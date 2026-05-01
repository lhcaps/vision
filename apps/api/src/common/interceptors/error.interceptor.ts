import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
}

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      message = 'An unexpected error occurred.';
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      ...(error ? { error } : {}),
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(errorResponse);
  }
}
