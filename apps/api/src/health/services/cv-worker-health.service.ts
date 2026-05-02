import { Injectable } from '@nestjs/common';
import { DependencyHealthDto } from '../dto/health-response.dto';

const ALLOWED_WORKER_HOSTS = ['localhost', '127.0.0.1'];

@Injectable()
export class CvWorkerHealthService {
  private readonly workerUrl: string;
  private readonly isAllowed: boolean;

  constructor() {
    this.workerUrl = process.env.CV_WORKER_URL ?? 'http://localhost:8000';
    this.isAllowed = this.#validateHost(this.workerUrl);
  }

  #validateHost(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ALLOWED_WORKER_HOSTS.includes(parsed.hostname);
    } catch {
      return false;
    }
  }

  async check(timeoutMs = 5000): Promise<DependencyHealthDto> {
    const start = Date.now();
    if (!this.workerUrl || this.workerUrl === 'mock') {
      return {
        status: 'up',
        responseTimeMs: Date.now() - start,
        details: { note: 'mock mode' },
      };
    }

    if (!this.isAllowed) {
      return {
        status: 'down',
        responseTimeMs: Date.now() - start,
        details: { error: 'CV_WORKER_URL must point to localhost' },
      };
    }

    try {
      const response = await fetch(`${this.workerUrl}/health`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        return {
          status: 'down',
          responseTimeMs: Date.now() - start,
          details: { httpStatus: response.status },
        };
      }
      const data = (await response.json()) as {
        version?: string;
        capabilities?: Record<string, unknown>;
      };
      return {
        status: 'up',
        responseTimeMs: Date.now() - start,
        details: { version: data.version, capabilities: data.capabilities },
      };
    } catch (err) {
      return {
        status: 'down',
        responseTimeMs: Date.now() - start,
        details: { error: (err as Error).message },
      };
    }
  }
}
