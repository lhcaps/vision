import { InferenceJobStatus } from '@visionflow/contracts';
import { InferenceJobTransitionError, ProgressRewindError } from './errors';

export const VALID_INFERENCE_TRANSITIONS: Record<InferenceJobStatus, InferenceJobStatus[]> = {
  QUEUED: ['RUNNING', 'CANCELLED'],
  RUNNING: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

export function assertValidInferenceTransition(
  from: InferenceJobStatus,
  to: InferenceJobStatus
): void {
  const valid = VALID_INFERENCE_TRANSITIONS[from];
  if (!valid.includes(to)) {
    throw new InferenceJobTransitionError(
      `Invalid inference job transition: ${from} → ${to}. ` +
      `Valid transitions from ${from}: [${valid.join(', ') || 'none'}]`,
      { from, to, validTransitions: valid }
    );
  }
}

export function assertValidProgress(
  current: number,
  next: number,
  status: InferenceJobStatus
): void {
  if (next < current && status !== 'FAILED') {
    throw new ProgressRewindError(current, next, { status });
  }
}
