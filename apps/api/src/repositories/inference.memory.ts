import { Injectable } from '@nestjs/common';
import { InferenceJobStatus } from '@visionflow/contracts';
import { InferenceRepository, InferenceJobSummary, InferenceProgressUpdate } from './inference.repository';

const memoryJobs = new Map<string, InferenceJobSummary>();

@Injectable()
export class MemoryInferenceRepository implements InferenceRepository {
  async createJob(data: {
    projectId: string;
    pipelineId: string;
    datasetVersionId: string;
    modelId?: string | null;
    status: InferenceJobStatus;
  }): Promise<InferenceJobSummary> {
    const job: InferenceJobSummary = {
      id: `inference_job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId: data.projectId,
      pipelineId: data.pipelineId,
      datasetVersionId: data.datasetVersionId,
      modelId: data.modelId ?? null,
      status: data.status,
      progress: 0,
      startedAt: null,
      completedAt: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
    };
    memoryJobs.set(job.id, job);
    return job;
  }

  async findById(projectId: string, jobId: string): Promise<InferenceJobSummary | null> {
    const job = memoryJobs.get(jobId);
    if (!job || job.projectId !== projectId) return null;
    return job;
  }

  async listByProject(projectId: string): Promise<InferenceJobSummary[]> {
    return [...memoryJobs.values()]
      .filter((j) => j.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
    const job = memoryJobs.get(jobId);
    if (!job || job.projectId !== projectId) return null;
    if (data.status !== undefined) job.status = data.status;
    if (data.progress !== undefined) job.progress = data.progress;
    if (data.error !== undefined) job.errorMessage = data.error;
    if (data.startedAt !== undefined) job.startedAt = data.startedAt;
    if (data.completedAt !== undefined) job.completedAt = data.completedAt;
    return job;
  }

  async cancelJob(projectId: string, jobId: string): Promise<InferenceJobSummary | null> {
    return this.updateJob(projectId, jobId, {
      status: 'CANCELLED',
      completedAt: new Date().toISOString(),
    });
  }

  async getProgress(jobId: string): Promise<InferenceProgressUpdate | null> {
    const job = memoryJobs.get(jobId);
    if (!job) return null;
    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      timestamp: new Date().toISOString(),
    };
  }
}
