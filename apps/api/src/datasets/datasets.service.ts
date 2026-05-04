import { Inject, Injectable } from '@nestjs/common';
import {
  CreateDatasetRequest,
  CreateDatasetVersionRequest,
  DatasetSummary,
  DatasetVersionSummary,
  AssignDatasetVersionAssetsRequest,
} from '@visionflow/contracts';
import { DatasetRepository } from '../repositories/dataset.repository';
import { DATASET_REPOSITORY } from '../config/provider-tokens';

@Injectable()
export class DatasetsService {
  constructor(@Inject(DATASET_REPOSITORY) private readonly datasetRepo: DatasetRepository) {}

  async createDataset(projectId: string, dto: CreateDatasetRequest): Promise<DatasetSummary> {
    return this.datasetRepo.createDataset(projectId, dto);
  }

  async listDatasets(projectId: string): Promise<DatasetSummary[]> {
    return this.datasetRepo.listDatasets(projectId);
  }

  async createVersion(
    projectId: string,
    datasetId: string,
    dto: CreateDatasetVersionRequest
  ): Promise<DatasetVersionSummary> {
    return this.datasetRepo.createVersion(projectId, datasetId, dto);
  }

  async listVersions(projectId: string, datasetId: string): Promise<DatasetVersionSummary[]> {
    return this.datasetRepo.listVersions(projectId, datasetId);
  }

  async listVersionAssetIds(projectId: string, versionId: string): Promise<string[]> {
    return this.datasetRepo.listVersionAssetIds(projectId, versionId);
  }

  async assignAssets(
    projectId: string,
    versionId: string,
    dto: AssignDatasetVersionAssetsRequest
  ): Promise<DatasetVersionSummary> {
    return this.datasetRepo.assignAssets(projectId, versionId, dto);
  }

  async lockVersion(projectId: string, versionId: string): Promise<DatasetVersionSummary> {
    return this.datasetRepo.lockVersion(projectId, versionId);
  }
}
