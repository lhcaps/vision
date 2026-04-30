import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { Observable, Subject } from "rxjs";
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
  assertJobTransition,
  isTerminalJobStatus,
} from "@visionflow/contracts";
import { DatasetsService } from "../datasets/datasets.service";
import { MediaService } from "../media/media.service";
import { PipelinesService } from "../pipelines/pipelines.service";
import { PrismaService } from "../prisma/prisma.service";
import { demoSnapshot } from "../projects/demo-snapshot";
import { CvWorkerClient } from "./cv-worker.client";

type InferenceQueuePayload = {
  projectId: string;
  jobId: string;
};

type MemoryInferenceJob = InferenceJobSummary;

type JobPatch = {
  status?: InferenceJobStatus;
  progress: number;
  stage: InferenceWorkerStage;
  message: string;
  type?: InferenceJobEvent["type"];
  errorMessage?: string | null;
};

const QUEUE_NAME = "visionflow.inference";
const DEFAULT_PROJECT_ID = demoSnapshot.project.id;

@Injectable()
export class InferenceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InferenceService.name);
  private readonly eventSubjects = new Map<string, Subject<InferenceJobEvent>>();
  private readonly eventHistory = new Map<string, InferenceJobEvent[]>();
  private readonly memoryJobs = new Map<string, MemoryInferenceJob>();
  private readonly memoryQueue: InferenceQueuePayload[] = [];
  private queue: Queue<InferenceQueuePayload> | null = null;
  private worker: Worker<InferenceQueuePayload> | null = null;
  private memoryDrain: Promise<void> | null = null;
  private eventSequence = 0;
  private jobSequence = 0;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DatasetsService) private readonly datasetsService: DatasetsService,
    @Inject(MediaService) private readonly mediaService: MediaService,
    @Inject(PipelinesService) private readonly pipelinesService: PipelinesService,
    @Inject(CvWorkerClient) private readonly cvWorkerClient: CvWorkerClient,
  ) {}

  onModuleInit(): void {
    if (!this.shouldUseBullMq()) {
      return;
    }

    const connection = this.redisConnection();
    this.queue = new Queue<InferenceQueuePayload>(QUEUE_NAME, { connection });
    this.worker = new Worker<InferenceQueuePayload>(
      QUEUE_NAME,
      async (job) => this.processJob(job.data),
      {
        connection,
        concurrency: Number(process.env.INFERENCE_WORKER_CONCURRENCY ?? "1"),
      },
    );

    this.worker.on("failed", (job, error) => {
      if (!job) {
        this.logger.warn(`Inference worker failed before job data was available: ${error.message}`);
        return;
      }

      this.logger.warn(`Inference worker failed for ${job.data.jobId}: ${error.message}`);
    });

    this.worker.on("error", (error) => {
      this.logger.warn(`Inference worker error: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  async listJobs(projectId: string): Promise<InferenceJobSummary[]> {
    if (process.env.DATABASE_URL) {
      const rows = await this.prisma.inferenceJob.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 12,
      });

      return rows.map((row) => toJobSummary(row));
    }

    this.ensureMemorySeed(projectId);

    return [...this.memoryJobs.values()]
      .filter((job) => job.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getJob(projectId: string, jobId: string): Promise<InferenceJobSummary> {
    const job = await this.findJob(projectId, jobId);

    if (!job) {
      throw new NotFoundException("Inference job not found for this project.");
    }

    return job;
  }

  async createJob(projectId: string, dto: CreateInferenceJobRequest): Promise<InferenceJobSummary> {
    await this.assertRunnableDatasetVersion(projectId, dto.datasetVersionId);
    await this.assertRunnablePipeline(projectId, dto.pipelineId);

    const job = process.env.DATABASE_URL
      ? await this.createPrismaJob(projectId, dto)
      : this.createMemoryJob(projectId, dto);

    this.emitJobEvent(job, {
      type: "log",
      stage: "queued",
      message: "Queue accepted inference payload with IDs only.",
    });

    await this.enqueueJob({ projectId, jobId: job.id });

    return job;
  }

  streamJob(projectId: string, jobId: string): Observable<InferenceJobEvent> {
    return new Observable((observer) => {
      let closed = false;
      let unsubscribe: (() => void) | null = null;

      void this.getJob(projectId, jobId)
        .then((job) => {
          if (closed) {
            return;
          }

          observer.next(
            this.buildEvent(job, {
              type: "snapshot",
              stage: this.stageForStatus(job.status),
              message: `Current job snapshot: ${job.status} at ${job.progress}%.`,
            }),
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

  private async createPrismaJob(
    projectId: string,
    dto: CreateInferenceJobRequest,
  ): Promise<InferenceJobSummary> {
    if (dto.modelId) {
      const model = await this.prisma.modelArtifact.findFirst({
        where: { id: dto.modelId, projectId },
        select: { id: true },
      });

      if (!model) {
        throw new NotFoundException("Model artifact not found for this project.");
      }
    }

    const job = await this.prisma.inferenceJob.create({
      data: {
        projectId,
        datasetVersionId: dto.datasetVersionId,
        pipelineId: dto.pipelineId,
        modelId: dto.modelId ?? null,
        status: "QUEUED",
        progress: 0,
      },
    });

    await this.writeAudit(projectId, "INFERENCE_JOB_CREATED", "InferenceJob", job.id, {
      datasetVersionId: dto.datasetVersionId,
      pipelineId: dto.pipelineId,
      modelId: dto.modelId ?? null,
    });

    return toJobSummary(job);
  }

  private createMemoryJob(projectId: string, dto: CreateInferenceJobRequest): InferenceJobSummary {
    const now = new Date().toISOString();
    const job: MemoryInferenceJob = {
      id: `inference_job_${sanitizeId(projectId)}_${Date.now()}_${++this.jobSequence}`,
      projectId,
      datasetVersionId: dto.datasetVersionId,
      pipelineId: dto.pipelineId,
      modelId: dto.modelId ?? null,
      status: "QUEUED",
      progress: 0,
      createdAt: now,
      startedAt: null,
      completedAt: null,
      errorMessage: null,
    };

    this.memoryJobs.set(job.id, job);

    return job;
  }

  private async assertRunnableDatasetVersion(
    projectId: string,
    datasetVersionId: string,
  ): Promise<void> {
    if (process.env.DATABASE_URL) {
      const version = await this.prisma.datasetVersion.findFirst({
        where: {
          id: datasetVersionId,
          dataset: { projectId },
        },
        include: {
          assets: {
            select: { id: true },
          },
        },
      });

      if (!version) {
        throw new NotFoundException("Dataset version not found for this project.");
      }

      if (version.status !== "LOCKED") {
        throw new ConflictException("Inference jobs require a locked dataset version.");
      }

      if (version.assets.length === 0) {
        throw new BadRequestException("Inference jobs require at least one dataset asset.");
      }

      return;
    }

    const datasets = await this.datasetsService.listDatasets(projectId);

    for (const dataset of datasets) {
      const versions = await this.datasetsService.listVersions(projectId, dataset.id);
      const version = versions.find((item) => item.id === datasetVersionId);

      if (!version) {
        continue;
      }

      if (version.status !== "LOCKED") {
        throw new ConflictException("Inference jobs require a locked dataset version.");
      }

      if (version.assetCount === 0) {
        throw new BadRequestException("Inference jobs require at least one dataset asset.");
      }

      return;
    }

    throw new NotFoundException("Dataset version not found for this project.");
  }

  private async assertRunnablePipeline(projectId: string, pipelineId: string): Promise<void> {
    const pipeline = (await this.pipelinesService.listPipelines(projectId)).find(
      (item) => item.id === pipelineId,
    );

    if (!pipeline) {
      throw new NotFoundException("Pipeline not found for this project.");
    }

    if (!pipeline.validation.ok) {
      throw new BadRequestException({
        message: "Inference jobs require a valid persisted pipeline.",
        issues: pipeline.validation.issues,
      });
    }
  }

  private async enqueueJob(payload: InferenceQueuePayload): Promise<void> {
    if (this.queue) {
      try {
        await this.queue.add("run-inference", payload, {
          jobId: payload.jobId,
          removeOnComplete: 100,
          removeOnFail: 100,
        });
        return;
      } catch (error) {
        this.logger.warn(
          `BullMQ enqueue failed, falling back to in-process worker: ${formatError(error)}`,
        );
      }
    }

    this.memoryQueue.push(payload);

    if (!this.memoryDrain) {
      this.memoryDrain = this.drainMemoryQueue().finally(() => {
        this.memoryDrain = null;
      });
    }
  }

  private async drainMemoryQueue(): Promise<void> {
    while (this.memoryQueue.length > 0) {
      const payload = this.memoryQueue.shift();

      if (payload) {
        await this.processJob(payload);
      }
    }
  }

  private async processJob(payload: InferenceQueuePayload): Promise<void> {
    try {
      await this.patchJob(payload, {
        status: "RUNNING",
        progress: 8,
        stage: "validated",
        message: "Worker claimed job and validated the state transition.",
      });

      const workerPayload = await this.resolveCvWorkerPayload(payload);

      await this.runStep(payload, {
        progress: 28,
        stage: "dataset_resolved",
        message: `Locked dataset version resolved with ${workerPayload.assets.length} image assets.`,
      });
      await this.runStep(payload, {
        progress: 46,
        stage: "cv_worker_dispatched",
        message: `Dispatching ${workerPayload.detectorMode} detector request to the CV worker.`,
      });

      const workerResponse = await this.cvWorkerClient.runPipeline(workerPayload);

      await this.patchJob(payload, {
        progress: 72,
        stage: "cv_worker_dispatched",
        type: "log",
        message: `CV worker ${workerResponse.mode} completed ${workerResponse.predictionCount} predictions.`,
      });

      for (const warning of workerResponse.warnings) {
        await this.patchJob(payload, {
          progress: 72,
          stage: "cv_worker_dispatched",
          type: "log",
          message: warning,
        });
      }

      const persistedCount = await this.persistPredictions(payload, workerResponse);

      await this.runStep(payload, {
        progress: 88,
        stage: "predictions_persisted",
        message: `${persistedCount} worker predictions persisted for overlay and evaluation.`,
      });
      await this.runStep(payload, {
        status: "SUCCEEDED",
        progress: 100,
        stage: "completed",
        type: "complete",
        message: "Inference job completed successfully.",
      });
    } catch (error) {
      await this.failJob(payload, error);
    }
  }

  private async resolveCvWorkerPayload(
    payload: InferenceQueuePayload,
  ): Promise<CvWorkerRunPipelinePayload> {
    const job = await this.getJob(payload.projectId, payload.jobId);
    const pipeline = (await this.pipelinesService.listPipelines(payload.projectId)).find(
      (item) => item.id === job.pipelineId,
    );

    if (!pipeline) {
      throw new Error("Inference job pipeline could not be resolved for worker dispatch.");
    }

    const assetIds = await this.datasetsService.listVersionAssetIds(
      payload.projectId,
      job.datasetVersionId,
    );
    const assets = await this.resolveWorkerAssets(payload.projectId, assetIds);
    const detectorNode = pipeline.definition.nodes.find((node) => node.type === "yolo_onnx");
    const detectorMode = process.env.CV_WORKER_DETECTOR_MODE === "onnx" ? "onnx" : "mock";
    const detectorModelId = detectorNode?.type === "yolo_onnx" ? detectorNode.params.modelId : null;

    return {
      jobId: job.id,
      pipeline: pipeline.definition,
      detectorMode,
      modelArtifactKey: await this.resolveModelArtifactKey(
        payload.projectId,
        job.modelId ?? detectorModelId,
      ),
      confidenceThreshold:
        detectorNode?.type === "yolo_onnx" ? detectorNode.params.threshold : undefined,
      assets,
    };
  }

  private async resolveWorkerAssets(
    projectId: string,
    assetIds: string[],
  ): Promise<CvWorkerAssetInput[]> {
    const mediaRows = await this.mediaService.list(projectId);
    const mediaById = new Map(mediaRows.map((asset) => [asset.id, asset]));
    const workerAssets = assetIds.map((assetId) => {
      const asset = mediaById.get(assetId);

      if (!asset) {
        throw new Error(`Dataset version references missing media asset ${assetId}.`);
      }

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
      throw new Error("CV worker dispatch requires at least one dataset asset.");
    }

    return workerAssets;
  }

  private async resolveModelArtifactKey(
    projectId: string,
    modelId: string | null,
  ): Promise<string | null> {
    if (!modelId) {
      return null;
    }

    if (!process.env.DATABASE_URL) {
      return modelId;
    }

    const model = await this.prisma.modelArtifact.findFirst({
      where: { id: modelId, projectId },
      select: { artifactKey: true },
    });

    return model?.artifactKey ?? modelId;
  }

  private async persistPredictions(
    payload: InferenceQueuePayload,
    workerResponse: CvWorkerRunPipelineResponse,
  ): Promise<number> {
    if (!process.env.DATABASE_URL) {
      return workerResponse.predictionCount;
    }

    await this.prisma.prediction.deleteMany({
      where: { inferenceJobId: payload.jobId },
    });

    if (workerResponse.predictions.length === 0) {
      return 0;
    }

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
    try {
      await this.patchJob(payload, {
        status: "FAILED",
        progress: 100,
        stage: "failed",
        type: "error",
        message: formatError(error),
        errorMessage: formatError(error),
      });
    } catch (patchError) {
      this.logger.warn(`Could not mark inference job failed: ${formatError(patchError)}`);
    }
  }

  private async patchJob(payload: InferenceQueuePayload, patch: JobPatch): Promise<void> {
    assertJobProgress(patch.progress);
    const current = await this.getJob(payload.projectId, payload.jobId);

    if (patch.status && patch.status !== current.status) {
      assertJobTransition(current.status, patch.status);
    }

    if (patch.progress < current.progress && patch.status !== "FAILED") {
      throw new Error(
        `Invalid inference job progress rewind: ${current.progress} -> ${patch.progress}`,
      );
    }

    const now = new Date();
    const nextStatus = patch.status ?? current.status;

    if (process.env.DATABASE_URL) {
      const row = await this.prisma.inferenceJob.update({
        where: { id: payload.jobId },
        data: {
          status: nextStatus,
          progress: patch.progress,
          startedAt:
            nextStatus === "RUNNING" && !current.startedAt
              ? now
              : parseNullableDate(current.startedAt),
          completedAt: isTerminalJobStatus(nextStatus)
            ? now
            : parseNullableDate(current.completedAt),
          errorMessage: patch.errorMessage ?? current.errorMessage,
        },
      });

      await this.writeStatusAudit(
        payload.projectId,
        row.id,
        nextStatus,
        patch.stage,
        patch.message,
      );
      this.emitJobEvent(toJobSummary(row), patch);
      return;
    }

    const updated: MemoryInferenceJob = {
      ...current,
      status: nextStatus,
      progress: patch.progress,
      startedAt:
        nextStatus === "RUNNING" && !current.startedAt ? now.toISOString() : current.startedAt,
      completedAt: isTerminalJobStatus(nextStatus) ? now.toISOString() : current.completedAt,
      errorMessage: patch.errorMessage ?? current.errorMessage,
    };

    this.memoryJobs.set(updated.id, updated);
    this.emitJobEvent(updated, patch);
  }

  private emitJobEvent(
    job: InferenceJobSummary,
    partial: {
      type?: InferenceJobEvent["type"];
      stage: InferenceWorkerStage;
      message: string;
    },
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
      type?: InferenceJobEvent["type"];
      stage: InferenceWorkerStage;
      message: string;
    },
  ): InferenceJobEvent {
    return InferenceJobEventSchema.parse({
      id: `evt_${job.id}_${++this.eventSequence}`,
      jobId: job.id,
      type: partial.type ?? (job.status === "FAILED" ? "error" : "progress"),
      status: job.status,
      progress: job.progress,
      stage: partial.stage,
      message: partial.message,
      createdAt: new Date().toISOString(),
    });
  }

  private subjectFor(jobId: string): Subject<InferenceJobEvent> {
    const existing = this.eventSubjects.get(jobId);

    if (existing && !existing.closed) {
      return existing;
    }

    const subject = new Subject<InferenceJobEvent>();
    this.eventSubjects.set(jobId, subject);

    return subject;
  }

  private async findJob(projectId: string, jobId: string): Promise<InferenceJobSummary | null> {
    if (process.env.DATABASE_URL) {
      const row = await this.prisma.inferenceJob.findFirst({
        where: { id: jobId, projectId },
      });

      return row ? toJobSummary(row) : null;
    }

    this.ensureMemorySeed(projectId);
    const job = this.memoryJobs.get(jobId);

    return job?.projectId === projectId ? job : null;
  }

  private async writeStatusAudit(
    projectId: string,
    jobId: string,
    status: InferenceJobStatus,
    stage: InferenceWorkerStage,
    message: string,
  ): Promise<void> {
    if (status !== "SUCCEEDED" && status !== "FAILED" && stage !== "validated") {
      return;
    }

    await this.writeAudit(projectId, "INFERENCE_JOB_STATE_CHANGED", "InferenceJob", jobId, {
      status,
      stage,
      message,
    });
  }

  private async writeAudit(
    projectId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadataJson: Prisma.InputJsonObject,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        projectId,
        action,
        targetType,
        targetId,
        metadataJson,
      },
    });
  }

  private ensureMemorySeed(projectId: string): void {
    const hasProjectJob = [...this.memoryJobs.values()].some((job) => job.projectId === projectId);

    if (hasProjectJob) {
      return;
    }

    const datasetId = `dataset_${sanitizeId(projectId)}_parking`;
    const job: MemoryInferenceJob = {
      id:
        projectId === DEFAULT_PROJECT_ID
          ? demoSnapshot.job.id
          : `job_${sanitizeId(projectId)}_seed`,
      projectId,
      datasetVersionId: `${datasetId}_v3`,
      pipelineId: `pipeline_${sanitizeId(projectId)}_parking_detector`,
      modelId: null,
      status: demoSnapshot.job.status,
      progress: demoSnapshot.job.progress,
      createdAt: "2026-04-28T13:35:40.000Z",
      startedAt: demoSnapshot.job.startedAt ?? null,
      completedAt: null,
      errorMessage: null,
    };

    this.memoryJobs.set(job.id, job);
  }

  private shouldUseBullMq(): boolean {
    if (process.env.INFERENCE_QUEUE_MODE === "memory") {
      return false;
    }

    return Boolean(
      process.env.INFERENCE_QUEUE_MODE === "bullmq" ||
      process.env.REDIS_URL ||
      process.env.REDIS_HOST,
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
      host: process.env.REDIS_HOST ?? "127.0.0.1",
      port: Number(process.env.REDIS_PORT ?? "6379"),
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      connectTimeout: 750,
    } as ConnectionOptions;
  }

  private stepDelayMs(): number {
    const configured = Number(process.env.INFERENCE_WORKER_STEP_MS);

    if (Number.isFinite(configured) && configured >= 0) {
      return configured;
    }

    return this.queue ? 180 : 80;
  }

  private stageForStatus(status: InferenceJobStatus): InferenceWorkerStage {
    if (status === "QUEUED") {
      return "queued";
    }

    if (status === "SUCCEEDED") {
      return "completed";
    }

    if (status === "FAILED" || status === "CANCELLED") {
      return "failed";
    }

    return "pipeline_dispatched";
  }
}

function toJobSummary(row: {
  id: string;
  projectId: string;
  datasetVersionId: string;
  pipelineId: string;
  modelId: string | null;
  status: InferenceJobStatus;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}): InferenceJobSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    datasetVersionId: row.datasetVersionId,
    pipelineId: row.pipelineId,
    modelId: row.modelId,
    status: row.status,
    progress: row.progress,
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    errorMessage: row.errorMessage,
  };
}

function parseNullableDate(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "project";
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}
