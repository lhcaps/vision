import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MediaCvWorkerClient } from './media-cv-worker.client';
import { createLogger, getCurrentRequestId } from '../common/logging/structured-logger';
import {
  CvWorkerCreateThumbnailResponse,
  CvWorkerDerivativeArtifact,
  CvWorkerExtractFramesResponse,
} from '@visionflow/contracts';

export type MediaProcessingPayload = {
  projectId: string;
  mediaJobId: string;
  assetId: string;
  sourceObjectKey: string;
  targetKey: string;
  jobType: 'THUMBNAIL' | 'EXTRACT_FRAMES';
  correlationId: string;
  mimeType: string;
  width: number | null;
  height: number | null;
};

const QUEUE_NAME = 'visionflow.media-processing';

const logger = createLogger('MediaProcessingService');

@Injectable()
export class MediaProcessingService implements OnModuleInit, OnModuleDestroy {
  private queue: Queue<MediaProcessingPayload> | null = null;
  private worker: Worker<MediaProcessingPayload> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaWorkerClient: MediaCvWorkerClient
  ) {}

  onModuleInit(): void {
    if (!this.shouldUseBullMq()) return;

    const connection = this.redisConnection();
    this.queue = new Queue<MediaProcessingPayload>(QUEUE_NAME, { connection });

    this.worker = new Worker<MediaProcessingPayload>(
      QUEUE_NAME,
      async (job) => this.processJob(job.data),
      {
        connection,
        concurrency: Number(process.env.MEDIA_WORKER_CONCURRENCY ?? '2'),
      }
    );

    this.worker.on('failed', (job, error) => {
      const payload = job?.data;
      logger.error(
        {
          jobId: payload?.mediaJobId,
          correlationId: payload?.correlationId,
          error: error.message,
        },
        `Media worker failed: ${error.message}`
      );
    });

    this.worker.on('error', (error) => {
      logger.error({ stack: error.stack }, `Media worker error: ${error.message}`);
    });

    logger.info({ queue: QUEUE_NAME }, 'Media processing worker started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  async enqueueJob(payload: MediaProcessingPayload): Promise<void> {
    if (!this.queue) {
      logger.warn(
        { mediaJobId: payload.mediaJobId, correlationId: payload.correlationId },
        'BullMQ not available; skipping media job enqueue'
      );
      return;
    }

    await this.queue.add('process-media', payload, {
      jobId: payload.mediaJobId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    logger.info(
      {
        mediaJobId: payload.mediaJobId,
        assetId: payload.assetId,
        jobType: payload.jobType,
        correlationId: payload.correlationId,
      },
      'Media processing job enqueued'
    );
  }

  private async processJob(payload: MediaProcessingPayload): Promise<void> {
    const { mediaJobId, projectId, assetId, correlationId } = payload;

    logger.info(
      { mediaJobId, projectId, assetId, jobType: payload.jobType, correlationId },
      'Media processing worker claimed job'
    );

    try {
      await this.transitionJob(mediaJobId, projectId, 'RUNNING', null);

      if (payload.jobType === 'THUMBNAIL') {
        await this.processThumbnail(payload);
      } else {
        await this.processFrameExtraction(payload);
      }
    } catch (error) {
      await this.failJob(payload, error);
      throw error;
    }
  }

  private async processThumbnail(payload: MediaProcessingPayload): Promise<void> {
    const {
      mediaJobId,
      projectId,
      assetId,
      sourceObjectKey,
      targetKey,
      correlationId,
      mimeType,
      width,
      height,
    } = payload;

    logger.info(
      { mediaJobId, assetId, sourceObjectKey, targetKey, correlationId },
      'Dispatching thumbnail request to CV worker'
    );

    let response: CvWorkerCreateThumbnailResponse;

    try {
      response = await this.mediaWorkerClient.createThumbnail({
        jobId: mediaJobId,
        assetId,
        storageKey: sourceObjectKey,
        targetKey,
        mimeType,
        width,
        height,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(
        { mediaJobId, assetId, correlationId, error: msg },
        'CV worker thumbnail request failed'
      );
      await this.transitionJob(mediaJobId, projectId, 'FAILED', msg);
      await this.writeAuditLog(
        projectId,
        'MEDIA_THUMBNAIL_FAILED',
        'MediaProcessingJob',
        mediaJobId,
        {
          assetId,
          error: msg,
        }
      );
      throw error;
    }

    if (response.status === 'FAILED') {
      const errorMsg = response.error ?? 'CV worker returned FAILED status';
      logger.error(
        { mediaJobId, assetId, correlationId, error: errorMsg },
        'CV worker thumbnail returned FAILED'
      );
      await this.transitionJob(mediaJobId, projectId, 'FAILED', errorMsg);
      await this.writeAuditLog(
        projectId,
        'MEDIA_THUMBNAIL_FAILED',
        'MediaProcessingJob',
        mediaJobId,
        {
          assetId,
          error: errorMsg,
        }
      );
      throw new Error(errorMsg);
    }

    const derivative = response.derivative;
    if (!derivative) {
      const msg = 'CV worker returned SUCCEEDED but no derivative was provided';
      logger.error({ mediaJobId, assetId }, msg);
      await this.transitionJob(mediaJobId, projectId, 'FAILED', msg);
      throw new Error(msg);
    }

    await this.persistDerivative(projectId, assetId, derivative, mediaJobId);
    await this.updateAssetThumbnailKey(projectId, assetId, derivative.storageKey, mediaJobId);
    await this.transitionJob(mediaJobId, projectId, 'SUCCEEDED', null);

    await this.writeAuditLog(
      projectId,
      'MEDIA_THUMBNAIL_CREATED',
      'MediaProcessingJob',
      mediaJobId,
      {
        assetId,
        derivativeStorageKey: derivative.storageKey,
        checksum: derivative.checksum,
        width: derivative.width,
        height: derivative.height,
      }
    );

    logger.info(
      {
        mediaJobId,
        assetId,
        derivativeStorageKey: derivative.storageKey,
        checksum: derivative.checksum,
        width: derivative.width,
        height: derivative.height,
        correlationId,
      },
      'Thumbnail processing completed successfully'
    );
  }

  private async processFrameExtraction(payload: MediaProcessingPayload): Promise<void> {
    const { mediaJobId, projectId, assetId, sourceObjectKey, targetKey, correlationId, mimeType } =
      payload;

    logger.info(
      { mediaJobId, assetId, sourceObjectKey, correlationId },
      'Dispatching frame extraction to CV worker'
    );

    let response: CvWorkerExtractFramesResponse;

    try {
      response = await this.mediaWorkerClient.extractFrames({
        jobId: mediaJobId,
        assetId,
        storageKey: sourceObjectKey,
        targetKey,
        mimeType,
        width: payload.width,
        height: payload.height,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(
        { mediaJobId, assetId, correlationId, error: msg },
        'CV worker frame extraction failed'
      );
      await this.transitionJob(mediaJobId, projectId, 'FAILED', msg);
      await this.writeAuditLog(
        projectId,
        'MEDIA_FRAME_EXTRACTION_FAILED',
        'MediaProcessingJob',
        mediaJobId,
        {
          assetId,
          error: msg,
        }
      );
      throw error;
    }

    const errorMsg = response.error ?? 'Frame extraction returned FAILED';
    logger.error(
      { mediaJobId, assetId, correlationId, error: errorMsg },
      'CV worker frame extraction returned FAILED'
    );
    await this.transitionJob(mediaJobId, projectId, 'FAILED', errorMsg);
    await this.writeAuditLog(
      projectId,
      'MEDIA_FRAME_EXTRACTION_FAILED',
      'MediaProcessingJob',
      mediaJobId,
      {
        assetId,
        error: errorMsg,
      }
    );
    throw new Error(errorMsg);
  }

  private async persistDerivative(
    projectId: string,
    assetId: string,
    derivative: CvWorkerDerivativeArtifact,
    jobId: string
  ): Promise<void> {
    const derivativeType =
      derivative.type === 'THUMBNAIL'
        ? 'THUMBNAIL'
        : derivative.type === 'FRAME'
          ? 'FRAME'
          : 'PREVIEW';

    await this.prisma.assetDerivative.create({
      data: {
        assetId,
        type: derivativeType,
        storageKey: derivative.storageKey,
        width: derivative.width ?? null,
        height: derivative.height ?? null,
        checksum: derivative.checksum,
      },
    });

    logger.debug(
      { assetId, storageKey: derivative.storageKey, checksum: derivative.checksum },
      'AssetDerivative row created'
    );
  }

  private async updateAssetThumbnailKey(
    projectId: string,
    assetId: string,
    thumbnailKey: string,
    jobId: string
  ): Promise<void> {
    await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: { thumbnailKey },
    });

    logger.debug({ assetId, thumbnailKey }, 'MediaAsset.thumbnailKey updated');
  }

  private async transitionJob(
    jobId: string,
    projectId: string,
    status: 'RUNNING' | 'SUCCEEDED' | 'FAILED',
    errorMessage: string | null
  ): Promise<void> {
    await this.prisma.mediaProcessingJob.update({
      where: { id: jobId },
      data: {
        status,
        errorMessage: errorMessage ?? null,
      },
    });
  }

  private async writeAuditLog(
    projectId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          projectId,
          action,
          targetType,
          targetId,
          metadataJson: metadata as Prisma.InputJsonValue,
        },
      });
    } catch {
      logger.warn({ action, targetId }, 'Failed to write audit log entry');
    }
  }

  private async failJob(payload: MediaProcessingPayload, error: unknown): Promise<void> {
    const errorMsg = error instanceof Error ? error.message : String(error);
    try {
      await this.transitionJob(payload.mediaJobId, payload.projectId, 'FAILED', errorMsg);
      await this.writeAuditLog(
        payload.projectId,
        'MEDIA_PROCESSING_FAILED',
        'MediaProcessingJob',
        payload.mediaJobId,
        {
          assetId: payload.assetId,
          jobType: payload.jobType,
          error: errorMsg,
        }
      );
    } catch (patchError) {
      logger.error(
        { mediaJobId: payload.mediaJobId, error: String(patchError) },
        'Failed to mark media job as FAILED'
      );
    }
  }

  private shouldUseBullMq(): boolean {
    if (process.env.MEDIA_QUEUE_MODE === 'memory') return false;
    return Boolean(
      process.env.MEDIA_QUEUE_MODE === 'bullmq' || process.env.REDIS_URL || process.env.REDIS_HOST
    );
  }

  private redisConnection(): ConnectionOptions {
    if (process.env.REDIS_URL) {
      return {
        url: process.env.REDIS_URL,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        connectTimeout: 750,
      } as ConnectionOptions;
    }
    return {
      host: process.env.REDIS_HOST ?? '127.0.0.1',
      port: Number(process.env.REDIS_PORT ?? '6379'),
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      connectTimeout: 750,
    } as ConnectionOptions;
  }
}
