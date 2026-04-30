import { z } from 'zod';

const nodeBase = z.object({
  id: z.string().min(1),
});

export const PipelineNodeSchema = z.discriminatedUnion('type', [
  nodeBase.extend({
    type: z.literal('input'),
    params: z.object({}),
  }),
  nodeBase.extend({
    type: z.literal('resize'),
    params: z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive().optional(),
    }),
  }),
  nodeBase.extend({
    type: z.literal('hsv_filter'),
    params: z.object({
      hMin: z.number().min(0).max(360),
      hMax: z.number().min(0).max(360),
      sMin: z.number().min(0).max(1),
      vMin: z.number().min(0).max(1),
    }),
  }),
  nodeBase.extend({
    type: z.literal('yolo_onnx'),
    params: z.object({
      modelId: z.string().min(1).nullable(),
      threshold: z.number().min(0).max(1),
    }),
  }),
  nodeBase.extend({
    type: z.literal('nms'),
    params: z.object({
      iouThreshold: z.number().min(0).max(1),
    }),
  }),
  nodeBase.extend({
    type: z.literal('output'),
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

export const PipelineValidationIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  nodeId: z.string().optional(),
  edgeId: z.string().optional(),
});

export const PipelineValidationSummarySchema = z.object({
  nodeCount: z.number().int().nonnegative(),
  edgeCount: z.number().int().nonnegative(),
  detectorNodeCount: z.number().int().nonnegative(),
  inputNodeId: z.string().nullable(),
  outputNodeId: z.string().nullable(),
  executionOrder: z.array(z.string()),
});

export const PipelineValidationResultSchema = z.object({
  ok: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  issues: z.array(PipelineValidationIssueSchema),
  summary: PipelineValidationSummarySchema,
});

export const CreatePipelineRequestSchema = z.object({
  name: z.string().min(2).max(80),
  definition: PipelineDefinitionSchema,
});

export const UpdatePipelineRequestSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    definition: PipelineDefinitionSchema.optional(),
  })
  .refine((value) => value.name !== undefined || value.definition !== undefined, {
    message: 'At least one pipeline field must be provided.',
  });

export const ValidatePipelineRequestSchema = z.object({
  definition: z.unknown(),
});

export const PipelineSummarySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  definition: PipelineDefinitionSchema,
  validation: PipelineValidationResultSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PipelineListResponseSchema = z.object({
  pipelines: z.array(PipelineSummarySchema),
});

export const PipelineValidationResponseSchema = z.object({
  validation: PipelineValidationResultSchema,
});

export type PipelineNode = z.infer<typeof PipelineNodeSchema>;
export type PipelineEdge = z.infer<typeof PipelineEdgeSchema>;
export type PipelineDefinition = z.infer<typeof PipelineDefinitionSchema>;
export type PipelineValidationIssue = z.infer<typeof PipelineValidationIssueSchema>;
export type PipelineValidationSummary = z.infer<typeof PipelineValidationSummarySchema>;
export type PipelineValidationResult = z.infer<typeof PipelineValidationResultSchema>;
export type CreatePipelineRequest = z.infer<typeof CreatePipelineRequestSchema>;
export type UpdatePipelineRequest = z.infer<typeof UpdatePipelineRequestSchema>;
export type ValidatePipelineRequest = z.infer<typeof ValidatePipelineRequestSchema>;
export type PipelineSummary = z.infer<typeof PipelineSummarySchema>;
export type PipelineListResponse = z.infer<typeof PipelineListResponseSchema>;
export type PipelineValidationResponse = z.infer<typeof PipelineValidationResponseSchema>;

export function validatePipelineDefinition(definition: unknown): PipelineValidationResult {
  const parsed = PipelineDefinitionSchema.safeParse(definition);
  const issues: PipelineValidationIssue[] = [];

  if (!parsed.success) {
    parsed.error.issues.forEach((issue) =>
      addIssue(issues, {
        code: 'schema_invalid',
        severity: 'error',
        message:
          issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
      })
    );

    return buildValidationResult(emptySummary(), issues);
  }

  const value = parsed.data;
  const nodeIds = new Set(value.nodes.map((node) => node.id));
  const duplicateNodeIds = findDuplicates(value.nodes.map((node) => node.id));
  const duplicateEdgeIds = findDuplicates(value.edges.map((edge) => edge.id));
  const inputNodes = value.nodes.filter((node) => node.type === 'input');
  const outputNodes = value.nodes.filter((node) => node.type === 'output');

  duplicateNodeIds.forEach((nodeId) =>
    addIssue(issues, {
      code: 'duplicate_node_id',
      severity: 'error',
      message: `Node id ${nodeId} is used more than once.`,
      nodeId,
    })
  );

  duplicateEdgeIds.forEach((edgeId) =>
    addIssue(issues, {
      code: 'duplicate_edge_id',
      severity: 'error',
      message: `Edge id ${edgeId} is used more than once.`,
      edgeId,
    })
  );

  if (inputNodes.length !== 1) {
    addIssue(issues, {
      code: 'input_count',
      severity: 'error',
      message: 'Pipeline must have exactly one input node.',
    });
  }

  if (outputNodes.length !== 1) {
    addIssue(issues, {
      code: 'output_count',
      severity: 'error',
      message: 'Pipeline must have exactly one output node.',
    });
  }

  for (const edge of value.edges) {
    if (!nodeIds.has(edge.source)) {
      addIssue(issues, {
        code: 'edge_missing_source',
        severity: 'error',
        message: `Edge ${edge.id} references missing source node ${edge.source}.`,
        edgeId: edge.id,
      });
    }

    if (!nodeIds.has(edge.target)) {
      addIssue(issues, {
        code: 'edge_missing_target',
        severity: 'error',
        message: `Edge ${edge.id} references missing target node ${edge.target}.`,
        edgeId: edge.id,
      });
    }
  }

  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();

  for (const node of value.nodes) {
    inbound.set(node.id, 0);
    outbound.set(node.id, 0);
  }

  for (const edge of value.edges) {
    inbound.set(edge.target, (inbound.get(edge.target) ?? 0) + 1);
    outbound.set(edge.source, (outbound.get(edge.source) ?? 0) + 1);
  }

  for (const node of value.nodes) {
    if (node.type === 'input' && (inbound.get(node.id) ?? 0) > 0) {
      addIssue(issues, {
        code: 'input_has_inbound',
        severity: 'error',
        message: `Input node ${node.id} cannot have inbound edges.`,
        nodeId: node.id,
      });
    }

    if (node.type === 'output' && (outbound.get(node.id) ?? 0) > 0) {
      addIssue(issues, {
        code: 'output_has_outbound',
        severity: 'error',
        message: `Output node ${node.id} cannot have outbound edges.`,
        nodeId: node.id,
      });
    }

    if (node.type !== 'input' && (inbound.get(node.id) ?? 0) === 0) {
      addIssue(issues, {
        code: 'node_missing_inbound',
        severity: 'error',
        message: `Node ${node.id} needs an inbound edge.`,
        nodeId: node.id,
      });
    }

    if (node.type !== 'output' && (outbound.get(node.id) ?? 0) === 0) {
      addIssue(issues, {
        code: 'node_missing_outbound',
        severity: 'error',
        message: `Node ${node.id} needs an outbound edge.`,
        nodeId: node.id,
      });
    }

    if (node.type === 'yolo_onnx' && !node.params.modelId) {
      addIssue(issues, {
        code: 'detector_missing_model',
        severity: 'error',
        message: `Detector node ${node.id} requires a modelId.`,
        nodeId: node.id,
      });
    }

    if (node.type === 'hsv_filter' && node.params.hMin > node.params.hMax) {
      addIssue(issues, {
        code: 'hsv_range_invalid',
        severity: 'error',
        message: `HSV node ${node.id} must keep hMin less than or equal to hMax.`,
        nodeId: node.id,
      });
    }
  }

  const graph = buildGraph(value.nodes, value.edges);
  const reverseGraph = buildReverseGraph(value.nodes, value.edges);
  const inputNode = inputNodes[0] ?? null;
  const outputNode = outputNodes[0] ?? null;

  if (inputNode) {
    const reachable = collectReachable(inputNode.id, graph);

    for (const node of value.nodes) {
      if (!reachable.has(node.id)) {
        addIssue(issues, {
          code: 'node_unreachable_from_input',
          severity: 'error',
          message: `Node ${node.id} is not reachable from the input node.`,
          nodeId: node.id,
        });
      }
    }
  }

  if (outputNode) {
    const reachesOutput = collectReachable(outputNode.id, reverseGraph);

    for (const node of value.nodes) {
      if (!reachesOutput.has(node.id)) {
        addIssue(issues, {
          code: 'node_cannot_reach_output',
          severity: 'error',
          message: `Node ${node.id} does not lead to the output node.`,
          nodeId: node.id,
        });
      }
    }
  }

  if (hasCycle(value.nodes, value.edges)) {
    addIssue(issues, {
      code: 'cycle_detected',
      severity: 'error',
      message: 'Pipeline graph cannot contain cycles.',
    });
  }

  const summary: PipelineValidationSummary = {
    nodeCount: value.nodes.length,
    edgeCount: value.edges.length,
    detectorNodeCount: value.nodes.filter((node) => node.type === 'yolo_onnx').length,
    inputNodeId: inputNode?.id ?? null,
    outputNodeId: outputNode?.id ?? null,
    executionOrder: topologicalOrder(value.nodes, value.edges),
  };

  return buildValidationResult(summary, issues);
}

function hasCycle(nodes: PipelineNode[], edges: PipelineEdge[]): boolean {
  const graph = buildGraph(nodes, edges);
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

function buildGraph(nodes: PipelineNode[], edges: PipelineEdge[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const node of nodes) {
    graph.set(node.id, []);
  }

  for (const edge of edges) {
    if (graph.has(edge.source)) {
      graph.get(edge.source)?.push(edge.target);
    }
  }

  return graph;
}

function buildReverseGraph(nodes: PipelineNode[], edges: PipelineEdge[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const node of nodes) {
    graph.set(node.id, []);
  }

  for (const edge of edges) {
    if (graph.has(edge.target)) {
      graph.get(edge.target)?.push(edge.source);
    }
  }

  return graph;
}

function collectReachable(startNodeId: string, graph: Map<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;

    if (visited.has(nodeId)) {
      continue;
    }

    visited.add(nodeId);

    for (const target of graph.get(nodeId) ?? []) {
      queue.push(target);
    }
  }

  return visited;
}

function topologicalOrder(nodes: PipelineNode[], edges: PipelineEdge[]): string[] {
  const inbound = new Map(nodes.map((node) => [node.id, 0]));
  const graph = buildGraph(nodes, edges);

  for (const edge of edges) {
    inbound.set(edge.target, (inbound.get(edge.target) ?? 0) + 1);
  }

  const queue = nodes.filter((node) => (inbound.get(node.id) ?? 0) === 0).map((node) => node.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    order.push(nodeId);

    for (const target of graph.get(nodeId) ?? []) {
      inbound.set(target, (inbound.get(target) ?? 0) - 1);

      if ((inbound.get(target) ?? 0) === 0) {
        queue.push(target);
      }
    }
  }

  return order.length === nodes.length ? order : [];
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  });

  return [...duplicates];
}

function addIssue(issues: PipelineValidationIssue[], issue: PipelineValidationIssue): void {
  issues.push(issue);
}

function buildValidationResult(
  summary: PipelineValidationSummary,
  issues: PipelineValidationIssue[]
): PipelineValidationResult {
  const errors = issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message);
  const warnings = issues
    .filter((issue) => issue.severity === 'warning')
    .map((issue) => issue.message);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    issues,
    summary,
  };
}

function emptySummary(): PipelineValidationSummary {
  return {
    nodeCount: 0,
    edgeCount: 0,
    detectorNodeCount: 0,
    inputNodeId: null,
    outputNodeId: null,
    executionOrder: [],
  };
}
