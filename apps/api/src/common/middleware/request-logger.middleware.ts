import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../logging/structured-logger';

const logger = createLogger('http');

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const requestId = (req.headers['x-request-id'] as string) ?? '-';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const durationMs = Date.now() - startTime;
      const logData = {
        requestId,
        method,
        url: originalUrl,
        statusCode,
        durationMs,
        userAgent: req.headers['user-agent'] ?? '-',
      };
      if (statusCode >= 500) {
        logger.error(logData, `${method} ${originalUrl} ${statusCode} ${durationMs}ms`);
      } else if (statusCode >= 400) {
        logger.warn(logData, `${method} ${originalUrl} ${statusCode} ${durationMs}ms`);
      } else {
        logger.info(logData, `${method} ${originalUrl} ${statusCode} ${durationMs}ms`);
      }
    });

    next();
  }
}
