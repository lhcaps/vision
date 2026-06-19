# QUANLYVKS Backend Clean Architecture Foundation Design

**Date:** 2026-06-19  
**Status:** Approved  
**Scope:** Phase D.0 and Phase D.1  
**Repository:** `D:\Study\Project\QLLaw-main`

## 1. Objective

Turn the current NestJS backend into a stable modular monolith with explicit
application and infrastructure boundaries, while preserving the existing API
and document-generation behavior.

The first delivery covers:

1. Phase D.0: make local API/web development, authentication probing, health
   checks, CORS, and the DOCX contract catalog reliable.
2. Phase D.1: establish reusable backend infrastructure for configuration,
   workspace paths, application errors, HTTP error mapping, request
   correlation, health/readiness, and filesystem-backed contract access.

This delivery does not rewrite the 213 forms or lock additional contracts.

## 2. Verified Baseline

The repository already contains a DOCX-first contract pipeline:

```text
source DOC/DOCX
  -> scripts/docx-contract/*
  -> docs/audit/docx/contracts/*.contract.draft.json
  -> docs/audit/docx/contracts/locked/*.contract.locked.json
  -> forms catalog API
  -> contract-driven web form schema
```

Current corpus:

- 213 form contracts.
- BM-001, BM-002, and BM-003 are locked and runtime-eligible.
- 210 contracts are draft and must remain non-production.
- Two reference documents are excluded from form runtime.

The existing `DocumentRendererService` remains a major migration target:

- 33,702 lines.
- 160 BM codes embedded in one service.
- Database, filesystem, payload composition, template-specific policy, and
  DOCX rendering are coupled.

Phase D.1 creates the boundaries needed to extract this service safely in
later phases. It does not perform a big-bang renderer rewrite.

## 3. Chosen Strategy

Use a modular-monolith strangler migration.

The current public API remains stable. New infrastructure is introduced behind
interfaces, then existing modules are moved behind those interfaces one use
case at a time.

Rejected alternatives:

- Big-bang rewrite: too likely to lose undocumented BM-specific behavior.
- Patch-only stabilization: fixes immediate failures but preserves the current
  architectural coupling.

## 4. Target Dependency Rule

```text
presentation (Nest controllers, filters, middleware)
    -> application (use cases and ports)
        -> domain (models, policies, errors)

infrastructure (Prisma, filesystem, DOCX, environment)
    -> application ports
```

Domain and application code must not import:

- `@nestjs/*`
- `@prisma/client`
- Node filesystem APIs
- DOCX rendering libraries
- process-global environment access

Nest modules compose application ports with infrastructure adapters.

## 5. Phase D.0 Design

### 5.1 Authentication and network handling

The global browser fetch wrapper may observe API responses to emit a global
unauthorized event, but its observer promise must never create a second
unhandled rejection.

`fetchMe()` is a best-effort session probe:

- network/CORS/offline failures return `null`;
- HTTP 401 returns `null`;
- malformed or non-success responses return `null`.

Interactive login remains strict and returns a clear connection error when the
API cannot be reached.

### 5.2 Repository root resolution

All D.0 contract catalog paths resolve from a single deterministic helper:

1. Use `REPO_ROOT` when set and valid.
2. Use the current working directory when it contains `pnpm-workspace.yaml`.
3. Walk upward from the current working directory until the workspace marker
   is found.
4. Throw an actionable error when no repository root can be resolved.

The contract root is always:

```text
<repo-root>/docs/audit/docx/contracts
```

Invalid contract files may be skipped individually with a warning containing
the exact path and parse/validation error. A missing contract root is fatal and
must never become an unexplained empty catalog.

### 5.3 Health and smoke checks

Endpoints:

- `GET /api/v1`: existing detailed service information.
- `GET /api/v1/health`: stable liveness response.
- `GET /api/v1/ready`: D.1 readiness response.

Local scripts:

- `pnpm dev:health`: check API health, locked catalog, and web reachability.
- `pnpm smoke:forms-runtime`: validate runtime contract invariants.
- `pnpm dev:stable:api-first`: start web only after API health succeeds.

The health script treats the web response as text/HTML, not JSON.

### 5.4 CORS

`API_CORS_ORIGIN` remains a comma-separated allow-list.

- Loopback origins are allowed automatically in development.
- LAN origins must be explicitly configured.
- Wildcard CORS remains forbidden in production.
- Development startup logs the effective allow-list without exposing secrets.

## 6. Phase D.1 Infrastructure

### 6.1 Configuration

`AppConfigService` is the only backend service responsible for interpreting
environment values used by shared infrastructure.

It exposes narrow values:

- environment name;
- API port and global prefix;
- allowed CORS origins;
- repository root override;
- storage root;
- Swagger enablement;
- authentication cookie safety settings.

Invalid production security settings fail during bootstrap.

### 6.2 Workspace paths

`WorkspacePathsService` resolves and validates paths relative to the repository
root:

- contracts root;
- storage root;
- normalized templates root;
- generated documents root;
- temporary import root.

Consumers no longer duplicate `path.resolve(process.cwd(), '..', '..')`.

Path resolution is deterministic and testable with injected environment and
working-directory values.

### 6.3 Application errors

Application and infrastructure code use typed errors:

- `ResourceNotFoundError`
- `InvalidInputError`
- `ConflictError`
- `InfrastructureError`
- `ConfigurationError`

An HTTP exception filter maps these errors to a stable response:

```json
{
  "statusCode": 500,
  "code": "INFRASTRUCTURE_ERROR",
  "message": "Actionable public message",
  "requestId": "request correlation id",
  "timestamp": "ISO-8601 timestamp",
  "path": "/api/v1/..."
}
```

Unexpected exceptions are logged with request context while the response avoids
stack traces and internal paths.

### 6.4 Request correlation

Every HTTP request receives an `x-request-id`:

- preserve a valid incoming request ID;
- otherwise generate a UUID;
- return it in the response header;
- expose it to the exception filter and structured logs.

### 6.5 Contract repository boundary

Application port:

```ts
export abstract class FormContractRepository {
  abstract findByIdentifier(
    identifier: string,
  ): Promise<LoadedFormContract | null>;

  abstract list(
    query?: FormCatalogQuery,
  ): Promise<LoadedFormContract[]>;

  abstract inspect(): Promise<ContractRepositoryStatus>;
}
```

Filesystem adapter responsibilities:

- discover locked and draft JSON files;
- validate raw JSON before normalization;
- prefer locked over draft for the same template code;
- exclude reference documents;
- report invalid files with exact paths;
- cache parsed contracts using file metadata;
- expose repository readiness status.

The catalog application service performs filtering and presentation mapping. It
does not read the filesystem directly.

### 6.6 Health semantics

Liveness means the Node process can answer requests.

Readiness verifies:

- repository root resolved;
- contract directory exists;
- contract repository can load BM-001, BM-002, and BM-003 as locked;
- no reference document leaks into the runtime catalog.

Database readiness is reported separately so local catalog development can
still diagnose filesystem problems when MariaDB is unavailable.

## 7. Contract Runtime Flow

```text
HTTP request
  -> FormsCatalogController
  -> ListFormContractsUseCase / GetFormContractUseCase
  -> FormContractRepository
  -> FileSystemFormContractRepository
  -> WorkspacePathsService
  -> docs/audit/docx/contracts
```

Later renderer migration:

```text
RenderDocumentUseCase
  -> FormContractRepository
  -> RenderPolicyRegistry
       -> ContractDrivenPolicy
       -> LegacyBmPolicy adapters
  -> DocxRenderEngine
  -> DocumentStorage
```

This allows BM-specific logic to leave `DocumentRendererService` incrementally
without changing controller routes.

## 8. Compatibility

The following public behavior remains unchanged:

- API global prefix defaults to `api/v1`.
- Existing health endpoint at `GET /api/v1` remains available.
- Existing form catalog routes and response fields remain available.
- Existing login/session cookie behavior remains available.
- Existing document generation routes remain available.
- Draft contracts remain visible for review but are not runtime-eligible.

No Prisma schema or database migration is part of D.0/D.1.

## 9. Testing Strategy

### Unit tests

- repository-root resolution under root, `apps/api`, invalid override, and
  missing workspace cases;
- environment parsing and production safety validation;
- application-error HTTP mapping;
- request ID preservation/generation;
- contract validation, locked precedence, reference exclusion, and invalid JSON
  reporting;
- catalog filtering and detail lookup.

### Integration tests

- Nest testing module with temporary contract directory;
- `/health`, `/ready`, `/forms/catalog`, and `/forms/catalog/:sourceId`;
- API-down authentication probe behavior;
- fetch observer rejection handling.

### Runtime smoke checks

- API liveness;
- locked catalog contains BM-001/BM-002/BM-003;
- BM-004 remains non-runtime-eligible while draft;
- no reference document appears;
- web is reachable.

## 10. Operational Quality Gates

Required before reporting D.0/D.1 complete:

```powershell
pnpm --filter api exec tsc --noEmit
pnpm --filter web exec tsc --noEmit
pnpm --filter api test -- --runInBand
node --test test/docx-contract/*.test.mjs
pnpm --filter api exec eslint "src/**/*.ts" "test/**/*.ts"
pnpm --filter web exec eslint "src/**/*.{ts,tsx}"
pnpm build
pnpm dev:health
pnpm smoke:forms-runtime
```

Runtime checks must use a real local API and web process. Any pre-existing
failure outside the touched scope must be reported with the exact command and
error rather than hidden.

## 11. Migration Boundaries

D.0/D.1 deliberately do not:

- lock more contracts;
- edit 213 form UIs manually;
- change Prisma schema;
- rewrite `DocumentRendererService` in one step;
- remove legacy BM-specific behavior;
- add a distributed queue.

The next architecture phase extracts document rendering behind ports and
migrates locked BM-001/BM-002/BM-003 first with golden payload and DOCX tests.

## 12. Completion Criteria

D.0/D.1 are complete only when:

1. API and web typechecks pass.
2. Relevant unit and integration tests pass.
3. Local health and forms-runtime smoke scripts pass.
4. The API reads the real contract directory from both repository-root and
   `apps/api` working directories.
5. Locked contract precedence and draft safety are enforced.
6. Missing/invalid contract data produces actionable diagnostics.
7. Shared infrastructure uses configuration/path/error/request boundaries.
8. Forms catalog code no longer owns raw environment and filesystem path
   resolution.
9. Existing API response compatibility is retained.
10. Current architectural debt and the next renderer extraction phase are
    documented with evidence.
