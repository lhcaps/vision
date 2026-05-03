import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InferenceJobStatus } from '@visionflow/contracts';
import {
  InferenceRepository,
  InferenceJobSummary,
  InferenceProgressUpdate,
} from './inference.repository';
import { PRISMA_SERVICE } from '../config/provider-tokens';

@Injectable()
export class PrismaInferenceRepository implements InferenceRepository {
  constructor(@Inject(PRISMA_SERVICE) private readonly prisma: PrismaService) {}

  async createJob(data: {
    projectId: string;
    pipelineId: string;
    datasetVersionId: string;
    modelId?: string | null;
    status: InferenceJobStatus;
  }): Promise<InferenceJobSummary> {
    const job = await this.prisma.inferenceJob.create({
      data: {
        projectId: data.projectId,
        pipelineId: data.pipelineId,
        datasetVersionId: data.datasetVersionId,
        modelId: data.modelId ?? null,
        status: data.status as 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED',
        progress: 0,
      },
    });
    return toJobSummary(job);
  }

  async findById(projectId: string, jobId: string): Promise<InferenceJobSummary | null> {
    const row = await this.prisma.inferenceJob.findFirst({
      where: { id: jobId, projectId },
    });
    return row ? toJobSummary(row) : null;
  }

  async listByProject(projectId: string): Promise<InferenceJobSummary[]> {
    const rows = await this.prisma.inferenceJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    return rows.map(toJobSummary);
  }

  async updateJob(
    projectId: string,
    jobId: string,
    data: {
      status?: InferenceJobStatus;
      progress?: number;
      error?: string | null;
      startedAt?: string | null;
      completedAt?: string | null;
    }
  ): Promise<InferenceJobSummary | null> {
    const existing = await this.prisma.inferenceJob.findFirst({
      where: { id: jobId, projectId },
    });
    if (!existing) return null;
    const row = await this.prisma.inferenceJob.update({
      where: { id: jobId },
      data: {
        status: data.status as 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED',
        progress: data.progress,
        startedAt: data.startedAt ? new Date(data.startedAt) : existing.startedAt,
        completedAt: data.completedAt ? new Date(data.completedAt) : existing.completedAt,
        errorMessage: data.error !== undefined ? data.error : existing.errorMessage,
      },
    });
    return toJobSummary(row);
  }

  async cancelJob(projectId: string, jobId: string): Promise<InferenceJobSummary | null> {
    const existing = await this.prisma.inferenceJob.findFirst({
      where: { id: jobId, projectId },
    });
    if (!existing) return null;
    const row = await this.prisma.inferenceJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED', completedAt: new Date() },
    });
    return toJobSummary(row);
  }

  async getProgress(jobId: string): Promise<InferenceProgressUpdate | null> {
    const job = await this.prisma.inferenceJob.findUnique({ where: { id: jobId } });
    if (!job) return null;
    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      timestamp: new Date().toISOString(),
    };
  }
}

function toJobSummary(row: {
  id: string;
  projectId: string;
  datasetVersionId: string;
  pipelineId: string;
  modelId: string | null;
  status: InferenceJobStatus;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): InferenceJobSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    datasetVersionId: row.datasetVersionId,
    pipelineId: row.pipelineId,
    modelId: row.modelId,
    status: row.status,
    progress: row.progress,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
