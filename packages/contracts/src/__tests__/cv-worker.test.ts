import { describe, expect, it } from 'vitest';
import {
  CvWorkerEvaluationRequestSchema,
  CvWorkerEvaluationResponseSchema,
  CvWorkerRunPipelineRequestSchema,
  CvWorkerRunPipelineResponseSchema,
} from '../cv-worker';

const pipeline = {
  version: 1,
  nodes: [
    { id: 'input', type: 'input', params: {} },
    { id: 'detector', type: 'yolo_onnx', params: { modelId: 'model_1', threshold: 0.6 } },
    { id: 'output', type: 'output', params: {} },
  ],
  edges: [
    { id: 'e1', source: 'input', target: 'detector' },
    { id: 'e2', source: 'detector', target: 'output' },
  ],
} as const;

describe('cv worker contracts', () => {
  it('defaults run-pipeline requests to mock detector mode', () => {
    const parsed = CvWorkerRunPipelineRequestSchema.parse({
      jobId: 'job_1',
      pipeline,
      assets: [
        {
          assetId: 'asset_1',
          storageKey: 'projects/demo/originals/asset_1.jpg',
          width: 640,
          height: 360,
        },
      ],
    });

    expect(parsed.detectorMode).toBe('mock');
  });

  it('validates worker prediction responses', () => {
    const parsed = CvWorkerRunPipelineResponseSchema.parse({
      jobId: 'job_1',
      mode: 'mock_detector',
      workerVersion: '0.2.0',
      assetCount: 1,
      predictionCount: 1,
      predictions: [
        {
          assetId: 'asset_1',
          labelClassId: null,
          geometry: { x: 12, y: 18, width: 80, height: 48 },
          confidence: 0.71,
          metadata: { runtime: 'mock_detector' },
        },
      ],
      warnings: [],
    });

    expect(parsed.predictionCount).toBe(1);
  });

  it('validates evaluation metrics and default threshold', () => {
    const request = CvWorkerEvaluationRequestSchema.parse({
      predictions: [],
      groundTruth: [],
    });
    const response = CvWorkerEvaluationResponseSchema.parse({
      jobId: null,
      iouThreshold: request.iouThreshold,
      truePositive: 0,
      falsePositive: 0,
      falseNegative: 0,
      precision: 0,
      recall: 0,
      f1: 0,
      meanIou: 0,
      matches: [],
    });

    expect(response.iouThreshold).toBe(0.5);
  });
});
