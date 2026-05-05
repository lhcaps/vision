import type { RuntimeStatusResponse } from '@visionflow/contracts';
import { RuntimeStatusResponseSchema } from '@visionflow/contracts';
import { apiJson } from '../../shared/api/client';

/**
 * Fetch the authoritative runtime status from the backend.
 * The backend aggregates API mode, database health, queue mode, and CV worker health
 * into a single endpoint so the frontend does not have to guess or hard-code readiness.
 *
 * Response is validated against RuntimeStatusResponseSchema at the trust boundary.
 * An AbortSignal can be passed to cancel in-flight requests.
 */
export async function fetchRuntimeStatus(signal?: AbortSignal): Promise<RuntimeStatusResponse> {
  const json = await apiJson<unknown>('/api/health/runtime/status', { signal });
  return RuntimeStatusResponseSchema.parse(json);
}
