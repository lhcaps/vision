import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { resolveRepoRoot } from './repo-root';

describe('resolveRepoRoot', () => {
  const temporaryRoots: string[] = [];

  afterEach(() => {
    for (const root of temporaryRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function createWorkspace(): string {
    const root = mkdtempSync(join(tmpdir(), 'qlv-repo-root-'));
    temporaryRoots.push(root);
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
    return root;
  }

  it('uses a valid REPO_ROOT override', () => {
    const root = createWorkspace();

    expect(
      resolveRepoRoot({
        cwd: resolve(root, 'ignored'),
        repoRoot: root,
      }),
    ).toBe(resolve(root));
  });

  it('walks upward from apps/api to the workspace root', () => {
    const root = createWorkspace();
    const apiRoot = join(root, 'apps', 'api');
    mkdirSync(apiRoot, { recursive: true });

    expect(resolveRepoRoot({ cwd: apiRoot })).toBe(resolve(root));
  });

  it('rejects an invalid override instead of silently falling back', () => {
    const root = createWorkspace();
    const missingRoot = join(root, 'missing');

    expect(() =>
      resolveRepoRoot({
        cwd: root,
        repoRoot: missingRoot,
      }),
    ).toThrow(`REPO_ROOT does not point to a pnpm workspace: "${missingRoot}"`);
  });

  it('throws an actionable error when no workspace marker can be found', () => {
    const root = mkdtempSync(join(tmpdir(), 'qlv-no-workspace-'));
    temporaryRoots.push(root);

    expect(() => resolveRepoRoot({ cwd: root })).toThrow(
      `Cannot resolve repository root from cwd "${resolve(root)}"`,
    );
  });
});
