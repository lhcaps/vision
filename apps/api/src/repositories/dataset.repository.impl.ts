import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetRepository, VersionSnapshot } from './dataset.repository';
import {
  DatasetSummary,
  DatasetVersionSummary,
  AssignDatasetVersionAssetsRequest,
  assertDraftDatasetVersion,
  DatasetSplit,
} from '@visionflow/contracts';
import { demoSnapshot } from '../projects/demo-snapshot';
import { Prisma } from '@prisma/client';
import { DatasetLockValidator } from '../datasets/dataset-lock.validator';

type VersionRow = {
  id: string;
  datasetId: string;
  version: number;
  status: 'DRAFT' | 'LOCKED' | 'ARCHIVED';
  parentVersionId: string | null;
  createdAt: Date;
  assets: Array<{ split: DatasetSplit }>;
};

type DatasetRow = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  versions: Array<{
    status: 'DRAFT' | 'LOCKED' | 'ARCHIVED';
    assets: Array<{ assetId?: string; split: DatasetSplit }>;
  }>;
};

const datasetInclude = {
  versions: {
    include: {
      assets: { select: { assetId: true, split: true } },
    },
  },
} as const;

const versionInclude = {
  assets: { select: { split: true } },
} as const;

function toDatasetSummary(row: DatasetRow): DatasetSummary {
  const assetIds = new Set<string>();
  for (const version of row.versions) {
    for (const asset of version.assets) {
      if (asset.assetId) assetIds.add(asset.assetId);
    }
  }
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    description: row.description,
    versionCount: row.versions.length,
    draftVersionCount: row.versions.filter((v) => v.status === 'DRAFT').length,
    lockedVersionCount: row.versions.filter((v) => v.status === 'LOCKED').length,
    assetCount: assetIds.size,
    createdAt: row.createdAt.toISOString(),
  };
}

function toVersionSummary(row: VersionRow, datasetId: string): DatasetVersionSummary {
  const splits = row.assets.reduce(
    (acc, a) => {
      if (a.split !== 'UNASSIGNED') acc[a.split]++;
      return acc;
    },
    { TRAIN: 0, VALID: 0, TEST: 0, UNASSIGNED: 0 }
  );
  return {
    id: row.id,
    datasetId: datasetId,
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
export class PrismaDatasetRepository implements DatasetRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lockValidator: DatasetLockValidator
  ) {}

  async createDataset(
    projectId: string,
    dto: { name: string; description?: string | null }
  ): Promise<DatasetSummary> {
    await this.ensureProject(projectId);
    const dataset = await this.prisma.dataset.create({
      data: { projectId, name: dto.name, description: dto.description ?? null },
      include: datasetInclude,
    });
    await this.writeAudit(projectId, 'DATASET_CREATED', 'Dataset', dataset.id, {
      name: dataset.name,
    });
    return toDatasetSummary(dataset);
  }

  async listDatasets(projectId: string): Promise<DatasetSummary[]> {
    const datasets = await this.prisma.dataset.findMany({
      where: { projectId },
      include: datasetInclude,
      orderBy: { createdAt: 'desc' },
    });
    return datasets.map(toDatasetSummary);
  }

  async createVersion(
    projectId: string,
    datasetId: string,
    dto: { parentVersionId?: string | null }
  ): Promise<DatasetVersionSummary> {
    await this.assertDatasetForProject(projectId, datasetId);
    if (dto.parentVersionId) {
      await this.assertVersionForDataset(projectId, datasetId, dto.parentVersionId);
    }
    return this.#createVersionWithRetry(projectId, datasetId, dto.parentVersionId ?? null);
  }

  #createVersionWithRetry(
    projectId: string,
    datasetId: string,
    parentVersionId: string | null,
    attempt = 1
  ): Promise<DatasetVersionSummary> {
    const MAX_ATTEMPTS = 3;

    return this.prisma
      .$transaction(async (tx) => {
        const latest = await tx.datasetVersion.aggregate({
          where: { datasetId },
          _max: { version: true },
        });
        const nextVersion = (latest._max.version ?? 0) + 1;

        const version = await tx.datasetVersion.create({
          data: {
            datasetId,
            version: nextVersion,
            parentVersionId,
          },
          include: versionInclude,
        });

        await tx.auditLog.create({
          data: {
            projectId,
            action: 'DATASET_VERSION_CREATED',
            targetType: 'DatasetVersion',
            targetId: version.id,
            metadataJson: {
              datasetId,
              version: version.version,
              parentVersionId: version.parentVersionId,
            },
          },
        });

        return toVersionSummary(version, datasetId);
      })
      .catch(async (err: unknown) => {
        const isUniqueViolation =
          err instanceof Error &&
          (err.message.includes('Unique constraint') ||
            err.message.includes('unique constraint') ||
            (err as { code?: string }).code === 'P2002');

        if (isUniqueViolation && attempt < MAX_ATTEMPTS) {
          return this.#createVersionWithRetry(projectId, datasetId, parentVersionId, attempt + 1);
        }
        throw err;
      });
  }

  async listVersions(projectId: string, datasetId: string): Promise<DatasetVersionSummary[]> {
    await this.assertDatasetForProject(projectId, datasetId);
    const versions = await this.prisma.datasetVersion.findMany({
      where: { datasetId },
      include: versionInclude,
      orderBy: { version: 'desc' },
    });
    return versions.map((v) => toVersionSummary(v, datasetId));
  }

  async listVersionAssetIds(projectId: string, versionId: string): Promise<string[]> {
    const version = await this.prisma.datasetVersion.findFirst({
      where: { id: versionId, dataset: { projectId } },
      include: { assets: { select: { assetId: true } } },
    });
    if (!version) throw new NotFoundException('Dataset version not found for this project.');
    return version.assets.map((a) => a.assetId);
  }

  async assignAssets(
    projectId: string,
    versionId: string,
    dto: AssignDatasetVersionAssetsRequest
  ): Promise<DatasetVersionSummary> {
    return this.prisma.$transaction(async (tx) => {
      const version = await tx.datasetVersion.findFirst({
        where: { id: versionId, dataset: { projectId } },
        include: versionInclude,
      });
      if (!version) throw new NotFoundException('Dataset version not found.');
      assertDraftDatasetVersion(version.status);
      const assetIds = dto.assets.map((a) => a.assetId);
      const assets = await tx.mediaAsset.findMany({
        where: { id: { in: assetIds }, projectId },
        select: { id: true },
      });
      if (assets.length !== assetIds.length)
        throw new ConflictException('Assets do not belong to this project.');
      const existing = await tx.datasetVersionAsset.findMany({
        where: { datasetVersionId: versionId, assetId: { in: assetIds } },
        select: { assetId: true },
      });
      if (existing.length > 0) throw new ConflictException('Assets already assigned.');
      await tx.datasetVersionAsset.createMany({
        data: dto.assets.map((a) => ({
          datasetVersionId: versionId,
          assetId: a.assetId,
          split: a.split,
        })),
      });
      await tx.auditLog.create({
        data: {
          projectId,
          action: 'DATASET_VERSION_ASSETS_ASSIGNED',
          targetType: 'DatasetVersion',
          targetId: versionId,
          metadataJson: { assetCount: dto.assets.length, splits: dto.assets.map((a) => a.split) },
        },
      });
      const refreshed = await tx.datasetVersion.findUniqueOrThrow({
        where: { id: versionId },
        include: versionInclude,
      });
      return toVersionSummary(refreshed, refreshed.datasetId);
    });
  }

  async lockVersion(projectId: string, versionId: string): Promise<DatasetVersionSummary> {
    return this.prisma.$transaction(async (tx) => {
      const version = await tx.datasetVersion.findFirst({
        where: { id: versionId, dataset: { projectId } },
        include: {
          assets: {
            include: {
              asset: {
                select: { id: true, type: true, storageKey: true, width: true, height: true },
              },
            },
          },
          annotationSets: {
            include: {
              annotations: {
                select: {
                  id: true,
                  assetId: true,
                  labelClassId: true,
                  type: true,
                  geometryJson: true,
                  labelClass: { select: { name: true } },
                },
              },
            },
          },
        },
      });
      if (!version) throw new NotFoundException('Dataset version not found.');
      if (version.status === 'LOCKED') {
        const summary = await tx.datasetVersion.findUniqueOrThrow({
          where: { id: versionId },
          include: versionInclude,
        });
        return toVersionSummary(summary, summary.datasetId);
      }
      assertDraftDatasetVersion(version.status);

      const snapshot = {
        id: version.id,
        datasetId: version.datasetId,
        version: version.version,
        status: version.status,
        assets: version.assets.map((link) => ({
          assetId: link.assetId,
          split: link.split,
          asset: {
            id: link.asset.id,
            type: link.asset.type,
            storageKey: link.asset.storageKey,
            width: link.asset.width,
            height: link.asset.height,
          },
        })),
        annotationSets: version.annotationSets.map((set) => ({
          id: set.id,
          annotations: set.annotations.map((ann) => ({
            id: ann.id,
            assetId: ann.assetId,
            labelClassId: ann.labelClassId,
            labelName: ann.labelClass.name,
            type: ann.type as 'BBOX' | 'MASK' | 'KEYPOINT',
            geometryJson: ann.geometryJson,
          })),
        })),
      };

      this.lockValidator.validate(snapshot);

      const locked = await tx.datasetVersion.update({
        where: { id: versionId },
        data: { status: 'LOCKED' },
        include: versionInclude,
      });
      const splits = locked.assets.reduce(
        (acc, a) => {
          if (a.split !== 'UNASSIGNED') acc[a.split]++;
          return acc;
        },
        { TRAIN: 0, VALID: 0, TEST: 0 }
      );
      await tx.auditLog.create({
        data: {
          projectId,
          action: 'DATASET_VERSION_LOCKED',
          targetType: 'DatasetVersion',
          targetId: versionId,
          metadataJson: { assetCount: locked.assets.length, splitSummary: splits },
        },
      });
      return toVersionSummary(locked, locked.datasetId);
    });
  }

  async getVersionSnapshot(projectId: string, versionId: string): Promise<VersionSnapshot | null> {
    const version = await this.prisma.datasetVersion.findFirst({
      where: { id: versionId, dataset: { projectId } },
      include: {
        assets: {
          include: {
            asset: {
              select: { id: true, type: true, storageKey: true, width: true, height: true },
            },
          },
        },
        annotationSets: {
          include: {
            annotations: {
              select: {
                id: true,
                assetId: true,
                labelClassId: true,
                type: true,
                geometryJson: true,
                labelClass: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!version) return null;

    return {
      id: version.id,
      datasetId: version.datasetId,
      version: version.version,
      status: version.status,
      assets: version.assets.map((link) => ({
        assetId: link.assetId,
        split: link.split,
        asset: {
          id: link.asset.id,
          type: link.asset.type,
          storageKey: link.asset.storageKey,
          width: link.asset.width,
          height: link.asset.height,
        },
      })),
      annotationSets: version.annotationSets.map((set) => ({
        id: set.id,
        annotations: set.annotations.map((ann) => ({
          id: ann.id,
          assetId: ann.assetId,
          labelClassId: ann.labelClassId,
          labelName: ann.labelClass.name,
          type: ann.type as 'BBOX' | 'MASK' | 'KEYPOINT',
          geometryJson: ann.geometryJson,
        })),
      })),
    };
  }

  async getVersionStatusByAnnotationSet(
    projectId: string,
    annotationSetId: string
  ): Promise<'DRAFT' | 'LOCKED' | 'ARCHIVED' | null> {
    const version = await this.prisma.datasetVersion.findFirst({
      where: {
        annotationSets: { some: { id: annotationSetId } },
        dataset: { projectId },
      },
      select: { status: true },
    });
    return version?.status ?? null;
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

  private async assertDatasetForProject(projectId: string, datasetId: string): Promise<void> {
    const dataset = await this.prisma.dataset.findFirst({
      where: { id: datasetId, projectId },
      select: { id: true },
    });
    if (!dataset) throw new NotFoundException('Dataset not found for this project.');
  }

  private async assertVersionForDataset(
    projectId: string,
    datasetId: string,
    versionId: string
  ): Promise<void> {
    const version = await this.prisma.datasetVersion.findFirst({
      where: { id: versionId, datasetId, dataset: { projectId } },
      select: { id: true },
    });
    if (!version) throw new NotFoundException('Parent version not found.');
  }

  private async writeAudit(
    projectId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadataJson: Prisma.InputJsonObject
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: { projectId, action, targetType, targetId, metadataJson },
    });
  }
}
