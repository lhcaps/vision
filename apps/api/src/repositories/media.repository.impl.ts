import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaAssetSummary, MediaProcessingJobSummary } from '@visionflow/contracts';
import { buildProcessingTargetKey } from '../media/media-ingestion';
import { demoSnapshot } from '../projects/demo-snapshot';
import { STORAGE_REPOSITORY } from '../config/provider-tokens';

export interface MediaRepository {
  findByProject(projectId: string): Promise<MediaAssetSummary[]>;
  findById(projectId: string, assetId: string): Promise<MediaAssetSummary | null>;
  findByChecksum(projectId: string, checksum: string): Promise<MediaAssetSummary | null>;
  create(data: {
    projectId: string;
    name: string;
    type: 'IMAGE' | 'VIDEO' | 'FRAME';
    storageKey: string;
    checksum: string;
    mimeType: string;
    sizeBytes: number;
    originalName?: string;
  }): Promise<MediaAssetSummary>;
  createProcessingJob(data: {
    projectId: string;
    assetId: string;
    type: 'THUMBNAIL' | 'EXTRACT_FRAMES';
    storageKey: string;
    mimeType: string;
  }): Promise<MediaProcessingJobSummary>;
}

type Row = {
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
};

@Injectable()
export class PrismaMediaRepository implements MediaRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_REPOSITORY) private readonly storage: { putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void> }
  ) {}

  async findByProject(projectId: string): Promise<MediaAssetSummary[]> {
    const rows = await this.prisma.mediaAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toSummary);
  }

  async findById(projectId: string, assetId: string): Promise<MediaAssetSummary | null> {
    const row = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
    if (!row || row.projectId !== projectId) return null;
    return toSummary(row);
  }

  async findByChecksum(
    projectId: string,
    checksum: string
  ): Promise<MediaAssetSummary | null> {
    const row = await this.prisma.mediaAsset.findUnique({
      where: { projectId_checksum: { projectId, checksum } },
    });
    return row ? toSummary(row) : null;
  }

  async create(data: {
    projectId: string;
    name: string;
    type: 'IMAGE' | 'VIDEO' | 'FRAME';
    storageKey: string;
    checksum: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<MediaAssetSummary> {
    await this.prisma.project.upsert({
      where: { id: data.projectId },
      create: {
        id: data.projectId,
        slug: data.projectId,
        name: data.projectId === demoSnapshot.project.id
          ? demoSnapshot.project.name
          : data.projectId,
      },
      update: {},
    });

    const asset = await this.prisma.mediaAsset.create({
      data: {
        projectId: data.projectId,
        type: data.type,
        storageKey: data.storageKey,
        checksum: data.checksum,
        metadataJson: {
          originalName: data.name,
          mimeType: data.mimeType as MediaAssetSummary['mimeType'],
          sizeBytes: data.sizeBytes,
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        projectId: data.projectId,
        action: 'MEDIA_ASSET_UPLOADED',
        targetType: 'MediaAsset',
        targetId: asset.id,
        metadataJson: { checksum: data.checksum, storageKey: data.storageKey },
      },
    });

    return toSummary(asset);
  }

  async createProcessingJob(data: {
    projectId: string;
    assetId: string;
    type: 'THUMBNAIL' | 'EXTRACT_FRAMES';
    storageKey: string;
    mimeType: string;
  }): Promise<MediaProcessingJobSummary> {
    const targetKey = buildProcessingTargetKey(data.projectId, data.assetId, data.type);
    const job = await this.prisma.mediaProcessingJob.create({
      data: {
        projectId: data.projectId,
        assetId: data.assetId,
        type: data.type,
        status: 'QUEUED',
        targetKey,
        payloadJson: { storageKey: data.storageKey, mimeType: data.mimeType },
      },
    });
    return {
      id: job.id,
      assetId: job.assetId,
      type: job.type,
      status: job.status,
      targetKey: job.targetKey,
      createdAt: job.createdAt.toISOString(),
    };
  }
}

@Injectable()
export class MemoryMediaRepository implements MediaRepository {
  private readonly memoryAssets = new Map<string, MediaAssetSummary>();
  private readonly memoryJobs = new Map<string, MediaProcessingJobSummary>();

  async findByProject(projectId: string): Promise<MediaAssetSummary[]> {
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

  async findById(projectId: string, assetId: string): Promise<MediaAssetSummary | null> {
    return this.memoryAssets.get(assetId) ?? null;
  }

  async findByChecksum(
    projectId: string,
    checksum: string
  ): Promise<MediaAssetSummary | null> {
    return [...this.memoryAssets.values()].find((a) => a.checksum === checksum) ?? null;
  }

  async create(data: {
    projectId: string;
    name: string;
    type: 'IMAGE' | 'VIDEO' | 'FRAME';
    storageKey: string;
    checksum: string;
    mimeType: string;
    sizeBytes: number;
    originalName?: string;
  }): Promise<MediaAssetSummary> {
    const asset: MediaAssetSummary = {
      id: `asset_${data.checksum.slice(0, 12)}`,
      projectId: data.projectId,
      name: data.name,
      type: data.type,
      mimeType: data.mimeType as MediaAssetSummary['mimeType'],
      storageKey: data.storageKey,
      thumbnailKey: null,
      width: null,
      height: null,
      durationMs: null,
      frameCount: null,
      checksum: data.checksum,
      sizeBytes: data.sizeBytes,
      status: 'indexed',
      createdAt: new Date().toISOString(),
    };
    this.memoryAssets.set(asset.id, asset);
    return asset;
  }

  async createProcessingJob(data: {
    projectId: string;
    assetId: string;
    type: 'THUMBNAIL' | 'EXTRACT_FRAMES';
    storageKey: string;
    mimeType: string;
  }): Promise<MediaProcessingJobSummary> {
    const job: MediaProcessingJobSummary = {
      id: `media_job_${Date.now()}`,
      assetId: data.assetId,
      type: data.type,
      status: 'QUEUED',
      targetKey: buildProcessingTargetKey(data.projectId, data.assetId, data.type),
      createdAt: new Date().toISOString(),
    };
    this.memoryJobs.set(job.id, job);
    return job;
  }
}

function toSummary(row: Row): MediaAssetSummary {
  const meta = row.metadataJson as { originalName?: string; mimeType?: string; sizeBytes?: number } | undefined;
  return {
    id: row.id,
    projectId: row.projectId,
    name: meta?.originalName ?? row.id,
    type: row.type,
    mimeType: (meta?.mimeType ?? 'image/jpeg') as MediaAssetSummary['mimeType'],
    storageKey: row.storageKey,
    thumbnailKey: row.thumbnailKey,
    width: row.width,
    height: row.height,
    durationMs: row.durationMs,
    frameCount: row.frameCount,
    checksum: row.checksum,
    sizeBytes: meta?.sizeBytes ?? 0,
    status: 'indexed',
    createdAt: row.createdAt.toISOString(),
  };
}
