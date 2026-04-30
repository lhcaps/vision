import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AssignDatasetVersionAssetsRequest,
  CreateDatasetRequest,
  CreateDatasetVersionRequest,
  DatasetSplit,
  DatasetSummary,
  DatasetVersionStatus,
  DatasetVersionSummary,
  assertDraftDatasetVersion,
  summarizeDatasetSplits,
} from '@visionflow/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { demoSnapshot } from '../projects/demo-snapshot';

type VersionAssetRow = {
  assetId?: string;
  split: DatasetSplit;
};

type DatasetRow = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  versions: Array<{
    status: DatasetVersionStatus;
    assets: VersionAssetRow[];
  }>;
};

type DatasetVersionRow = {
  id: string;
  datasetId: string;
  version: number;
  status: DatasetVersionStatus;
  parentVersionId: string | null;
  createdAt: Date;
  assets: VersionAssetRow[];
};

type MemoryDataset = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: string;
};

type MemoryVersion = {
  id: string;
  datasetId: string;
  version: number;
  status: DatasetVersionStatus;
  parentVersionId: string | null;
  createdAt: string;
};

type MemoryVersionAsset = {
  datasetVersionId: string;
  assetId: string;
  split: DatasetSplit;
  createdAt: string;
};

@Injectable()
export class DatasetsService {
  private readonly memoryDatasets = new Map<string, MemoryDataset>();
  private readonly memoryVersions = new Map<string, MemoryVersion>();
  private readonly memoryVersionAssets: MemoryVersionAsset[] = [];

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createDataset(projectId: string, dto: CreateDatasetRequest): Promise<DatasetSummary> {
    if (process.env.DATABASE_URL) {
      await this.ensureProject(projectId);

      const dataset = await this.prisma.dataset.create({
        data: {
          projectId,
          name: dto.name,
          description: dto.description ?? null,
        },
        include: datasetInclude,
      });

      await this.writeAudit(projectId, 'DATASET_CREATED', 'Dataset', dataset.id, {
        name: dataset.name,
      });

      return toDatasetSummary(dataset);
    }

    const now = new Date().toISOString();
    const dataset: MemoryDataset = {
      id: `dataset_${sanitizeId(projectId)}_${this.memoryDatasets.size + 1}`,
      projectId,
      name: dto.name,
      description: dto.description ?? null,
      createdAt: now,
    };

    this.memoryDatasets.set(dataset.id, dataset);

    return this.toMemoryDatasetSummary(dataset);
  }

  async listDatasets(projectId: string): Promise<DatasetSummary[]> {
    if (process.env.DATABASE_URL) {
      const datasets = await this.prisma.dataset.findMany({
        where: { projectId },
        include: datasetInclude,
        orderBy: { createdAt: 'desc' },
      });

      return datasets.map((dataset) => toDatasetSummary(dataset));
    }

    this.ensureMemorySeed(projectId);

    return [...this.memoryDatasets.values()]
      .filter((dataset) => dataset.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((dataset) => this.toMemoryDatasetSummary(dataset));
  }

  async createVersion(
    projectId: string,
    datasetId: string,
    dto: CreateDatasetVersionRequest
  ): Promise<DatasetVersionSummary> {
    if (process.env.DATABASE_URL) {
      await this.assertDatasetForProject(projectId, datasetId);

      if (dto.parentVersionId) {
        await this.assertVersionForDataset(projectId, datasetId, dto.parentVersionId);
      }

      const latest = await this.prisma.datasetVersion.aggregate({
        where: { datasetId },
        _max: { version: true },
      });
      const nextVersion = (latest._max.version ?? 0) + 1;
      const version = await this.prisma.datasetVersion.create({
        data: {
          datasetId,
          version: nextVersion,
          parentVersionId: dto.parentVersionId ?? null,
        },
        include: versionInclude,
      });

      await this.writeAudit(projectId, 'DATASET_VERSION_CREATED', 'DatasetVersion', version.id, {
        datasetId,
        version: nextVersion,
        parentVersionId: dto.parentVersionId ?? null,
      });

      return toVersionSummary(version);
    }

    this.ensureMemorySeed(projectId);
    this.assertMemoryDataset(projectId, datasetId);

    if (dto.parentVersionId) {
      this.assertMemoryVersion(projectId, dto.parentVersionId);
    }

    const versions = this.memoryVersionsForDataset(datasetId);
    const version: MemoryVersion = {
      id: `dataset_version_${sanitizeId(datasetId)}_${versions.length + 1}`,
      datasetId,
      version: versions.length + 1,
      status: 'DRAFT',
      parentVersionId: dto.parentVersionId ?? null,
      createdAt: new Date().toISOString(),
    };

    this.memoryVersions.set(version.id, version);

    return this.toMemoryVersionSummary(version);
  }

  async listVersions(projectId: string, datasetId: string): Promise<DatasetVersionSummary[]> {
    if (process.env.DATABASE_URL) {
      await this.assertDatasetForProject(projectId, datasetId);

      const versions = await this.prisma.datasetVersion.findMany({
        where: { datasetId },
        include: versionInclude,
        orderBy: { version: 'desc' },
      });

      return versions.map((version) => toVersionSummary(version));
    }

    this.ensureMemorySeed(projectId);
    this.assertMemoryDataset(projectId, datasetId);

    return this.memoryVersionsForDataset(datasetId)
      .sort((a, b) => b.version - a.version)
      .map((version) => this.toMemoryVersionSummary(version));
  }

  async listVersionAssetIds(projectId: string, versionId: string): Promise<string[]> {
    if (process.env.DATABASE_URL) {
      const version = await this.prisma.datasetVersion.findFirst({
        where: {
          id: versionId,
          dataset: { projectId },
        },
        include: {
          assets: {
            select: { assetId: true },
          },
        },
      });

      if (!version) {
        throw new NotFoundException('Dataset version not found for this project.');
      }

      return version.assets.map((asset) => asset.assetId);
    }

    this.ensureMemorySeed(projectId);
    this.assertMemoryVersion(projectId, versionId);

    return this.memoryAssetsForVersion(versionId).map((asset) => asset.assetId);
  }

  async assignAssets(
    projectId: string,
    versionId: string,
    dto: AssignDatasetVersionAssetsRequest
  ): Promise<DatasetVersionSummary> {
    this.assertNoDuplicateRequestAssets(dto);

    if (process.env.DATABASE_URL) {
      return this.prisma.$transaction(async (tx) => {
        const version = await tx.datasetVersion.findFirst({
          where: {
            id: versionId,
            dataset: { projectId },
          },
          include: versionInclude,
        });

        if (!version) {
          throw new NotFoundException('Dataset version not found for this project.');
        }

        this.assertDraft(version.status);

        const assetIds = dto.assets.map((asset) => asset.assetId);
        const assets = await tx.mediaAsset.findMany({
          where: {
            id: { in: assetIds },
            projectId,
          },
          select: { id: true },
        });

        if (assets.length !== assetIds.length) {
          throw new BadRequestException('One or more assets do not belong to this project.');
        }

        const existing = await tx.datasetVersionAsset.findMany({
          where: {
            datasetVersionId: versionId,
            assetId: { in: assetIds },
          },
          select: { assetId: true },
        });

        if (existing.length > 0) {
          throw new ConflictException('Assets cannot be assigned twice to the same version.');
        }

        await tx.datasetVersionAsset.createMany({
          data: dto.assets.map((asset) => ({
            datasetVersionId: versionId,
            assetId: asset.assetId,
            split: asset.split,
          })),
        });

        await tx.auditLog.create({
          data: {
            projectId,
            action: 'DATASET_VERSION_ASSETS_ASSIGNED',
            targetType: 'DatasetVersion',
            targetId: versionId,
            metadataJson: {
              assetCount: dto.assets.length,
              splits: dto.assets.map((asset) => asset.split),
            },
          },
        });

        const refreshed = await tx.datasetVersion.findUniqueOrThrow({
          where: { id: versionId },
          include: versionInclude,
        });

        return toVersionSummary(refreshed);
      });
    }

    this.ensureMemorySeed(projectId);
    const version = this.assertMemoryVersion(projectId, versionId);
    this.assertDraft(version.status);

    const existingAssetIds = new Set(
      this.memoryVersionAssets
        .filter((asset) => asset.datasetVersionId === versionId)
        .map((asset) => asset.assetId)
    );

    if (dto.assets.some((asset) => existingAssetIds.has(asset.assetId))) {
      throw new ConflictException('Assets cannot be assigned twice to the same version.');
    }

    const now = new Date().toISOString();
    this.memoryVersionAssets.push(
      ...dto.assets.map((asset) => ({
        datasetVersionId: versionId,
        assetId: asset.assetId,
        split: asset.split,
        createdAt: now,
      }))
    );

    return this.toMemoryVersionSummary(version);
  }

  async lockVersion(projectId: string, versionId: string): Promise<DatasetVersionSummary> {
    if (process.env.DATABASE_URL) {
      return this.prisma.$transaction(async (tx) => {
        const version = await tx.datasetVersion.findFirst({
          where: {
            id: versionId,
            dataset: { projectId },
          },
          include: versionInclude,
        });

        if (!version) {
          throw new NotFoundException('Dataset version not found for this project.');
        }

        if (version.status === 'LOCKED') {
          return toVersionSummary(version);
        }

        this.assertDraft(version.status);

        const locked = await tx.datasetVersion.update({
          where: { id: versionId },
          data: { status: 'LOCKED' },
          include: versionInclude,
        });

        await tx.auditLog.create({
          data: {
            projectId,
            action: 'DATASET_VERSION_LOCKED',
            targetType: 'DatasetVersion',
            targetId: versionId,
            metadataJson: {
              assetCount: locked.assets.length,
              splitSummary: summarizeDatasetSplits(locked.assets),
            },
          },
        });

        return toVersionSummary(locked);
      });
    }

    this.ensureMemorySeed(projectId);
    const version = this.assertMemoryVersion(projectId, versionId);

    if (version.status === 'LOCKED') {
      return this.toMemoryVersionSummary(version);
    }

    this.assertDraft(version.status);
    version.status = 'LOCKED';

    return this.toMemoryVersionSummary(version);
  }

  private async ensureProject(projectId: string): Promise<void> {
    await this.prisma.project.upsert({
      where: { id: projectId },
      create: {
        id: projectId,
        slug: projectId,
        name: projectId === demoSnapshot.project.id ? demoSnapshot.project.name : projectId,
      },
      update: {},
    });
  }

  private async writeAudit(
    projectId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadataJson: Prisma.InputJsonObject
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        projectId,
        action,
        targetType,
        targetId,
        metadataJson,
      },
    });
  }

  private async assertDatasetForProject(projectId: string, datasetId: string): Promise<void> {
    const dataset = await this.prisma.dataset.findFirst({
      where: {
        id: datasetId,
        projectId,
      },
      select: { id: true },
    });

    if (!dataset) {
      throw new NotFoundException('Dataset not found for this project.');
    }
  }

  private async assertVersionForDataset(
    projectId: string,
    datasetId: string,
    versionId: string
  ): Promise<void> {
    const version = await this.prisma.datasetVersion.findFirst({
      where: {
        id: versionId,
        datasetId,
        dataset: { projectId },
      },
      select: { id: true },
    });

    if (!version) {
      throw new NotFoundException('Parent dataset version not found for this project.');
    }
  }

  private assertDraft(status: DatasetVersionStatus): void {
    try {
      assertDraftDatasetVersion(status);
    } catch {
      throw new ConflictException('Version is locked and cannot be modified.');
    }
  }

  private assertNoDuplicateRequestAssets(dto: AssignDatasetVersionAssetsRequest): void {
    const assetIds = dto.assets.map((asset) => asset.assetId);
    const uniqueIds = new Set(assetIds);

    if (uniqueIds.size !== assetIds.length) {
      throw new ConflictException('Request contains duplicate asset assignments.');
    }
  }

  private ensureMemorySeed(projectId: string): void {
    const hasProjectDataset = [...this.memoryDatasets.values()].some(
      (dataset) => dataset.projectId === projectId
    );

    if (hasProjectDataset) {
      return;
    }

    const now = new Date('2026-04-28T12:00:00.000Z').toISOString();
    const datasetId = `dataset_${sanitizeId(projectId)}_parking`;
    const dataset: MemoryDataset = {
      id: datasetId,
      projectId,
      name: projectId === demoSnapshot.project.id ? 'Parking Lot Dataset' : 'Demo Dataset',
      description: 'Curated media grouped into immutable detector evaluation snapshots.',
      createdAt: now,
    };
    const versions: MemoryVersion[] = [
      {
        id: `${datasetId}_v1`,
        datasetId,
        version: 1,
        status: 'LOCKED',
        parentVersionId: null,
        createdAt: '2026-04-28T12:05:00.000Z',
      },
      {
        id: `${datasetId}_v2`,
        datasetId,
        version: 2,
        status: 'LOCKED',
        parentVersionId: `${datasetId}_v1`,
        createdAt: '2026-04-28T12:16:00.000Z',
      },
      {
        id: `${datasetId}_v3`,
        datasetId,
        version: 3,
        status: 'LOCKED',
        parentVersionId: `${datasetId}_v2`,
        createdAt: '2026-04-28T12:28:00.000Z',
      },
      {
        id: `${datasetId}_v4`,
        datasetId,
        version: 4,
        status: 'DRAFT',
        parentVersionId: `${datasetId}_v3`,
        createdAt: '2026-04-28T12:42:00.000Z',
      },
    ];

    this.memoryDatasets.set(dataset.id, dataset);
    versions.forEach((version) => this.memoryVersions.set(version.id, version));

    const media = demoSnapshot.media;
    this.memoryVersionAssets.push(
      ...media.slice(0, 1).map((asset) => ({
        datasetVersionId: versions[0].id,
        assetId: asset.id,
        split: asset.split,
        createdAt: versions[0].createdAt,
      })),
      ...media.slice(0, 2).map((asset) => ({
        datasetVersionId: versions[1].id,
        assetId: asset.id,
        split: asset.split,
        createdAt: versions[1].createdAt,
      })),
      ...media.map((asset) => ({
        datasetVersionId: versions[2].id,
        assetId: asset.id,
        split: asset.split,
        createdAt: versions[2].createdAt,
      }))
    );
  }

  private assertMemoryDataset(projectId: string, datasetId: string): MemoryDataset {
    const dataset = this.memoryDatasets.get(datasetId);

    if (!dataset || dataset.projectId !== projectId) {
      throw new NotFoundException('Dataset not found for this project.');
    }

    return dataset;
  }

  private assertMemoryVersion(projectId: string, versionId: string): MemoryVersion {
    const version = this.memoryVersions.get(versionId);
    const dataset = version ? this.memoryDatasets.get(version.datasetId) : null;

    if (!version || !dataset || dataset.projectId !== projectId) {
      throw new NotFoundException('Dataset version not found for this project.');
    }

    return version;
  }

  private memoryVersionsForDataset(datasetId: string): MemoryVersion[] {
    return [...this.memoryVersions.values()].filter((version) => version.datasetId === datasetId);
  }

  private memoryAssetsForVersion(versionId: string): MemoryVersionAsset[] {
    return this.memoryVersionAssets.filter((asset) => asset.datasetVersionId === versionId);
  }

  private toMemoryDatasetSummary(dataset: MemoryDataset): DatasetSummary {
    const versions = this.memoryVersionsForDataset(dataset.id);
    const assetIds = new Set(
      this.memoryVersionAssets
        .filter((asset) => versions.some((version) => version.id === asset.datasetVersionId))
        .map((asset) => asset.assetId)
    );

    return {
      id: dataset.id,
      projectId: dataset.projectId,
      name: dataset.name,
      description: dataset.description,
      versionCount: versions.length,
      draftVersionCount: versions.filter((version) => version.status === 'DRAFT').length,
      lockedVersionCount: versions.filter((version) => version.status === 'LOCKED').length,
      assetCount: assetIds.size,
      createdAt: dataset.createdAt,
    };
  }

  private toMemoryVersionSummary(version: MemoryVersion): DatasetVersionSummary {
    const assets = this.memoryAssetsForVersion(version.id);

    return {
      id: version.id,
      datasetId: version.datasetId,
      version: version.version,
      label: `v${version.version}`,
      status: version.status,
      parentVersionId: version.parentVersionId,
      assetCount: assets.length,
      splitSummary: summarizeDatasetSplits(assets),
      createdAt: version.createdAt,
    };
  }
}

const datasetInclude = {
  versions: {
    include: {
      assets: {
        select: {
          assetId: true,
          split: true,
        },
      },
    },
  },
} as const;

const versionInclude = {
  assets: {
    select: {
      split: true,
    },
  },
} as const;

function toDatasetSummary(row: DatasetRow): DatasetSummary {
  const assetIds = new Set<string>();

  for (const version of row.versions) {
    version.assets.forEach((asset) => {
      if (asset.assetId) {
        assetIds.add(asset.assetId);
      }
    });
  }

  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    description: row.description,
    versionCount: row.versions.length,
    draftVersionCount: row.versions.filter((version) => version.status === 'DRAFT').length,
    lockedVersionCount: row.versions.filter((version) => version.status === 'LOCKED').length,
    assetCount: assetIds.size,
    createdAt: row.createdAt.toISOString(),
  };
}

function toVersionSummary(row: DatasetVersionRow): DatasetVersionSummary {
  return {
    id: row.id,
    datasetId: row.datasetId,
    version: row.version,
    label: `v${row.version}`,
    status: row.status,
    parentVersionId: row.parentVersionId,
    assetCount: row.assets.length,
    splitSummary: summarizeDatasetSplits(row.assets),
    createdAt: row.createdAt.toISOString(),
  };
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'project';
}
