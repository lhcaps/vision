/**
 * Domain layer error classes for VisionFlow Studio.
 * All domain errors extend the base DomainError class for easy instanceof checking.
 */

export interface DomainErrorContext {
  readonly [key: string]: unknown;
}

/**
 * Base class for all domain errors.
 * Provides structured context for debugging and error handling.
 */
export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly context: DomainErrorContext;

  constructor(message: string, code: string, context: DomainErrorContext = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}

/**
 * Thrown when an inference job state transition is invalid.
 * Job lifecycle: QUEUED → RUNNING → SUCCEEDED/FAILED/CANCELLED
 */
export class InferenceJobTransitionError extends DomainError {
  constructor(
    message: string,
    context: {
      from?: string;
      to?: string;
      validTransitions?: readonly string[];
      current?: number;
      next?: number;
    } = {}
  ) {
    super(message, 'INFERENCE_JOB_TRANSITION_ERROR', context);
  }
}

/**
 * Thrown when annotation geometry is invalid.
 * This includes invalid bounding boxes, masks, or keypoints.
 */
export class AnnotationGeometryError extends DomainError {
  constructor(
    message: string,
    context: {
      annotationId?: string;
      assetId?: string;
      geometryType?: string;
      validationError?: string;
    } = {}
  ) {
    super(message, 'ANNOTATION_GEOMETRY_ERROR', context);
  }
}

/**
 * Thrown when a pipeline graph fails validation.
 * Pipeline graphs must be acyclic, have valid node/edge references, etc.
 */
export class PipelineValidationError extends DomainError {
  constructor(
    message: string,
    context: {
      pipelineId?: string;
      validationErrors?: readonly string[];
      nodeId?: string;
      edgeId?: string;
    } = {}
  ) {
    super(message, 'PIPELINE_VALIDATION_ERROR', context);
  }
}

/**
 * Thrown when attempting to mutate a locked dataset version.
 * Dataset versions become immutable once locked.
 */
export class DatasetVersionLockedError extends DomainError {
  constructor(
    message: string,
    context: {
      versionId?: string;
      datasetId?: string;
      projectId?: string;
      currentStatus?: string;
    } = {}
  ) {
    super(message, 'DATASET_VERSION_LOCKED_ERROR', context);
  }
}
