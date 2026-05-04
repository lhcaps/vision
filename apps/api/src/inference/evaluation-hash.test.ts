import { describe, expect, it } from 'vitest';
import { computeEvaluationInputHash, computeEvaluationMetricsHash } from './evaluation-hash';

const mkPred = (
  id: string,
  assetId: string,
  classKey: string,
  x: number,
  y: number,
  w: number,
  h: number,
  confidence = 0.9
) => ({
  id,
  assetId,
  classKey,
  label: classKey,
  geometry: { x, y, width: w, height: h },
  confidence,
});

const mkGt = (
  id: string,
  assetId: string,
  classKey: string,
  x: number,
  y: number,
  w: number,
  h: number
) => ({
  id,
  assetId,
  classKey,
  label: classKey,
  geometry: { x, y, width: w, height: h },
});

describe('computeEvaluationInputHash', () => {
  const JOB = 'job_test_01';
  const DS = 'ds_test_01';

  it('same inputs produce the same hash', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const h1 = computeEvaluationInputHash(JOB, DS, preds, gts, 0.5, 'eval-v1');
    const h2 = computeEvaluationInputHash(JOB, DS, preds, gts, 0.5, 'eval-v1');

    expect(h1).toBe(h2);
  });

  it('same IDs in different array order produce the same hash (deterministic sort)', () => {
    const preds1 = [
      mkPred('p2', 'a1', 'car', 0, 0, 100, 100, 0.95),
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95),
    ];
    const preds2 = [
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95),
      mkPred('p2', 'a1', 'car', 0, 0, 100, 100, 0.95),
    ];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const h1 = computeEvaluationInputHash(JOB, DS, preds1, gts, 0.5, 'eval-v1');
    const h2 = computeEvaluationInputHash(JOB, DS, preds2, gts, 0.5, 'eval-v1');

    expect(h1).toBe(h2);
  });

  it('tiny geometry difference (0.0001) produces a different hash', () => {
    const preds1 = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const preds2 = [mkPred('p1', 'a1', 'car', 0.0001, 0, 100, 100, 0.95)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const h1 = computeEvaluationInputHash(JOB, DS, preds1, gts, 0.5, 'eval-v1');
    const h2 = computeEvaluationInputHash(JOB, DS, preds2, gts, 0.5, 'eval-v1');

    expect(h1).not.toBe(h2);
  });

  it('tiny confidence difference produces a different hash', () => {
    const preds1 = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const preds2 = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.9501)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const h1 = computeEvaluationInputHash(JOB, DS, preds1, gts, 0.5, 'eval-v1');
    const h2 = computeEvaluationInputHash(JOB, DS, preds2, gts, 0.5, 'eval-v1');

    expect(h1).not.toBe(h2);
  });

  it('different prediction IDs produce different hashes', () => {
    const preds1 = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const preds2 = [mkPred('p2', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const h1 = computeEvaluationInputHash(JOB, DS, preds1, gts, 0.5, 'eval-v1');
    const h2 = computeEvaluationInputHash(JOB, DS, preds2, gts, 0.5, 'eval-v1');

    expect(h1).not.toBe(h2);
  });

  it('returns a 16-char lowercase hex string', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const h = computeEvaluationInputHash(JOB, DS, preds, gts, 0.5, 'eval-v1');

    expect(h).toMatch(/^[a-f0-9]{16}$/);
  });

  it('includes algorithmVersion in canonical content', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const h1 = computeEvaluationInputHash(JOB, DS, preds, gts, 0.5, 'eval-v1');
    const h2 = computeEvaluationInputHash(JOB, DS, preds, gts, 0.5, 'eval-v2');

    expect(h1).not.toBe(h2);
  });

  it('includes iouThreshold in canonical content', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const h1 = computeEvaluationInputHash(JOB, DS, preds, gts, 0.5, 'eval-v1');
    const h2 = computeEvaluationInputHash(JOB, DS, preds, gts, 0.7, 'eval-v1');

    expect(h1).not.toBe(h2);
  });
});

describe('computeEvaluationMetricsHash', () => {
  const makeReport = (
    overrides: Partial<Parameters<typeof computeEvaluationMetricsHash>[0]> = {}
  ) => ({
    id: 'eval_test_hash_01',
    jobId: 'job_test_01',
    datasetVersionId: 'ds_test_01',
    pipelineId: null,
    modelId: null,
    algorithmVersion: 'eval-v1-iou-0.5-greedy-class-aware',
    iouThreshold: 0.5,
    inputHash: 'abcd1234efab5678',
    metricsHash: '', // filled by the function
    precision: 1,
    recall: 1,
    f1: 1,
    meanIoU: 1,
    truePositives: 1,
    falsePositives: 0,
    falseNegatives: 0,
    predictionCount: 1,
    groundTruthCount: 1,
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
    ],
    matches: [{ predictionId: 'p1', groundTruthId: 'g1', assetId: 'a1', classKey: 'car', iou: 1 }],
    ...overrides,
  });

  it('same report with different evaluatedAt produces the same hash', () => {
    const r1 = makeReport({ evaluatedAt: '2026-04-28T13:37:30.000Z' });
    const r2 = makeReport({ evaluatedAt: '2026-04-29T00:00:00.000Z' });

    expect(computeEvaluationMetricsHash(r1)).toBe(computeEvaluationMetricsHash(r2));
  });

  it('same report with different id produces the same hash', () => {
    const r1 = makeReport({ id: 'eval_test_01' });
    const r2 = makeReport({ id: 'eval_test_02' });

    expect(computeEvaluationMetricsHash(r1)).toBe(computeEvaluationMetricsHash(r2));
  });

  it('report with changed perClassMetrics produces a different hash', () => {
    const r1 = makeReport();
    const r2 = makeReport({
      perClassMetrics: [
        {
          classKey: 'car',
          label: 'car',
          precision: 0.5,
          recall: 1,
          f1: 0.667,
          truePositives: 1,
          falsePositives: 1,
          falseNegatives: 0,
          count: 1,
          meanIou: 1,
        },
      ],
    });

    expect(computeEvaluationMetricsHash(r1)).not.toBe(computeEvaluationMetricsHash(r2));
  });

  it('report with changed matches produces a different hash', () => {
    const r1 = makeReport({
      matches: [
        { predictionId: 'p1', groundTruthId: 'g1', assetId: 'a1', classKey: 'car', iou: 1 },
      ],
    });
    const r2 = makeReport({
      matches: [
        { predictionId: 'p2', groundTruthId: 'g1', assetId: 'a1', classKey: 'car', iou: 1 },
      ],
    });

    expect(computeEvaluationMetricsHash(r1)).not.toBe(computeEvaluationMetricsHash(r2));
  });

  it('report without matches produces stable hash', () => {
    const r1 = makeReport({ matches: undefined });
    const r2 = makeReport({ matches: undefined });

    expect(computeEvaluationMetricsHash(r1)).toBe(computeEvaluationMetricsHash(r2));
  });

  it('returns a 16-char lowercase hex string', () => {
    const r = makeReport();
    const h = computeEvaluationMetricsHash(r);
    expect(h).toMatch(/^[a-f0-9]{16}$/);
  });

  it('perClassMetrics are sorted deterministically by classKey', () => {
    const r1 = makeReport({
      perClassMetrics: [
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
      ],
    });
    const r2 = makeReport({
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
      ],
    });

    expect(computeEvaluationMetricsHash(r1)).toBe(computeEvaluationMetricsHash(r2));
  });
});
