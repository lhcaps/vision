import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { DependencyHealthDto } from '../dto/health-response.dto';

@Injectable()
export class RedisHealthService {
  private readonly redisConfigured: boolean;

  constructor() {
    this.redisConfigured = !!(
      process.env.REDIS_HOST || process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING
    );
  }

  async check(timeoutMs = 5000): Promise<DependencyHealthDto> {
    const start = Date.now();
    if (!this.redisConfigured) {
      return { status: 'up', responseTimeMs: 0, details: { note: 'memory mode' } };
    }

    const host = process.env.REDIS_HOST ?? '127.0.0.1';
    const port = Number(process.env.REDIS_PORT ?? 6379);
    const password = process.env.REDIS_PASSWORD || undefined;

    const redis = new Redis({
      host,
      port,
      password,
      connectTimeout: timeoutMs,
      lazyConnect: true,
    });

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        redis.disconnect();
        resolve({
          status: 'down',
          responseTimeMs: Date.now() - start,
          details: { error: 'timeout' },
        });
      }, timeoutMs);

      redis.on('error', (err) => {
        clearTimeout(timer);
        redis.disconnect();
        resolve({
          status: 'down',
          responseTimeMs: Date.now() - start,
          details: { error: err.message },
        });
      });

      redis.connect()
        .then(() => redis.ping())
        .then((reply) => {
          clearTimeout(timer);
          redis.disconnect();
          if (reply === 'PONG') {
            resolve({ status: 'up', responseTimeMs: Date.now() - start });
          } else {
            resolve({
              status: 'down',
              responseTimeMs: Date.now() - start,
              details: { error: `unexpected PING reply: ${reply}` },
            });
          }
        })
        .catch((err: Error) => {
          clearTimeout(timer);
          redis.disconnect();
          resolve({
            status: 'down',
            responseTimeMs: Date.now() - start,
            details: { error: err.message },
          });
        });
    });
  }
}
