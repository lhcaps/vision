import type {
  AnnotationSummary,
  AnnotationWorkspaceResponse,
  CreateAnnotationRequest,
  DeleteAnnotationResponse,
  UpdateAnnotationRequest,
} from '@visionflow/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000';

export async function loadAnnotationWorkspace(
  projectId: string,
  datasetVersionId: string,
  assetId?: string
): Promise<AnnotationWorkspaceResponse> {
  const query = assetId ? `?assetId=${encodeURIComponent(assetId)}` : '';

  return apiJson<AnnotationWorkspaceResponse>(
    `/api/projects/${projectId}/dataset-versions/${datasetVersionId}/annotation-workspace${query}`
  );
}

export async function createAnnotation(
  projectId: string,
  annotationSetId: string,
  body: CreateAnnotationRequest
): Promise<AnnotationSummary> {
  return apiJson<AnnotationSummary>(
    `/api/projects/${projectId}/annotation-sets/${annotationSetId}/annotations`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

export async function updateAnnotation(
  projectId: string,
  annotationId: string,
  body: UpdateAnnotationRequest
): Promise<AnnotationSummary> {
  return apiJson<AnnotationSummary>(`/api/projects/${projectId}/annotations/${annotationId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteAnnotation(
  projectId: string,
  annotationId: string
): Promise<DeleteAnnotationResponse> {
  return apiJson<DeleteAnnotationResponse>(
    `/api/projects/${projectId}/annotations/${annotationId}`,
    {
      method: 'DELETE',
    }
  );
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

    return body.detail ?? body.error ?? `Annotation request failed with HTTP ${response.status}`;
  } catch {
    return `Annotation request failed with HTTP ${response.status}`;
  }
}
