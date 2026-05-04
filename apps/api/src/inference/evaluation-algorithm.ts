import { createHash } from 'node:crypto';
import { BBoxGeometrySchema } from '@visionflow/contracts';

export const ALGORITHM_VERSION = 'eval-v1-iou-0.5-greedy-class-aware';
export const DEFAULT_IOU_THRESHOLD = 0.5;

export interface EvaluationPrediction {
  id: string;
  assetId: string;
  classKey: string;
  label: string;
  geometry: EvaluationGeometry;
  confidence: number;
}

export interface EvaluationGroundTruth {
  id: string;
  assetId: string;
  classKey: string;
  label: string;
  geometry: EvaluationGeometry;
}

export interface EvaluationGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EvaluationMatch {
  predictionId: string;
  groundTruthId: string;
  assetId: string;
  classKey: string;
  iou: number;
}

export interface EvaluationResult {
  algorithmVersion: string;
  iouThreshold: number;
  inputHash: string;
  jobId: string;
  datasetVersionId: string;
  pipelineId: string | null;
  modelId: string | null;
  predictionCount: number;
  groundTruthCount: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  precision: number;
  recall: number;
  f1: number;
  meanIou: number;
  perClassMetrics: PerClassMetrics[];
  matches: EvaluationMatch[];
}

export interface PerClassMetrics {
  classKey: string;
  label: string;
  precision: number;
  recall: number;
  f1: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  count: number;
  meanIou: number;
}

export interface EvaluationConfig {
  iouThreshold?: number;
  algorithmVersion?: string;
}

function validateGeometry(geom: EvaluationGeometry, source: string, id: string): void {
  const result = BBoxGeometrySchema.safeParse(geom);
  if (!result.success) {
    throw new Error(
      `Invalid geometry for ${source} ${id}: ` +
        result.error.issues.map((i) => `${i.path.join('.')}=${i.message}`).join(', ')
    );
  }
}

function computeIoU(a: EvaluationGeometry, b: EvaluationGeometry): number {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const areaA = Math.max(0, a.width) * Math.max(0, a.height);
  const areaB = Math.max(0, b.width) * Math.max(0, b.height);
  const union = areaA + areaB - intersection;

  return union === 0 ? 0 : Number((intersection / union).toFixed(6));
}

export function computeEvaluationMetrics(
  predictions: EvaluationPrediction[],
  groundTruth: EvaluationGroundTruth[],
  jobId: string,
  datasetVersionId: string,
  config: EvaluationConfig = {}
): EvaluationResult {
  const iouThreshold = config.iouThreshold ?? DEFAULT_IOU_THRESHOLD;
  const algorithmVersion = config.algorithmVersion ?? ALGORITHM_VERSION;

  for (const p of predictions) {
    validateGeometry(p.geometry, 'prediction', p.id);
  }
  for (const gt of groundTruth) {
    validateGeometry(gt.geometry, 'groundTruth', gt.id);
  }

  const groupedPredictions = new Map<string, EvaluationPrediction[]>();
  for (const pred of predictions) {
    const key = `${pred.assetId}|${pred.classKey}`;
    if (!groupedPredictions.has(key)) {
      groupedPredictions.set(key, []);
    }
    groupedPredictions.get(key)!.push(pred);
  }

  for (const preds of groupedPredictions.values()) {
    preds.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.id.localeCompare(b.id);
    });
  }

  const groupedGt = new Map<string, EvaluationGroundTruth[]>();
  for (const gt of groundTruth) {
    const key = `${gt.assetId}|${gt.classKey}`;
    if (!groupedGt.has(key)) {
      groupedGt.set(key, []);
    }
    groupedGt.get(key)!.push(gt);
  }

  for (const gts of groupedGt.values()) {
    gts.sort((a, b) => a.id.localeCompare(b.id));
  }

  const matchedGt = new Set<string>();
  const matches: EvaluationMatch[] = [];

  for (const [key, preds] of groupedPredictions) {
    const gts = groupedGt.get(key) ?? [];
    const gtIndexMap = new Map<string, number>();
    gts.forEach((gt, idx) => gtIndexMap.set(gt.id, idx));

    for (const pred of preds) {
      let bestGt: EvaluationGroundTruth | null = null;
      let bestIoU = -1;
      let bestGtOriginalIdx = -1;

      for (const gt of gts) {
        const gtGlobalId = `${key}:${gt.id}`;
        if (matchedGt.has(gtGlobalId)) continue;

        const iou = computeIoU(pred.geometry, gt.geometry);
        if (iou > bestIoU) {
          bestIoU = iou;
          bestGt = gt;
          bestGtOriginalIdx = gtIndexMap.get(gt.id) ?? -1;
        }
      }

      if (bestGt && bestIoU >= iouThreshold) {
        const gtGlobalId = `${key}:${bestGt.id}`;
        matchedGt.add(gtGlobalId);
        matches.push({
          predictionId: pred.id,
          groundTruthId: bestGt.id,
          assetId: pred.assetId,
          classKey: pred.classKey,
          iou: Number(bestIoU.toFixed(6)),
        });
      }
    }
  }

  // Build a lookup from GT id -> match for that GT
  const matchByGtId = new Map<string, EvaluationMatch>();
  for (const m of matches) {
    matchByGtId.set(m.groundTruthId, m);
  }

  // ── Per-class aggregation: accumulate TP/FP/FN across ALL assetId|classKey
  // groups into a single entry per classKey.
  // The accumulator approach ensures that if "car" appears in asset a1 and
  // asset a2, both contribute to the same "car" row rather than overwriting.
  // ─────────────────────────────────────────────────────────────────────────────

  const classAccumulator = new Map<
    string,
    { classKey: string; label: string; tp: number; fp: number; fn: number; ious: number[] }
  >();

  // Process every (assetId, classKey) group to accumulate per-class counts.
  // Groups that have no predictions still contribute FN (missing GT).
  // Groups that have predictions with no matches contribute FP.
  for (const [groupKey, gts] of groupedGt) {
    const parts = groupKey.split('|');
    const classKey = parts[1];
    const preds = groupedPredictions.get(groupKey) ?? [];

    // Resolve label: prefer GT label > prediction label > classKey
    const label = gts[0]?.label ?? preds[0]?.label ?? classKey;

    const gtIds = gts.map((gt) => gt.id);
    const matchedGtIds = gtIds.filter((gtId) => matchByGtId.has(gtId));
    const tp = matchedGtIds.length;
    const fp = preds.length - tp;
    const fn = gts.length - tp;

    const ious = matchedGtIds.map((gtId) => matchByGtId.get(gtId)!.iou);

    if (!classAccumulator.has(classKey)) {
      classAccumulator.set(classKey, { classKey, label, tp: 0, fp: 0, fn: 0, ious: [] });
    }
    const acc = classAccumulator.get(classKey)!;
    // Label preference: keep existing label unless new one is more specific
    if (label !== classKey && acc.label === classKey) {
      acc.label = label;
    }
    acc.tp += tp;
    acc.fp += fp;
    acc.fn += fn;
    acc.ious.push(...ious);
  }

  // Groups with predictions but no GT at all contribute FP per class.
  for (const [groupKey, preds] of groupedPredictions) {
    if (!groupedGt.has(groupKey)) {
      const parts = groupKey.split('|');
      const classKey = parts[1];
      const label = preds[0]?.label ?? classKey;
      if (!classAccumulator.has(classKey)) {
        classAccumulator.set(classKey, { classKey, label, tp: 0, fp: 0, fn: 0, ious: [] });
      }
      const acc = classAccumulator.get(classKey)!;
      if (label !== classKey && acc.label === classKey) {
        acc.label = label;
      }
      acc.fp += preds.length;
    }
  }

  const totalTp = matches.length;
  const totalFp = predictions.length - totalTp;
  const totalFn = groundTruth.length - totalTp;

  const precision = predictions.length > 0 ? totalTp / (totalTp + totalFp) : 0;
  const recall = groundTruth.length > 0 ? totalTp / (totalTp + totalFn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const meanIou = totalTp > 0 ? matches.reduce((s, m) => s + m.iou, 0) / totalTp : 0;

  const perClassMetrics: PerClassMetrics[] = [...classAccumulator.values()]
    .sort((a, b) => {
      const labelCmp = a.label.localeCompare(b.label);
      if (labelCmp !== 0) return labelCmp;
      return a.classKey.localeCompare(b.classKey);
    })
    .map((c) => {
      const tp = c.tp;
      const fp = c.fp;
      const fn = c.fn;
      const p = tp + fp > 0 ? tp / (tp + fp) : 0;
      const r = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f = p + r > 0 ? (2 * p * r) / (p + r) : 0;
      const meanIoU = c.ious.length > 0 ? c.ious.reduce((s, i) => s + i, 0) / c.ious.length : 0;
      return {
        classKey: c.classKey,
        label: c.label,
        precision: Number(p.toFixed(6)),
        recall: Number(r.toFixed(6)),
        f1: Number(f.toFixed(6)),
        truePositives: tp,
        falsePositives: fp,
        falseNegatives: fn,
        count: tp + fn,
        meanIou: Number(meanIoU.toFixed(6)),
      };
    });

  const sortedMatches: EvaluationMatch[] = [...matches].sort((a, b) => {
    if (a.classKey !== b.classKey) return a.classKey.localeCompare(b.classKey);
    if (a.assetId !== b.assetId) return a.assetId.localeCompare(b.assetId);
    const iouDiff = b.iou - a.iou;
    if (Math.abs(iouDiff) > 1e-9) return iouDiff;
    return a.predictionId.localeCompare(b.predictionId);
  });

  const inputHash = computeInputHash(
    jobId,
    datasetVersionId,
    predictions,
    groundTruth,
    iouThreshold,
    algorithmVersion
  );

  const pipelineId: string | null = predictions[0]
    ? ((predictions[0] as EvaluationPrediction & { pipelineId?: string }).pipelineId ?? null)
    : null;
  const modelId: string | null = predictions[0]
    ? ((predictions[0] as EvaluationPrediction & { modelId?: string }).modelId ?? null)
    : null;

  return {
    algorithmVersion,
    iouThreshold,
    inputHash,
    jobId,
    datasetVersionId,
    pipelineId,
    modelId,
    predictionCount: predictions.length,
    groundTruthCount: groundTruth.length,
    truePositive: totalTp,
    falsePositive: totalFp,
    falseNegative: totalFn,
    precision: Number(precision.toFixed(6)),
    recall: Number(recall.toFixed(6)),
    f1: Number(f1.toFixed(6)),
    meanIou: Number(meanIou.toFixed(6)),
    perClassMetrics,
    matches: sortedMatches,
  };
}

/**
 * Deterministic canonical JSON for input hash.
 * Uses exact numeric values (no rounding) so that tiny precision differences
 * produce different hashes. Keys are sorted for deterministic ordering.
 */
export function computeInputHash(
  jobId: string,
  datasetVersionId: string,
  predictions: EvaluationPrediction[],
  groundTruth: EvaluationGroundTruth[],
  iouThreshold: number,
  algorithmVersion: string
): string {
  const sortedPreds = [...predictions]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p) => ({
      id: p.id,
      assetId: p.assetId,
      classKey: p.classKey,
      geometry: p.geometry,
      confidence: p.confidence,
    }));

  const sortedGt = [...groundTruth]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((gt) => ({
      id: gt.id,
      assetId: gt.assetId,
      classKey: gt.classKey,
      geometry: gt.geometry,
    }));

  const canonical = JSON.stringify({
    jobId,
    datasetVersionId,
    iouThreshold,
    algorithmVersion,
    predictions: sortedPreds,
    groundTruth: sortedGt,
  });

  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

export function safeDiv(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}
