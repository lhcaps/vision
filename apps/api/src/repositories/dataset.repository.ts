import {
  DatasetSummary,
  DatasetVersionSummary,
  AssignDatasetVersionAssetsRequest,
} from '@visionflow/contracts';

export interface DatasetRepository {
  createDataset(
    projectId: string,
    dto: { name: string; description?: string | null }
  ): Promise<DatasetSummary>;
  listDatasets(projectId: string): Promise<DatasetSummary[]>;
  createVersion(
    projectId: string,
    datasetId: string,
    dto: { parentVersionId?: string | null }
  ): Promise<DatasetVersionSummary>;
  listVersions(
    projectId: string,
    datasetId: string
  ): Promise<DatasetVersionSummary[]>;
  listVersionAssetIds(
    projectId: string,
    versionId: string
  ): Promise<string[]>;
  assignAssets(
    projectId: string,
    versionId: string,
    dto: AssignDatasetVersionAssetsRequest
  ): Promise<DatasetVersionSummary>;
  lockVersion(
    projectId: string,
    versionId: string
  ): Promise<DatasetVersionSummary>;
}
