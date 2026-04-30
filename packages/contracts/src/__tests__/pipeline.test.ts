import { describe, expect, it } from 'vitest';
import { PipelineDefinition, validatePipelineDefinition } from '../pipeline';

const validPipeline: PipelineDefinition = {
  version: 1,
  nodes: [
    { id: 'input', type: 'input', params: {} },
    { id: 'resize', type: 'resize', params: { width: 960 } },
    {
      id: 'detector',
      type: 'yolo_onnx',
      params: { modelId: 'model_onnx_parking', threshold: 0.62 },
    },
    { id: 'nms', type: 'nms', params: { iouThreshold: 0.45 } },
    { id: 'output', type: 'output', params: {} },
  ],
  edges: [
    { id: 'e1', source: 'input', target: 'resize' },
    { id: 'e2', source: 'resize', target: 'detector' },
    { id: 'e3', source: 'detector', target: 'nms' },
    { id: 'e4', source: 'nms', target: 'output' },
  ],
};

describe('pipeline validation', () => {
  it('accepts the canonical V1 detector pipeline', () => {
    expect(validatePipelineDefinition(validPipeline)).toMatchObject({
      ok: true,
      errors: [],
      summary: {
        nodeCount: 5,
        edgeCount: 4,
        detectorNodeCount: 1,
        inputNodeId: 'input',
        outputNodeId: 'output',
        executionOrder: ['input', 'resize', 'detector', 'nms', 'output'],
      },
    });
  });

  it('requires detector model configuration', () => {
    const definition: PipelineDefinition = {
      ...validPipeline,
      nodes: validPipeline.nodes.map((node) =>
        node.type === 'yolo_onnx' ? { ...node, params: { ...node.params, modelId: null } } : node
      ),
    };

    expect(validatePipelineDefinition(definition).errors).toContain(
      'Detector node detector requires a modelId.'
    );
  });

  it('rejects graph cycles', () => {
    const definition: PipelineDefinition = {
      ...validPipeline,
      edges: [...validPipeline.edges, { id: 'cycle', source: 'nms', target: 'resize' }],
    };

    expect(validatePipelineDefinition(definition).errors).toContain(
      'Pipeline graph cannot contain cycles.'
    );
  });

  it('reports disconnected nodes with structured issue metadata', () => {
    const definition: PipelineDefinition = {
      ...validPipeline,
      nodes: [
        ...validPipeline.nodes,
        { id: 'unused_resize', type: 'resize', params: { width: 640 } },
      ],
    };
    const validation = validatePipelineDefinition(definition);

    expect(validation.ok).toBe(false);
    expect(validation.issues).toContainEqual({
      code: 'node_missing_inbound',
      severity: 'error',
      message: 'Node unused_resize needs an inbound edge.',
      nodeId: 'unused_resize',
    });
    expect(validation.errors).toContain('Node unused_resize is not reachable from the input node.');
  });

  it('rejects duplicate node ids', () => {
    const definition: PipelineDefinition = {
      ...validPipeline,
      nodes: [
        { id: 'input', type: 'input', params: {} },
        { id: 'input', type: 'resize', params: { width: 960 } },
        { id: 'output', type: 'output', params: {} },
      ],
      edges: [{ id: 'e1', source: 'input', target: 'output' }],
    };

    expect(validatePipelineDefinition(definition).errors).toContain(
      'Node id input is used more than once.'
    );
  });

  it('returns structured schema issues for malformed definitions', () => {
    const validation = validatePipelineDefinition({
      version: 1,
      nodes: [],
      edges: [],
    });

    expect(validation.ok).toBe(false);
    expect(validation.issues[0]).toMatchObject({
      code: 'schema_invalid',
      severity: 'error',
    });
  });
});
