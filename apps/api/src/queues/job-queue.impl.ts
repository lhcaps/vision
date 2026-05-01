import { Injectable } from '@nestjs/common';
import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { JobQueue, JobQueuePayload } from './job-queue';

const QUEUE_NAME = 'visionflow.inference';

@Injectable()
export class BullMqJobQueue implements JobQueue {
  private queue: Queue<JobQueuePayload> | null = null;
  private worker: Worker<JobQueuePayload> | null = null;
  private processor?: (payload: JobQueuePayload) => Promise<void>;
  private redisConnection: ConnectionOptions | null = null;

  registerProcessor(processor: (payload: JobQueuePayload) => Promise<void>): void {
    this.processor = processor;
  }

  async start(): Promise<void> {
    if (!this.redisConnection) return;
    this.queue = new Queue<JobQueuePayload>(QUEUE_NAME, { connection: this.redisConnection });
    if (this.processor) {
      this.worker = new Worker<JobQueuePayload>(
        QUEUE_NAME,
        async (job) => this.processor!(job.data),
        { connection: this.redisConnection }
      );
    }
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    this.queue = null;
    this.worker = null;
  }

  async enqueue(payload: JobQueuePayload): Promise<void> {
    if (!this.queue) return;
    await this.queue.add('run-inference', payload, {
      jobId: payload.jobId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  setConnection(connection: ConnectionOptions): void {
    this.redisConnection = connection;
  }
}

@Injectable()
export class NoopJobQueue implements JobQueue {
  private queue: JobQueuePayload[] = [];
  private processor?: (payload: JobQueuePayload) => Promise<void>;

  registerProcessor(processor: (payload: JobQueuePayload) => Promise<void>): void {
    this.processor = processor;
  }

  async start(): Promise<void> {
    this.drain();
  }

  async stop(): Promise<void> {}

  async enqueue(payload: JobQueuePayload): Promise<void> {
    this.queue.push(payload);
    if (this.processor) {
      const p = this.queue.shift();
      if (p) await this.processor(p);
    }
  }

  private async drain(): Promise<void> {
    while (this.queue.length > 0) {
      const payload = this.queue.shift();
      if (payload && this.processor) await this.processor(payload);
    }
  }
}
