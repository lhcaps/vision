import { ConflictException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { firstValueFrom, take } from "rxjs";
import { DatasetsService } from "../datasets/datasets.service";
import { PipelinesService } from "../pipelines/pipelines.service";
import { PrismaService } from "../prisma/prisma.service";
import { InferenceService } from "./inference.service";

describe("InferenceService memory fallback", () => {
  let service: InferenceService;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_URL;
    process.env.INFERENCE_QUEUE_MODE = "memory";
    process.env.INFERENCE_WORKER_STEP_MS = "0";

    const prisma = {} as PrismaService;
    service = new InferenceService(
      prisma,
      new DatasetsService(prisma),
      new PipelinesService(prisma),
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
