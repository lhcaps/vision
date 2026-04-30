import { z } from "zod";

export const PerClassMetricSchema = z.object({
  label: z.string(),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1: z.number().min(0).max(1),
  truePositives: z.number().int().nonnegative(),
  falsePositives: z.number().int().nonnegative(),
  falseNegatives: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});

export const EvaluationReportSummarySchema = z.object({
  id: z.string(),
  jobId: z.string(),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1: z.number().min(0).max(1),
  meanIoU: z.number().min(0).max(1),
  truePositives: z.number().int().nonnegative(),
  falsePositives: z.number().int().nonnegative(),
  falseNegatives: z.number().int().nonnegative(),
  evaluatedAt: z.string(),
  assetCount: z.number().int().nonnegative(),
});

export const EvaluationReportSchema = EvaluationReportSummarySchema.extend({
  perClassMetrics: z.array(PerClassMetricSchema),
});

export const EvaluationReportListResponseSchema = z.object({
  report: EvaluationReportSummarySchema.nullable(),
});

export const EvaluationRunResponseSchema = z.object({
  report: EvaluationReportSchema,
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
});

export const PredictionListResponseSchema = z.object({
  predictions: z.array(PredictionSummarySchema),
});

export const PredictionListResponseForWebSchema = z.object({
  predictions: z.array(PredictionSummarySchema),
});

export const RunEvaluationRequestSchema = z.object({
  jobId: z.string().min(1),
});

export type PerClassMetric = z.infer<typeof PerClassMetricSchema>;
export type EvaluationReportSummary = z.infer<typeof EvaluationReportSummarySchema>;
export type EvaluationReport = z.infer<typeof EvaluationReportSchema>;
export type EvaluationReportListResponse = z.infer<typeof EvaluationReportListResponseSchema>;
export type EvaluationRunResponse = z.infer<typeof EvaluationRunResponseSchema>;
export type PredictionSummary = z.infer<typeof PredictionSummarySchema>;
export type PredictionListResponse = z.infer<typeof PredictionListResponseSchema>;
export type RunEvaluationRequest = z.infer<typeof RunEvaluationRequestSchema>;
