export interface JobQueuePayload {
  projectId: string;
  jobId: string;
}

export interface JobQueue {
  enqueue(payload: JobQueuePayload): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}
