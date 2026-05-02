import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { createLogger, getCurrentRequestId } from '../logging/structured-logger';

const logger = createLogger('GlobalErrorFilter');

interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  requestId?: string;
}

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const requestId = getCurrentRequestId();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred.';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as { message?: unknown; error?: string };
        message = typeof resp.message === 'string' ? resp.message : String(resp.message ?? message);
        error = typeof resp.error === 'string' ? resp.error : undefined;
      }
    } else if (exception instanceof Error) {
      logger.error(
        { requestId, stack: exception.stack, name: exception.name },
        `Unhandled exception: ${exception.message}`,
      );
      message = 'An unexpected error occurred.';
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      ...(error ? { error } : {}),
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    };

    response.status(statusCode).json(errorResponse);
  }
}
