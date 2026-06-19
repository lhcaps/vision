# Phase D.0 Dev Infrastructure Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the API, web authentication probe, contract catalog, and local development startup deterministic and diagnosable.

**Architecture:** Keep existing public routes and frontend behavior. Extract deterministic repository-root resolution into a pure helper, add regression tests before production changes, and use standalone health/smoke scripts as operational acceptance tests.

**Tech Stack:** Node.js 20+, TypeScript, NestJS 11, Next.js 16, Jest, Node test runner, pnpm.

---

## File Structure

- `apps/api/src/common/repo-root.ts`: pure repository-root resolution.
- `apps/api/src/common/repo-root.spec.ts`: root/cwd/override regression tests.
- `apps/api/src/modules/forms-contracts/forms-catalog.service.ts`: catalog loading and diagnostics.
- `apps/api/src/modules/forms-contracts/forms-catalog.service.spec.ts`: real temporary-directory catalog tests.
- `apps/api/src/app.controller.ts`: liveness route.
- `apps/api/src/app.controller.spec.ts`: liveness response test.
- `apps/web/src/lib/api-client.ts`: rejection-safe fetch observer.
- `apps/web/src/lib/auth-client.ts`: graceful auth probe and strict login.
- `apps/web/src/lib/auth-network.spec.ts`: API-down regression tests executed with `tsx`.
- `scripts/dev-healthcheck.mjs`: API/catalog/web diagnostics.
- `scripts/smoke-forms-runtime.mjs`: runtime contract invariants.
- `.env.example`: LAN CORS guidance.
- `package.json`: operational commands.

### Task 1: Repository root resolver

**Files:**
- Create: `apps/api/src/common/repo-root.ts`
- Create: `apps/api/src/common/repo-root.spec.ts`
- Modify: `apps/api/src/modules/forms-contracts/forms-catalog.service.ts`

- [ ] **Step 1: Write the failing resolver tests**

```ts
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveRepoRoot } from './repo-root';

describe('resolveRepoRoot', () => {
  it('uses a valid REPO_ROOT override', () => {
    const root = mkdtempSync(join(tmpdir(), 'qlv-root-'));
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []');
    expect(resolveRepoRoot({ cwd: 'C:\\ignored', repoRoot: root })).toBe(root);
  });

  it('walks upward from apps/api to the workspace root', () => {
    const root = mkdtempSync(join(tmpdir(), 'qlv-root-'));
    const api = join(root, 'apps', 'api');
    mkdirSync(api, { recursive: true });
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []');
    expect(resolveRepoRoot({ cwd: api })).toBe(root);
  });

  it('rejects an invalid override instead of silently falling back', () => {
    expect(() =>
      resolveRepoRoot({ cwd: process.cwd(), repoRoot: 'Z:\\missing-root' }),
    ).toThrow('REPO_ROOT');
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
pnpm --filter api test -- repo-root.spec.ts --runInBand
```

Expected: FAIL because `./repo-root` does not exist.

- [ ] **Step 3: Implement the pure resolver**

```ts
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type RepoRootOptions = {
  cwd?: string;
  repoRoot?: string;
};

const WORKSPACE_MARKER = 'pnpm-workspace.yaml';

function isWorkspaceRoot(candidate: string): boolean {
  return existsSync(resolve(candidate, WORKSPACE_MARKER));
}

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
    `Cannot resolve repository root from cwd "${cwd}". Set REPO_ROOT to the directory containing pnpm-workspace.yaml.`,
  );
}
```

- [ ] **Step 4: Inject the resolver into the catalog**

Use:

```ts
const repoRoot = resolveRepoRoot({
  cwd: process.cwd(),
  repoRoot: process.env.REPO_ROOT,
});
```

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
pnpm --filter api test -- repo-root.spec.ts --runInBand
pnpm --filter api exec tsc --noEmit
```

Expected: resolver tests pass and API typecheck exits 0.

### Task 2: Catalog diagnostics and precedence

**Files:**
- Create: `apps/api/src/modules/forms-contracts/forms-catalog.service.spec.ts`
- Modify: `apps/api/src/modules/forms-contracts/forms-catalog.service.ts`

- [ ] **Step 1: Write failing catalog behavior tests**

Use a temporary workspace and set `REPO_ROOT` before constructing the service.
Cover:

```ts
it('prefers a locked contract over the matching draft');
it('excludes reference documents');
it('throws when the contracts root is missing');
it('logs and skips an invalid JSON contract');
it('returns BM-004 as runtimeEligible=false while draft');
```

Each valid fixture must contain:

```ts
{
  sourceId: 'BM-001__fixture',
  templateCode: 'BM-001',
  templateTitle: 'Fixture',
  documentKind: 'form',
  status: 'locked',
  docxSlots: [],
  canonicalFields: [],
  renderBindings: []
}
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
pnpm --filter api test -- forms-catalog.service.spec.ts --runInBand
```

Expected: at least the missing-root and invalid-file diagnostic assertions fail.

- [ ] **Step 3: Make file loading return explicit results**

Replace nullable silent parsing with:

```ts
function loadContractFromPath(filePath: string): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<
      string,
      unknown
    >;
  } catch (error) {
    throw new Error(
      `Cannot parse form contract "${filePath}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
```

Catch per file in batch loading, log the exact error, and continue. Do not catch
the missing-root error.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
pnpm --filter api test -- forms-catalog.service.spec.ts --runInBand
pnpm --filter api exec tsc --noEmit
```

Expected: all catalog tests pass.

### Task 3: Liveness endpoint

**Files:**
- Modify: `apps/api/src/app.service.ts`
- Modify: `apps/api/src/app.controller.ts`
- Modify: `apps/api/src/app.controller.spec.ts`

- [ ] **Step 1: Add the failing controller test**

```ts
it('returns a stable simple health response', () => {
  expect(appController.getHealth()).toMatchObject({
    ok: true,
    service: 'QUANLYVKS API',
    env: expect.any(String),
  });
  expect(appController.getHealth().timestamp).toEqual(expect.any(String));
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
pnpm --filter api test -- app.controller.spec.ts --runInBand
```

Expected: FAIL when `getHealth()` is not present or has the wrong shape.

- [ ] **Step 3: Implement `GET /health`**

Return:

```ts
{
  ok: true,
  service: 'QUANLYVKS API',
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV ?? 'development',
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
pnpm --filter api test -- app.controller.spec.ts --runInBand
```

Expected: PASS.

### Task 4: Browser fetch and auth probe resilience

**Files:**
- Create: `apps/web/src/lib/auth-network.spec.ts`
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/web/src/lib/auth-client.ts`

- [ ] **Step 1: Write API-down regression tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchMe, login } from './auth-client';

test('fetchMe returns null when fetch rejects', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };
  try {
    assert.equal(await fetchMe(), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('login reports an actionable API connection error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };
  try {
    await assert.rejects(
      login('admin', 'secret'),
      /Không kết nối được API đăng nhập/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
```

- [ ] **Step 2: Verify RED against the branch baseline**

Run:

```powershell
pnpm --filter api exec tsx --test ../web/src/lib/auth-network.spec.ts
```

Expected: the `fetchMe` case fails on the unpatched baseline. If the dirty
working tree already contains the fix, temporarily compare with `git show
HEAD:apps/web/src/lib/auth-client.ts` and record that the test covers an
existing uncommitted fix.

- [ ] **Step 3: Complete the implementation**

`fetchMe()` catches fetch rejection and returns `null`. `login()` catches fetch
rejection and throws the Vietnamese connection message. The fetch observer
attaches a rejection handler to its `responsePromise` chain without altering
the original promise returned to the caller.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
pnpm --filter api exec tsx --test ../web/src/lib/auth-network.spec.ts
pnpm --filter web exec tsc --noEmit
```

Expected: both tests and web typecheck pass.

### Task 5: Health and runtime smoke scripts

**Files:**
- Modify: `scripts/dev-healthcheck.mjs`
- Create: `scripts/smoke-forms-runtime.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add script-level tests for response parsing**

Export `checkJsonEndpoint`, `checkTextEndpoint`, and
`validateFormsRuntimeCatalog` from their script modules. Add:

```js
test('web health accepts HTML instead of parsing JSON');
test('runtime smoke requires locked BM-001, BM-002, and BM-003');
test('runtime smoke rejects reference documents');
test('runtime smoke requires BM-004 to remain ineligible while draft');
```

Place the tests in:

```text
test/dev-healthcheck.test.mjs
test/smoke-forms-runtime.test.mjs
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --test test/dev-healthcheck.test.mjs test/smoke-forms-runtime.test.mjs
```

Expected: FAIL because exported helpers and the smoke module do not exist.

- [ ] **Step 3: Implement the scripts**

The health script must:

- check API JSON;
- check catalog JSON;
- check web using `response.text()`;
- use `AbortSignal.timeout()` or an `AbortController`;
- return exit code 1 when any required component fails.

The smoke script must validate exact catalog invariants and print each failed
invariant before exiting 1.

Add package scripts:

```json
"dev:health": "node scripts/dev-healthcheck.mjs",
"smoke:forms-runtime": "node scripts/smoke-forms-runtime.mjs"
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
node --test test/dev-healthcheck.test.mjs test/smoke-forms-runtime.test.mjs
```

Expected: PASS.

### Task 6: API-first startup and LAN CORS guidance

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Avoid a new dependency**

Use the existing health-check script in wait mode instead of adding `wait-on`:

```json
"dev:wait-api": "node scripts/dev-healthcheck.mjs --wait --api-only",
"dev:stable:api-first": "concurrently -n api,web -c blue,green \"pnpm dev:api:stable\" \"pnpm dev:wait-api && pnpm dev:web\""
```

This keeps dependency changes at zero while providing condition-based startup.

- [ ] **Step 2: Document LAN configuration**

Add:

```env
# Comma-separated allow-list. Add the exact LAN web origin when opening the
# frontend from another device, for example http://26.200.36.171:3000.
API_CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

- [ ] **Step 3: Log the effective development origins**

Refactor CORS parsing into a pure function and test:

```ts
expect(parseCorsOrigins('http://a.test,http://b.test')).toEqual([
  'http://a.test',
  'http://b.test',
]);
```

Log only the origin strings in development.

- [ ] **Step 4: Run D.0 static verification**

```powershell
pnpm --filter api exec tsc --noEmit
pnpm --filter web exec tsc --noEmit
pnpm --filter api test -- --runInBand
node --test test/dev-healthcheck.test.mjs test/smoke-forms-runtime.test.mjs
```

Expected: all commands exit 0.

### Task 7: Real runtime verification

**Files:**
- No production file changes.

- [ ] **Step 1: Start API**

```powershell
pnpm dev:api:stable
```

Expected: API listens on port 3001.

- [ ] **Step 2: Verify API endpoints**

```powershell
Invoke-RestMethod http://localhost:3001/api/v1/health
Invoke-RestMethod 'http://localhost:3001/api/v1/forms/catalog?status=locked'
```

Expected: health `ok=true`; catalog contains BM-001, BM-002, BM-003.

- [ ] **Step 3: Start web and run operational scripts**

```powershell
pnpm dev:web
pnpm dev:health
pnpm smoke:forms-runtime
```

Expected: both scripts exit 0.

- [ ] **Step 4: Commit D.0**

```powershell
git add package.json .env.example apps/api/src apps/web/src/lib scripts test
git commit -m "fix: stabilize contract runtime development"
```

