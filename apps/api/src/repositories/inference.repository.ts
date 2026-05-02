import { InferenceJobStatus } from '@visionflow/contracts';

export interface InferenceProgressUpdate {
  jobId: string;
  status: InferenceJobStatus;
  progress: number;
  timestamp: string;
}

export interface InferenceRepository {
  createJob(data: {
    projectId: string;
    pipelineId: string;
    datasetVersionId: string;
    modelId?: string | null;
    status: InferenceJobStatus;
  }): Promise<InferenceJobSummary>;

  findById(projectId: string, jobId: string): Promise<InferenceJobSummary | null>;

  listByProject(projectId: string): Promise<InferenceJobSummary[]>;

  updateJob(
    projectId: string,
    jobId: string,
    data: {
      status?: InferenceJobStatus;
      progress?: number;
      error?: string | null;
      startedAt?: string | null;
      completedAt?: string | null;
    }
  ): Promise<InferenceJobSummary | null>;

  cancelJob(projectId: string, jobId: string): Promise<InferenceJobSummary | null>;

  getProgress(jobId: string): Promise<InferenceProgressUpdate | null>;
}

export interface InferenceJobSummary {
  id: string;
  projectId: string;
  datasetVersionId: string;
  pipelineId: string;
  modelId: string | null;
  status: InferenceJobStatus;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
