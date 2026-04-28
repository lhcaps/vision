import { z } from "zod";

const nodeBase = z.object({
  id: z.string().min(1),
});

export const PipelineNodeSchema = z.discriminatedUnion("type", [
  nodeBase.extend({
    type: z.literal("input"),
    params: z.object({}),
  }),
  nodeBase.extend({
    type: z.literal("resize"),
    params: z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive().optional(),
    }),
  }),
  nodeBase.extend({
    type: z.literal("hsv_filter"),
    params: z.object({
      hMin: z.number().min(0).max(360),
      hMax: z.number().min(0).max(360),
      sMin: z.number().min(0).max(1),
      vMin: z.number().min(0).max(1),
    }),
  }),
  nodeBase.extend({
    type: z.literal("yolo_onnx"),
    params: z.object({
      modelId: z.string().min(1).nullable(),
      threshold: z.number().min(0).max(1),
    }),
  }),
  nodeBase.extend({
    type: z.literal("nms"),
    params: z.object({
      iouThreshold: z.number().min(0).max(1),
    }),
  }),
  nodeBase.extend({
    type: z.literal("output"),
    params: z.object({}),
  }),
]);

export const PipelineEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
});

export const PipelineDefinitionSchema = z.object({
  version: z.literal(1),
  nodes: z.array(PipelineNodeSchema).min(1),
  edges: z.array(PipelineEdgeSchema),
});

export type PipelineNode = z.infer<typeof PipelineNodeSchema>;
export type PipelineEdge = z.infer<typeof PipelineEdgeSchema>;
export type PipelineDefinition = z.infer<typeof PipelineDefinitionSchema>;

export type PipelineValidationResult = {
  ok: boolean;
  errors: string[];
};

export function validatePipelineDefinition(
  definition: PipelineDefinition,
): PipelineValidationResult {
  const errors: string[] = [];
  const parsed = PipelineDefinitionSchema.safeParse(definition);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const nodeIds = new Set(definition.nodes.map((node) => node.id));
  const inputNodes = definition.nodes.filter((node) => node.type === "input");
  const outputNodes = definition.nodes.filter((node) => node.type === "output");

  if (inputNodes.length !== 1) {
    errors.push("Pipeline must have exactly one input node.");
  }

  if (outputNodes.length !== 1) {
    errors.push("Pipeline must have exactly one output node.");
  }

  for (const edge of definition.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references missing source node ${edge.source}.`);
    }

    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references missing target node ${edge.target}.`);
    }
  }

  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();

  for (const node of definition.nodes) {
    inbound.set(node.id, 0);
    outbound.set(node.id, 0);
  }

  for (const edge of definition.edges) {
    inbound.set(edge.target, (inbound.get(edge.target) ?? 0) + 1);
    outbound.set(edge.source, (outbound.get(edge.source) ?? 0) + 1);
  }

  for (const node of definition.nodes) {
    if (node.type !== "input" && (inbound.get(node.id) ?? 0) === 0) {
      errors.push(`Node ${node.id} needs an inbound edge.`);
    }

    if (node.type !== "output" && (outbound.get(node.id) ?? 0) === 0) {
      errors.push(`Node ${node.id} needs an outbound edge.`);
    }

    if (node.type === "yolo_onnx" && !node.params.modelId) {
      errors.push(`Detector node ${node.id} requires a modelId.`);
    }
  }

  if (hasCycle(definition.nodes, definition.edges)) {
    errors.push("Pipeline graph cannot contain cycles.");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function hasCycle(nodes: PipelineNode[], edges: PipelineEdge[]): boolean {
  const graph = new Map<string, string[]>();

  for (const node of nodes) {
    graph.set(node.id, []);
  }

  for (const edge of edges) {
    graph.get(edge.source)?.push(edge.target);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(nodeId: string): boolean {
    if (visiting.has(nodeId)) {
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visiting.add(nodeId);

    for (const target of graph.get(nodeId) ?? []) {
      if (visit(target)) {
        return true;
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);

    return false;
  }

  return nodes.some((node) => visit(node.id));
}
