import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  MediaAssetSummary,
  MediaProcessingJobSummary,
  MediaUploadResponse,
} from '@visionflow/contracts';
import { buildMediaIngestionPlan } from './media-ingestion';
import { MediaProcessingService, MediaProcessingPayload } from './media-processing.service';
import { MediaRepository } from '../repositories/media.repository';
import { MEDIA_REPOSITORY, STORAGE_REPOSITORY } from '../config/provider-tokens';
import { PrismaService } from '../prisma/prisma.service';
import { isDatabaseMode } from '../config/app-mode';
import { createLogger } from '../common/logging/structured-logger';

const uploadLogger = createLogger('MediaService');

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
};

@Injectable()
export class MediaService {
  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly mediaRepo: MediaRepository,
    @Inject(STORAGE_REPOSITORY)
    private readonly storage: {
      putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void>;
      putOriginalStream(
        key: string,
        stream: NodeJS.ReadableStream,
        size: number,
        mimeType: string
      ): Promise<void>;
      delete(key: string): Promise<void>;
    },
    private readonly prisma: PrismaService,
    private readonly mediaProcessingService: MediaProcessingService
  ) {}

  async upload(projectId: string, file: UploadedFile | undefined): Promise<MediaUploadResponse> {
    if (!file) {
      throw new BadRequestException("Missing multipart file field named 'file'.");
    }

    // diskStorage writes to disk and gives us file.path (no file.buffer).
    // memoryStorage gives us file.buffer directly. Handle both paths here.
    const buffer = await this.readUploadedFileBuffer(file);

    let plan: Awaited<ReturnType<typeof buildMediaIngestionPlan>>;

    try {
      plan = await buildMediaIngestionPlan({
        projectId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        buffer,
      });
    } catch (err) {
      // Clean up the temp file since we already read it into memory.
      if (file.path) await this.safelyDeleteFile(file.path);
      if (err instanceof Error && err.message.includes('Magic bytes')) {
        throw new BadRequestException(
          'File content does not match declared file type. The file may be corrupted or misnamed.'
        );
      }
      throw new BadRequestException(`Unsupported media MIME type: ${file.mimetype || 'unknown'}.`);
    }

    const existing = await this.mediaRepo.findByChecksum(projectId, plan.checksum);
    if (existing) {
      if (file.path) await this.safelyDeleteFile(file.path);
      return {
        asset: { ...existing, status: 'duplicate' },
        processingJob: null,
        deduplicated: true,
      };
    }

    if (isDatabaseMode()) {
      return this.uploadWithSaga(projectId, file, plan);
    }

    if (file.buffer) {
      await this.storage.putOriginal(plan.storageKey, file.buffer, plan.mimeType);
    } else if (file.path) {
      await this.streamToStorage(plan.storageKey, file.path, file.size, plan.mimeType);
    } else {
      throw new InternalServerErrorException('No file content available for upload.');
    }

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
    // Enqueue to media-processing queue for real worker processing
    const targetKey = processingJob.targetKey!;
    await this.enqueueMediaProcessing(projectId, asset.id, processingJob.id, plan, targetKey);
    return {
      asset,
      processingJob,
      deduplicated: false,
    };
  }

  private async uploadWithSaga(
    projectId: string,
    file: UploadedFile,
    plan: Awaited<ReturnType<typeof buildMediaIngestionPlan>>
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
      throw new InternalServerErrorException(
        `Failed to persist media record: ${(err as Error).message}`
      );
    }

    try {
      if (file.buffer) {
        await this.storage.putOriginal(plan.storageKey, file.buffer, plan.mimeType);
      } else if (file.path) {
        await this.streamToStorage(plan.storageKey, file.path, file.size, plan.mimeType);
      } else {
        throw new Error('No file content available for upload.');
      }
    } catch (err) {
      await this.cleanupFailedUpload(projectId, asset.id, processingJob.id, plan.storageKey);
      throw new InternalServerErrorException('Media upload failed; storage cleaned up.');
    } finally {
      if (file.path) await this.safelyDeleteFile(file.path);
    }

    // Enqueue to media-processing queue ONLY after the original object
    // is confirmed in MinIO. This prevents a race where the BullMQ worker
    // picks up the job and tries to read a source that does not yet exist.
    const targetKey = processingJob.targetKey!;
    await this.enqueueMediaProcessing(projectId, asset.id, processingJob.id, plan, targetKey);

    return { asset, processingJob, deduplicated: false };
  }

  private async readUploadedFileBuffer(file: UploadedFile): Promise<Buffer> {
    if (file.buffer) return file.buffer;
    if (file.path) {
      const fs = await import('fs/promises');
      return fs.readFile(file.path);
    }
    throw new InternalServerErrorException('No file content available for upload.');
  }

  private async streamToStorage(
    storageKey: string,
    filePath: string,
    size: number,
    mimeType: string
  ): Promise<void> {
    if (typeof this.storage.putOriginalStream === 'function') {
      const stream = createReadStream(filePath) as unknown as NodeJS.ReadableStream;
      await this.storage.putOriginalStream(storageKey, stream, size, mimeType);
    } else {
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(filePath);
      await this.storage.putOriginal(storageKey, buffer, mimeType);
    }
  }

  private async safelyDeleteFile(path: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(path);
    } catch {
      // Non-critical: temp file will be cleaned by OS eventually
    }
  }

  private async cleanupFailedUpload(
    projectId: string,
    assetId: string,
    mediaJobId: string | undefined,
    storageKey: string
  ): Promise<void> {
    // Remove the queued BullMQ job first so the worker never picks it up.
    if (mediaJobId) {
      await this.mediaProcessingService.removeQueuedJob(mediaJobId);
    }
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

  private async enqueueMediaProcessing(
    projectId: string,
    assetId: string,
    mediaJobId: string,
    plan: Awaited<ReturnType<typeof buildMediaIngestionPlan>>,
    targetKey: string
  ): Promise<void> {
    const correlationId = uuidv4();

    const payload: MediaProcessingPayload = {
      projectId,
      mediaJobId,
      assetId,
      sourceObjectKey: plan.storageKey,
      targetKey,
      jobType: plan.processingJobType,
      correlationId,
      mimeType: plan.mimeType,
      width: null,
      height: null,
    };

    try {
      await this.mediaProcessingService.enqueueJob(payload);
      uploadLogger.info(
        { mediaJobId, assetId, jobType: plan.processingJobType, correlationId },
        'Media processing job enqueued'
      );
    } catch (err) {
      uploadLogger.error(
        { mediaJobId, assetId, jobType: plan.processingJobType, error: String(err) },
        'Failed to enqueue media processing job — worker will not process this asset'
      );
    }
  }
}
