/**
 * Inference job state machine for VisionFlow Studio.
 * Enforces valid state transitions and progress invariants.
 */

import { InferenceJobStatus } from '@visionflow/contracts';
import { InferenceJobTransitionError } from './errors';

/**
 * Valid state transitions for inference jobs.
 * Job lifecycle: QUEUED → RUNNING → SUCCEEDED/FAILED/CANCELLED
 */
export const VALID_INFERENCE_TRANSITIONS: Record<InferenceJobStatus, InferenceJobStatus[]> = {
  QUEUED: ['RUNNING', 'CANCELLED'],
  RUNNING: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

/**
 * Assert that a state transition is valid.
 * Throws InferenceJobTransitionError if the transition is not allowed.
 */
export function assertValidInferenceTransition(
  from: InferenceJobStatus,
  to: InferenceJobStatus
): void {
  const valid = VALID_INFERENCE_TRANSITIONS[from];
  if (!valid.includes(to)) {
    throw new InferenceJobTransitionError(
      `Invalid inference job transition: ${from} → ${to}. ` +
        `Valid transitions from ${from}: [${valid.join(', ')}]`,
      { from, to, validTransitions: valid }
    );
  }
}

/**
 * Assert that progress values are valid (non-decreasing unless job failed).
 * Progress should monotonically increase from 0 to 100.
 * Throws InferenceJobTransitionError if progress would rewind.
 */
export function assertValidProgress(
  current: number,
  next: number,
  status: InferenceJobStatus
): void {
  if (next < current && status !== 'FAILED') {
    throw new InferenceJobTransitionError(
      `Invalid progress rewind: ${current} -> ${next}`,
      { current, next }
    );
  }
}

/**
 * Check if a transition is valid without throwing.
 */
export function isValidInferenceTransition(
  from: InferenceJobStatus,
  to: InferenceJobStatus
): boolean {
  return VALID_INFERENCE_TRANSITIONS[from].includes(to);
}

/**
 * Get all valid next states for a given status.
 */
export function getValidNextStates(status: InferenceJobStatus): InferenceJobStatus[] {
  return [...VALID_INFERENCE_TRANSITIONS[status]];
}

/**
 * Check if a status is a terminal state (no further transitions allowed).
 */
export function isTerminalInferenceStatus(status: InferenceJobStatus): boolean {
  return VALID_INFERENCE_TRANSITIONS[status].length === 0;
}
