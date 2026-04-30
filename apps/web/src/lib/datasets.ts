import type {
  AssignDatasetVersionAssetsRequest,
  CreateDatasetRequest,
  CreateDatasetVersionRequest,
  DatasetListResponse,
  DatasetSummary,
  DatasetVersionListResponse,
  DatasetVersionSummary,
  LockDatasetVersionResponse,
} from '@visionflow/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000';

export async function listProjectDatasets(projectId: string): Promise<DatasetListResponse> {
  return apiJson<DatasetListResponse>(`/api/projects/${projectId}/datasets`);
}

export async function createDataset(
  projectId: string,
  body: CreateDatasetRequest
): Promise<DatasetSummary> {
  return apiJson<DatasetSummary>(`/api/projects/${projectId}/datasets`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listDatasetVersions(
  projectId: string,
  datasetId: string
): Promise<DatasetVersionListResponse> {
  return apiJson<DatasetVersionListResponse>(
    `/api/projects/${projectId}/datasets/${datasetId}/versions`
  );
}

export async function createDatasetVersion(
  projectId: string,
  datasetId: string,
  body: CreateDatasetVersionRequest
): Promise<DatasetVersionSummary> {
  return apiJson<DatasetVersionSummary>(
    `/api/projects/${projectId}/datasets/${datasetId}/versions`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

export async function assignDatasetVersionAssets(
  projectId: string,
  versionId: string,
  body: AssignDatasetVersionAssetsRequest
): Promise<DatasetVersionSummary> {
  return apiJson<DatasetVersionSummary>(
    `/api/projects/${projectId}/dataset-versions/${versionId}/assets`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

export async function lockDatasetVersion(
  projectId: string,
  versionId: string
): Promise<LockDatasetVersionResponse> {
  return apiJson<LockDatasetVersionResponse>(
    `/api/projects/${projectId}/dataset-versions/${versionId}/lock`,
    {
      method: 'POST',
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

    return body.detail ?? body.error ?? `Dataset request failed with HTTP ${response.status}`;
  } catch {
    return `Dataset request failed with HTTP ${response.status}`;
  }
}
