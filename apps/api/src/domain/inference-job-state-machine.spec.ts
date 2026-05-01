import { describe, expect, it } from 'vitest';
import {
  assertValidInferenceTransition,
  assertValidProgress,
  VALID_INFERENCE_TRANSITIONS,
} from './inference-job-state-machine';
import { InferenceJobTransitionError, ProgressRewindError } from './errors';

describe('VALID_INFERENCE_TRANSITIONS', () => {
  it('QUEUED transitions to RUNNING and CANCELLED', () => {
    expect(VALID_INFERENCE_TRANSITIONS.QUEUED).toContain('RUNNING');
    expect(VALID_INFERENCE_TRANSITIONS.QUEUED).toContain('CANCELLED');
    expect(VALID_INFERENCE_TRANSITIONS.QUEUED).not.toContain('SUCCEEDED');
  });

  it('RUNNING transitions to SUCCEEDED, FAILED, and CANCELLED', () => {
    expect(VALID_INFERENCE_TRANSITIONS.RUNNING).toContain('SUCCEEDED');
    expect(VALID_INFERENCE_TRANSITIONS.RUNNING).toContain('FAILED');
    expect(VALID_INFERENCE_TRANSITIONS.RUNNING).toContain('CANCELLED');
  });

  it('terminal states have no valid transitions', () => {
    expect(VALID_INFERENCE_TRANSITIONS.SUCCEEDED).toHaveLength(0);
    expect(VALID_INFERENCE_TRANSITIONS.FAILED).toHaveLength(0);
    expect(VALID_INFERENCE_TRANSITIONS.CANCELLED).toHaveLength(0);
  });
});

describe('assertValidInferenceTransition', () => {
  it('allows valid transitions', () => {
    expect(() => assertValidInferenceTransition('QUEUED', 'RUNNING')).not.toThrow();
    expect(() => assertValidInferenceTransition('QUEUED', 'CANCELLED')).not.toThrow();
    expect(() => assertValidInferenceTransition('RUNNING', 'SUCCEEDED')).not.toThrow();
    expect(() => assertValidInferenceTransition('RUNNING', 'FAILED')).not.toThrow();
    expect(() => assertValidInferenceTransition('RUNNING', 'CANCELLED')).not.toThrow();
  });

  it('throws InferenceJobTransitionError for invalid transitions', () => {
    expect(() => assertValidInferenceTransition('QUEUED', 'SUCCEEDED')).toThrow(
      InferenceJobTransitionError
    );
    expect(() => assertValidInferenceTransition('SUCCEEDED', 'RUNNING')).toThrow(
      InferenceJobTransitionError
    );
    expect(() => assertValidInferenceTransition('FAILED', 'QUEUED')).toThrow(
      InferenceJobTransitionError
    );
    expect(() => assertValidInferenceTransition('CANCELLED', 'SUCCEEDED')).toThrow(
      InferenceJobTransitionError
    );
  });

  it('includes correct context on error', () => {
    try {
      assertValidInferenceTransition('QUEUED', 'SUCCEEDED');
    } catch (err) {
      if (err instanceof InferenceJobTransitionError) {
        expect(err.context).toMatchObject({
          from: 'QUEUED',
          to: 'SUCCEEDED',
        });
        expect(err.code).toBe('INFERENCE_JOB_TRANSITION_ERROR');
      } else {
        throw err;
      }
    }
  });

  it('includes valid transitions in error context', () => {
    try {
      assertValidInferenceTransition('SUCCEEDED', 'RUNNING');
    } catch (err) {
      if (err instanceof InferenceJobTransitionError) {
        expect(err.context.validTransitions).toEqual([]);
        expect(err.message).toContain('Valid transitions from SUCCEEDED: [none]');
      } else {
        throw err;
      }
    }
  });
});

describe('assertValidProgress', () => {
  it('allows progress increase', () => {
    expect(() => assertValidProgress(0, 50, 'RUNNING')).not.toThrow();
    expect(() => assertValidProgress(50, 100, 'RUNNING')).not.toThrow();
  });

  it('allows progress rewind on FAILED', () => {
    expect(() => assertValidProgress(50, 10, 'FAILED')).not.toThrow();
  });

  it('throws ProgressRewindError for progress rewind during RUNNING', () => {
    expect(() => assertValidProgress(50, 10, 'RUNNING')).toThrow(ProgressRewindError);
  });

  it('allows equal progress (no rewind check for equal values)', () => {
    expect(() => assertValidProgress(50, 50, 'RUNNING')).not.toThrow();
  });

  it('includes correct context on progress rewind error', () => {
    try {
      assertValidProgress(50, 10, 'RUNNING');
    } catch (err) {
      if (err instanceof ProgressRewindError) {
        expect(err.context).toMatchObject({ current: 50, next: 10, status: 'RUNNING' });
        expect(err.code).toBe('PROGRESS_REWIND_ERROR');
        expect(err.message).toContain('Invalid progress rewind');
      } else {
        throw err;
      }
    }
  });
});
