import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  MediaAssetSummary,
  MediaProcessingJobSummary,
  MediaUploadResponse,
} from '@visionflow/contracts';
import { buildMediaIngestionPlan } from './media-ingestion';
import { MediaRepository } from '../repositories/media.repository';
import { MEDIA_REPOSITORY, STORAGE_REPOSITORY } from '../config/provider-tokens';
import { PrismaService } from '../prisma/prisma.service';
import { isDatabaseMode } from '../config/app-mode';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class MediaService {
  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepo: MediaRepository,
    @Inject(STORAGE_REPOSITORY)
    private readonly storage: {
      putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void>;
      delete(key: string): Promise<void>;
    },
    private readonly prisma: PrismaService,
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
        throw new BadRequestException(
          'File content does not match declared file type. The file may be corrupted or misnamed.',
        );
      }
      throw new BadRequestException(`Unsupported media MIME type: ${file.mimetype || 'unknown'}.`);
    }

    const existing = await this.mediaRepo.findByChecksum(projectId, plan.checksum);
    if (existing) {
      return {
        asset: { ...existing, status: 'duplicate' },
        processingJob: null,
        deduplicated: true,
      };
    }

    if (isDatabaseMode()) {
      return this.uploadWithSaga(projectId, file.buffer, plan);
    }

    await this.storage.putOriginal(plan.storageKey, file.buffer, plan.mimeType);
    const asset = await this.mediaRepo.create({
      projectId,
      name: plan.originalName,
      type: plan.mediaType,
      storageKey: plan.storageKey,
      checksum: plan.checksum,
      mimeType: plan.mimeType,
      sizeBytes: plan.sizeBytes,
      originalName: plan.originalName,
    });
    const processingJob = await this.mediaRepo.createProcessingJob({
      projectId,
      assetId: asset.id,
      type: plan.processingJobType,
      storageKey: plan.storageKey,
      mimeType: plan.mimeType,
    });
    return {
      asset,
      processingJob,
      deduplicated: false,
    };
  }

  private async uploadWithSaga(
    projectId: string,
    buffer: Buffer,
    plan: Awaited<ReturnType<typeof buildMediaIngestionPlan>>,
  ): Promise<MediaUploadResponse> {
    let asset: Awaited<ReturnType<MediaRepository['create']>>;
    let processingJob: Awaited<ReturnType<MediaRepository['createProcessingJob']>>;

    try {
      asset = await this.mediaRepo.create({
        projectId,
        name: plan.originalName,
        type: plan.mediaType,
        storageKey: plan.storageKey,
        checksum: plan.checksum,
        mimeType: plan.mimeType,
        sizeBytes: plan.sizeBytes,
        originalName: plan.originalName,
      });

      processingJob = await this.mediaRepo.createProcessingJob({
        projectId,
        assetId: asset.id,
        type: plan.processingJobType,
        storageKey: plan.storageKey,
        mimeType: plan.mimeType,
      });
    } catch (err) {
      throw new InternalServerErrorException(`Failed to persist media record: ${(err as Error).message}`);
    }

    try {
      await this.storage.putOriginal(plan.storageKey, buffer, plan.mimeType);
    } catch (err) {
      await this.cleanupFailedUpload(projectId, asset.id, plan.storageKey);
      throw new InternalServerErrorException('Media upload failed; storage cleaned up.');
    }

    return { asset, processingJob, deduplicated: false };
  }

  private async cleanupFailedUpload(
    projectId: string,
    assetId: string,
    storageKey: string,
  ): Promise<void> {
    try {
      await this.storage.delete(storageKey);
    } catch {
      // storage cleanup failed — log and continue
    }
    try {
      await this.prisma.mediaAsset.delete({ where: { id: assetId } });
    } catch {
      // asset cleanup failed — already gone or cascade
    }
    try {
      await this.prisma.auditLog.create({
        data: {
          projectId,
          action: 'MEDIA_UPLOAD_FAILED',
          targetType: 'MediaAsset',
          targetId: assetId,
          metadataJson: { storageKey, assetId },
        },
      });
    } catch {
      // audit log failed — non-critical
    }
  }

  async list(projectId: string): Promise<MediaAssetSummary[]> {
    return this.mediaRepo.findByProject(projectId);
  }

  async findAsset(projectId: string, assetId: string): Promise<MediaAssetSummary | null> {
    return this.mediaRepo.findById(projectId, assetId);
  }
}
