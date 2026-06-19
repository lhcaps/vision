import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export type RequestWithContext = Request & {
  requestId?: string;
};

function readIncomingRequestId(request: Request): string | undefined {
  const value = request.headers[REQUEST_ID_HEADER];
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && VALID_REQUEST_ID.test(candidate) ? candidate : undefined;
}

/**
 * Attach a safe correlation ID to every HTTP request and response.
 */
export function requestContextMiddleware(
  request: RequestWithContext,
  response: Response,
  next: NextFunction,
): void {
  const requestId = readIncomingRequestId(request) ?? randomUUID();
  request.requestId = requestId;
  response.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
