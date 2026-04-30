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
      precision: 0.82,
      recall: 0.74,
      f1: 0.78,
      meanIoU: 0.61,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
      perClassMetrics: [
        {
          label: 'Car',
          precision: 0.82,
          recall: 0.74,
          f1: 0.78,
          truePositives: 45,
          falsePositives: 8,
          falseNegatives: 12,
          count: 57,
        },
      ],
      evaluatedAt: '2026-04-28T13:36:00.000Z',
      assetCount: 10,
    };
    expect(() => EvaluationReportSchema.parse(valid)).not.toThrow();
  });

  it('rejects negative precision', () => {
    const invalid = {
      id: 'report-1',
      jobId: 'job-1',
      precision: -0.1,
      recall: 0.74,
      f1: 0.78,
      meanIoU: 0.61,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
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
      precision: 0.82,
      recall: 0.74,
      f1: 1.5,
      meanIoU: 0.61,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
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
      precision: 0.82,
      recall: 0.74,
      f1: 0.78,
      meanIoU: 1.5,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
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
      label: 'Car',
      precision: 0.82,
      recall: 0.74,
      f1: 0.78,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
      count: 57,
    };
    expect(() => PerClassMetricSchema.parse(valid)).not.toThrow();
  });

  it('accepts zero counts (empty class)', () => {
    const zero = {
      label: 'EmptyClass',
      precision: 0,
      recall: 0,
      f1: 0,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      count: 0,
    };
    expect(() => PerClassMetricSchema.parse(zero)).not.toThrow();
  });

  it('rejects negative tp/fp/fn', () => {
    const invalid = {
      label: 'Car',
      precision: 0.82,
      recall: 0.74,
      f1: 0.78,
      truePositives: -1,
      falsePositives: 8,
      falseNegatives: 12,
      count: 57,
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
  it('accepts summary without perClassMetrics', () => {
    const valid = {
      id: 'summary-1',
      jobId: 'job-1',
      precision: 0.82,
      recall: 0.74,
      f1: 0.78,
      meanIoU: 0.61,
      truePositives: 45,
      falsePositives: 8,
      falseNegatives: 12,
      evaluatedAt: '2026-04-28T13:36:00.000Z',
      assetCount: 10,
    };
    expect(() => EvaluationReportSummarySchema.parse(valid)).not.toThrow();
  });
});
