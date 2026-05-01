export class DomainError extends Error {
  public readonly code: string;
  public readonly context: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InferenceJobTransitionError extends DomainError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 'INFERENCE_JOB_TRANSITION_ERROR', context);
    this.name = 'InferenceJobTransitionError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AnnotationGeometryError extends DomainError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 'ANNOTATION_GEOMETRY_ERROR', context);
    this.name = 'AnnotationGeometryError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PipelineValidationError extends DomainError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 'PIPELINE_VALIDATION_ERROR', context);
    this.name = 'PipelineValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DatasetVersionLockedError extends DomainError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 'DATASET_VERSION_LOCKED_ERROR', context);
    this.name = 'DatasetVersionLockedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ProgressRewindError extends DomainError {
  constructor(current: number, next: number, context: Record<string, unknown> = {}) {
    super(
      `Invalid progress rewind: ${current} -> ${next}`,
      'PROGRESS_REWIND_ERROR',
      { current, next, ...context }
    );
    this.name = 'ProgressRewindError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
