export interface JobQueue {
  enqueue<T>(name: string, data: T): Promise<void>;
  process<T>(name: string, handler: (data: T) => Promise<void>): Promise<void>;
  onProgress(jobId: string, progress: number): Promise<void>;
}
