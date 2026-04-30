import { ConflictException, NotFoundException } from "@nestjs/common";
import type { CvWorkerRunPipelinePayload } from "@visionflow/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { firstValueFrom, take } from "rxjs";
import { DatasetsService } from "../datasets/datasets.service";
import { MediaService } from "../media/media.service";
import { PipelinesService } from "../pipelines/pipelines.service";
import { PrismaService } from "../prisma/prisma.service";
import { CvWorkerClient } from "./cv-worker.client";
import { InferenceService } from "./inference.service";

describe("InferenceService memory fallback", () => {
  let service: InferenceService;
  let cvWorkerClient: Pick<CvWorkerClient, "runPipeline">;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_URL;
    delete process.env.CV_WORKER_URL;
    delete process.env.CV_WORKER_DETECTOR_MODE;
    process.env.INFERENCE_QUEUE_MODE = "memory";
    process.env.INFERENCE_WORKER_STEP_MS = "0";

    const prisma = {} as PrismaService;
    cvWorkerClient = {
      runPipeline: vi.fn(async (request: CvWorkerRunPipelinePayload) => ({
        jobId: request.jobId,
        mode: "mock_detector" as const,
        workerVersion: "test-worker",
        assetCount: request.assets.length,
        predictionCount: request.assets.length,
        predictions: request.assets.map((asset) => ({
          assetId: asset.assetId,
          labelClassId: null,
          geometry: { x: 8, y: 12, width: 64, height: 48 },
          confidence: 0.82,
          metadata: { runtime: "test_worker", storageKey: asset.storageKey },
        })),
        warnings: [],
      })),
    };
    service = new InferenceService(
      prisma,
      new DatasetsService(prisma),
      new MediaService(prisma, {} as never),
      new PipelinesService(prisma),
      cvWorkerClient as CvWorkerClient,
    );
  });

  it("lists a seeded job snapshot", async () => {
    const [job] = await service.listJobs("proj_parking_lot");

    expect(job).toMatchObject({
      id: "job_2026_04_28_2036",
      datasetVersionId: "dataset_proj_parking_lot_parking_v3",
      pipelineId: "pipeline_proj_parking_lot_parking_detector",
      status: "QUEUED",
    });
  });

  it("creates a queued job and advances it through explicit worker states", async () => {
    const created = await service.createJob("proj_parking_lot", {
      datasetVersionId: "dataset_proj_parking_lot_parking_v3",
      pipelineId: "pipeline_proj_parking_lot_parking_detector",
      modelId: null,
    });

    await service.drainMemoryJobsForTest();

    const completed = await service.getJob("proj_parking_lot", created.id);

    expect(completed).toMatchObject({
      status: "SUCCEEDED",
      progress: 100,
      startedAt: expect.any(String),
      completedAt: expect.any(String),
    });
    expect(cvWorkerClient.runPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        detectorMode: "mock",
        confidenceThreshold: 0.62,
        assets: expect.arrayContaining([
          expect.objectContaining({
            assetId: "asset_frame_1482",
            width: 1920,
            height: 1080,
          }),
        ]),
      }),
    );
  });

  it("streams a job snapshot before live events", async () => {
    const job = await service.createJob("proj_parking_lot", {
      datasetVersionId: "dataset_proj_parking_lot_parking_v3",
      pipelineId: "pipeline_proj_parking_lot_parking_detector",
      modelId: null,
    });
    const event = await firstValueFrom(service.streamJob("proj_parking_lot", job.id).pipe(take(1)));

    expect(event).toMatchObject({
      jobId: job.id,
      type: "snapshot",
    });
  });

  it("marks jobs failed when the CV worker rejects dispatch", async () => {
    vi.mocked(cvWorkerClient.runPipeline).mockRejectedValueOnce(new Error("CV worker offline"));

    const created = await service.createJob("proj_parking_lot", {
      datasetVersionId: "dataset_proj_parking_lot_parking_v3",
      pipelineId: "pipeline_proj_parking_lot_parking_detector",
      modelId: null,
    });

    await service.drainMemoryJobsForTest();

    const failed = await service.getJob("proj_parking_lot", created.id);

    expect(failed).toMatchObject({
      status: "FAILED",
      progress: 100,
      errorMessage: "CV worker offline",
    });
  });

  it("rejects draft dataset versions", async () => {
    await expect(
      service.createJob("proj_parking_lot", {
        datasetVersionId: "dataset_proj_parking_lot_parking_v4",
        pipelineId: "pipeline_proj_parking_lot_parking_detector",
        modelId: null,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it("rejects missing pipelines", async () => {
    await expect(
      service.createJob("proj_parking_lot", {
        datasetVersionId: "dataset_proj_parking_lot_parking_v3",
        pipelineId: "pipeline_missing",
        modelId: null,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
