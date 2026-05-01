import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  MediaAssetSummary,
  MediaProcessingJobSummary,
  MediaUploadResponse,
} from '@visionflow/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { demoSnapshot } from '../projects/demo-snapshot';
import { buildMediaIngestionPlan, buildProcessingTargetKey } from './media-ingestion';
import { MediaStorageService } from './media-storage.service';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type MemoryAsset = MediaAssetSummary;
type MemoryJob = MediaProcessingJobSummary;

@Injectable()
export class MediaService {
  private readonly memoryAssets = new Map<string, MemoryAsset>();
  private readonly memoryJobs = new Map<string, MemoryJob>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorageService
  ) {}

  async upload(projectId: string, file: UploadedFile | undefined): Promise<MediaUploadResponse> {
    if (!file) {
      throw new BadRequestException("Missing multipart file field named 'file'.");
    }

    let plan: Awaited<ReturnType<typeof buildMediaIngestionPlan>>;

    try {
      plan = await buildMediaIngestionPlan({
        projectId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        buffer: file.buffer,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('Magic bytes')) {
        throw new BadRequestException('File content does not match declared file type. The file may be corrupted or misnamed.');
      }
      throw new BadRequestException(`Unsupported media MIME type: ${file.mimetype || 'unknown'}.`);
    }

    const existing = await this.findExistingAsset(projectId, plan.checksum);

    if (existing) {
      return {
        asset: { ...existing, status: 'duplicate' },
        processingJob: null,
        deduplicated: true,
      };
    }

    await this.storage.putOriginal(plan.storageKey, file.buffer, plan.mimeType);

    if (process.env.DATABASE_URL) {
      return this.createWithPrisma(plan);
    }

    return this.createInMemory(plan);
  }

  async list(projectId: string): Promise<MediaAssetSummary[]> {
    if (process.env.DATABASE_URL) {
      const rows = await this.prisma.mediaAsset.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      return rows.map((row) => toMediaSummary(row));
    }

    const seeded = demoSnapshot.media.map((asset) => ({
      id: asset.id,
      projectId,
      name: asset.name,
      type: asset.type,
      mimeType: 'image/jpeg' as const,
      storageKey: `projects/${projectId}/originals/${asset.id}.jpg`,
      thumbnailKey: asset.thumbnailKey ?? null,
      width: asset.width,
      height: asset.height,
      durationMs: null,
      frameCount: null,
      checksum: asset.checksum,
      sizeBytes: asset.sizeBytes ?? 1_486_400,
      status: asset.status,
      createdAt: new Date().toISOString(),
    }));

    return [...this.memoryAssets.values(), ...seeded];
  }

  private async findExistingAsset(
    projectId: string,
    checksum: string
  ): Promise<MediaAssetSummary | null> {
    if (process.env.DATABASE_URL) {
      const row = await this.prisma.mediaAsset.findUnique({
        where: { projectId_checksum: { projectId, checksum } },
      });

      return row ? toMediaSummary(row) : null;
    }

    return [...this.memoryAssets.values()].find((asset) => asset.checksum === checksum) ?? null;
  }

  async findAsset(projectId: string, assetId: string): Promise<MediaAssetSummary | null> {
    if (process.env.DATABASE_URL) {
      const row = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
      if (!row || row.projectId !== projectId) return null;
      return toMediaSummary(row);
    }
    return this.memoryAssets.get(assetId) ?? null;
  }

  private async createWithPrisma(plan: Awaited<ReturnType<typeof buildMediaIngestionPlan>>) {
    try {
      await this.prisma.project.upsert({
        where: { id: plan.projectId },
        create: {
          id: plan.projectId,
          slug: plan.projectId,
          name:
            plan.projectId === demoSnapshot.project.id ? demoSnapshot.project.name : plan.projectId,
        },
        update: {},
      });

      const asset = await this.prisma.mediaAsset.create({
        data: {
          projectId: plan.projectId,
          type: plan.mediaType,
          storageKey: plan.storageKey,
          checksum: plan.checksum,
          metadataJson: {
            originalName: plan.originalName,
            mimeType: plan.mimeType,
            sizeBytes: plan.sizeBytes,
          },
        },
      });
      const targetKey = buildProcessingTargetKey(plan.projectId, asset.id, plan.processingJobType);
      const processingJob = await this.prisma.mediaProcessingJob.create({
        data: {
          projectId: plan.projectId,
          assetId: asset.id,
          type: plan.processingJobType,
          status: 'QUEUED',
          targetKey,
          payloadJson: {
            storageKey: plan.storageKey,
            mimeType: plan.mimeType,
          },
        },
      });

      await this.prisma.auditLog.create({
        data: {
          projectId: plan.projectId,
          action: 'MEDIA_ASSET_UPLOADED',
          targetType: 'MediaAsset',
          targetId: asset.id,
          metadataJson: {
            checksum: plan.checksum,
            storageKey: plan.storageKey,
            processingJobId: processingJob.id,
          },
        },
      });

      return {
        asset: toMediaSummary(asset),
        processingJob: toProcessingJobSummary(processingJob),
        deduplicated: false,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Media metadata could not be written.',
      });
    }
  }

  private createInMemory(plan: Awaited<ReturnType<typeof buildMediaIngestionPlan>>): MediaUploadResponse {
    const now = new Date().toISOString();
    const assetId = `asset_${plan.checksum.slice(0, 12)}`;
    const asset: MemoryAsset = {
      id: assetId,
      projectId: plan.projectId,
      name: plan.originalName,
      type: plan.mediaType,
      mimeType: plan.mimeType,
      storageKey: plan.storageKey,
      thumbnailKey: null,
      width: null,
      height: null,
      durationMs: null,
      frameCount: null,
      checksum: plan.checksum,
      sizeBytes: plan.sizeBytes,
      status: 'indexed',
      createdAt: now,
    };
    const processingJob: MemoryJob = {
      id: `media_job_${plan.checksum.slice(0, 12)}`,
      assetId,
      type: plan.processingJobType,
      status: 'QUEUED',
      targetKey: buildProcessingTargetKey(plan.projectId, assetId, plan.processingJobType),
      createdAt: now,
    };

    this.memoryAssets.set(asset.id, asset);
    this.memoryJobs.set(processingJob.id, processingJob);

    return {
      asset,
      processingJob,
      deduplicated: false,
    };
  }
}

function toMediaSummary(row: {
  id: string;
  projectId: string;
  type: 'IMAGE' | 'VIDEO' | 'FRAME';
  storageKey: string;
  thumbnailKey: string | null;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  frameCount: number | null;
  checksum: string;
  metadataJson: unknown;
  createdAt: Date;
}): MediaAssetSummary {
  const metadata = row.metadataJson as {
    originalName?: string;
    mimeType?: MediaAssetSummary['mimeType'];

    sizeBytes?: number;
  };

  return {
    id: row.id,
    projectId: row.projectId,
    name: metadata.originalName ?? row.id,
    type: row.type,
    mimeType: metadata.mimeType ?? 'image/jpeg',
    storageKey: row.storageKey,
    thumbnailKey: row.thumbnailKey,
    width: row.width,
    height: row.height,
    durationMs: row.durationMs,
    frameCount: row.frameCount,
    checksum: row.checksum,
    sizeBytes: metadata.sizeBytes ?? 0,
    status: 'indexed',
    createdAt: row.createdAt.toISOString(),
  };
}

function toProcessingJobSummary(row: {
  id: string;
  assetId: string;
  type: 'THUMBNAIL' | 'EXTRACT_FRAMES';
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  targetKey: string | null;
  createdAt: Date;
}): MediaProcessingJobSummary {
  return {
    id: row.id,
    assetId: row.assetId,
    type: row.type,
    status: row.status,
    targetKey: row.targetKey,
    createdAt: row.createdAt.toISOString(),
  };
}
