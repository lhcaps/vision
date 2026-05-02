import { Injectable } from '@nestjs/common';
import { AnnotationRepository, AnnotationJob } from './annotation.repository';

const memoryAnnotationJobs = new Map<string, AnnotationJob>();

@Injectable()
export class MemoryAnnotationRepository implements AnnotationRepository {
  async createJob(data: {
    projectId: string;
    mediaAssetId: string;
    modelId?: string;
  }): Promise<AnnotationJob> {
    const job: AnnotationJob = {
      id: `annotation_job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId: data.projectId,
      mediaAssetId: data.mediaAssetId,
      modelId: data.modelId ?? null,
      status: 'PENDING',
      annotations: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    memoryAnnotationJobs.set(job.id, job);
    return job;
  }

  async findById(projectId: string, jobId: string): Promise<AnnotationJob | null> {
    const job = memoryAnnotationJobs.get(jobId);
    if (!job || job.projectId !== projectId) return null;
    return job;
  }

  async listByProject(projectId: string): Promise<AnnotationJob[]> {
    return [...memoryAnnotationJobs.values()].filter((j) => j.projectId === projectId);
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
    const job = memoryAnnotationJobs.get(jobId);
    if (!job || job.projectId !== projectId) return null;
    if (data.status !== undefined) job.status = data.status;
    if (data.annotations !== undefined) job.annotations = data.annotations;
    if (data.completedAt !== undefined) job.completedAt = data.completedAt;
    return job;
  }
}
