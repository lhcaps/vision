import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from './infrastructure/config/app-config.service';
import { WorkspacePathsService } from './infrastructure/paths/workspace-paths.service';

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

export interface SimpleHealthInfo {
  ok: boolean;
  service: string;
  timestamp: string;
  env: string;
}

@Injectable()
export class AppService {
  private readonly startedAt = Date.now();

  constructor(
    private readonly config: AppConfigService,
    private readonly paths: WorkspacePathsService,
  ) {}

  private readPackageInfo(): {
    name: string;
    version: string;
    description: string;
  } {
    // Resolve from the workspace root so health metadata is independent of cwd.
    try {
      const pkgPath = join(this.paths.repoRoot, 'apps', 'api', 'package.json');
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
    const apiPrefix = this.config.apiGlobalPrefix;
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

  getSimpleHealth(): SimpleHealthInfo {
    return {
      ok: true,
      service: 'QUANLYVKS API',
      timestamp: new Date().toISOString(),
      env: this.config.environment,
    };
  }
}
