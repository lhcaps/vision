import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';

export interface HealthInfo {
  status: 'ok' | 'degraded';
  name: string;
  version: string;
  description: string;
  uptimeSeconds: number;
  timestamp: string;
  docs: string;
  apiPrefix: string;
}

@Injectable()
export class AppService {
  private readonly startedAt = Date.now();

  private readPackageInfo(): {
    name: string;
    version: string;
    description: string;
  } {
    // package.json ở cùng cấp với dist/src; đọc từ process.cwd (root api) cho chắc.
    try {
      const pkgPath = join(process.cwd(), 'package.json');
      const raw = readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(raw) as {
        name?: string;
        version?: string;
        description?: string;
      };
      return {
        name: pkg.name ?? 'api',
        version: pkg.version ?? '0.0.0',
        description: pkg.description ?? '',
      };
    } catch {
      return { name: 'api', version: '0.0.0', description: '' };
    }
  }

  getHealth(): HealthInfo {
    const pkg = this.readPackageInfo();
    const apiPrefix = process.env.API_GLOBAL_PREFIX ?? 'api/v1';
    return {
      status: 'ok',
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      docs: '/api/docs',
      apiPrefix,
    };
  }
}
