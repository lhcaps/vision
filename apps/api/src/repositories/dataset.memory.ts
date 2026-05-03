import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DatasetRepository, VersionSnapshot } from './dataset.repository';
import {
  DatasetSummary,
  DatasetVersionSummary,
  AssignDatasetVersionAssetsRequest,
  assertDraftDatasetVersion,
  DatasetSplit,
} from '@visionflow/contracts';

type VersionRow = {
  id: string;
  datasetId: string;
  version: number;
  status: 'DRAFT' | 'LOCKED' | 'ARCHIVED';
  parentVersionId: string | null;
  createdAt: Date;
  assets: Array<{ assetId: string; split: DatasetSplit }>;
};

type DatasetRow = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  versions: VersionRow[];
};

type AnnotationSetRow = {
  id: string;
  projectId: string;
  datasetVersionId: string;
};

const memoryDatasets = new Map<string, DatasetRow>();
const memoryVersions = new Map<string, VersionRow>();
const memoryAnnotationSets = new Map<string, AnnotationSetRow>();

function toDatasetSummary(row: DatasetRow): DatasetSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    description: row.description,
    versionCount: row.versions.length,
    draftVersionCount: row.versions.filter((v) => v.status === 'DRAFT').length,
    lockedVersionCount: row.versions.filter((v) => v.status === 'LOCKED').length,
    assetCount: row.versions.reduce((acc, v) => acc + v.assets.length, 0),
    createdAt: row.createdAt.toISOString(),
  };
}

function toVersionSummary(row: VersionRow): DatasetVersionSummary {
  const splits = row.assets.reduce(
    (acc, a) => {
      if (a.split !== 'UNASSIGNED') acc[a.split]++;
      return acc;
    },
    { TRAIN: 0, VALID: 0, TEST: 0, UNASSIGNED: 0 }
  );
  return {
    id: row.id,
    datasetId: row.datasetId,
    version: row.version,
    label: `v${row.version}`,
    status: row.status,
    parentVersionId: row.parentVersionId,
    assetCount: row.assets.length,
    splitSummary: splits,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class MemoryDatasetRepository implements DatasetRepository {
  async createDataset(
    projectId: string,
    dto: { name: string; description?: string | null }
  ): Promise<DatasetSummary> {
    const dataset: DatasetRow = {
      id: `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId,
      name: dto.name,
      description: dto.description ?? null,
      createdAt: new Date(),
      versions: [],
    };
    memoryDatasets.set(dataset.id, dataset);
    return toDatasetSummary(dataset);
  }

  async listDatasets(projectId: string): Promise<DatasetSummary[]> {
    return [...memoryDatasets.values()]
      .filter((d) => d.projectId === projectId)
      .map(toDatasetSummary);
  }

  async createVersion(
    projectId: string,
    datasetId: string,
    dto: { parentVersionId?: string | null }
  ): Promise<DatasetVersionSummary> {
    const dataset = memoryDatasets.get(datasetId);
    if (!dataset || dataset.projectId !== projectId) {
      throw new NotFoundException('Dataset not found for this project.');
    }
    const latest = dataset.versions.reduce((max, v) => Math.max(max, v.version), 0);
    const version: VersionRow = {
      id: `version_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      datasetId,
      version: latest + 1,
      status: 'DRAFT',
      parentVersionId: dto.parentVersionId ?? null,
      createdAt: new Date(),
      assets: [],
    };
    memoryVersions.set(version.id, version);
    dataset.versions.push(version);
    return toVersionSummary(version);
  }

  async listVersions(projectId: string, datasetId: string): Promise<DatasetVersionSummary[]> {
    const dataset = memoryDatasets.get(datasetId);
    if (!dataset || dataset.projectId !== projectId) {
      throw new NotFoundException('Dataset not found for this project.');
    }
    return dataset.versions.map(toVersionSummary).sort((a, b) => b.version - a.version);
  }

  async listVersionAssetIds(projectId: string, versionId: string): Promise<string[]> {
    const version = memoryVersions.get(versionId);
    if (!version) throw new NotFoundException('Dataset version not found for this project.');
    return version.assets.map((a) => a.assetId);
  }

  async assignAssets(
    projectId: string,
    versionId: string,
    dto: AssignDatasetVersionAssetsRequest
  ): Promise<DatasetVersionSummary> {
    const version = memoryVersions.get(versionId);
    if (!version) throw new NotFoundException('Dataset version not found.');
    const dataset = memoryDatasets.get(version.datasetId);
    if (!dataset || dataset.projectId !== projectId) {
      throw new NotFoundException('Dataset version not found.');
    }
    assertDraftDatasetVersion(version.status);
    for (const asset of dto.assets) {
      if (!version.assets.some((a) => a.assetId === asset.assetId)) {
        version.assets.push(asset);
      } else {
        throw new ConflictException('Asset already assigned.');
      }
    }
    return toVersionSummary(version);
  }

  async lockVersion(projectId: string, versionId: string): Promise<DatasetVersionSummary> {
    // Memory mode: lock-readiness validation is not enforced.
    // This is a demo/fallback path — production path (PrismaDatasetRepository) enforces
    // all DatasetLockValidator invariants before locking.
    const version = memoryVersions.get(versionId);
    if (!version) throw new NotFoundException('Dataset version not found.');
    const dataset = memoryDatasets.get(version.datasetId);
    if (!dataset || dataset.projectId !== projectId) {
      throw new NotFoundException('Dataset version not found.');
    }
    if (version.status === 'LOCKED') return toVersionSummary(version);
    assertDraftDatasetVersion(version.status);
    version.status = 'LOCKED';
    return toVersionSummary(version);
  }

  async getVersionSnapshot(projectId: string, versionId: string): Promise<VersionSnapshot | null> {
    const version = memoryVersions.get(versionId);
    if (!version) return null;
    const dataset = memoryDatasets.get(version.datasetId);
    if (!dataset || dataset.projectId !== projectId) return null;
    // Memory mode: COCO export is not supported on the memory path.
    // annotationSets is empty so labelName is never accessed.
    return {
      id: version.id,
      datasetId: version.datasetId,
      version: version.version,
      status: version.status,
      assets: version.assets.map((a) => ({
        assetId: a.assetId,
        split: a.split,
        asset: {
          id: a.assetId,
          type: 'IMAGE' as const,
          storageKey: `projects/${projectId}/originals/${a.assetId}.jpg`,
          width: 1920,
          height: 1080,
        },
      })),
      annotationSets: [],
    };
  }

  async getVersionStatusByAnnotationSet(
    projectId: string,
    annotationSetId: string
  ): Promise<'DRAFT' | 'LOCKED' | 'ARCHIVED' | null> {
    const set = memoryAnnotationSets.get(annotationSetId);
    if (!set || set.projectId !== projectId) return null;
    const version = memoryVersions.get(set.datasetVersionId);
    if (!version) return null;
    return version.status;
  }
}
