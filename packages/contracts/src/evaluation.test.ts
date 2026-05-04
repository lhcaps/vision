import { describe, it, expect } from 'vitest';
import {
  EvaluationReportSchema,
  PerClassMetricSchema,
  PredictionSummarySchema,
  EvaluationReportSummarySchema,
} from './evaluation';

describe('EvaluationReportSchema', () => {
  it('accepts valid evaluation report', () => {
    const valid = {
      id: 'report-1',
      jobId: 'job-1',
      datasetVersionId: 'dsv-1',
      pipelineId: 'pipe-1',
      modelId: 'model-1',
      algorithmVersion: 'eval-v1-iou-0.5-greedy-class-aware',
      iouThreshold: 0.5,
      inputHash: 'a1b2c3d4e5f6a1b2',
      metricsHash: '1234567890abcdef',
      precision: 0.82,
      recall: 0.74,
      f1: 0.78,
      meanIoU: 0.61,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
      predictionCount: 53,
      groundTruthCount: 57,
      perClassMetrics: [
        {
          classKey: 'car',
          label: 'Car',
          precision: 0.82,
          recall: 0.74,
          f1: 0.78,
          truePositives: 45,
          falsePositives: 8,
          falseNegatives: 12,
          count: 57,
          meanIou: 0.61,
        },
      ],
      evaluatedAt: '2026-04-28T13:36:00.000Z',
      assetCount: 10,
    };
    expect(() => EvaluationReportSchema.parse(valid)).not.toThrow();
  });

  it('accepts valid evaluation report with matches', () => {
    const valid = {
      id: 'report-1',
      jobId: 'job-1',
      datasetVersionId: 'dsv-1',
      pipelineId: 'pipe-1',
      modelId: 'model-1',
      algorithmVersion: 'eval-v1-iou-0.5-greedy-class-aware',
      iouThreshold: 0.5,
      inputHash: 'a1b2c3d4e5f6a1b2',
      metricsHash: '1234567890abcdef',
      precision: 1,
      recall: 1,
      f1: 1,
      meanIoU: 1,
      truePositives: 3,
      falsePositives: 0,
      falseNegatives: 0,
      predictionCount: 3,
      groundTruthCount: 3,
      perClassMetrics: [
        {
          classKey: 'car',
          label: 'Car',
          precision: 1,
          recall: 1,
          f1: 1,
          truePositives: 1,
          falsePositives: 0,
          falseNegatives: 0,
          count: 1,
          meanIou: 1,
        },
      ],
      matches: [
        {
          predictionId: 'p1',
          groundTruthId: 'g1',
          assetId: 'a1',
          classKey: 'car',
          iou: 1,
        },
      ],
      evaluatedAt: '2026-04-28T13:36:00.000Z',
      assetCount: 1,
    };
    expect(() => EvaluationReportSchema.parse(valid)).not.toThrow();
  });

  it('rejects negative precision', () => {
    const invalid = {
      id: 'report-1',
      jobId: 'job-1',
      datasetVersionId: 'dsv-1',
      pipelineId: 'pipe-1',
      modelId: 'model-1',
      algorithmVersion: 'eval-v1-iou-0.5-greedy-class-aware',
      iouThreshold: 0.5,
      inputHash: 'a1b2c3d4e5f6a1b2',
      metricsHash: '1234567890abcdef',
      precision: -0.1,
      recall: 0.74,
      f1: 0.78,
      meanIoU: 0.61,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
      predictionCount: 53,
      groundTruthCount: 57,
      perClassMetrics: [],
      evaluatedAt: '2026-04-28T13:36:00.000Z',
      assetCount: 10,
    };
    expect(() => EvaluationReportSchema.parse(invalid)).toThrow();
  });

  it('rejects f1 outside 0-1 range', () => {
    const invalid = {
      id: 'report-1',
      jobId: 'job-1',
      datasetVersionId: 'dsv-1',
      pipelineId: 'pipe-1',
      modelId: 'model-1',
      algorithmVersion: 'eval-v1-iou-0.5-greedy-class-aware',
      iouThreshold: 0.5,
      inputHash: 'a1b2c3d4e5f6a1b2',
      metricsHash: '1234567890abcdef',
      precision: 0.82,
      recall: 0.74,
      f1: 1.5,
      meanIoU: 0.61,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
      predictionCount: 53,
      groundTruthCount: 57,
      perClassMetrics: [],
      evaluatedAt: '2026-04-28T13:36:00.000Z',
      assetCount: 10,
    };
    expect(() => EvaluationReportSchema.parse(invalid)).toThrow();
  });

  it('rejects meanIoU outside 0-1 range', () => {
    const invalid = {
      id: 'report-1',
      jobId: 'job-1',
      datasetVersionId: 'dsv-1',
      pipelineId: 'pipe-1',
      modelId: 'model-1',
      algorithmVersion: 'eval-v1-iou-0.5-greedy-class-aware',
      iouThreshold: 0.5,
      inputHash: 'a1b2c3d4e5f6a1b2',
      metricsHash: '1234567890abcdef',
      precision: 0.82,
      recall: 0.74,
      f1: 0.78,
      meanIoU: 1.5,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
      predictionCount: 53,
      groundTruthCount: 57,
      perClassMetrics: [],
      evaluatedAt: '2026-04-28T13:36:00.000Z',
      assetCount: 10,
    };
    expect(() => EvaluationReportSchema.parse(invalid)).toThrow();
  });

  it('rejects missing required fields', () => {
    const incomplete = {
      id: 'report-1',
      jobId: 'job-1',
      precision: 0.82,
    };
    expect(() => EvaluationReportSchema.parse(incomplete)).toThrow();
  });
});

describe('PerClassMetricSchema', () => {
  it('accepts valid per-class metric', () => {
    const valid = {
      classKey: 'car',
      label: 'Car',
      precision: 0.82,
      recall: 0.74,
      f1: 0.78,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
      count: 57,
      meanIou: 0.61,
    };
    expect(() => PerClassMetricSchema.parse(valid)).not.toThrow();
  });

  it('accepts zero counts (empty class)', () => {
    const zero = {
      classKey: 'empty',
      label: 'EmptyClass',
      precision: 0,
      recall: 0,
      f1: 0,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      count: 0,
      meanIou: 0,
    };
    expect(() => PerClassMetricSchema.parse(zero)).not.toThrow();
  });

  it('rejects negative tp/fp/fn', () => {
    const invalid = {
      classKey: 'car',
      label: 'Car',
      precision: 0.82,
      recall: 0.74,
      f1: 0.78,
      truePositives: -1,
      falsePositives: 8,
      falseNegatives: 12,
      count: 57,
      meanIou: 0.61,
    };
    expect(() => PerClassMetricSchema.parse(invalid)).toThrow();
  });
});

describe('PredictionSummarySchema', () => {
  it('accepts valid prediction summary', () => {
    const valid = {
      id: 'pred-1',
      assetId: 'asset-1',
      labelClassId: 'car',
      label: 'Car',
      color: '#6ad9a1',
      geometry: { x: 120, y: 80, width: 200, height: 160 },
      confidence: 0.87,
    };
    expect(() => PredictionSummarySchema.parse(valid)).not.toThrow();
  });

  it('accepts null labelClassId', () => {
    const valid = {
      id: 'pred-1',
      assetId: 'asset-1',
      labelClassId: null,
      label: 'Unknown',
      color: '#ffffff',
      geometry: { x: 0, y: 0, width: 100, height: 100 },
      confidence: 0.5,
    };
    expect(() => PredictionSummarySchema.parse(valid)).not.toThrow();
  });

  it('rejects confidence > 1', () => {
    const invalid = {
      id: 'pred-1',
      assetId: 'asset-1',
      labelClassId: 'car',
      label: 'Car',
      color: '#6ad9a1',
      geometry: { x: 120, y: 80, width: 200, height: 160 },
      confidence: 1.5,
    };
    expect(() => PredictionSummarySchema.parse(invalid)).toThrow();
  });

  it('rejects negative confidence', () => {
    const invalid = {
      id: 'pred-1',
      assetId: 'asset-1',
      labelClassId: 'car',
      label: 'Car',
      color: '#6ad9a1',
      geometry: { x: 120, y: 80, width: 200, height: 160 },
      confidence: -0.1,
    };
    expect(() => PredictionSummarySchema.parse(invalid)).toThrow();
  });

  it('rejects zero or negative geometry dimensions', () => {
    const invalid = {
      id: 'pred-1',
      assetId: 'asset-1',
      labelClassId: 'car',
      label: 'Car',
      color: '#6ad9a1',
      geometry: { x: 120, y: 80, width: 0, height: 160 },
      confidence: 0.87,
    };
    expect(() => PredictionSummarySchema.parse(invalid)).toThrow();
  });
});

describe('EvaluationReportSummarySchema', () => {
  it('accepts valid summary with all required fields', () => {
    const valid = {
      id: 'summary-1',
      jobId: 'job-1',
      datasetVersionId: 'dsv-1',
      pipelineId: 'pipe-1',
      modelId: 'model-1',
      algorithmVersion: 'eval-v1-iou-0.5-greedy-class-aware',
      iouThreshold: 0.5,
      inputHash: 'a1b2c3d4e5f6a1b2',
      metricsHash: '1234567890abcdef',
      precision: 0.82,
      recall: 0.74,
      f1: 0.78,
      meanIoU: 0.61,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
      predictionCount: 53,
      groundTruthCount: 57,
      assetCount: 10,
      evaluatedAt: '2026-04-28T13:36:00.000Z',
    };
    expect(() => EvaluationReportSummarySchema.parse(valid)).not.toThrow();
  });
});
