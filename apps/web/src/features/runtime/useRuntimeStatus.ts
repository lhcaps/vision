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

  const load = useCallback(async (signal: AbortSignal) => {
    try {
      const data = await fetchRuntimeStatus(signal);
      setRaw(data);
      setError(null);
    } catch (err) {
      if (signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch runtime status');
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    intervalRef.current = setInterval(() => {
      // Abort the previous in-flight request before starting a new one.
      controller.abort();
      // Create a fresh AbortController for the next request.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const newController = new AbortController();
      void load(newController.signal);
      // Replace the interval ref with the new controller so the cleanup uses the right one.
      intervalRef.current = newController as unknown as ReturnType<typeof setInterval>;
    }, REFRESH_INTERVAL_MS);

    return () => {
      controller.abort();
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
    refresh: () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      const controller = new AbortController();
      void load(controller.signal);
      intervalRef.current = controller as unknown as ReturnType<typeof setInterval>;
    },
  };
}
