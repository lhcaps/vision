import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EvaluationReportSchema } from '@visionflow/contracts';

/**
 * Tests for EvaluationReportSchema strict parsing and legacy adapter behavior.
 *
 * The legacy adapter in EvaluationService.getEvaluationReport() handles reports
 * that were persisted before Phase 20B/20C schema changes. These tests verify
 * that the schema correctly accepts full reports and rejects partial/corrupt ones.
 */

describe('EvaluationReportSchema — strict parsing', () => {
  const makeFullReport = (overrides: Record<string, unknown> = {}) => ({
    id: 'eval_test_01',
    jobId: 'job_test_01',
    datasetVersionId: 'ds_test_01',
    pipelineId: null,
    modelId: null,
    algorithmVersion: 'eval-v1-iou-0.5-greedy-class-aware',
    iouThreshold: 0.5,
    inputHash: 'abcd1234efab5678',
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
    assetCount: 1,
    evaluatedAt: '2026-04-28T13:37:30.000Z',
    perClassMetrics: [
      {
        classKey: 'car',
        label: 'car',
        precision: 1,
        recall: 1,
        f1: 1,
        truePositives: 1,
        falsePositives: 0,
        falseNegatives: 0,
        count: 1,
        meanIou: 1,
      },
      {
        classKey: 'van',
        label: 'van',
        precision: 1,
        recall: 1,
        f1: 1,
        truePositives: 1,
        falsePositives: 0,
        falseNegatives: 0,
        count: 1,
        meanIou: 1,
      },
      {
        classKey: 'truck',
        label: 'truck',
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
      { predictionId: 'p1', groundTruthId: 'g1', assetId: 'a1', classKey: 'car', iou: 1 },
      { predictionId: 'p2', groundTruthId: 'g2', assetId: 'a1', classKey: 'van', iou: 1 },
      { predictionId: 'p3', groundTruthId: 'g3', assetId: 'a1', classKey: 'truck', iou: 1 },
    ],
    ...overrides,
  });

  it('full report passes strict parse', () => {
    const report = makeFullReport();
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(true);
  });

  it('full report without matches passes strict parse (matches is optional)', () => {
    const report = makeFullReport({ matches: undefined });
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(true);
  });

  it('report missing perClassMetrics fails strict parse', () => {
    const report = makeFullReport();
    delete (report as Record<string, unknown>).perClassMetrics;
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it('report missing jobId fails strict parse', () => {
    const report = makeFullReport() as Record<string, unknown>;
    delete report.jobId;
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it('report missing inputHash fails strict parse', () => {
    const report = makeFullReport() as Record<string, unknown>;
    delete report.inputHash;
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it('report missing metricsHash fails strict parse', () => {
    const report = makeFullReport() as Record<string, unknown>;
    delete report.metricsHash;
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it('report missing evaluatedAt fails strict parse', () => {
    const report = makeFullReport() as Record<string, unknown>;
    delete report.evaluatedAt;
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it('report with wrong type for precision fails strict parse', () => {
    const report = makeFullReport({ precision: '1' as unknown as number });
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it('report with inputHash not 16 chars fails strict parse', () => {
    const report = makeFullReport({ inputHash: 'abcd1234efgh' });
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it('report with metricsHash not 16 chars fails strict parse', () => {
    const report = makeFullReport({ metricsHash: '1234567890ab' });
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it('report with non-hex inputHash fails strict parse', () => {
    const report = makeFullReport({ inputHash: 'hijk9012lmno3456' });
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it('report with uppercase hex inputHash fails strict parse', () => {
    const report = makeFullReport({ inputHash: 'ABCD1234EFAB5678' });
    const result = EvaluationReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it('partial report with only jobId/datasetVersionId/perClassMetrics fails strict parse', () => {
    const partial = {
      jobId: 'job_test_01',
      datasetVersionId: 'ds_test_01',
      perClassMetrics: [],
    };
    const result = EvaluationReportSchema.safeParse(partial);
    expect(result.success).toBe(false);
  });

  it('empty object fails strict parse', () => {
    const result = EvaluationReportSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('legacy report missing matches but otherwise full passes', () => {
    // This is what old Phase 20 persisted: full report without matches field.
    const legacy = makeFullReport() as Record<string, unknown>;
    delete legacy.matches;
    const result = EvaluationReportSchema.safeParse(legacy);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.matches).toBeUndefined();
    }
  });
});

describe('inputHash and metricsHash regex validation', () => {
  it('inputHash must be exactly 16 lowercase hex chars', () => {
    const valid = EvaluationReportSchema.safeParse({
      id: 'e',
      jobId: 'j',
      datasetVersionId: 'd',
      pipelineId: null,
      modelId: null,
      algorithmVersion: 'v',
      iouThreshold: 0.5,
      inputHash: 'abcd1234efab5678',
      metricsHash: '1234567890abcdef',
      precision: 1,
      recall: 1,
      f1: 1,
      meanIoU: 1,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      predictionCount: 0,
      groundTruthCount: 0,
      assetCount: 0,
      evaluatedAt: '2026-01-01T00:00:00Z',
      perClassMetrics: [],
    });
    expect(valid.success).toBe(true);

    const tooShort = EvaluationReportSchema.safeParse({
      id: 'e',
      jobId: 'j',
      datasetVersionId: 'd',
      pipelineId: null,
      modelId: null,
      algorithmVersion: 'v',
      iouThreshold: 0.5,
      inputHash: 'abcd1234efgh',
      metricsHash: '1234567890abcdef',
      precision: 1,
      recall: 1,
      f1: 1,
      meanIoU: 1,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      predictionCount: 0,
      groundTruthCount: 0,
      assetCount: 0,
      evaluatedAt: '2026-01-01T00:00:00Z',
      perClassMetrics: [],
    });
    expect(tooShort.success).toBe(false);
  });

  it('metricsHash must be exactly 16 lowercase hex chars', () => {
    const valid = EvaluationReportSchema.safeParse({
      id: 'e',
      jobId: 'j',
      datasetVersionId: 'd',
      pipelineId: null,
      modelId: null,
      algorithmVersion: 'v',
      iouThreshold: 0.5,
      inputHash: 'abcd1234efab5678',
      metricsHash: '1234567890abcdef',
      precision: 1,
      recall: 1,
      f1: 1,
      meanIoU: 1,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      predictionCount: 0,
      groundTruthCount: 0,
      assetCount: 0,
      evaluatedAt: '2026-01-01T00:00:00Z',
      perClassMetrics: [],
    });
    expect(valid.success).toBe(true);

    const nonHex = EvaluationReportSchema.safeParse({
      id: 'e',
      jobId: 'j',
      datasetVersionId: 'd',
      pipelineId: null,
      modelId: null,
      algorithmVersion: 'v',
      iouThreshold: 0.5,
      inputHash: 'abcd1234efab5678',
      metricsHash: 'hijk9012lmno3456',
      precision: 1,
      recall: 1,
      f1: 1,
      meanIoU: 1,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      predictionCount: 0,
      groundTruthCount: 0,
      assetCount: 0,
      evaluatedAt: '2026-01-01T00:00:00Z',
      perClassMetrics: [],
    });
    expect(nonHex.success).toBe(false);

    const uppercase = EvaluationReportSchema.safeParse({
      id: 'e',
      jobId: 'j',
      datasetVersionId: 'd',
      pipelineId: null,
      modelId: null,
      algorithmVersion: 'v',
      iouThreshold: 0.5,
      inputHash: 'ABCD1234EFAB5678',
      metricsHash: '1234567890ABCDEF',
      precision: 1,
      recall: 1,
      f1: 1,
      meanIoU: 1,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      predictionCount: 0,
      groundTruthCount: 0,
      assetCount: 0,
      evaluatedAt: '2026-01-01T00:00:00Z',
      perClassMetrics: [],
    });
    expect(uppercase.success).toBe(false);
  });
});
