import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { Observable, Subject } from 'rxjs';
import {
  CreateInferenceJobRequest,
  CvWorkerAssetInput,
  CvWorkerRunPipelinePayload,
  CvWorkerRunPipelineResponse,
  InferenceJobEvent,
  InferenceJobEventSchema,
  InferenceJobStatus,
  InferenceJobSummary,
  InferenceWorkerStage,
  assertJobProgress,
  isTerminalJobStatus,
} from '@visionflow/contracts';
import { createLogger, getCurrentRequestId } from '../common/logging/structured-logger';
import {
  assertValidInferenceTransition,
  assertValidProgress,
} from '../domain/inference-job-state-machine';
import { DatasetsService } from '../datasets/datasets.service';
import { MediaService } from '../media/media.service';
import { PipelinesService } from '../pipelines/pipelines.service';
import { PrismaService } from '../prisma/prisma.service';
import { CvWorkerClient } from './cv-worker.client';
import { InferenceRepository } from '../repositories/inference.repository';
import { INFERENCE_REPOSITORY, PRISMA_SERVICE } from '../config/provider-tokens';

type InferenceQueuePayload = {
  projectId: string;
  jobId: string;
  correlationId: string;
};

type JobPatch = {
  status?: InferenceJobStatus;
  progress: number;
  stage: InferenceWorkerStage;
  message: string;
  type?: InferenceJobEvent['type'];
  errorMessage?: string | null;
};

const QUEUE_NAME = 'visionflow.inference';

@Injectable()
export class InferenceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = createLogger(InferenceService.name);
  private readonly eventSubjects = new Map<string, Subject<InferenceJobEvent>>();
  private readonly eventHistory = new Map<string, InferenceJobEvent[]>();
  private readonly memoryJobs = new Map<string, InferenceJobSummary>();
  private readonly memoryQueue: InferenceQueuePayload[] = [];
  private queue: Queue<InferenceQueuePayload> | null = null;
  private worker: Worker<InferenceQueuePayload> | null = null;
  private memoryDrain: Promise<void> | null = null;
  private eventSequence = 0;
  private jobSequence = 0;

  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaService,
    @Inject(INFERENCE_REPOSITORY) private readonly inferenceRepo: InferenceRepository,
    private readonly datasetsService: DatasetsService,
    private readonly mediaService: MediaService,
    private readonly pipelinesService: PipelinesService,
    private readonly cvWorkerClient: CvWorkerClient
  ) {}

  onModuleInit(): void {
    if (!this.shouldUseBullMq()) return;

    const connection = this.redisConnection();
    this.queue = new Queue<InferenceQueuePayload>(QUEUE_NAME, { connection });
    this.worker = new Worker<InferenceQueuePayload>(
      QUEUE_NAME,
      async (job) => this.processJob(job.data),
      {
        connection,
        concurrency: Number(process.env.INFERENCE_WORKER_CONCURRENCY ?? '1'),
      }
    );

    this.worker.on('failed', (job, error) => {
      const correlationId = job?.data?.correlationId;
      if (!job) {
        this.logger.error(
          { correlationId },
          `Inference worker failed before job data was available: ${error.message}`
        );
        return;
      }
      this.logger.error(
        { jobId: job.data.jobId, correlationId: job.data.correlationId },
        `Inference worker failed for job ${job.data.jobId}: ${error.message}`
      );
    });

    this.worker.on('error', (error) => {
      this.logger.error({ stack: error.stack }, `Inference worker error: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  async listJobs(projectId: string): Promise<InferenceJobSummary[]> {
    return this.inferenceRepo.listByProject(projectId);
  }

  async getJob(projectId: string, jobId: string): Promise<InferenceJobSummary> {
    const job = await this.inferenceRepo.findById(projectId, jobId);
    if (!job) throw new NotFoundException('Inference job not found for this project.');
    return job;
  }

  async createJob(projectId: string, dto: CreateInferenceJobRequest): Promise<InferenceJobSummary> {
    await this.assertRunnableDatasetVersion(projectId, dto.datasetVersionId);
    await this.assertRunnablePipeline(projectId, dto.pipelineId);

    const job = await this.inferenceRepo.createJob({
      projectId,
      pipelineId: dto.pipelineId,
      datasetVersionId: dto.datasetVersionId,
      status: 'QUEUED',
    });

    this.emitJobEvent(job, {
      type: 'log',
      stage: 'queued',
      message: 'Queue accepted inference payload with IDs only.',
    });

    const correlationId = getCurrentRequestId() ?? uuidv4();
    await this.enqueueJob({ projectId, jobId: job.id, correlationId });
    return job;
  }

  streamJob(projectId: string, jobId: string): Observable<InferenceJobEvent> {
    return new Observable((observer) => {
      let closed = false;
      let unsubscribe: (() => void) | null = null;

      void this.getJob(projectId, jobId)
        .then((job) => {
          if (closed) return;

          observer.next(
            this.buildEvent(job, {
              type: 'snapshot',
              stage: this.stageForStatus(job.status),
              message: `Current job snapshot: ${job.status} at ${job.progress}%.`,
            })
          );

          for (const event of this.eventHistory.get(job.id) ?? []) {
            observer.next(event);
          }

          if (isTerminalJobStatus(job.status)) {
            observer.complete();
            return;
          }

          const subscription = this.subjectFor(jobId).subscribe(observer);
          unsubscribe = () => subscription.unsubscribe();
        })
        .catch((error: unknown) => observer.error(error));

      return () => {
        closed = true;
        unsubscribe?.();
      };
    });
  }

  async drainMemoryJobsForTest(): Promise<void> {
    await this.memoryDrain;
  }

  private async assertRunnableDatasetVersion(
    projectId: string,
    datasetVersionId: string
  ): Promise<void> {
    const datasets = await this.datasetsService.listDatasets(projectId);
    for (const dataset of datasets) {
      const versions = await this.datasetsService.listVersions(projectId, dataset.id);
      const version = versions.find((item) => item.id === datasetVersionId);
      if (!version) continue;
      if (version.status !== 'LOCKED') {
        throw new ConflictException('Inference jobs require a locked dataset version.');
      }
      if (version.assetCount === 0) {
        throw new BadRequestException('Inference jobs require at least one dataset asset.');
      }
      return;
    }
    throw new NotFoundException('Dataset version not found for this project.');
  }

  private async assertRunnablePipeline(projectId: string, pipelineId: string): Promise<void> {
    const pipeline = (await this.pipelinesService.listPipelines(projectId)).find(
      (item) => item.id === pipelineId
    );
    if (!pipeline) throw new NotFoundException('Pipeline not found for this project.');
    if (!pipeline.validation.ok) {
      throw new BadRequestException({
        message: 'Inference jobs require a valid persisted pipeline.',
        issues: pipeline.validation.issues,
      });
    }
  }

  private async enqueueJob(payload: InferenceQueuePayload): Promise<void> {
    const correlationId = payload.correlationId;

    if (this.queue) {
      try {
        await this.queue.add('run-inference', payload, {
          jobId: payload.jobId,
          removeOnComplete: 100,
          removeOnFail: 100,
        });
        this.logger.info(
          { jobId: payload.jobId, correlationId, pipelineId: payload.projectId },
          'Inference job enqueued'
        );
        return;
      } catch (error) {
        this.logger.warn(
          { jobId: payload.jobId, correlationId, error: formatError(error) },
          'BullMQ enqueue failed, falling back to in-process worker'
        );
      }
    }

    this.memoryQueue.push(payload);
    this.logger.info(
      { jobId: payload.jobId, correlationId },
      'Inference job queued in memory fallback'
    );
    if (!this.memoryDrain) {
      this.memoryDrain = this.drainMemoryQueue().finally(() => {
        this.memoryDrain = null;
      });
    }
  }

  private async drainMemoryQueue(): Promise<void> {
    while (this.memoryQueue.length > 0) {
      const payload = this.memoryQueue.shift();
      if (payload) await this.processJob(payload);
    }
  }

  private async processJob(payload: InferenceQueuePayload): Promise<void> {
    this.logger.info(
      { jobId: payload.jobId, correlationId: payload.correlationId },
      'Worker started processing inference job'
    );

    try {
      await this.patchJob(payload, {
        status: 'RUNNING',
        progress: 8,
        stage: 'validated',
        message: 'Worker claimed job and validated the state transition.',
      });

      const workerPayload = await this.resolveCvWorkerPayload(payload);

      await this.runStep(payload, {
        progress: 28,
        stage: 'dataset_resolved',
        message: `Locked dataset version resolved with ${workerPayload.assets.length} image assets.`,
      });
      this.logger.info(
        {
          jobId: payload.jobId,
          correlationId: payload.correlationId,
          assetCount: workerPayload.assets.length,
        },
        'Dataset assets resolved for inference'
      );
      await this.runStep(payload, {
        progress: 46,
        stage: 'cv_worker_dispatched',
        message: `Dispatching ${workerPayload.detectorMode} detector request to the CV worker.`,
      });

      const workerResponse = await this.cvWorkerClient.runPipeline(workerPayload);

      await this.patchJob(payload, {
        progress: 72,
        stage: 'cv_worker_dispatched',
        type: 'log',
        message: `CV worker ${workerResponse.mode} completed ${workerResponse.predictionCount} predictions.`,
      });

      for (const warning of workerResponse.warnings) {
        await this.patchJob(payload, {
          progress: 72,
          stage: 'cv_worker_dispatched',
          type: 'log',
          message: warning,
        });
      }

      const persistedCount = await this.persistPredictions(payload, workerResponse);

      this.logger.info(
        {
          jobId: payload.jobId,
          correlationId: payload.correlationId,
          predictionCount: persistedCount,
        },
        'Predictions persisted'
      );

      await this.runStep(payload, {
        progress: 88,
        stage: 'predictions_persisted',
        message: `${persistedCount} worker predictions persisted for overlay and evaluation.`,
      });
      await this.runStep(payload, {
        status: 'SUCCEEDED',
        progress: 100,
        stage: 'completed',
        type: 'complete',
        message: 'Inference job completed successfully.',
      });
    } catch (error) {
      await this.failJob(payload, error);
    }
  }

  private async resolveCvWorkerPayload(
    payload: InferenceQueuePayload
  ): Promise<CvWorkerRunPipelinePayload> {
    const job = await this.getJob(payload.projectId, payload.jobId);
    const pipeline = (await this.pipelinesService.listPipelines(payload.projectId)).find(
      (item) => item.id === job.pipelineId
    );
    if (!pipeline)
      throw new Error('Inference job pipeline could not be resolved for worker dispatch.');

    const assetIds = await this.datasetsService.listVersionAssetIds(
      payload.projectId,
      job.datasetVersionId
    );
    const assets = await this.resolveWorkerAssets(payload.projectId, assetIds);
    const detectorNode = pipeline.definition.nodes.find((node) => node.type === 'yolo_onnx');
    const detectorMode = process.env.CV_WORKER_DETECTOR_MODE === 'onnx' ? 'onnx' : 'mock';
    const detectorModelId = detectorNode?.type === 'yolo_onnx' ? detectorNode.params.modelId : null;

    return {
      jobId: job.id,
      pipeline: pipeline.definition,
      detectorMode,
      modelArtifactKey: await this.resolveModelArtifactKey(
        payload.projectId,
        job.modelId ?? detectorModelId
      ),
      confidenceThreshold:
        detectorNode?.type === 'yolo_onnx' ? detectorNode.params.threshold : undefined,
      assets,
    };
  }

  private async resolveWorkerAssets(
    projectId: string,
    assetIds: string[]
  ): Promise<CvWorkerAssetInput[]> {
    const mediaRows = await this.mediaService.list(projectId);
    const mediaById = new Map(mediaRows.map((asset) => [asset.id, asset]));
    const workerAssets = assetIds.map((assetId) => {
      const asset = mediaById.get(assetId);
      if (!asset) throw new Error(`Dataset version references missing media asset ${assetId}.`);
      if (!asset.width || !asset.height) {
        throw new Error(`Media asset ${assetId} needs indexed image dimensions before inference.`);
      }
      return {
        assetId: asset.id,
        storageKey: asset.storageKey,
        width: asset.width,
        height: asset.height,
      };
    });
    if (workerAssets.length === 0) {
      throw new Error('CV worker dispatch requires at least one dataset asset.');
    }
    return workerAssets;
  }

  private async resolveModelArtifactKey(
    projectId: string,
    modelId: string | null
  ): Promise<string | null> {
    if (!modelId) return null;
    const model = await this.prisma.modelArtifact.findFirst({
      where: { id: modelId, projectId },
      select: { artifactKey: true },
    });
    return model?.artifactKey ?? modelId;
  }

  private async persistPredictions(
    payload: InferenceQueuePayload,
    workerResponse: CvWorkerRunPipelineResponse
  ): Promise<number> {
    if (workerResponse.predictions.length === 0) return 0;

    await this.prisma.prediction.deleteMany({
      where: { inferenceJobId: payload.jobId },
    });

    await this.prisma.prediction.createMany({
      data: workerResponse.predictions.map((prediction) => ({
        inferenceJobId: payload.jobId,
        assetId: prediction.assetId,
        labelClassId: prediction.labelClassId,
        geometryJson: prediction.geometry as Prisma.InputJsonObject,
        confidence: prediction.confidence,
        metadataJson: {
          ...prediction.metadata,
          workerMode: workerResponse.mode,
          workerVersion: workerResponse.workerVersion,
        } as Prisma.InputJsonObject,
      })),
    });

    return workerResponse.predictionCount;
  }

  private async runStep(payload: InferenceQueuePayload, patch: JobPatch): Promise<void> {
    await sleep(this.stepDelayMs());
    await this.patchJob(payload, patch);
  }

  private async failJob(payload: InferenceQueuePayload, error: unknown): Promise<void> {
    const errMsg = formatError(error);
    this.logger.error(
      { jobId: payload.jobId, correlationId: payload.correlationId, error: errMsg },
      'Inference job failed'
    );
    try {
      await this.patchJob(payload, {
        status: 'FAILED',
        progress: 100,
        stage: 'failed',
        type: 'error',
        message: formatError(error),
        errorMessage: formatError(error),
      });
    } catch (patchError) {
      this.logger.warn(
        {
          jobId: payload.jobId,
          correlationId: payload.correlationId,
          error: formatError(patchError),
        },
        'Could not mark inference job as failed'
      );
    }
  }

  private async patchJob(payload: InferenceQueuePayload, patch: JobPatch): Promise<void> {
    assertJobProgress(patch.progress);
    const current = await this.inferenceRepo.findById(payload.projectId, payload.jobId);
    if (!current) throw new NotFoundException('Inference job not found.');

    if (patch.status && patch.status !== current.status) {
      assertValidInferenceTransition(current.status, patch.status);
    }

    assertValidProgress(current.progress, patch.progress, current.status);

    const now = new Date();
    const nextStatus = patch.status ?? current.status;

    const row = await this.inferenceRepo.updateJob(payload.projectId, payload.jobId, {
      status: nextStatus,
      progress: patch.progress,
      startedAt:
        nextStatus === 'RUNNING' && !current.startedAt
          ? now.toISOString()
          : (current.startedAt ?? null),
      completedAt: isTerminalJobStatus(nextStatus)
        ? now.toISOString()
        : (current.completedAt ?? null),
      error: patch.errorMessage ?? null,
    });

    if (!row) throw new NotFoundException('Inference job not found after update.');
    this.emitJobEvent(row, patch);
  }

  private emitJobEvent(
    job: InferenceJobSummary,
    partial: {
      type?: InferenceJobEvent['type'];
      stage: InferenceWorkerStage;
      message: string;
    }
  ): void {
    const event = this.buildEvent(job, partial);
    const history = this.eventHistory.get(job.id) ?? [];
    history.push(event);
    this.eventHistory.set(job.id, history.slice(-20));
    this.subjectFor(job.id).next(event);

    if (isTerminalJobStatus(job.status)) {
      this.subjectFor(job.id).complete();
      this.eventSubjects.delete(job.id);
    }
  }

  private buildEvent(
    job: InferenceJobSummary,
    partial: {
      type?: InferenceJobEvent['type'];
      stage: InferenceWorkerStage;
      message: string;
    }
  ): InferenceJobEvent {
    return InferenceJobEventSchema.parse({
      id: `evt_${job.id}_${++this.eventSequence}`,
      jobId: job.id,
      type: partial.type ?? (job.status === 'FAILED' ? 'error' : 'progress'),
      status: job.status,
      progress: job.progress,
      stage: partial.stage,
      message: partial.message,
      createdAt: new Date().toISOString(),
    });
  }

  private subjectFor(jobId: string): Subject<InferenceJobEvent> {
    const existing = this.eventSubjects.get(jobId);
    if (existing && !existing.closed) return existing;
    const subject = new Subject<InferenceJobEvent>();
    this.eventSubjects.set(jobId, subject);
    return subject;
  }

  private shouldUseBullMq(): boolean {
    if (process.env.INFERENCE_QUEUE_MODE === 'memory') return false;
    return Boolean(
      process.env.INFERENCE_QUEUE_MODE === 'bullmq' ||
      process.env.REDIS_URL ||
      process.env.REDIS_HOST
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

  private stepDelayMs(): number {
    const configured = Number(process.env.INFERENCE_WORKER_STEP_MS);
    if (Number.isFinite(configured) && configured >= 0) return configured;
    return this.queue ? 180 : 80;
  }

  private stageForStatus(status: InferenceJobStatus): InferenceWorkerStage {
    if (status === 'QUEUED') return 'queued';
    if (status === 'SUCCEEDED') return 'completed';
    if (status === 'FAILED' || status === 'CANCELLED') return 'failed';
    return 'pipeline_dispatched';
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
