import pino from 'pino';
import { hostname } from 'os';
import { getCurrentRequestId } from './request-context';

export {
  getCurrentRequestId,
  getRequestStartTime,
  withRequestContext,
  requestContextStorage,
} from './request-context';

export { type RequestContext } from './request-context';

export const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info') as pino.Level;

const isProduction = process.env.NODE_ENV === 'production';

function buildLoggerOptions(name: string): pino.LoggerOptions {
  return {
    name,
    level: LOG_LEVEL,
    base: {
      pid: process.pid,
      hostname: hostname(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isProduction
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname,nodeVersion',
            },
          },
        }),
  };
}

const loggerCache = new Map<string, pino.Logger>();

export function createLogger(name: string): pino.Logger {
  const cached = loggerCache.get(name);
  if (cached) return cached;
  const logger = pino(buildLoggerOptions(name));
  loggerCache.set(name, logger);
  return logger;
}

export function createChildLogger(
  parent: pino.Logger,
  bindings: Record<string, unknown>
): pino.Logger {
  return parent.child(bindings);
}
