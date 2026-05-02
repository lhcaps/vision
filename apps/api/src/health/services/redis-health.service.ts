import { Injectable } from '@nestjs/common';
import { createConnection } from 'net';
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

    return new Promise((resolve) => {
      const socket = createConnection({ host, port, timeout: timeoutMs });

      socket.on('connect', () => {
        socket.destroy();
        resolve({ status: 'up', responseTimeMs: Date.now() - start });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          status: 'down',
          responseTimeMs: Date.now() - start,
          details: { error: 'connection timeout' },
        });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({
          status: 'down',
          responseTimeMs: Date.now() - start,
          details: { error: err.message },
        });
      });

      setTimeout(() => {
        socket.destroy();
        resolve({
          status: 'down',
          responseTimeMs: Date.now() - start,
          details: { error: 'timeout' },
        });
      }, timeoutMs);
    });
  }
}
