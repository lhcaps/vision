import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { PipelineDefinition } from "@visionflow/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { PipelinesService } from "./pipelines.service";

const validPipeline: PipelineDefinition = {
  version: 1,
  nodes: [
    { id: "input", type: "input", params: {} },
    { id: "resize", type: "resize", params: { width: 960 } },
    {
      id: "detector",
      type: "yolo_onnx",
      params: { modelId: "model_onnx_parking", threshold: 0.62 },
    },
    { id: "nms", type: "nms", params: { iouThreshold: 0.45 } },
    { id: "output", type: "output", params: {} },
  ],
  edges: [
    { id: "e1", source: "input", target: "resize" },
    { id: "e2", source: "resize", target: "detector" },
    { id: "e3", source: "detector", target: "nms" },
    { id: "e4", source: "nms", target: "output" },
  ],
};

describe("PipelinesService memory fallback", () => {
  let service: PipelinesService;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    service = new PipelinesService({} as PrismaService);
  });

  it("lists a seeded demo pipeline with backend validation metadata", async () => {
    const [pipeline] = await service.listPipelines("proj_parking_lot");

    expect(pipeline).toMatchObject({
      name: "Parking detector pipeline",
      validation: {
        ok: true,
        summary: {
          nodeCount: 5,
          detectorNodeCount: 1,
          executionOrder: ["input", "resize", "detector", "nms", "output"],
        },
      },
    });
  });

  it("creates and updates validated pipeline definitions", async () => {
    const created = await service.createPipeline("proj_parking_lot", {
      name: "Review pipeline",
      definition: validPipeline,
    });
    const updated = await service.updatePipeline("proj_parking_lot", created.id, {
      name: "Review pipeline locked",
      definition: {
        ...validPipeline,
        nodes: validPipeline.nodes.map((node) =>
          node.type === "nms" ? { ...node, params: { ...node.params, iouThreshold: 0.5 } } : node,
        ),
      },
    });

    expect(updated.name).toBe("Review pipeline locked");
    expect(updated.validation.ok).toBe(true);
    expect(updated.definition.nodes.find((node) => node.type === "nms")?.params.iouThreshold).toBe(
      0.5,
    );
  });

  it("rejects invalid detector configuration before persistence", async () => {
    const invalidDefinition: PipelineDefinition = {
      ...validPipeline,
      nodes: validPipeline.nodes.map((node) =>
        node.type === "yolo_onnx" ? { ...node, params: { ...node.params, modelId: null } } : node,
      ),
    };

    await expect(
      service.createPipeline("proj_parking_lot", {
        name: "Broken pipeline",
        definition: invalidDefinition,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects project-scoped updates to missing pipelines", async () => {
    await expect(
      service.updatePipeline("proj_parking_lot", "pipeline_missing", { name: "Nope" }),
    ).rejects.toThrow(NotFoundException);
  });
});
