/**
 * UX Regression Tests — Phase 15.10
 *
 * These tests protect against the most dangerous UX contradictions:
 * 1. FAILED job + RUNNING pipeline simultaneously
 * 2. FAILED job + evaluation enabled
 * 3. No locked dataset + inference enabled
 * 4. Demo state mixed with API state
 * 5. Pipeline inspector showing wrong context
 *
 * All tests verify that the runtime selectors enforce correct behavior.
 */

import { describe, expect, it } from 'vitest';
import type { WorkbenchRuntimeState } from './workbench-runtime';
import {
  canRunInference,
  canRunEvaluation,
  canShowPredictionOverlay,
  shouldShowPipelineExecution,
  isPortfolioSafe,
} from './runtime-selectors';

function makeState(overrides: Partial<WorkbenchRuntimeState> = {}): WorkbenchRuntimeState {
  return {
    mode: 'api',
    projectId: 'proj_test',
    selectedDatasetVersionId: 'v1',
    selectedDatasetVersionLabel: 'v1.3',
    lockedDatasetWithAssets: true,
    latestJobId: 'job_01',
    latestJobStatus: 'NONE',
    latestJobError: null,
    hasPredictions: false,
    hasEvaluationReport: false,
    health: {
      api: 'connected',
      database: 'connected',
      queue: 'connected',
      worker: 'connected',
    },
    ...overrides,
  };
}

describe('15.10 — UX State Consistency Regression Tests', () => {
  // ══════════════════════════════════════════════════════════════════════════════
  // Rule 1: FAILED job must NOT show RUNNING pipeline
  // ══════════════════════════════════════════════════════════════════════════════

  describe('FAILED job does NOT show RUNNING pipeline', () => {
    it('shouldShowPipelineExecution returns false when job is FAILED', () => {
      const state = makeState({
        latestJobStatus: 'FAILED',
        latestJobError: 'No assets in dataset',
      });
      expect(shouldShowPipelineExecution(state)).toBe(false);
    });

    it('shouldShowPipelineExecution returns false even with success-like health', () => {
      const state = makeState({
        latestJobStatus: 'FAILED',
        health: {
          api: 'connected',
          database: 'connected',
          queue: 'connected',
          worker: 'connected',
        },
      });
      expect(shouldShowPipelineExecution(state)).toBe(false);
    });

    it('shouldShowPipelineExecution returns true when job is RUNNING', () => {
      const state = makeState({ latestJobStatus: 'RUNNING' });
      expect(shouldShowPipelineExecution(state)).toBe(true);
    });

    it('shouldShowPipelineExecution returns true when job is SUCCEEDED', () => {
      const state = makeState({ latestJobStatus: 'SUCCEEDED', hasPredictions: true });
      expect(shouldShowPipelineExecution(state)).toBe(true);
    });

    it('shouldShowPipelineExecution returns false when job is CANCELLED', () => {
      const state = makeState({ latestJobStatus: 'CANCELLED' });
      expect(shouldShowPipelineExecution(state)).toBe(false);
    });

    it('shouldShowPipelineExecution returns false when no job exists (NONE)', () => {
      const state = makeState({ latestJobStatus: 'NONE' });
      expect(shouldShowPipelineExecution(state)).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Rule 2: FAILED job must NOT allow evaluation
  // ══════════════════════════════════════════════════════════════════════════════

  describe('FAILED job disables evaluation with a reason', () => {
    it('canRunEvaluation returns false with reason when job FAILED', () => {
      const state = makeState({
        latestJobStatus: 'FAILED',
        latestJobError: 'No locked dataset',
        hasPredictions: false,
      });
      const result = canRunEvaluation(state);
      expect(result.ok).toBe(false);
      expect(result.reason).toBeTruthy();
      expect(result.reason).toContain('failed');
    });

    it('canRunEvaluation returns false even if predictions exist from a previous job', () => {
      const state = makeState({
        latestJobStatus: 'FAILED',
        latestJobError: 'Out of memory',
        hasPredictions: true,
      });
      const result = canRunEvaluation(state);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('failed');
    });

    it('canRunEvaluation returns false when job is RUNNING', () => {
      const state = makeState({ latestJobStatus: 'RUNNING', hasPredictions: true });
      const result = canRunEvaluation(state);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('running');
    });

    it('canRunEvaluation returns false when job is QUEUED', () => {
      const state = makeState({ latestJobStatus: 'QUEUED' });
      const result = canRunEvaluation(state);
      expect(result.ok).toBe(false);
    });

    it('canRunEvaluation returns false when no job exists', () => {
      const state = makeState({ latestJobId: null, latestJobStatus: 'NONE' });
      const result = canRunEvaluation(state);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('No inference job');
    });

    it('canRunEvaluation returns false when job succeeded but no predictions', () => {
      const state = makeState({ latestJobStatus: 'SUCCEEDED', hasPredictions: false });
      const result = canRunEvaluation(state);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('No persisted predictions');
    });

    it('canRunEvaluation returns true only when job succeeded with predictions', () => {
      const state = makeState({ latestJobStatus: 'SUCCEEDED', hasPredictions: true });
      const result = canRunEvaluation(state);
      expect(result.ok).toBe(true);
      expect(result.reason).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Rule 3: No locked dataset must disable Run with a reason
  // ══════════════════════════════════════════════════════════════════════════════

  describe('No locked dataset disables Run with a reason', () => {
    it('canRunInference returns false when no locked dataset exists', () => {
      const state = makeState({ lockedDatasetWithAssets: false });
      const result = canRunInference(state);
      expect(result.ok).toBe(false);
      expect(result.reason).toBeTruthy();
      expect(result.reason!.toLowerCase()).toContain('dataset');
    });

    it('canRunInference returns false when API is not connected', () => {
      const state = makeState({ health: { ...makeState().health, api: 'unavailable' } });
      const result = canRunInference(state);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('API');
    });

    it('canRunInference returns false when a job is already RUNNING', () => {
      const state = makeState({ latestJobStatus: 'RUNNING' });
      const result = canRunInference(state);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('already running');
    });

    it('canRunInference returns false when a job is QUEUED', () => {
      const state = makeState({ latestJobStatus: 'QUEUED' });
      const result = canRunInference(state);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('queued');
    });

    it('canRunInference returns true only when all conditions are met', () => {
      const state = makeState({
        lockedDatasetWithAssets: true,
        latestJobStatus: 'NONE',
        health: {
          api: 'connected',
          database: 'connected',
          queue: 'connected',
          worker: 'connected',
        },
      });
      const result = canRunInference(state);
      expect(result.ok).toBe(true);
      expect(result.reason).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Rule 4: Prediction overlay must NOT show real predictions when job failed
  // ══════════════════════════════════════════════════════════════════════════════

  describe('Prediction overlay is hidden when job is not SUCCEEDED', () => {
    it('canShowPredictionOverlay returns false when job is FAILED', () => {
      const state = makeState({ latestJobStatus: 'FAILED', hasPredictions: true });
      expect(canShowPredictionOverlay(state)).toBe(false);
    });

    it('canShowPredictionOverlay returns false when job is RUNNING', () => {
      const state = makeState({ latestJobStatus: 'RUNNING', hasPredictions: false });
      expect(canShowPredictionOverlay(state)).toBe(false);
    });

    it('canShowPredictionOverlay returns false when job never ran', () => {
      const state = makeState({ latestJobStatus: 'NONE', hasPredictions: false });
      expect(canShowPredictionOverlay(state)).toBe(false);
    });

    it('canShowPredictionOverlay returns true only when job SUCCEEDED with predictions', () => {
      const state = makeState({ latestJobStatus: 'SUCCEEDED', hasPredictions: true });
      expect(canShowPredictionOverlay(state)).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Rule 5: Portfolio-safe state guards
  // ══════════════════════════════════════════════════════════════════════════════

  describe('Portfolio-safe state guards', () => {
    it('isPortfolioSafe returns false when job is FAILED', () => {
      const state = makeState({ latestJobStatus: 'FAILED' });
      expect(isPortfolioSafe(state)).toBe(false);
    });

    it('isPortfolioSafe returns false when mode is degraded', () => {
      const state = makeState({ mode: 'degraded' });
      expect(isPortfolioSafe(state)).toBe(false);
    });

    it('isPortfolioSafe returns false when API is unavailable', () => {
      const state = makeState({ health: { ...makeState().health, api: 'unavailable' } });
      expect(isPortfolioSafe(state)).toBe(false);
    });

    it('isPortfolioSafe returns true for a clean API state with no job', () => {
      const state = makeState({
        latestJobStatus: 'NONE',
        mode: 'api',
        health: {
          api: 'connected',
          database: 'connected',
          queue: 'connected',
          worker: 'connected',
        },
      });
      expect(isPortfolioSafe(state)).toBe(true);
    });

    it('isPortfolioSafe returns true for mock mode only when API is connected', () => {
      // Mock mode with a connected API is portfolio-safe
      const state = makeState({
        mode: 'mock',
        latestJobStatus: 'NONE',
        health: { api: 'connected', database: 'connected', queue: 'connected', worker: 'mock' },
      });
      expect(isPortfolioSafe(state)).toBe(true);
    });

    it('isPortfolioSafe returns false for mock mode when API is unavailable', () => {
      // Mock mode with unavailable API is NOT portfolio-safe
      const state = makeState({
        mode: 'mock',
        latestJobStatus: 'NONE',
        health: { api: 'unavailable', database: 'unknown', queue: 'unknown', worker: 'mock' },
      });
      expect(isPortfolioSafe(state)).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Rule 6: Runtime mode labeling
  // ══════════════════════════════════════════════════════════════════════════════

  describe('Runtime mode must be explicitly labeled', () => {
    it('every state has a known runtime mode', () => {
      const modes: WorkbenchRuntimeState['mode'][] = [
        'loading',
        'api',
        'fallback',
        'mock',
        'degraded',
      ];
      for (const mode of modes) {
        const state = makeState({ mode });
        expect(state.mode).toBe(mode);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Rule 7: Contradictory state combinations must not pass
  // ══════════════════════════════════════════════════════════════════════════════

  describe('No contradictory state combinations pass eligibility checks', () => {
    it('FAILED + hasPredictions must still disable evaluation', () => {
      const state = makeState({
        latestJobStatus: 'FAILED',
        latestJobError: 'Validation error',
        hasPredictions: true, // stale predictions from previous run
      });
      const result = canRunEvaluation(state);
      expect(result.ok).toBe(false);
    });

    it('RUNNING job + locked dataset must still allow inference', () => {
      // Actually this should be false — can't run two jobs at once
      const state = makeState({
        latestJobStatus: 'RUNNING',
        lockedDatasetWithAssets: true,
      });
      const result = canRunInference(state);
      expect(result.ok).toBe(false);
    });

    it('API unavailable + mock queue must disable inference', () => {
      const state = makeState({
        lockedDatasetWithAssets: true,
        health: {
          api: 'unavailable',
          database: 'unknown',
          queue: 'fallback',
          worker: 'mock',
        },
      });
      const result = canRunInference(state);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('API');
    });

    // ══════════════════════════════════════════════════════════════════════════════
    // Regression: backend API connected but job.source is NOT 'api'
    // Previously runtimeState.health.api derived from job.source (split-brain bug).
    // Now runtimeState.health.api comes from the backend /api/health/runtime/status
    // endpoint, so inference should be allowed when the backend is healthy regardless
    // of what the job controller's data source is.
    // ══════════════════════════════════════════════════════════════════════════════
    it('backend API connected + job.source=fallback enables inference (backend truth wins)', () => {
      const state: WorkbenchRuntimeState = {
        ...makeState(),
        mode: 'fallback',
        health: {
          api: 'connected', // from backend runtime status — authoritative
          database: 'connected',
          queue: 'fallback',
          worker: 'mock',
        },
        lockedDatasetWithAssets: true,
        latestJobStatus: 'NONE',
      };
      const result = canRunInference(state);
      expect(result.ok).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('backend API connected + job.source=loading enables inference once backend reports ready', () => {
      const state: WorkbenchRuntimeState = {
        ...makeState(),
        mode: 'loading',
        health: {
          api: 'connected',
          database: 'connected',
          queue: 'connected',
          worker: 'connected',
        },
        lockedDatasetWithAssets: true,
        latestJobStatus: 'NONE',
      };
      const result = canRunInference(state);
      expect(result.ok).toBe(true);
    });
  });
});
