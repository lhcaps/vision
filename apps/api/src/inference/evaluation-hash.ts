import { createHash } from 'node:crypto';

/**
 * Shared evaluation hash utilities.
 *
 * These are pure TypeScript with no external dependencies, so they can be
 * imported by both the NestJS runtime (via the API package) and by seed
 * scripts (via tsx relative imports).
 *
 * The two hash functions are:
 *   computeEvaluationInputHash  — canonical fingerprint of the evaluation inputs
 *   computeEvaluationMetricsHash — canonical fingerprint of the computed metrics
 *
 * Both produce 16-char lowercase hex output (SHA-256 prefix).
 */

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

export interface PerClassMetric {
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

/** Alias for backwards compatibility with Phase 20 consumers. */
export type PerClassMetrics = PerClassMetric;

export interface EvaluationReport {
  id: string;
  jobId: string;
  datasetVersionId: string;
  pipelineId: string | null;
  modelId: string | null;
  algorithmVersion: string;
  iouThreshold: number;
  inputHash: string;
  metricsHash: string;
  precision: number;
  recall: number;
  f1: number;
  meanIoU: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  predictionCount: number;
  groundTruthCount: number;
  assetCount: number;
  evaluatedAt: string;
  perClassMetrics: PerClassMetric[];
  matches?: EvaluationMatch[];
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
  perClassMetrics: PerClassMetric[];
  matches: EvaluationMatch[];
}

export interface EvaluationConfig {
  iouThreshold?: number;
  algorithmVersion?: string;
}

/**
 * Deterministic canonical JSON for the evaluation input hash.
 *
 * Uses EXACT numeric values (no rounding) so that tiny precision differences
 * produce different hashes. Keys are sorted for deterministic ordering.
 * Predictions and ground truths are sorted by id to ensure order independence.
 */
export function computeEvaluationInputHash(
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

/**
 * Deterministic canonical JSON for the evaluation metrics hash.
 *
 * Includes the FULL canonical payload (excluding metricsHash itself and evaluatedAt)
 * to ensure stable output across re-runs with identical inputs.
 */
export function computeEvaluationMetricsHash(report: EvaluationReport): string {
  const sortedPerClass = [...report.perClassMetrics].sort((a, b) =>
    a.classKey.localeCompare(b.classKey)
  );

  const sortedMatches = report.matches
    ? [...report.matches].sort((a, b) => {
        if (a.classKey !== b.classKey) return a.classKey.localeCompare(b.classKey);
        if (a.assetId !== b.assetId) return a.assetId.localeCompare(b.assetId);
        if (Math.abs(a.iou - b.iou) > 1e-9) return b.iou - a.iou;
        return a.predictionId.localeCompare(b.predictionId);
      })
    : [];

  const canonical = JSON.stringify({
    jobId: report.jobId,
    datasetVersionId: report.datasetVersionId,
    pipelineId: report.pipelineId,
    modelId: report.modelId,
    algorithmVersion: report.algorithmVersion,
    iouThreshold: report.iouThreshold,
    inputHash: report.inputHash,
    precision: report.precision,
    recall: report.recall,
    f1: report.f1,
    meanIoU: report.meanIoU,
    truePositives: report.truePositives,
    falsePositives: report.falsePositives,
    falseNegatives: report.falseNegatives,
    predictionCount: report.predictionCount,
    groundTruthCount: report.groundTruthCount,
    assetCount: report.assetCount,
    perClassMetrics: sortedPerClass,
    matches: sortedMatches,
  });

  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}
