import type {
  CreateInferenceJobRequest,
  CreateInferenceJobResponse,
  EvaluationReport,
  EvaluationRunResponse,
  InferenceJobEvent,
  InferenceJobListResponse,
  InferenceJobSummary,
  PredictionListResponse,
} from '@visionflow/contracts';
import { apiJson, API_BASE_URL } from './http';

export async function listInferenceJobs(projectId: string): Promise<InferenceJobListResponse> {
  return apiJson<InferenceJobListResponse>(`/api/projects/${projectId}/inference-jobs`);
}

export async function createInferenceJob(
  projectId: string,
  body: CreateInferenceJobRequest
): Promise<CreateInferenceJobResponse> {
  return apiJson<CreateInferenceJobResponse>(`/api/projects/${projectId}/inference-jobs`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getEvaluationReport(
  projectId: string,
  jobId: string
): Promise<EvaluationReport | null> {
  const data = await apiJson<EvaluationRunResponse>(
    `/api/projects/${projectId}/inference-jobs/${jobId}/evaluation`
  );

  return data.report ?? null;
}

export async function runEvaluation(
  projectId: string,
  jobId: string
): Promise<EvaluationReport> {
  const data = await apiJson<EvaluationRunResponse>(
    `/api/projects/${projectId}/inference-jobs/evaluate`,
    {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    }
  );

  return data.report!;
}

export async function getJobPredictions(
  projectId: string,
  jobId: string
): Promise<PredictionListResponse> {
  return apiJson<PredictionListResponse>(
    `/api/projects/${projectId}/inference-jobs/${jobId}/predictions`
  );
}

export async function getInferenceJob(
  projectId: string,
  jobId: string
): Promise<InferenceJobSummary> {
  return apiJson<InferenceJobSummary>(
    `/api/projects/${projectId}/inference-jobs/${jobId}`
  );
}

export function openInferenceJobEvents(projectId: string, jobId: string): EventSource {
  return new EventSource(
    `${API_BASE_URL}/api/projects/${projectId}/inference-jobs/${jobId}/events`
  );
}

export function mergeJobEvent(
  job: InferenceJobSummary,
  event: InferenceJobEvent
): InferenceJobSummary {
  return {
    ...job,
    status: event.status,
    progress: event.progress,
    startedAt: job.startedAt ?? (event.status === 'RUNNING' ? event.createdAt : null),
    completedAt:
      event.status === 'SUCCEEDED' || event.status === 'FAILED' || event.status === 'CANCELLED'
        ? event.createdAt
        : job.completedAt,
    errorMessage: event.type === 'error' ? event.message : job.errorMessage,
  };
}
