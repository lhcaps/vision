import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApplicationError } from './application-error';
import type { RequestWithContext } from './request-context.middleware';

type ErrorResponse = {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
  timestamp: string;
  path: string;
};

function getHttpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object' && 'message' in response) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(String).join(', ');
  }
  return exception.message || 'Request failed.';
}

@Catch()
export class ApplicationErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApplicationErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    const mapped = this.mapError(exception);
    const requestId = request.requestId ?? 'unavailable';
    const path = request.originalUrl ?? request.url ?? '';

    if (
      !(exception instanceof ApplicationError) &&
      !(exception instanceof HttpException)
    ) {
      const detail =
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : String(exception);
      this.logger.error(
        `${request.method ?? 'UNKNOWN'} ${path} failed requestId=${requestId}: ${detail}`,
      );
    }

    const body: ErrorResponse = {
      statusCode: mapped.statusCode,
      code: mapped.code,
      message: mapped.message,
      requestId,
      timestamp: new Date().toISOString(),
      path,
    };

    response.status(mapped.statusCode).json(body);
  }

  private mapError(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
  } {
    if (exception instanceof ApplicationError) {
      return {
        statusCode: exception.status,
        code: exception.code,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        code: 'HTTP_ERROR',
        message: getHttpExceptionMessage(exception),
      };
    }

    return {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    };
  }
}
