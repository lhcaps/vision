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
import { apiJson } from './http';

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
