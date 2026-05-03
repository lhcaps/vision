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
  listVersions(projectId: string, datasetId: string): Promise<DatasetVersionSummary[]>;
  listVersionAssetIds(projectId: string, versionId: string): Promise<string[]>;
  assignAssets(
    projectId: string,
    versionId: string,
    dto: AssignDatasetVersionAssetsRequest
  ): Promise<DatasetVersionSummary>;
  lockVersion(projectId: string, versionId: string): Promise<DatasetVersionSummary>;
  getVersionSnapshot(projectId: string, versionId: string): Promise<VersionSnapshot | null>;
  getVersionStatusByAnnotationSet(
    projectId: string,
    annotationSetId: string
  ): Promise<'DRAFT' | 'LOCKED' | 'ARCHIVED' | null>;
}

export type VersionSnapshotAsset = {
  assetId: string;
  split: 'TRAIN' | 'VALID' | 'TEST' | 'UNASSIGNED';
  asset: {
    id: string;
    type: 'IMAGE' | 'VIDEO' | 'FRAME';
    storageKey: string;
    width: number | null;
    height: number | null;
  };
};

export type VersionSnapshotAnnotation = {
  id: string;
  assetId: string;
  labelClassId: string;
  labelName: string;
  type: 'BBOX' | 'MASK' | 'KEYPOINT';
  geometryJson: unknown;
};

export type VersionSnapshot = {
  id: string;
  datasetId: string;
  version: number;
  status: 'DRAFT' | 'LOCKED' | 'ARCHIVED';
  assets: VersionSnapshotAsset[];
  annotationSets: Array<{
    id: string;
    annotations: VersionSnapshotAnnotation[];
  }>;
};
