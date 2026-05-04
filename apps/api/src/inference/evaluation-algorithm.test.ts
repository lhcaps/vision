import { describe, expect, it } from 'vitest';
import {
  ALGORITHM_VERSION,
  computeEvaluationMetrics,
  computeInputHash,
  DEFAULT_IOU_THRESHOLD,
} from './evaluation-algorithm';
import type { EvaluationGroundTruth, EvaluationPrediction } from './evaluation-algorithm';

const mkPred = (
  id: string,
  assetId: string,
  classKey: string,
  x: number,
  y: number,
  w: number,
  h: number,
  confidence = 0.9
): EvaluationPrediction => ({
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
): EvaluationGroundTruth => ({
  id,
  assetId,
  classKey,
  label: classKey,
  geometry: { x, y, width: w, height: h },
});

const JOB = 'job_test_01';
const DS = 'ds_test_01';

describe('computeEvaluationMetrics', () => {
  it('EVAL-09a: perfect match — one prediction, one GT, IoU >= threshold', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(1);
    expect(result.falsePositive).toBe(0);
    expect(result.falseNegative).toBe(0);
    expect(result.precision).toBe(1);
    expect(result.recall).toBe(1);
    expect(result.f1).toBe(1);
    expect(result.meanIou).toBeCloseTo(1.0, 3);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].predictionId).toBe('p1');
    expect(result.matches[0].groundTruthId).toBe('g1');
  });

  it('EVAL-09b: duplicate predictions — one GT, two predictions, one TP + one FP', () => {
    const preds = [
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95),
      mkPred('p2', 'a1', 'car', 0, 0, 100, 100, 0.85),
    ];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(1);
    expect(result.falsePositive).toBe(1);
    expect(result.falseNegative).toBe(0);
    expect(result.precision).toBeCloseTo(0.5, 3);
    expect(result.recall).toBe(1);
    expect(result.f1).toBeCloseTo(0.666667, 3);
  });

  it('EVAL-09c: prediction IoU below threshold — FP + FN', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 50, 50, 0.95)];
    const gts = [mkGt('g1', 'a1', 'car', 100, 100, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(0);
    expect(result.falsePositive).toBe(1);
    expect(result.falseNegative).toBe(1);
    expect(result.precision).toBe(0);
    expect(result.recall).toBe(0);
    expect(result.f1).toBe(0);
    expect(result.matches).toHaveLength(0);
  });

  it('EVAL-09d: wrong class — FP + FN, no cross-class matching', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const gts = [mkGt('g1', 'a1', 'van', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(0);
    expect(result.falsePositive).toBe(1);
    expect(result.falseNegative).toBe(1);
    expect(result.precision).toBe(0);
    expect(result.recall).toBe(0);
    expect(result.f1).toBe(0);
  });

  it('EVAL-09e: missing prediction — FN only', () => {
    const preds: EvaluationPrediction[] = [];
    const gts = [
      mkGt('g1', 'a1', 'car', 0, 0, 100, 100),
      mkGt('g2', 'a1', 'car', 200, 200, 100, 100),
    ];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(0);
    expect(result.falsePositive).toBe(0);
    expect(result.falseNegative).toBe(2);
    expect(result.precision).toBe(0);
    expect(result.recall).toBe(0);
    expect(result.f1).toBe(0);
  });

  it('EVAL-09f: no ground truth — all predictions FP', () => {
    const preds = [
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95),
      mkPred('p2', 'a1', 'car', 200, 200, 100, 100, 0.85),
    ];
    const gts: EvaluationGroundTruth[] = [];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(0);
    expect(result.falsePositive).toBe(2);
    expect(result.falseNegative).toBe(0);
    expect(result.precision).toBe(0);
    expect(result.recall).toBe(0);
    expect(result.f1).toBe(0);
    expect(result.meanIou).toBe(0);
  });

  it('EVAL-09g: no predictions — all GT FN', () => {
    const preds: EvaluationPrediction[] = [];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(0);
    expect(result.falsePositive).toBe(0);
    expect(result.falseNegative).toBe(1);
    expect(result.precision).toBe(0);
    expect(result.recall).toBe(0);
  });

  it('EVAL-09h: multi-class — correct metrics per class', () => {
    const preds = [
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95),
      mkPred('p2', 'a1', 'van', 0, 0, 100, 100, 0.85),
      mkPred('p3', 'a1', 'truck', 0, 0, 50, 50, 0.75),
    ];
    const gts = [
      mkGt('g1', 'a1', 'car', 0, 0, 100, 100),
      mkGt('g2', 'a1', 'van', 0, 0, 100, 100),
      mkGt('g3', 'a1', 'truck', 200, 200, 100, 100),
    ];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(2);
    expect(result.falsePositive).toBe(1);
    expect(result.falseNegative).toBe(1);
    expect(result.perClassMetrics).toHaveLength(3);

    const carMetrics = result.perClassMetrics.find((m) => m.classKey === 'car')!;
    expect(carMetrics.truePositives).toBe(1);
    expect(carMetrics.falsePositives).toBe(0);
    expect(carMetrics.falseNegatives).toBe(0);
    expect(carMetrics.precision).toBe(1);
    expect(carMetrics.recall).toBe(1);
    expect(carMetrics.f1).toBe(1);

    const truckMetrics = result.perClassMetrics.find((m) => m.classKey === 'truck')!;
    expect(truckMetrics.truePositives).toBe(0);
    expect(truckMetrics.falsePositives).toBe(1);
    expect(truckMetrics.falseNegatives).toBe(1);
    expect(truckMetrics.precision).toBe(0);
    expect(truckMetrics.recall).toBe(0);
  });

  it('EVAL-09i: deterministic ordering — confidence DESC, id ASC', () => {
    const preds = [
      mkPred('p2', 'a1', 'car', 0, 0, 100, 100, 0.7),
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.9),
      mkPred('p3', 'a1', 'car', 0, 0, 100, 100, 0.8),
    ];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(1);
    expect(result.matches[0].predictionId).toBe('p1');
  });

  it('EVAL-09j: mean IoU correct for overlapping boxes', () => {
    const preds = [
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100),
      mkPred('p2', 'a1', 'car', 0, 0, 100, 100),
    ];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100), mkGt('g2', 'a1', 'car', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(2);
    expect(result.meanIou).toBeCloseTo(1.0, 3);
  });

  it('rejects invalid geometry loudly', () => {
    const preds = [
      {
        id: 'p1',
        assetId: 'a1',
        classKey: 'car',
        label: 'car',
        geometry: { x: -1, y: 0, width: 100, height: 100 },
        confidence: 0.9,
      },
    ];
    const gts: EvaluationGroundTruth[] = [];

    expect(() => computeEvaluationMetrics(preds, gts, JOB, DS)).toThrow('Invalid geometry');
  });

  it('includes algorithmVersion and traceability fields', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.algorithmVersion).toBe(ALGORITHM_VERSION);
    expect(result.iouThreshold).toBe(DEFAULT_IOU_THRESHOLD);
    expect(result.inputHash).toMatch(/^[a-f0-9]{16}$/);
    expect(result.jobId).toBe(JOB);
    expect(result.datasetVersionId).toBe(DS);
    expect(result.predictionCount).toBe(1);
    expect(result.groundTruthCount).toBe(1);
  });

  it('same inputs produce same inputHash', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const hash1 = computeInputHash(JOB, DS, preds, gts, 0.5, ALGORITHM_VERSION);
    const hash2 = computeInputHash(JOB, DS, preds, gts, 0.5, ALGORITHM_VERSION);

    expect(hash1).toBe(hash2);
  });

  it('same IDs in different array order produces same inputHash', () => {
    const preds1 = [
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100),
      mkPred('p2', 'a1', 'car', 50, 50, 100, 100),
    ];
    const gts1 = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];
    const preds2 = [
      mkPred('p2', 'a1', 'car', 50, 50, 100, 100),
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100),
    ];
    const gts2 = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const hash1 = computeInputHash(JOB, DS, preds1, gts1, 0.5, ALGORITHM_VERSION);
    const hash2 = computeInputHash(JOB, DS, preds2, gts2, 0.5, ALGORITHM_VERSION);

    expect(hash1).toBe(hash2);
  });

  it('different IoU threshold produces different inputHash', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const hash1 = computeInputHash(JOB, DS, preds, gts, 0.5, ALGORITHM_VERSION);
    const hash2 = computeInputHash(JOB, DS, preds, gts, 0.7, ALGORITHM_VERSION);

    expect(hash1).not.toBe(hash2);
  });

  it('per-class metrics include meanIou', () => {
    const preds = [mkPred('p1', 'a1', 'car', 5, 5, 100, 100)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    const car = result.perClassMetrics.find((m) => m.classKey === 'car')!;
    expect(car.meanIou).toBeGreaterThan(0);
    expect(car.meanIou).toBeLessThan(1);
  });

  it('zero-area geometry is rejected', () => {
    const preds = [
      {
        id: 'p1',
        assetId: 'a1',
        classKey: 'car',
        label: 'car',
        geometry: { x: 0, y: 0, width: 0, height: 0 },
        confidence: 0.9,
      },
    ];
    const gts: EvaluationGroundTruth[] = [];

    expect(() => computeEvaluationMetrics(preds, gts, JOB, DS)).toThrow('Invalid geometry');
  });

  it('partial overlap above threshold matches', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100)];
    const gts = [mkGt('g1', 'a1', 'car', 10, 10, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(1);
    expect(result.meanIou).toBeGreaterThan(0.5);
  });

  it('partial overlap below threshold does not match', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100)];
    const gts = [mkGt('g1', 'a1', 'car', 90, 90, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(0);
    expect(result.falsePositive).toBe(1);
    expect(result.falseNegative).toBe(1);
  });

  it('matches sorted by classKey, assetId, IoU desc, predictionId asc', () => {
    const preds = [
      mkPred('p2', 'a1', 'car', 0, 0, 100, 100, 0.9),
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.9),
      mkPred('p3', 'a1', 'van', 0, 0, 100, 100, 0.9),
      mkPred('p4', 'a2', 'car', 0, 0, 100, 100, 0.9),
    ];
    const gts = [
      mkGt('g1', 'a1', 'car', 0, 0, 100, 100),
      mkGt('g2', 'a1', 'van', 0, 0, 100, 100),
      mkGt('g3', 'a2', 'car', 0, 0, 100, 100),
    ];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(3);
    expect(result.matches).toHaveLength(3);
    expect(result.matches[0].classKey).toBe('car');
    expect(result.matches[0].predictionId).toBe('p1');
    expect(result.matches[1].classKey).toBe('car');
    expect(result.matches[1].assetId).toBe('a2');
    expect(result.matches[2].classKey).toBe('van');
  });

  it('unmapped class handled as regular class', () => {
    const preds = [mkPred('p1', 'a1', 'unmapped:bicycle', 0, 0, 100, 100)];
    const gts = [mkGt('g1', 'a1', 'unmapped:bicycle', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(1);
    const unmapped = result.perClassMetrics.find((m) => m.classKey === 'unmapped:bicycle');
    expect(unmapped).toBeDefined();
  });

  it('one GT matches highest-IoU prediction (greedy)', () => {
    const preds = [
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.7),
      mkPred('p2', 'a1', 'car', 2, 2, 100, 100, 0.9),
    ];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(1);
    expect(result.matches[0].predictionId).toBe('p2');
    expect(result.falsePositive).toBe(1);
  });

  it('cross-asset: same class in two assets aggregates per-class metrics correctly', () => {
    // car appears in asset a1 (TP) and asset a2 (FP + FN).
    // Per-class car should be: TP=1, FP=1, FN=1, P=0.5, R=0.5, F1~0.5
    const preds = [
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95),
      mkPred('p2', 'a2', 'car', 200, 200, 100, 100, 0.85),
    ];
    const gts = [
      mkGt('g1', 'a1', 'car', 0, 0, 100, 100),
      mkGt('g2', 'a2', 'car', 300, 300, 100, 100),
    ];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(1);
    expect(result.falsePositive).toBe(1);
    expect(result.falseNegative).toBe(1);
    expect(result.perClassMetrics).toHaveLength(1);

    const carMetrics = result.perClassMetrics.find((m) => m.classKey === 'car')!;
    expect(carMetrics).toBeDefined();
    expect(carMetrics.truePositives).toBe(1);
    expect(carMetrics.falsePositives).toBe(1);
    expect(carMetrics.falseNegatives).toBe(1);
    expect(carMetrics.precision).toBeCloseTo(0.5, 3);
    expect(carMetrics.recall).toBeCloseTo(0.5, 3);
    expect(carMetrics.f1).toBeGreaterThan(0);
    expect(carMetrics.f1).toBeLessThan(1);
  });

  it('cross-asset: car in a1 TP and a2 FN with no prediction — aggregated', () => {
    // car: a1 has TP, a2 has FN only
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const gts = [
      mkGt('g1', 'a1', 'car', 0, 0, 100, 100),
      mkGt('g2', 'a2', 'car', 200, 200, 100, 100),
    ];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(1);
    expect(result.falsePositive).toBe(0);
    expect(result.falseNegative).toBe(1);

    const carMetrics = result.perClassMetrics.find((m) => m.classKey === 'car')!;
    expect(carMetrics.truePositives).toBe(1);
    expect(carMetrics.falsePositives).toBe(0);
    expect(carMetrics.falseNegatives).toBe(1);
    expect(carMetrics.precision).toBe(1);
    expect(carMetrics.recall).toBeCloseTo(0.5, 3);
  });

  it('tiny geometry difference produces different inputHash', () => {
    const preds1 = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.9)];
    const gts1 = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];
    const preds2 = [mkPred('p1', 'a1', 'car', 0, 0, 100.0001, 100, 0.9)];
    const gts2 = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const hash1 = computeInputHash(JOB, DS, preds1, gts1, 0.5, ALGORITHM_VERSION);
    const hash2 = computeInputHash(JOB, DS, preds2, gts2, 0.5, ALGORITHM_VERSION);

    expect(hash1).not.toBe(hash2);
  });

  it('tiny confidence difference produces different inputHash', () => {
    const preds1 = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.9)];
    const gts1 = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];
    const preds2 = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.900001)];
    const gts2 = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const hash1 = computeInputHash(JOB, DS, preds1, gts1, 0.5, ALGORITHM_VERSION);
    const hash2 = computeInputHash(JOB, DS, preds2, gts2, 0.5, ALGORITHM_VERSION);

    expect(hash1).not.toBe(hash2);
  });

  it('different prediction ids produce different inputHash', () => {
    // Changing prediction IDs changes the canonical content, producing a different hash.
    const preds1 = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.9)];
    const gts1 = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];
    const preds2 = [mkPred('p2', 'a1', 'car', 0, 0, 100, 100, 0.9)];
    const gts2 = [mkGt('g2', 'a1', 'car', 0, 0, 100, 100)];

    const hash1 = computeInputHash(JOB, DS, preds1, gts1, 0.5, ALGORITHM_VERSION);
    const hash2 = computeInputHash(JOB, DS, preds2, gts2, 0.5, ALGORITHM_VERSION);

    expect(hash1).not.toBe(hash2);
  });

  it('identical inputs produce same inputHash', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.9)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const hash1 = computeInputHash(JOB, DS, preds, gts, 0.5, ALGORITHM_VERSION);
    const hash2 = computeInputHash(JOB, DS, preds, gts, 0.5, ALGORITHM_VERSION);

    expect(hash1).toBe(hash2);
  });

  it('report includes matches with predictionId, groundTruthId, assetId, classKey, iou', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.matches).toHaveLength(1);
    const match = result.matches[0];
    expect(match.predictionId).toBe('p1');
    expect(match.groundTruthId).toBe('g1');
    expect(match.assetId).toBe('a1');
    expect(match.classKey).toBe('car');
    expect(match.iou).toBeCloseTo(1.0, 3);
  });

  it('cross-asset: matches are deterministic and ordered by classKey, assetId, IoU desc, predictionId asc', () => {
    const preds = [
      mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.9),
      mkPred('p2', 'a2', 'car', 0, 0, 100, 100, 0.9),
    ];
    const gts = [mkGt('g1', 'a1', 'car', 0, 0, 100, 100), mkGt('g2', 'a2', 'car', 0, 0, 100, 100)];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].classKey).toBe('car');
    expect(result.matches[0].assetId).toBe('a1');
    expect(result.matches[1].classKey).toBe('car');
    expect(result.matches[1].assetId).toBe('a2');
  });

  it('FP-only when no GT exists for a locked version with predictions', () => {
    const preds = [mkPred('p1', 'a1', 'car', 0, 0, 100, 100, 0.95)];
    const gts: EvaluationGroundTruth[] = [];

    const result = computeEvaluationMetrics(preds, gts, JOB, DS);

    expect(result.truePositive).toBe(0);
    expect(result.falsePositive).toBe(1);
    expect(result.falseNegative).toBe(0);
    expect(result.precision).toBe(0);
    expect(result.recall).toBe(0);
    expect(result.f1).toBe(0);
  });
});
