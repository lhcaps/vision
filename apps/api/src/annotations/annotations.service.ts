import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AnnotationAssetSummary,
  AnnotationLabelSummary,
  AnnotationSetSummary,
  AnnotationSummary,
  AnnotationWorkspaceResponse,
  BBoxGeometry,
  BBoxGeometrySchema,
  CreateAnnotationRequest,
  UpdateAnnotationRequest,
  bboxArea,
  clampBBox,
} from '@visionflow/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { demoSnapshot } from '../projects/demo-snapshot';

type MemoryAnnotationSet = AnnotationSetSummary & { projectId: string };

const DEFAULT_ANNOTATION_SET_NAME = 'Manual QA Set';
const DEFAULT_IMAGE_WIDTH = 1920;
const DEFAULT_IMAGE_HEIGHT = 1080;
const defaultLabels = [
  { name: 'car', color: '#6ad9a1' },
  { name: 'van', color: '#5cc8ff' },
  { name: 'truck', color: '#f5b85d' },
  { name: 'person', color: '#f07178' },
] as const;

@Injectable()
export class AnnotationsService {
  private readonly memoryLabels = new Map<string, AnnotationLabelSummary>();
  private readonly memorySets = new Map<string, MemoryAnnotationSet>();
  private readonly memoryAnnotations = new Map<string, AnnotationSummary>();

  constructor(private readonly prisma: PrismaService) {}

  async loadWorkspace(
    projectId: string,
    datasetVersionId: string,
    assetId?: string
  ): Promise<AnnotationWorkspaceResponse> {
    if (process.env.DATABASE_URL) {
      return this.loadPrismaWorkspace(projectId, datasetVersionId, assetId);
    }

    this.ensureMemorySeed(projectId, datasetVersionId);

    const labels = this.memoryLabelsForProject(projectId);
    const annotationSet = this.toPublicSet(this.getMemorySet(projectId, datasetVersionId));
    const assets = this.memoryAssets(projectId);
    const asset = assets.find((item) => item.id === assetId) ?? assets[0] ?? null;
    const annotations = [...this.memoryAnnotations.values()].filter(
      (annotation) =>
        annotation.annotationSetId === annotationSet.id && annotation.assetId === asset?.id
    );

    return {
      annotationSet,
      asset,
      labels,
      annotations,
      imageWidth: asset?.width ?? DEFAULT_IMAGE_WIDTH,
      imageHeight: asset?.height ?? DEFAULT_IMAGE_HEIGHT,
    };
  }

  async createAnnotation(
    projectId: string,
    annotationSetId: string,
    dto: CreateAnnotationRequest
  ): Promise<AnnotationSummary> {
    if (process.env.DATABASE_URL) {
      return this.createPrismaAnnotation(projectId, annotationSetId, dto);
    }

    const set = this.assertMemorySet(projectId, annotationSetId);
    const asset = this.assertMemoryAsset(projectId, dto.assetId);
    const label = this.assertMemoryLabel(projectId, dto.labelClassId);
    const now = new Date().toISOString();
    const annotation: AnnotationSummary = {
      id: `ann_${Date.now()}_${this.memoryAnnotations.size + 1}`,
      annotationSetId: set.id,
      assetId: asset.id,
      labelClassId: label.id,
      label: label.name,
      color: label.color,
      type: 'BBOX',
      geometry: normalizeGeometry(dto.geometry, asset.width, asset.height),
      source: 'MANUAL',
      confidence: null,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryAnnotations.set(annotation.id, annotation);

    return annotation;
  }

  async updateAnnotation(
    projectId: string,
    annotationId: string,
    dto: UpdateAnnotationRequest
  ): Promise<AnnotationSummary> {
    if (process.env.DATABASE_URL) {
      return this.updatePrismaAnnotation(projectId, annotationId, dto);
    }

    const existing = this.assertMemoryAnnotation(projectId, annotationId);
    const asset = this.assertMemoryAsset(projectId, existing.assetId);
    const label = dto.labelClassId
      ? this.assertMemoryLabel(projectId, dto.labelClassId)
      : this.assertMemoryLabel(projectId, existing.labelClassId);
    const updated: AnnotationSummary = {
      ...existing,
      labelClassId: label.id,
      label: label.name,
      color: label.color,
      geometry: dto.geometry
        ? normalizeGeometry(dto.geometry, asset.width, asset.height)
        : existing.geometry,
      updatedAt: new Date().toISOString(),
    };

    this.memoryAnnotations.set(updated.id, updated);

    return updated;
  }

  async deleteAnnotation(projectId: string, annotationId: string): Promise<{ deletedId: string }> {
    if (process.env.DATABASE_URL) {
      await this.deletePrismaAnnotation(projectId, annotationId);
      return { deletedId: annotationId };
    }

    this.assertMemoryAnnotation(projectId, annotationId);
    this.memoryAnnotations.delete(annotationId);

    return { deletedId: annotationId };
  }

  private async loadPrismaWorkspace(
    projectId: string,
    datasetVersionId: string,
    assetId?: string
  ): Promise<AnnotationWorkspaceResponse> {
    const version = await this.prisma.datasetVersion.findFirst({
      where: {
        id: datasetVersionId,
        dataset: { projectId },
      },
      include: {
        assets: {
          include: { asset: true },
          orderBy: { createdAt: 'asc' },
        },
        annotationSets: {
          where: { name: DEFAULT_ANNOTATION_SET_NAME },
          take: 1,
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Dataset version not found for this project.');
    }

    const labels = await this.ensureDefaultLabels(projectId);
    const annotationSet =
      version.annotationSets[0] ??
      (await this.prisma.annotationSet.create({
        data: {
          datasetVersionId,
          name: DEFAULT_ANNOTATION_SET_NAME,
        },
      }));
    const selectedAsset =
      (assetId
        ? await this.prisma.mediaAsset.findFirst({
            where: { id: assetId, projectId },
          })
        : null) ??
      version.assets[0]?.asset ??
      null;
    const asset = selectedAsset ? toAssetSummary(selectedAsset) : null;
    const annotations = selectedAsset
      ? await this.prisma.annotation.findMany({
          where: {
            annotationSetId: annotationSet.id,
            assetId: selectedAsset.id,
            type: 'BBOX',
          },
          include: annotationInclude,
          orderBy: { updatedAt: 'desc' },
        })
      : [];

    return {
      annotationSet: toAnnotationSetSummary(annotationSet),
      asset,
      labels,
      annotations: annotations.map((annotation) => toAnnotationSummary(annotation)),
      imageWidth: asset?.width ?? DEFAULT_IMAGE_WIDTH,
      imageHeight: asset?.height ?? DEFAULT_IMAGE_HEIGHT,
    };
  }

  private async createPrismaAnnotation(
    projectId: string,
    annotationSetId: string,
    dto: CreateAnnotationRequest
  ): Promise<AnnotationSummary> {
    const annotationSet = await this.assertPrismaAnnotationSet(projectId, annotationSetId);
    const asset = await this.assertPrismaAsset(projectId, dto.assetId);
    const label = await this.assertPrismaLabel(projectId, dto.labelClassId);
    const { width, height } = dimensionsFor(asset);
    const annotation = await this.prisma.annotation.create({
      data: {
        annotationSetId: annotationSet.id,
        assetId: asset.id,
        labelClassId: label.id,
        type: 'BBOX',
        geometryJson: normalizeGeometry(dto.geometry, width, height),
        source: 'MANUAL',
      },
      include: annotationInclude,
    });

    await this.writeAudit(projectId, 'ANNOTATION_CREATED', 'Annotation', annotation.id, {
      annotationSetId,
      assetId: asset.id,
      labelClassId: label.id,
    });

    return toAnnotationSummary(annotation);
  }

  private async updatePrismaAnnotation(
    projectId: string,
    annotationId: string,
    dto: UpdateAnnotationRequest
  ): Promise<AnnotationSummary> {
    const existing = await this.prisma.annotation.findFirst({
      where: {
        id: annotationId,
        annotationSet: {
          datasetVersion: {
            dataset: { projectId },
          },
        },
      },
      include: {
        asset: true,
        labelClass: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Annotation not found for this project.');
    }

    const label = dto.labelClassId
      ? await this.assertPrismaLabel(projectId, dto.labelClassId)
      : existing.labelClass;
    const { width, height } = dimensionsFor(existing.asset);
    const annotation = await this.prisma.annotation.update({
      where: { id: annotationId },
      data: {
        labelClassId: label.id,
        ...(dto.geometry ? { geometryJson: normalizeGeometry(dto.geometry, width, height) } : {}),
      },
      include: annotationInclude,
    });

    await this.writeAudit(projectId, 'ANNOTATION_UPDATED', 'Annotation', annotation.id, {
      labelClassId: label.id,
      geometryUpdated: Boolean(dto.geometry),
    });

    return toAnnotationSummary({
      ...annotation,
      labelClass: {
        name: label.name,
        color: label.color,
      },
    });
  }

  private async deletePrismaAnnotation(projectId: string, annotationId: string): Promise<void> {
    const existing = await this.prisma.annotation.findFirst({
      where: {
        id: annotationId,
        annotationSet: {
          datasetVersion: {
            dataset: { projectId },
          },
        },
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Annotation not found for this project.');
    }

    await this.prisma.annotation.delete({ where: { id: annotationId } });
    await this.writeAudit(projectId, 'ANNOTATION_DELETED', 'Annotation', annotationId, {});
  }

  private async ensureDefaultLabels(projectId: string): Promise<AnnotationLabelSummary[]> {
    await this.prisma.project.upsert({
      where: { id: projectId },
      create: {
        id: projectId,
        slug: projectId,
        name: projectId === demoSnapshot.project.id ? demoSnapshot.project.name : projectId,
      },
      update: {},
    });

    for (const label of defaultLabels) {
      await this.prisma.labelClass.upsert({
        where: {
          projectId_name: {
            projectId,
            name: label.name,
          },
        },
        create: {
          projectId,
          name: label.name,
          color: label.color,
          type: 'BBOX',
        },
        update: {
          color: label.color,
          type: 'BBOX',
        },
      });
    }

    const labels = await this.prisma.labelClass.findMany({
      where: { projectId, type: 'BBOX' },
      orderBy: { name: 'asc' },
    });

    return labels.map((label) => ({
      id: label.id,
      projectId: label.projectId,
      name: label.name,
      color: label.color,
      type: label.type,
    }));
  }

  private async assertPrismaAnnotationSet(projectId: string, annotationSetId: string) {
    const annotationSet = await this.prisma.annotationSet.findFirst({
      where: {
        id: annotationSetId,
        datasetVersion: {
          dataset: { projectId },
        },
      },
    });

    if (!annotationSet) {
      throw new NotFoundException('Annotation set not found for this project.');
    }

    return annotationSet;
  }

  private async assertPrismaAsset(projectId: string, assetId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: assetId,
        projectId,
      },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found for this project.');
    }

    return asset;
  }

  private async assertPrismaLabel(projectId: string, labelClassId: string) {
    const label = await this.prisma.labelClass.findFirst({
      where: {
        id: labelClassId,
        projectId,
        type: 'BBOX',
      },
    });

    if (!label) {
      throw new NotFoundException('BBox label not found for this project.');
    }

    return label;
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

  private ensureMemorySeed(projectId: string, datasetVersionId: string): void {
    for (const label of defaultLabels) {
      const id = `label_${sanitizeId(projectId)}_${sanitizeId(label.name)}`;

      if (!this.memoryLabels.has(id)) {
        this.memoryLabels.set(id, {
          id,
          projectId,
          name: label.name,
          color: label.color,
          type: 'BBOX',
        });
      }
    }

    const setId = createMemorySetId(datasetVersionId);

    if (!this.memorySets.has(setId)) {
      const now = new Date('2026-04-28T12:50:00.000Z').toISOString();
      this.memorySets.set(setId, {
        id: setId,
        projectId,
        datasetVersionId,
        name: DEFAULT_ANNOTATION_SET_NAME,
        status: 'DRAFT',
        createdAt: now,
      });

      const labelByName = new Map(
        this.memoryLabelsForProject(projectId).map((label) => [label.name, label])
      );

      demoSnapshot.annotations.forEach((annotation, index) => {
        const label =
          labelByName.get(annotation.label) ?? this.memoryLabelsForProject(projectId)[0];
        const createdAt = new Date(2026, 3, 28, 12, 52, index).toISOString();
        this.memoryAnnotations.set(annotation.id, {
          id: annotation.id,
          annotationSetId: setId,
          assetId: annotation.assetId,
          labelClassId: label.id,
          label: label.name,
          color: label.color,
          type: 'BBOX',
          geometry: annotation.geometry,
          source: annotation.source,
          confidence: annotation.confidence ?? null,
          createdAt,
          updatedAt: createdAt,
        });
      });
    }
  }

  private getMemorySet(projectId: string, datasetVersionId: string): MemoryAnnotationSet {
    return this.assertMemorySet(projectId, createMemorySetId(datasetVersionId));
  }

  private assertMemorySet(projectId: string, annotationSetId: string): MemoryAnnotationSet {
    const set = this.memorySets.get(annotationSetId);

    if (!set || set.projectId !== projectId) {
      throw new NotFoundException('Annotation set not found for this project.');
    }

    return set;
  }

  private assertMemoryAnnotation(projectId: string, annotationId: string): AnnotationSummary {
    const annotation = this.memoryAnnotations.get(annotationId);
    const set = annotation ? this.memorySets.get(annotation.annotationSetId) : null;

    if (!annotation || !set || set.projectId !== projectId) {
      throw new NotFoundException('Annotation not found for this project.');
    }

    return annotation;
  }

  private assertMemoryAsset(projectId: string, assetId: string): AnnotationAssetSummary {
    const asset = this.memoryAssets(projectId).find((item) => item.id === assetId);

    if (!asset) {
      throw new NotFoundException('Media asset not found for this project.');
    }

    return asset;
  }

  private assertMemoryLabel(projectId: string, labelClassId: string): AnnotationLabelSummary {
    const label = this.memoryLabels.get(labelClassId);

    if (!label || label.projectId !== projectId || label.type !== 'BBOX') {
      throw new NotFoundException('BBox label not found for this project.');
    }

    return label;
  }

  private memoryLabelsForProject(projectId: string): AnnotationLabelSummary[] {
    return [...this.memoryLabels.values()]
      .filter((label) => label.projectId === projectId && label.type === 'BBOX')
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private memoryAssets(projectId: string): AnnotationAssetSummary[] {
    return demoSnapshot.media.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      width: asset.width,
      height: asset.height,
      split: asset.split,
      status: asset.status,
    }));
  }

  private toPublicSet(set: MemoryAnnotationSet): AnnotationSetSummary {
    return {
      id: set.id,
      datasetVersionId: set.datasetVersionId,
      name: set.name,
      status: set.status,
      createdAt: set.createdAt,
    };
  }
}

const annotationInclude = {
  labelClass: {
    select: {
      name: true,
      color: true,
    },
  },
} as const;

function normalizeGeometry(
  geometry: BBoxGeometry,
  imageWidth: number,
  imageHeight: number
): BBoxGeometry {
  const normalized = clampBBox(BBoxGeometrySchema.parse(geometry), imageWidth, imageHeight);

  if (bboxArea(normalized) <= 0) {
    throw new BadRequestException('BBox must overlap the image with positive area.');
  }

  return normalized;
}

function toAnnotationSetSummary(row: {
  id: string;
  datasetVersionId: string;
  name: string;
  status: 'DRAFT' | 'REVIEWING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}): AnnotationSetSummary {
  return {
    id: row.id,
    datasetVersionId: row.datasetVersionId,
    name: row.name,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

function toAnnotationSummary(row: {
  id: string;
  annotationSetId: string;
  assetId: string;
  labelClassId: string;
  type: 'BBOX' | 'MASK' | 'KEYPOINT';
  geometryJson: unknown;
  confidence: number | null;
  source: 'MANUAL' | 'MODEL' | 'IMPORT';
  createdAt: Date;
  updatedAt: Date;
  labelClass: {
    name: string;
    color: string;
  };
}): AnnotationSummary {
  return {
    id: row.id,
    annotationSetId: row.annotationSetId,
    assetId: row.assetId,
    labelClassId: row.labelClassId,
    label: row.labelClass.name,
    color: row.labelClass.color,
    type: 'BBOX',
    geometry: BBoxGeometrySchema.parse(row.geometryJson),
    source: row.source,
    confidence: row.confidence,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAssetSummary(row: {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'FRAME';
  width: number | null;
  height: number | null;
  checksum: string;
  metadataJson: unknown;
}): AnnotationAssetSummary {
  const metadata = row.metadataJson as {
    originalName?: string;
    status?: AnnotationAssetSummary['status'];
    split?: AnnotationAssetSummary['split'];
  };
  const dimensions = dimensionsFor(row);

  return {
    id: row.id,
    name: metadata.originalName ?? row.id,
    type: row.type,
    width: dimensions.width,
    height: dimensions.height,
    split: metadata.split ?? 'UNASSIGNED',
    status: metadata.status ?? 'indexed',
  };
}

function dimensionsFor(row: { width: number | null; height: number | null }) {
  return {
    width: row.width ?? DEFAULT_IMAGE_WIDTH,
    height: row.height ?? DEFAULT_IMAGE_HEIGHT,
  };
}

function createMemorySetId(datasetVersionId: string): string {
  return `annset_${sanitizeId(datasetVersionId)}_manual`;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
}
