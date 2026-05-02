import { Injectable } from '@nestjs/common';
import { DependencyHealthDto } from '../dto/health-response.dto';

function getAllowedWorkerHosts(): string[] {
  const env = process.env.CV_WORKER_ALLOWED_HOSTS ?? '';
  if (!env) return ['localhost', '127.0.0.1'];
  return env.split(',').map((h) => h.trim()).filter(Boolean);
}

@Injectable()
export class CvWorkerHealthService {
  private readonly workerUrl: string;
  private readonly allowedHosts: string[];
  private readonly isAllowed: boolean;

  constructor() {
    this.allowedHosts = getAllowedWorkerHosts();
    this.workerUrl = process.env.CV_WORKER_URL ?? '';
    this.isAllowed = this.#validateHost(this.workerUrl);
  }

  #validateHost(url: string): boolean {
    if (!url || url === 'mock') return true;
    try {
      const parsed = new URL(url);
      return this.allowedHosts.includes(parsed.hostname);
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
        details: { error: `CV_WORKER_URL hostname must be one of: ${this.allowedHosts.join(', ')}` },
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
