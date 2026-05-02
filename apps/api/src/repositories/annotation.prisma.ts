import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnnotationRepository, AnnotationJob } from './annotation.repository';

@Injectable()
export class PrismaAnnotationRepository implements AnnotationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(data: {
    projectId: string;
    mediaAssetId: string;
    modelId?: string;
  }): Promise<AnnotationJob> {
    const row = await this.prisma.annotation.findFirst({
      where: { id: data.mediaAssetId },
      include: { labelClass: true },
    });
    return {
      id: `annotation_job_${Date.now()}`,
      projectId: data.projectId,
      mediaAssetId: data.mediaAssetId,
      modelId: data.modelId ?? null,
      status: 'PENDING',
      annotations: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
  }

  async findById(projectId: string, jobId: string): Promise<AnnotationJob | null> {
    const row = await this.prisma.annotation.findFirst({
      where: { id: jobId, annotationSet: { datasetVersion: { dataset: { projectId } } } },
    });
    return row ? toAnnotationJob(row) : null;
  }

  async listByProject(projectId: string): Promise<AnnotationJob[]> {
    const rows = await this.prisma.annotation.findMany({
      where: { annotationSet: { datasetVersion: { dataset: { projectId } } } },
      include: { labelClass: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toAnnotationJob);
  }

  async updateJob(
    projectId: string,
    jobId: string,
    data: {
      status?: string;
      annotations?: unknown[];
      completedAt?: string | null;
    }
  ): Promise<AnnotationJob | null> {
    const existing = await this.prisma.annotation.findFirst({
      where: { id: jobId, annotationSet: { datasetVersion: { dataset: { projectId } } } },
    });
    if (!existing) return null;
    return toAnnotationJob(existing);
  }
}

function toAnnotationJob(row: {
  id: string;
  annotationSetId: string;
  assetId: string;
  labelClassId: string;
  type: string;
  geometryJson: unknown;
  confidence: number | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  modelId?: string | null;
}): AnnotationJob {
  return {
    id: row.id,
    projectId: '',
    mediaAssetId: row.assetId,
    modelId: row.modelId ?? null,
    status: row.type,
    annotations: [],
    createdAt: row.createdAt.toISOString(),
    completedAt: null,
  };
}
