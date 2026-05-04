import { describe, expect, it } from 'vitest';
import { validatePipelineDefinition } from '@visionflow/contracts';

describe('Pipeline Definition Validation', () => {
  const validPipeline = {
    version: 1 as const,
    nodes: [
      { id: 'input', type: 'input' as const, params: {} },
      {
        id: 'detector',
        type: 'yolo_onnx' as const,
        params: { modelId: 'model_test', threshold: 0.5 },
      },
      { id: 'output', type: 'output' as const, params: {} },
    ],
    edges: [
      { id: 'e1', source: 'input' as const, target: 'detector' as const },
      { id: 'e2', source: 'detector' as const, target: 'output' as const },
    ],
  };

  describe('validatePipelineDefinition', () => {
    it('accepts valid pipeline definition', () => {
      const result = validatePipelineDefinition(validPipeline);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects pipeline with circular edges', () => {
      const cyclicPipeline = {
        ...validPipeline,
        edges: [
          { id: 'e1', source: 'input', target: 'detector' },
          { id: 'e2', source: 'detector', target: 'output' },
          { id: 'e3', source: 'output', target: 'detector' },
        ],
      };
      const result = validatePipelineDefinition(cyclicPipeline);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('cycle'))).toBe(true);
    });

    it('rejects pipeline with missing source node for edge', () => {
      const invalidPipeline = {
        ...validPipeline,
        edges: [{ id: 'e1', source: 'nonexistent', target: 'detector' }],
      };
      const result = validatePipelineDefinition(invalidPipeline);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('missing source'))).toBe(true);
    });

    it('rejects pipeline with missing target node for edge', () => {
      const invalidPipeline = {
        ...validPipeline,
        edges: [{ id: 'e1', source: 'input', target: 'nonexistent' }],
      };
      const result = validatePipelineDefinition(invalidPipeline);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('missing target'))).toBe(true);
    });

    it('rejects pipeline without input node', () => {
      const noInputPipeline = {
        ...validPipeline,
        nodes: validPipeline.nodes.filter((n) => n.type !== 'input'),
        edges: [{ id: 'e1', source: 'detector', target: 'output' }],
      };
      const result = validatePipelineDefinition(noInputPipeline);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('input'))).toBe(true);
    });

    it('rejects pipeline without output node', () => {
      const noOutputPipeline = {
        ...validPipeline,
        nodes: validPipeline.nodes.filter((n) => n.type !== 'output'),
        edges: [{ id: 'e1', source: 'input', target: 'detector' }],
      };
      const result = validatePipelineDefinition(noOutputPipeline);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('output'))).toBe(true);
    });

    it('rejects pipeline with duplicate node IDs', () => {
      const duplicateNodesPipeline = {
        ...validPipeline,
        nodes: [
          { id: 'input', type: 'input' as const, params: {} },
          { id: 'input', type: 'resize' as const, params: { width: 640 } },
        ],
        edges: [],
      };
      const result = validatePipelineDefinition(duplicateNodesPipeline);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('more than once'))).toBe(true);
    });

    it('rejects detector node without modelId', () => {
      const noModelPipeline = {
        ...validPipeline,
        nodes: validPipeline.nodes.map((n) =>
          n.type === 'yolo_onnx' ? { ...n, params: { ...n.params, modelId: null } } : n
        ),
      };
      const result = validatePipelineDefinition(noModelPipeline);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('modelId'))).toBe(true);
    });

    it('rejects invalid graph structure with unreachable nodes', () => {
      const unreachablePipeline = {
        ...validPipeline,
        nodes: [
          { id: 'input', type: 'input' as const, params: {} },
          {
            id: 'detector',
            type: 'yolo_onnx' as const,
            params: { modelId: 'model_test', threshold: 0.5 },
          },
          { id: 'orphan', type: 'resize' as const, params: { width: 640 } },
          { id: 'output', type: 'output' as const, params: {} },
        ],
        edges: [
          { id: 'e1', source: 'input', target: 'detector' },
          { id: 'e2', source: 'detector', target: 'output' },
        ],
      };
      const result = validatePipelineDefinition(unreachablePipeline);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes('unreachable') || e.includes('inbound'))).toBe(
        true
      );
    });

    it('provides structured issues array', () => {
      const result = validatePipelineDefinition({ version: 1, nodes: [], edges: [] });
      expect(result.ok).toBe(false);
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toHaveProperty('code');
      expect(result.issues[0]).toHaveProperty('severity');
      expect(result.issues[0]).toHaveProperty('message');
    });

    it('returns proper summary for valid pipeline', () => {
      const result = validatePipelineDefinition(validPipeline);
      expect(result.summary).toBeDefined();
      expect(result.summary.nodeCount).toBe(3);
      expect(result.summary.edgeCount).toBe(2);
      expect(result.summary.detectorNodeCount).toBe(1);
      expect(result.summary.inputNodeId).toBe('input');
      expect(result.summary.outputNodeId).toBe('output');
    });
  });
});
