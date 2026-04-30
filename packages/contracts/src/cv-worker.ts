import { z } from 'zod';
import { BBoxGeometrySchema } from './geometry';
import { PipelineDefinitionSchema } from './pipeline';

export const CvWorkerDetectorModeSchema = z.enum(['mock', 'onnx']);

export const CvWorkerAssetInputSchema = z.object({
  assetId: z.string().min(1),
  storageKey: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const CvWorkerPredictionSchema = z.object({
  assetId: z.string().min(1),
  labelClassId: z.string().min(1).nullable(),
  geometry: BBoxGeometrySchema,
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.unknown()),
});

export const CvWorkerRunPipelineRequestSchema = z.object({
  jobId: z.string().min(1),
  pipeline: PipelineDefinitionSchema,
  detectorMode: CvWorkerDetectorModeSchema.default('mock'),
  modelArtifactKey: z.string().min(1).nullable().optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  assets: z.array(CvWorkerAssetInputSchema).min(1),
});

export const CvWorkerRunPipelineResponseSchema = z.object({
  jobId: z.string().min(1),
  mode: z.enum(['mock_detector', 'onnx_detector']),
  workerVersion: z.string().min(1),
  assetCount: z.number().int().nonnegative(),
  predictionCount: z.number().int().nonnegative(),
  predictions: z.array(CvWorkerPredictionSchema),
  warnings: z.array(z.string()),
});

export const CvWorkerEvaluationObjectSchema = z.object({
  assetId: z.string().min(1),
  labelClassId: z.string().min(1).nullable(),
  geometry: BBoxGeometrySchema,
  confidence: z.number().min(0).max(1).optional(),
});

export const CvWorkerEvaluationRequestSchema = z.object({
  jobId: z.string().min(1).optional(),
  iouThreshold: z.number().min(0).max(1).default(0.5),
  predictions: z.array(CvWorkerEvaluationObjectSchema),
  groundTruth: z.array(CvWorkerEvaluationObjectSchema),
});

export const CvWorkerEvaluationMatchSchema = z.object({
  predictionIndex: z.number().int().nonnegative(),
  groundTruthIndex: z.number().int().nonnegative(),
  assetId: z.string().min(1),
  iou: z.number().min(0).max(1),
});

export const CvWorkerEvaluationResponseSchema = z.object({
  jobId: z.string().nullable(),
  iouThreshold: z.number().min(0).max(1),
  truePositive: z.number().int().nonnegative(),
  falsePositive: z.number().int().nonnegative(),
  falseNegative: z.number().int().nonnegative(),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1: z.number().min(0).max(1),
  meanIou: z.number().min(0).max(1),
  matches: z.array(CvWorkerEvaluationMatchSchema),
});

export type CvWorkerDetectorMode = z.infer<typeof CvWorkerDetectorModeSchema>;
export type CvWorkerAssetInput = z.infer<typeof CvWorkerAssetInputSchema>;
export type CvWorkerPrediction = z.infer<typeof CvWorkerPredictionSchema>;
export type CvWorkerRunPipelineRequest = z.input<typeof CvWorkerRunPipelineRequestSchema>;
export type CvWorkerRunPipelinePayload = z.infer<typeof CvWorkerRunPipelineRequestSchema>;
export type CvWorkerRunPipelineResponse = z.infer<typeof CvWorkerRunPipelineResponseSchema>;
export type CvWorkerEvaluationObject = z.infer<typeof CvWorkerEvaluationObjectSchema>;
export type CvWorkerEvaluationRequest = z.input<typeof CvWorkerEvaluationRequestSchema>;
export type CvWorkerEvaluationPayload = z.infer<typeof CvWorkerEvaluationRequestSchema>;
export type CvWorkerEvaluationMatch = z.infer<typeof CvWorkerEvaluationMatchSchema>;
export type CvWorkerEvaluationResponse = z.infer<typeof CvWorkerEvaluationResponseSchema>;
