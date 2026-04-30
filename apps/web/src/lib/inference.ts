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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000';

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

export async function getEvaluationReport(jobId: string): Promise<EvaluationReport | null> {
  const data = await apiJson<EvaluationRunResponse>(
    `/api/projects/proj_parking_lot/inference-jobs/${jobId}/evaluation`
  );

  return data.report ?? null;
}

export async function runEvaluation(jobId: string): Promise<EvaluationReport> {
  const data = await apiJson<EvaluationRunResponse>(
    `/api/projects/proj_parking_lot/inference-jobs/evaluate`,
    {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    }
  );

  return data.report;
}

export async function getJobPredictions(jobId: string): Promise<PredictionListResponse> {
  return apiJson<PredictionListResponse>(
    `/api/projects/proj_parking_lot/inference-jobs/${jobId}/predictions`
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

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as T;
}

async function readApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      message?: string | string[] | { message?: string; detail?: string };
      error?: string;
      detail?: string;
    };

    if (typeof body.message === 'string') {
      return body.message;
    }

    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }

    if (typeof body.message === 'object' && body.message?.message) {
      return body.message.detail
        ? `${body.message.message}: ${body.message.detail}`
        : body.message.message;
    }

    return body.detail ?? body.error ?? `Inference request failed with HTTP ${response.status}`;
  } catch {
    return `Inference request failed with HTTP ${response.status}`;
  }
}
