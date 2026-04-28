import { z } from "zod";

export const InferenceJobStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]);

export type InferenceJobStatus = z.infer<typeof InferenceJobStatusSchema>;

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

export const InferenceJobPreviewSchema = z.object({
  projectId: z.string().min(1),
  datasetVersionId: z.string().min(1),
  pipelineId: z.string().min(1),
  modelId: z.string().min(1).optional(),
});

export type InferenceJobPreview = z.infer<typeof InferenceJobPreviewSchema>;
