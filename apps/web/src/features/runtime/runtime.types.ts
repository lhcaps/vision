import type {
  RuntimeStatusResponse,
  RuntimeStatusApi,
  RuntimeStatusDatabase,
  RuntimeStatusQueue,
  RuntimeStatusCvWorker,
} from '@visionflow/contracts';

export type { RuntimeStatusResponse };

export type CvReadinessState =
  | { kind: 'onnx-ready'; modelVersion: string }
  | { kind: 'onnx-configured-unavailable'; modelVersion: string }
  | { kind: 'mock-fallback'; requestedMode: 'mock' }
  | { kind: 'worker-unavailable' }
  | { kind: 'unknown' }
  | { kind: 'loading' };

export type QueueReadinessState =
  | { kind: 'bullmq-ready' }
  | { kind: 'memory-fallback' }
  | { kind: 'unavailable' }
  | { kind: 'unknown' }
  | { kind: 'loading' };

export type ApiReadinessState =
  | { kind: 'connected'; mode: 'database' | 'memory' | 'unknown' }
  | { kind: 'unavailable' }
  | { kind: 'loading' };

export type DatabaseReadinessState =
  | { kind: 'ready' }
  | { kind: 'unavailable' }
  | { kind: 'unknown' }
  | { kind: 'loading' };

export interface RuntimeReadiness {
  api: ApiReadinessState;
  database: DatabaseReadinessState;
  queue: QueueReadinessState;
  cvWorker: CvReadinessState;
}
