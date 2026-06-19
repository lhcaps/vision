# Phase D.1 Backend Infrastructure Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish clean, testable backend boundaries for configuration, workspace paths, application errors, request context, readiness, and filesystem-backed form contracts.

**Architecture:** Introduce a global `InfrastructureModule` that supplies narrow configuration and path services. Move contract filesystem access behind an application repository port, keep controllers compatible, and map typed errors at the HTTP boundary.

**Tech Stack:** TypeScript, NestJS 11, Jest, Zod 4, Node filesystem APIs, Prisma 6.

---

## File Structure

```text
apps/api/src/
  common/
    application-error.ts
    application-error.spec.ts
    application-error.filter.ts
    request-context.middleware.ts
    request-context.middleware.spec.ts
  infrastructure/
    infrastructure.module.ts
    config/app-config.service.ts
    config/app-config.service.spec.ts
    paths/workspace-paths.service.ts
    paths/workspace-paths.service.spec.ts
  modules/forms-contracts/
    domain/form-contract.ts
    application/form-contract.repository.ts
    application/forms-catalog.service.ts
    infrastructure/file-form-contract.repository.ts
    infrastructure/file-form-contract.repository.spec.ts
    forms-contracts.module.ts
    forms-catalog.controller.ts
  modules/health/
    health.module.ts
    readiness.service.ts
    readiness.service.spec.ts
    health.controller.ts
```

### Task 1: Typed application errors

**Files:**
- Create: `apps/api/src/common/application-error.ts`
- Create: `apps/api/src/common/application-error.spec.ts`

- [ ] **Step 1: Write failing error-shape tests**

```ts
import {
  ConfigurationError,
  InfrastructureError,
  InvalidInputError,
  ResourceNotFoundError,
} from './application-error';

describe('ApplicationError', () => {
  it.each([
    [new InvalidInputError('INVALID_INPUT', 'Bad input'), 400],
    [new ResourceNotFoundError('FORM_NOT_FOUND', 'Missing'), 404],
    [new ConfigurationError('CONFIGURATION_ERROR', 'Invalid config'), 500],
    [new InfrastructureError('CONTRACT_IO_ERROR', 'Read failed'), 503],
  ])('stores a stable code and status', (error, status) => {
    expect(error.status).toBe(status);
    expect(error.code).toEqual(expect.any(String));
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
pnpm --filter api test -- application-error.spec.ts --runInBand
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement narrow error classes**

```ts
export abstract class ApplicationError extends Error {
  protected constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
```

Implement the four tested subclasses plus `ConflictError` with status 409.

- [ ] **Step 4: Verify GREEN**

```powershell
pnpm --filter api test -- application-error.spec.ts --runInBand
```

Expected: PASS.

### Task 2: Configuration boundary

**Files:**
- Create: `apps/api/src/infrastructure/config/app-config.service.ts`
- Create: `apps/api/src/infrastructure/config/app-config.service.spec.ts`

- [ ] **Step 1: Write failing configuration tests**

Cover:

```ts
it('parses comma-separated CORS origins without blanks');
it('adds loopback origins in development');
it('rejects wildcard CORS in production');
it('rejects an insecure production auth cookie');
it('returns the configured repo-root override');
```

Construct with an injected object:

```ts
const config = new AppConfigService({
  NODE_ENV: 'development',
  API_CORS_ORIGIN: 'http://a.test, http://b.test',
});
```

- [ ] **Step 2: Verify RED**

```powershell
pnpm --filter api test -- app-config.service.spec.ts --runInBand
```

Expected: FAIL because `AppConfigService` does not exist.

- [ ] **Step 3: Implement `AppConfigService`**

The constructor accepts `NodeJS.ProcessEnv = process.env`. Expose getters:

```ts
environment
apiPort
apiGlobalPrefix
corsOrigins
repoRootOverride
storageRoot
isSwaggerEnabled
```

Expose `assertProductionSafety()` and call it during bootstrap.

- [ ] **Step 4: Verify GREEN**

```powershell
pnpm --filter api test -- app-config.service.spec.ts --runInBand
```

Expected: PASS.

### Task 3: Workspace path service

**Files:**
- Create: `apps/api/src/infrastructure/paths/workspace-paths.service.ts`
- Create: `apps/api/src/infrastructure/paths/workspace-paths.service.spec.ts`
- Modify: `apps/api/src/common/repo-root.ts`

- [ ] **Step 1: Write failing path tests**

```ts
expect(paths.contractsRoot).toBe(
  join(repoRoot, 'docs', 'audit', 'docx', 'contracts'),
);
expect(paths.normalizedTemplatesRoot).toBe(
  join(repoRoot, 'storage', 'templates', 'normalized-docx'),
);
expect(paths.generatedDocumentsRoot).toBe(
  join(repoRoot, 'storage', 'generated'),
);
```

Also test that a relative `STORAGE_ROOT=./custom-storage` resolves from the
repository root, not the process working directory.

- [ ] **Step 2: Verify RED**

```powershell
pnpm --filter api test -- workspace-paths.service.spec.ts --runInBand
```

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement the service**

Inject `AppConfigService`, resolve the repository root once in the constructor,
and expose readonly absolute path getters. Do not perform filesystem writes.

- [ ] **Step 4: Verify GREEN**

```powershell
pnpm --filter api test -- workspace-paths.service.spec.ts --runInBand
```

Expected: PASS.

### Task 4: Request correlation and HTTP error mapping

**Files:**
- Create: `apps/api/src/common/request-context.middleware.ts`
- Create: `apps/api/src/common/request-context.middleware.spec.ts`
- Create: `apps/api/src/common/application-error.filter.ts`
- Create: `apps/api/src/common/application-error.filter.spec.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Write failing request-ID tests**

Test:

```ts
it('preserves a valid x-request-id');
it('generates an id when the header is absent');
it('returns x-request-id in the response');
```

The middleware attaches `request.requestId`.

- [ ] **Step 2: Write failing filter tests**

Given `new InfrastructureError('CONTRACT_IO_ERROR', 'Contract store unavailable')`,
assert the response body contains:

```ts
{
  statusCode: 503,
  code: 'CONTRACT_IO_ERROR',
  message: 'Contract store unavailable',
  requestId: 'req-123',
  path: '/api/v1/forms/catalog',
}
```

- [ ] **Step 3: Verify RED**

```powershell
pnpm --filter api test -- request-context.middleware.spec.ts application-error.filter.spec.ts --runInBand
```

Expected: FAIL because both modules are missing.

- [ ] **Step 4: Implement middleware and filter**

Use `randomUUID()` for generated IDs. Accept incoming IDs only when they match:

```ts
/^[A-Za-z0-9._:-]{1,128}$/
```

The filter logs unexpected errors with request ID and returns a generic
`INTERNAL_ERROR` response without stack traces.

- [ ] **Step 5: Register at the HTTP boundary**

In bootstrap:

```ts
app.use(requestContextMiddleware);
app.useGlobalFilters(new ApplicationErrorFilter());
```

- [ ] **Step 6: Verify GREEN**

```powershell
pnpm --filter api test -- request-context.middleware.spec.ts application-error.filter.spec.ts --runInBand
```

Expected: PASS.

### Task 5: Contract domain model and repository port

**Files:**
- Create: `apps/api/src/modules/forms-contracts/domain/form-contract.ts`
- Create: `apps/api/src/modules/forms-contracts/application/form-contract.repository.ts`
- Move compatible types from: `apps/api/src/modules/forms-contracts/forms-catalog.types.ts`

- [ ] **Step 1: Define the domain types**

Move `DocxSlot`, `CanonicalField`, `RenderBinding`, `LoadedFormContract`, and
`FormCatalogQuery` into the domain file. Keep the public response shape
unchanged.

- [ ] **Step 2: Define the repository port**

```ts
export type ContractRepositoryStatus = {
  ready: boolean;
  contractsRoot: string;
  lockedCount: number;
  draftCount: number;
  invalidFiles: Array<{ path: string; message: string }>;
};

export abstract class FormContractRepository {
  abstract findByIdentifier(
    identifier: string,
  ): Promise<LoadedFormContract | null>;
  abstract list(): Promise<LoadedFormContract[]>;
  abstract inspect(): Promise<ContractRepositoryStatus>;
}
```

- [ ] **Step 3: Run typecheck**

```powershell
pnpm --filter api exec tsc --noEmit
```

Expected: FAIL until existing imports are redirected, then PASS without changing
controller response fields.

### Task 6: Filesystem repository adapter

**Files:**
- Create: `apps/api/src/modules/forms-contracts/infrastructure/file-form-contract.repository.ts`
- Create: `apps/api/src/modules/forms-contracts/infrastructure/file-form-contract.repository.spec.ts`

- [ ] **Step 1: Write failing adapter tests**

Use temporary directories and cover:

```ts
it('loads locked contracts before drafts');
it('finds by source ID and template code');
it('excludes reference contracts');
it('reports invalid JSON with its path');
it('reports not ready when the contracts root is absent');
it('invalidates cached data when file mtime changes');
```

- [ ] **Step 2: Verify RED**

```powershell
pnpm --filter api test -- file-form-contract.repository.spec.ts --runInBand
```

Expected: FAIL because the adapter is missing.

- [ ] **Step 3: Implement validation**

Use the existing `zod` dependency to validate required raw fields:

```ts
const rawContractSchema = z.object({
  sourceId: z.string().min(1),
  templateCode: z.string().regex(/^BM-\d{3}$/),
  templateTitle: z.string(),
  documentKind: z.enum(['form', 'reference']),
  status: z.enum(['locked', 'draft']),
  docxSlots: z.array(z.unknown()).default([]),
  canonicalFields: z.array(z.unknown()).default([]),
  renderBindings: z.array(z.unknown()).default([]),
}).passthrough();
```

Normalize only validated form contracts. Store invalid-file diagnostics for
`inspect()`.

- [ ] **Step 4: Implement metadata cache**

Cache by absolute file path with `mtimeMs`, size, and parsed result. Re-read
when either metadata value changes.

- [ ] **Step 5: Verify GREEN**

```powershell
pnpm --filter api test -- file-form-contract.repository.spec.ts --runInBand
```

Expected: PASS.

### Task 7: Catalog application service

**Files:**
- Create: `apps/api/src/modules/forms-contracts/application/forms-catalog.service.ts`
- Modify: `apps/api/src/modules/forms-contracts/forms-catalog.controller.ts`
- Modify: `apps/api/src/modules/forms-contracts/forms-contracts.module.ts`
- Delete after migration: `apps/api/src/modules/forms-contracts/forms-catalog.service.ts`

- [ ] **Step 1: Write failing use-case tests**

Cover:

```ts
it('filters contracts by status');
it('filters contracts by stage');
it('searches code, title, and stage label');
it('returns locked details by template code');
```

Use an in-memory fake implementing `FormContractRepository`.

- [ ] **Step 2: Verify RED**

```powershell
pnpm --filter api test -- forms-catalog.service.spec.ts --runInBand
```

Expected: FAIL against the new application service.

- [ ] **Step 3: Implement the use case**

The service depends only on `FormContractRepository`. It maps domain contracts
to the existing `FormCatalogItem` response and applies query filters.

- [ ] **Step 4: Compose the module**

```ts
providers: [
  FormsCatalogService,
  {
    provide: FormContractRepository,
    useClass: FileFormContractRepository,
  },
]
```

- [ ] **Step 5: Verify compatibility**

```powershell
pnpm --filter api test -- forms-catalog.service.spec.ts --runInBand
pnpm --filter api exec tsc --noEmit
```

Expected: tests and typecheck pass.

### Task 8: Readiness endpoint

**Files:**
- Create: `apps/api/src/modules/health/readiness.service.ts`
- Create: `apps/api/src/modules/health/readiness.service.spec.ts`
- Create: `apps/api/src/modules/health/health.controller.ts`
- Create: `apps/api/src/modules/health/health.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write failing readiness tests**

Test:

```ts
it('is ready when BM-001, BM-002, and BM-003 are locked');
it('is not ready when a required locked contract is missing');
it('is not ready when a reference contract leaks into the catalog');
it('includes contract repository diagnostics');
```

- [ ] **Step 2: Verify RED**

```powershell
pnpm --filter api test -- readiness.service.spec.ts --runInBand
```

Expected: FAIL because readiness does not exist.

- [ ] **Step 3: Implement readiness**

Return:

```ts
{
  ok: boolean,
  service: 'QUANLYVKS API',
  timestamp: string,
  checks: {
    contracts: {
      ok: boolean,
      lockedCount: number,
      draftCount: number,
      invalidFileCount: number,
      requiredLocked: ['BM-001', 'BM-002', 'BM-003'],
    },
  },
}
```

Expose `GET /ready`.

- [ ] **Step 4: Verify GREEN**

```powershell
pnpm --filter api test -- readiness.service.spec.ts --runInBand
pnpm --filter api exec tsc --noEmit
```

Expected: PASS.

### Task 9: Infrastructure composition

**Files:**
- Create: `apps/api/src/infrastructure/infrastructure.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Create a global infrastructure module**

```ts
@Global()
@Module({
  providers: [AppConfigService, WorkspacePathsService],
  exports: [AppConfigService, WorkspacePathsService],
})
export class InfrastructureModule {}
```

- [ ] **Step 2: Replace bootstrap environment parsing**

Create the Nest app, resolve `AppConfigService`, run
`assertProductionSafety()`, configure CORS and Swagger using typed getters, and
log the effective development origins.

- [ ] **Step 3: Verify static quality**

```powershell
pnpm --filter api exec tsc --noEmit
pnpm --filter api test -- --runInBand
pnpm --filter api exec eslint "src/**/*.ts" "test/**/*.ts"
```

Expected: all commands exit 0.

### Task 10: D.1 end-to-end verification

**Files:**
- No production file changes.

- [ ] **Step 1: Run contract pipeline tests**

```powershell
node --test test/docx-contract/*.test.mjs
```

Expected: all tests pass.

- [ ] **Step 2: Run builds**

```powershell
pnpm --filter api exec tsc --noEmit
pnpm --filter web exec tsc --noEmit
pnpm build
```

Expected: all commands exit 0. Record exact pre-existing failures if any.

- [ ] **Step 3: Verify real readiness and catalog**

```powershell
Invoke-RestMethod http://localhost:3001/api/v1/health
Invoke-RestMethod http://localhost:3001/api/v1/ready
Invoke-RestMethod 'http://localhost:3001/api/v1/forms/catalog?status=locked'
pnpm dev:health
pnpm smoke:forms-runtime
```

Expected: readiness `ok=true`, locked catalog contains exactly the expected
runtime contracts, and operational scripts exit 0.

- [ ] **Step 4: Commit D.1**

```powershell
git add apps/api/src docs/superpowers package.json scripts test
git commit -m "refactor: establish backend infrastructure boundaries"
```
