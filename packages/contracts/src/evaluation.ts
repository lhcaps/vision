import { z } from 'zod';

export const PerClassMetricSchema = z.object({
  classKey: z.string(),
  label: z.string(),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1: z.number().min(0).max(1),
  truePositives: z.number().int().nonnegative(),
  falsePositives: z.number().int().nonnegative(),
  falseNegatives: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
  meanIou: z.number().min(0).max(1),
});

export const EvaluationMatchSchema = z.object({
  predictionId: z.string(),
  groundTruthId: z.string(),
  assetId: z.string(),
  classKey: z.string(),
  iou: z.number().min(0).max(1),
});

export const EvaluationReportSummarySchema = z.object({
  id: z.string(),
  jobId: z.string(),
  datasetVersionId: z.string(),
  pipelineId: z.string().nullable(),
  modelId: z.string().nullable(),
  algorithmVersion: z.string(),
  iouThreshold: z.number().min(0).max(1),
  inputHash: z.string().length(16),
  metricsHash: z.string().length(16),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1: z.number().min(0).max(1),
  meanIoU: z.number().min(0).max(1),
  truePositives: z.number().int().nonnegative(),
  falsePositives: z.number().int().nonnegative(),
  falseNegatives: z.number().int().nonnegative(),
  predictionCount: z.number().int().nonnegative(),
  groundTruthCount: z.number().int().nonnegative(),
  assetCount: z.number().int().nonnegative(),
  evaluatedAt: z.string(),
});

export const EvaluationReportSchema = EvaluationReportSummarySchema.extend({
  perClassMetrics: z.array(PerClassMetricSchema),
  matches: z.array(EvaluationMatchSchema).optional(),
});

export const EvaluationReportListResponseSchema = z.object({
  report: EvaluationReportSummarySchema.nullable(),
});

export const EvaluationRunResponseSchema = z.object({
  report: EvaluationReportSchema.nullable(),
});

export const PredictionSummarySchema = z.object({
  id: z.string(),
  assetId: z.string(),
  labelClassId: z.string().nullable(),
  label: z.string(),
  color: z.string(),
  geometry: z.object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).optional(),
});

export const PredictionListResponseSchema = z.object({
  predictions: z.array(PredictionSummarySchema),
});

export const PredictionListResponseForWebSchema = z.object({
  predictions: z.array(PredictionSummarySchema),
});

export const RunEvaluationRequestSchema = z.object({
  jobId: z.string().min(1),
  iouThreshold: z.number().min(0).max(1).optional(),
});

export type PerClassMetric = z.infer<typeof PerClassMetricSchema>;
export type EvaluationMatch = z.infer<typeof EvaluationMatchSchema>;
export type EvaluationReportSummary = z.infer<typeof EvaluationReportSummarySchema>;
export type EvaluationReport = z.infer<typeof EvaluationReportSchema>;
export type EvaluationReportListResponse = z.infer<typeof EvaluationReportListResponseSchema>;
export type EvaluationRunResponse = z.infer<typeof EvaluationRunResponseSchema>;
export type PredictionSummary = z.infer<typeof PredictionSummarySchema>;
export type PredictionListResponse = z.infer<typeof PredictionListResponseSchema>;
export type RunEvaluationRequest = z.infer<typeof RunEvaluationRequestSchema>;
