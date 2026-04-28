import { describe, expect, it } from "vitest";
import { PipelineDefinition, validatePipelineDefinition } from "../pipeline";

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

describe("pipeline validation", () => {
  it("accepts the canonical V1 detector pipeline", () => {
    expect(validatePipelineDefinition(validPipeline)).toEqual({ ok: true, errors: [] });
  });

  it("requires detector model configuration", () => {
    const definition: PipelineDefinition = {
      ...validPipeline,
      nodes: validPipeline.nodes.map((node) =>
        node.type === "yolo_onnx" ? { ...node, params: { ...node.params, modelId: null } } : node,
      ),
    };

    expect(validatePipelineDefinition(definition).errors).toContain(
      "Detector node detector requires a modelId.",
    );
  });

  it("rejects graph cycles", () => {
    const definition: PipelineDefinition = {
      ...validPipeline,
      edges: [...validPipeline.edges, { id: "cycle", source: "nms", target: "resize" }],
    };

    expect(validatePipelineDefinition(definition).errors).toContain(
      "Pipeline graph cannot contain cycles.",
    );
  });
});
