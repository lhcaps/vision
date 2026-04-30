import { beforeEach, describe, expect, it } from "vitest";
import type { PipelineDefinition } from "@visionflow/contracts";
import { CvWorkerClient } from "./cv-worker.client";

const pipeline: PipelineDefinition = {
  version: 1,
  nodes: [
    { id: "input", type: "input", params: {} },
    { id: "detector", type: "yolo_onnx", params: { modelId: "model_1", threshold: 0.6 } },
    { id: "output", type: "output", params: {} },
  ],
  edges: [
    { id: "e1", source: "input", target: "detector" },
    { id: "e2", source: "detector", target: "output" },
  ],
};

describe("CvWorkerClient fallback", () => {
  beforeEach(() => {
    delete process.env.CV_WORKER_URL;
    delete process.env.CV_WORKER_TIMEOUT_MS;
  });

  it("keeps deterministic mock geometry inside tiny image bounds", async () => {
    const response = await new CvWorkerClient().runPipeline({
      jobId: "job_small",
      pipeline,
      assets: [
        {
          assetId: "asset_tiny",
          storageKey: "projects/demo/originals/tiny.jpg",
          width: 18,
          height: 20,
        },
      ],
    });

    const geometry = response.predictions[0].geometry;

    expect(geometry.x).toBeGreaterThanOrEqual(0);
    expect(geometry.y).toBeGreaterThanOrEqual(0);
    expect(geometry.x + geometry.width).toBeLessThanOrEqual(18);
    expect(geometry.y + geometry.height).toBeLessThanOrEqual(20);
  });

  it("does not run ONNX mode through the in-process fallback", async () => {
    await expect(
      new CvWorkerClient().runPipeline({
        jobId: "job_onnx",
        pipeline,
        detectorMode: "onnx",
        modelArtifactKey: "models/demo.onnx",
        assets: [
          {
            assetId: "asset_1",
            storageKey: "projects/demo/originals/asset_1.jpg",
            width: 640,
            height: 360,
          },
        ],
      }),
    ).rejects.toThrow("ONNX detector mode requires a configured CV_WORKER_URL.");
  });
});
