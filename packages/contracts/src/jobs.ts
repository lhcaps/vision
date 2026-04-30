import { z } from "zod";

export const InferenceJobStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]);

export type InferenceJobStatus = z.infer<typeof InferenceJobStatusSchema>;

export const InferenceWorkerStageSchema = z.enum([
  "queued",
  "validated",
  "dataset_resolved",
  "cv_worker_dispatched",
  "pipeline_dispatched",
  "predictions_persisted",
  "completed",
  "failed",
]);

export type InferenceWorkerStage = z.infer<typeof InferenceWorkerStageSchema>;

const validTransitions: Record<InferenceJobStatus, InferenceJobStatus[]> = {
  QUEUED: ["RUNNING", "CANCELLED", "FAILED"],
  RUNNING: ["SUCCEEDED", "FAILED", "CANCELLED"],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

export function canTransitionJob(from: InferenceJobStatus, to: InferenceJobStatus): boolean {
  return validTransitions[from].includes(to);
}

export function assertJobTransition(from: InferenceJobStatus, to: InferenceJobStatus): void {
  if (!canTransitionJob(from, to)) {
    throw new Error(`Invalid inference job transition: ${from} -> ${to}`);
  }
}

export function isTerminalJobStatus(status: InferenceJobStatus): boolean {
  return status === "SUCCEEDED" || status === "FAILED" || status === "CANCELLED";
}

export function assertJobProgress(progress: number): void {
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    throw new Error(`Invalid inference job progress: ${progress}`);
  }
}

export const InferenceJobPreviewSchema = z.object({
  projectId: z.string().min(1),
  datasetVersionId: z.string().min(1),
  pipelineId: z.string().min(1),
  modelId: z.string().min(1).optional(),
});

export type InferenceJobPreview = z.infer<typeof InferenceJobPreviewSchema>;

export const CreateInferenceJobRequestSchema = z.object({
  datasetVersionId: z.string().min(1),
  pipelineId: z.string().min(1),
  modelId: z.string().min(1).nullable().optional(),
});

export const InferenceJobSummarySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  datasetVersionId: z.string(),
  pipelineId: z.string(),
  modelId: z.string().nullable(),
  status: InferenceJobStatusSchema,
  progress: z.number().int().min(0).max(100),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  errorMessage: z.string().nullable(),
});

export const InferenceJobEventSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  type: z.enum(["snapshot", "progress", "log", "complete", "error"]),
  status: InferenceJobStatusSchema,
  progress: z.number().int().min(0).max(100),
  stage: InferenceWorkerStageSchema,
  message: z.string(),
  createdAt: z.string(),
});

export const CreateInferenceJobResponseSchema = z.object({
  job: InferenceJobSummarySchema,
});

export const InferenceJobListResponseSchema = z.object({
  jobs: z.array(InferenceJobSummarySchema),
});

export type CreateInferenceJobRequest = z.infer<typeof CreateInferenceJobRequestSchema>;
export type InferenceJobSummary = z.infer<typeof InferenceJobSummarySchema>;
export type InferenceJobEvent = z.infer<typeof InferenceJobEventSchema>;
export type CreateInferenceJobResponse = z.infer<typeof CreateInferenceJobResponseSchema>;
export type InferenceJobListResponse = z.infer<typeof InferenceJobListResponseSchema>;
