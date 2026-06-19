import { Injectable } from '@nestjs/common';
import { isAbsolute, join, resolve } from 'node:path';
import { resolveRepoRoot } from '../../common/repo-root';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class WorkspacePathsService {
  readonly repoRoot: string;
  readonly contractsRoot: string;
  readonly storageRoot: string;
  readonly normalizedTemplatesRoot: string;
  readonly generatedDocumentsRoot: string;
  readonly importsTempRoot: string;

  constructor(config: AppConfigService) {
    this.repoRoot = resolveRepoRoot({
      cwd: process.cwd(),
      repoRoot: config.repoRootOverride,
    });
    this.contractsRoot = join(
      this.repoRoot,
      'docs',
      'audit',
      'docx',
      'contracts',
    );
    this.storageRoot = isAbsolute(config.storageRoot)
      ? resolve(config.storageRoot)
      : resolve(this.repoRoot, config.storageRoot);
    this.normalizedTemplatesRoot = join(
      this.storageRoot,
      'templates',
      'normalized-docx',
    );
    this.generatedDocumentsRoot = join(this.storageRoot, 'generated');
    this.importsTempRoot = join(this.storageRoot, 'imports', '_tmp');
  }
}
