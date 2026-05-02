/**
 * Eligibility selectors — derived from WorkbenchRuntimeState.
 *
 * These selectors answer the question: "Can the user perform action X right now?"
 * Every disabled action MUST surface a reason via these selectors.
 */

import type { WorkbenchRuntimeState } from './workbench-runtime';

export type Eligibility = { ok: true; reason: null } | { ok: false; reason: string };

/**
 * Can the user queue a new inference job right now?
 *
 * Rules:
 * - API must be connected.
 * - A locked dataset version with at least one asset must exist.
 * - No job may already be running.
 * - Demo/fallback state is not a blocker — it is labeled as such in the runtime state.
 */
export function canRunInference(state: WorkbenchRuntimeState): Eligibility {
  if (state.health.api !== 'connected') {
    return {
      ok: false,
      reason:
        'API is not connected. Check that the NestJS API is running at http://localhost:3000.',
    };
  }

  if (!state.lockedDatasetWithAssets) {
    return {
      ok: false,
      reason:
        'No locked dataset version with assets is available for inference. ' +
        'Open Versions, lock a version with at least one asset, then try again.',
    };
  }

  if (state.latestJobStatus === 'RUNNING') {
    return {
      ok: false,
      reason:
        'An inference job is already running. Wait for it to complete before queuing another.',
    };
  }

  if (state.latestJobStatus === 'QUEUED') {
    return {
      ok: false,
      reason: 'An inference job is already queued. Wait for it to complete.',
    };
  }

  return { ok: true, reason: null };
}

/**
 * Can the user run evaluation right now?
 *
 * Rules:
 * - A successful inference job must exist.
 * - Predictions must be available for that job.
 * - If the job failed, evaluation is disabled with a recovery path.
 */
export function canRunEvaluation(state: WorkbenchRuntimeState): Eligibility {
  if (state.latestJobStatus === 'NONE' || state.latestJobStatus === 'QUEUED') {
    return {
      ok: false,
      reason: 'No inference job has been submitted yet. Run an inference job first.',
    };
  }

  if (state.latestJobStatus === 'RUNNING') {
    return {
      ok: false,
      reason: 'Inference is still running. Wait for it to complete before running evaluation.',
    };
  }

  if (state.latestJobStatus === 'FAILED') {
    return {
      ok: false,
      reason:
        'Inference failed. Fix the failure before running evaluation. ' +
        'Open Versions to add assets or retry with different parameters.',
    };
  }

  if (state.latestJobStatus === 'CANCELLED') {
    return {
      ok: false,
      reason: 'Inference was cancelled. Run a new inference job first.',
    };
  }

  if (!state.hasPredictions) {
    return {
      ok: false,
      reason:
        'No persisted predictions are available for this job. ' +
        'Ensure the inference job completed successfully and predictions were saved.',
    };
  }

  return { ok: true, reason: null };
}

/**
 * Is the prediction overlay showing real results?
 *
 * Rules:
 * - Overlay shows "live" predictions only when job succeeded.
 * - Overlay is hidden/disabled when job failed or no job has run.
 * - Overlay can show cached/demo predictions if explicitly labeled.
 */
export function canShowPredictionOverlay(state: WorkbenchRuntimeState): boolean {
  if (state.latestJobStatus === 'SUCCEEDED' && state.hasPredictions) {
    return true;
  }
  return false;
}

/**
 * Should the PipelineExecutionFlow be visible?
 *
 * Rules:
 * - Pipeline execution flow is only shown when a job is RUNNING or SUCCEEDED.
 * - It should NOT show "running" when the job has FAILED.
 */
export function shouldShowPipelineExecution(state: WorkbenchRuntimeState): boolean {
  return state.latestJobStatus === 'RUNNING' || state.latestJobStatus === 'SUCCEEDED';
}

/**
 * Is the system in a "portfolio-safe" state?
 * Portfolio-safe means: no contradictory failed/demo/fallback state is visible.
 */
export function isPortfolioSafe(state: WorkbenchRuntimeState): boolean {
  // Cannot be portfolio-safe if we have contradictory states
  if (state.latestJobStatus === 'FAILED') {
    return false;
  }
  if (state.mode === 'degraded') {
    return false;
  }
  if (state.health.api === 'unavailable') {
    return false;
  }
  return true;
}
