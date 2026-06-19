import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { AppConfigService } from '../config/app-config.service';
import { WorkspacePathsService } from './workspace-paths.service';

describe('WorkspacePathsService', () => {
  const temporaryRoots: string[] = [];

  afterEach(() => {
    for (const root of temporaryRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function createWorkspace(storageRoot = './storage') {
    const repoRoot = mkdtempSync(join(tmpdir(), 'qlv-paths-'));
    temporaryRoots.push(repoRoot);
    writeFileSync(
      join(repoRoot, 'pnpm-workspace.yaml'),
      'packages: []\n',
      'utf8',
    );

    const config = new AppConfigService({
      REPO_ROOT: repoRoot,
      STORAGE_ROOT: storageRoot,
    });
    return {
      repoRoot: resolve(repoRoot),
      paths: new WorkspacePathsService(config),
    };
  }

  it('resolves contract and template paths from the repository root', () => {
    const { repoRoot, paths } = createWorkspace();

    expect(paths.repoRoot).toBe(repoRoot);
    expect(paths.contractsRoot).toBe(
      join(repoRoot, 'docs', 'audit', 'docx', 'contracts'),
    );
    expect(paths.normalizedTemplatesRoot).toBe(
      join(repoRoot, 'storage', 'templates', 'normalized-docx'),
    );
    expect(paths.generatedDocumentsRoot).toBe(
      join(repoRoot, 'storage', 'generated'),
    );
    expect(paths.importsTempRoot).toBe(
      join(repoRoot, 'storage', 'imports', '_tmp'),
    );
  });

  it('resolves a relative storage root from the repository, not cwd', () => {
    const { repoRoot, paths } = createWorkspace('./custom-storage');

    expect(paths.storageRoot).toBe(join(repoRoot, 'custom-storage'));
  });

  it('preserves an absolute storage root', () => {
    const absoluteStorage = resolve(tmpdir(), 'qlv-absolute-storage');
    const { paths } = createWorkspace(absoluteStorage);

    expect(isAbsolute(paths.storageRoot)).toBe(true);
    expect(paths.storageRoot).toBe(absoluteStorage);
  });
});
