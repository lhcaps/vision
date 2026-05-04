import { useCallback, useEffect, useRef, useState } from 'react';
import type { RuntimeStatusResponse } from '@visionflow/contracts';
import { fetchRuntimeStatus } from './runtime.api';
import type {
  ApiReadinessState,
  CvReadinessState,
  DatabaseReadinessState,
  QueueReadinessState,
  RuntimeReadiness,
} from './runtime.types';

const REFRESH_INTERVAL_MS = 8_000;
const FETCH_TIMEOUT_MS = 5_000;

function deriveCvState(data: RuntimeStatusResponse['cvWorker']): CvReadinessState {
  if (!data.configured) {
    return { kind: 'mock-fallback', requestedMode: 'mock' };
  }
  if (!data.ok) {
    return { kind: 'worker-unavailable' };
  }
  if (data.requestedDetectorMode === 'onnx') {
    if (data.onnxAvailable === true) {
      return { kind: 'onnx-ready', modelVersion: data.modelVersion ?? 'unknown' };
    }
    return { kind: 'onnx-configured-unavailable', modelVersion: data.modelVersion ?? 'unknown' };
  }
  return { kind: 'mock-fallback', requestedMode: 'mock' };
}

function deriveQueueState(data: RuntimeStatusResponse['queue']): QueueReadinessState {
  switch (data.status) {
    case 'ready':
      return { kind: 'bullmq-ready' };
    case 'fallback':
      return { kind: 'memory-fallback' };
    case 'unavailable':
      return { kind: 'unavailable' };
    default:
      return { kind: 'unknown' };
  }
}

function deriveApiState(data: RuntimeStatusResponse['api']): ApiReadinessState {
  if (data.ok) {
    const mode = data.mode === 'database' || data.mode === 'memory' ? data.mode : 'unknown';
    return { kind: 'connected', mode };
  }
  return { kind: 'unavailable' };
}

function deriveDatabaseState(
  data: RuntimeStatusResponse['database']
): DatabaseReadinessState {
  switch (data.status) {
    case 'ready':
      return { kind: 'ready' };
    case 'unavailable':
      return { kind: 'unavailable' };
    default:
      return { kind: 'unknown' };
  }
}

function toReadiness(data: RuntimeStatusResponse): RuntimeReadiness {
  return {
    api: deriveApiState(data.api),
    database: deriveDatabaseState(data.database),
    queue: deriveQueueState(data.queue),
    cvWorker: deriveCvState(data.cvWorker),
  };
}

export interface UseRuntimeStatusResult {
  readiness: RuntimeReadiness;
  raw: RuntimeStatusResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRuntimeStatus(): UseRuntimeStatusResult {
  const [raw, setRaw] = useState<RuntimeStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    if (cancelledRef.current) return;
    try {
      const data = await Promise.race([
        fetchRuntimeStatus(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Runtime status fetch timed out')), FETCH_TIMEOUT_MS)
        ),
      ]);
      if (cancelledRef.current) return;
      setRaw(data);
      setError(null);
    } catch (err) {
      if (cancelledRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch runtime status');
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    intervalRef.current = setInterval(() => {
      void load();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelledRef.current = true;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [load]);

  const readiness: RuntimeReadiness = raw
    ? toReadiness(raw)
    : { api: { kind: 'loading' }, database: { kind: 'loading' }, queue: { kind: 'loading' }, cvWorker: { kind: 'loading' } };

  return {
    readiness,
    raw,
    loading,
    error,
    refresh: load,
  };
}
