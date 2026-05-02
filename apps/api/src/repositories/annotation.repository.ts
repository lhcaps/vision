export interface AnnotationRepository {
  createJob(data: {
    projectId: string;
    mediaAssetId: string;
    modelId?: string;
  }): Promise<AnnotationJob>;

  findById(projectId: string, jobId: string): Promise<AnnotationJob | null>;

  listByProject(projectId: string): Promise<AnnotationJob[]>;

  updateJob(
    projectId: string,
    jobId: string,
    data: {
      status?: string;
      annotations?: unknown[];
      completedAt?: string | null;
    }
  ): Promise<AnnotationJob | null>;
}

export interface AnnotationJob {
  id: string;
  projectId: string;
  mediaAssetId: string;
  modelId: string | null;
  status: string;
  annotations: unknown[];
  createdAt: string;
  completedAt: string | null;
}
