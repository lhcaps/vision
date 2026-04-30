import { describe, expect, it } from "vitest";
import {
  CreateInferenceJobRequestSchema,
  InferenceJobEventSchema,
  assertJobProgress,
  assertJobTransition,
  canTransitionJob,
  isTerminalJobStatus,
} from "../jobs";

describe("inference job state machine", () => {
  it("allows queued jobs to start", () => {
    expect(canTransitionJob("QUEUED", "RUNNING")).toBe(true);
  });

  it("rejects terminal state rewind", () => {
    expect(canTransitionJob("SUCCEEDED", "RUNNING")).toBe(false);
    expect(() => assertJobTransition("FAILED", "SUCCEEDED")).toThrow(
      "Invalid inference job transition",
    );
  });

  it("detects terminal statuses", () => {
    expect(isTerminalJobStatus("SUCCEEDED")).toBe(true);
    expect(isTerminalJobStatus("RUNNING")).toBe(false);
  });

  it("guards progress bounds", () => {
    expect(() => assertJobProgress(100)).not.toThrow();
    expect(() => assertJobProgress(101)).toThrow("Invalid inference job progress");
  });

  it("validates create requests and stream events", () => {
    expect(
      CreateInferenceJobRequestSchema.parse({
        datasetVersionId: "dataset_version_1",
        pipelineId: "pipeline_1",
        modelId: null,
      }),
    ).toMatchObject({ modelId: null });

    expect(
      InferenceJobEventSchema.parse({
        id: "evt_1",
        jobId: "job_1",
        type: "progress",
        status: "RUNNING",
        progress: 48,
        stage: "cv_worker_dispatched",
        message: "Worker dispatched validated pipeline.",
        createdAt: "2026-04-29T00:00:00.000Z",
      }),
    ).toMatchObject({ stage: "cv_worker_dispatched" });
  });
});
