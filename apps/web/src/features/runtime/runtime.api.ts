import type { RuntimeStatusResponse } from '@visionflow/contracts';
import { apiJson } from '../../shared/api/client';

/**
 * Fetch the authoritative runtime status from the backend.
 * The backend aggregates API mode, database health, queue mode, and CV worker health
 * into a single endpoint so the frontend does not have to guess or hard-code readiness.
 */
export async function fetchRuntimeStatus(): Promise<RuntimeStatusResponse> {
  return apiJson<RuntimeStatusResponse>('/health/runtime/status');
}
