/**
 * Base error for failures that application use cases intentionally expose.
 */
export abstract class ApplicationError extends Error {
  protected constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidInputError extends ApplicationError {
  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, 400, cause);
  }
}

export class ResourceNotFoundError extends ApplicationError {
  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, 404, cause);
  }
}

export class ConflictError extends ApplicationError {
  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, 409, cause);
  }
}

export class ConfigurationError extends ApplicationError {
  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, 500, cause);
  }
}

export class InfrastructureError extends ApplicationError {
  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, 503, cause);
  }
}
