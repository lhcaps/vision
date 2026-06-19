import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const WORKSPACE_MARKER = 'pnpm-workspace.yaml';

export type RepoRootOptions = {
  cwd?: string;
  repoRoot?: string;
};

function isWorkspaceRoot(candidate: string): boolean {
  return existsSync(resolve(candidate, WORKSPACE_MARKER));
}

/**
 * Resolve the repository root containing the pnpm workspace marker.
 */
export function resolveRepoRoot(options: RepoRootOptions = {}): string {
  const cwd = resolve(options.cwd ?? process.cwd());
  const override = options.repoRoot?.trim();

  if (override) {
    const candidate = resolve(override);
    if (!isWorkspaceRoot(candidate)) {
      throw new Error(
        `REPO_ROOT does not point to a pnpm workspace: "${candidate}".`,
      );
    }
    return candidate;
  }

  let candidate = cwd;
  while (true) {
    if (isWorkspaceRoot(candidate)) return candidate;

    const parent = dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }

  throw new Error(
    `Cannot resolve repository root from cwd "${cwd}". ` +
      `Set REPO_ROOT to the directory containing ${WORKSPACE_MARKER}.`,
  );
}
