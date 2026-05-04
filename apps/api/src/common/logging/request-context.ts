import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  startedAt: number;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getCurrentRequestId(): string | undefined {
  return requestContextStorage.getStore()?.requestId;
}

export function getRequestStartTime(): number | undefined {
  return requestContextStorage.getStore()?.startedAt;
}

export function withRequestContext<T>(context: RequestContext, fn: () => T): T {
  return requestContextStorage.run(context, fn);
}
