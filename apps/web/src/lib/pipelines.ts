import type {
  CreatePipelineRequest,
  PipelineListResponse,
  PipelineSummary,
  PipelineValidationResponse,
  UpdatePipelineRequest,
  ValidatePipelineRequest,
} from '@visionflow/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000';

export async function listProjectPipelines(projectId: string): Promise<PipelineListResponse> {
  return apiJson<PipelineListResponse>(`/api/projects/${projectId}/pipelines`);
}

export async function validateProjectPipeline(
  projectId: string,
  body: ValidatePipelineRequest
): Promise<PipelineValidationResponse> {
  return apiJson<PipelineValidationResponse>(`/api/projects/${projectId}/pipelines/validate`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function createProjectPipeline(
  projectId: string,
  body: CreatePipelineRequest
): Promise<PipelineSummary> {
  return apiJson<PipelineSummary>(`/api/projects/${projectId}/pipelines`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProjectPipeline(
  projectId: string,
  pipelineId: string,
  body: UpdatePipelineRequest
): Promise<PipelineSummary> {
  return apiJson<PipelineSummary>(`/api/projects/${projectId}/pipelines/${pipelineId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
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

    return body.detail ?? body.error ?? `Pipeline request failed with HTTP ${response.status}`;
  } catch {
    return `Pipeline request failed with HTTP ${response.status}`;
  }
}
