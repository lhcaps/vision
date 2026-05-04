import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { requestContextStorage, RequestContext } from '../logging/request-context';

// Extend Express Request to include requestId state
declare global {
  namespace Express {
    interface Request {
      state?: { requestId?: string };
    }
  }
}

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    response.setHeader('x-request-id', requestId);

    const ctx: RequestContext = {
      requestId,
      startedAt: Date.now(),
    };

    return new Observable((subscriber) => {
      requestContextStorage.run(ctx, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
