---
name: "Phase 10 Hardening"
phase: 10
phase_slug: hardening
padded_phase: "10"
status: planned
date: 2026-05-01
goal: "Tests, CI, README, one-command boot, demo script."
---

# Phase 10: Hardening — Context

**Gathered:** 2026-05-01
**Status:** Ready for planning
**Source:** Codebase exploration + ROADMAP.md Phase 10 scope

<domain>

## Phase Boundary

Phase 10 delivers production-hardening deliverables that Phase 1-9 did not: automated tests across all packages, a CI pipeline, a project README, a one-command startup script, and a polished demo/seed script. This phase does not add features — it adds confidence that existing features work and that new changes don't regress.

</domain>

<decisions>

## Implementation Decisions

### Tooling

- **Test runner**: Vitest (existing root devDependency) — unified across TypeScript packages. pytest for Python worker.
- **Vitest config**: Create workspace-level `vitest.workspace.ts` at root. Per-package `vitest.config.ts` for API and web.
- **CI platform**: GitHub Actions (`.github/workflows/ci.yml`). No external CI services.
- **Linting/Formatting**: Prettier (existing root devDependency) + ESLint. Add `.prettierrc`, `.eslintrc.cjs`.
- **E2E testing**: Playwright (existing root devDependency). Add `playwright.config.ts`.
- **One-command boot**: Root `package.json` script `dev:full` + `scripts/start-dev.sh` (shell) + `scripts/start-dev.ps1` (PowerShell for Windows).

### Test Coverage Scope

**API (`apps/api/`)**:
- Service-level tests for `MediaService`, `ProjectsService`, `AnnotationService` (currently only memory-fallback tests exist for some)
- API smoke tests for every endpoint using `supertest` + a NestJS `TestingModule` — test HTTP status codes, response shapes, validation rejection
- Prisma schema migration test: `prisma db push --dry-run` in CI

**Web (`apps/web/`)**:
- Unit tests for `lib/` API functions (mock `fetch`)
- Unit tests for `EvaluationMetricsPanel` metric tone logic
- Unit tests for `DatasetVersionDiff` diff engine
- Integration tests for App navigation between all 8 sections

**Packages (`packages/`)**:
- Contracts: add tests for `evaluation.ts` and `project-snapshot.ts` schemas (currently uncovered)
- Motion: add tests for motion token exports

**CV Worker (`apps/cv-worker/`)**:
- Existing 9 pytest tests cover critical paths — no additions needed
- Add `pytest.ini` for explicit config

### CI Pipeline Stages

1. **Lint** — ESLint + Prettier check
2. **Typecheck** — `pnpm typecheck` (all packages)
3. **Test** — `pnpm test` (vitest + pytest)
4. **Build** — `pnpm build` (all packages)
5. **E2E** (on PR merge to main) — Playwright smoke tests

### README Structure

```
# VisionFlow Studio

## Quick Start
## Features
## Architecture
## Development
## Testing
## Environment Variables
## License
```

### One-Command Boot

`pnpm dev:full` starts:
1. `docker compose -f infra/docker-compose.yml up -d` (infra)
2. `pnpm db:generate` (Prisma client)
3. `pnpm turbo dev` (all TypeScript apps in parallel)

`python -m uvicorn apps.cv-worker.src.main:app --reload` is documented separately (CV worker is standalone Python).

### Demo/Seed Script

`scripts/seed-demo.ts` — resets demo state in the memory-fallback mode (no real DB needed) so reviewers can walk through the workbench without running Docker.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — VisionFlow Studio product context and constraints
- `.planning/STATE.md` — Current project state and verification evidence
- `.planning/ROADMAP.md` — Phase 10 goal and phase history
- `.planning/REQUIREMENTS.md` — All V1 requirements

### Phase 9 Artifacts (recent prior phase)
- `.planning/phases/phase-9-timeline-replay-motion/VERIFICATION.md` — Phase 9 acceptance criteria
- `.planning/phases/phase-9-timeline-replay-motion/UI-REVIEW.md` — Phase 9 design review findings

### Design System
- `DESIGN.md` — Color tokens, typography, motion, layout, selection policy

### Frontend
- `apps/web/package.json` — Dependencies and scripts
- `apps/web/src/App.tsx` — App structure and section definitions
- `apps/web/src/lib/` — API function files (what needs tests)
- `apps/web/src/features/evaluation/EvaluationMetricsPanel.tsx` — Metric tone logic
- `apps/web/src/features/timeline/DatasetVersionDiff.tsx` — Diff engine

### Backend
- `apps/api/package.json` — NestJS scripts and deps
- `apps/api/src/` — All service and controller files
- `apps/api/src/inference/inference.service.ts` — Most complex service
- `infra/prisma/schema.prisma` — Domain schema

### Shared Packages
- `packages/contracts/src/` — All Zod schema files
- `packages/motion/src/index.ts` — Motion token exports

### CV Worker
- `apps/cv-worker/src/main.py` — FastAPI app
- `apps/cv-worker/tests/test_worker.py` — Existing pytest tests

### Infrastructure
- `infra/docker-compose.yml` — PostgreSQL + Redis + MinIO
- `.env.example` — All environment variables

</canonical_refs>

<specifics>

## Specific Details

### Vitest Workspace Config

```typescript
// vitest.workspace.ts at project root
import { defineWorkspace } from 'vitest/config'
export default defineWorkspace([
  'packages/*/vitest.config.ts',
  'apps/*/vitest.config.ts',
])
```

Each package needs its own `vitest.config.ts` since `turbo test` runs per-package. Config should include:
- Environment: `jsdom` for web, `node` for api and packages
- Coverage: v8 provider, threshold 60% for statements/branches
- Aliases matching Vite aliases from root `tsconfig.base.json`

### GitHub Actions CI

Trigger: `push` (all branches) + `pull_request` (all branches)
Concurrency: cancel-in-progress
Runs-on: `ubuntu-latest`
Node: 20.x (via setup-node)

Steps:
1. Checkout + pnpm setup
2. `pnpm install --frozen-lockfile`
3. `pnpm turbo typecheck`
4. `pnpm turbo test`
5. `pnpm turbo build`
6. E2E stage (only on `push` to `main`): `pnpm exec playwright install --with-deps chromium` then `pnpm test:e2e`

### Playwright E2E Tests

Create `apps/web/e2e/` with smoke tests:
- `navigation.spec.ts` — Navigate all 8 sections, no console errors
- `annotation.spec.ts` — Draw a BBox on the annotate section
- `pipeline.spec.ts` — Add and validate a pipeline

### ESLint Config

Use `eslint.config.js` (flat config) with:
- `@typescript-eslint/recommended-type-checked`
- `react` plugin
- `react-hooks`
- `tailwindcss`
- No `prettier` plugin (Prettier handles formatting, ESLint handles linting only)

### Prettier Config

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Demo Script

```typescript
// scripts/seed-demo.ts
// Runs in-memory demo state reset
// Usage: npx tsx scripts/seed-demo.ts
// No Docker/DB required
```

### Read-Only Scripts Reference

From `apps/api/src/lib/read-only-routes.ts` — all read-only routes exist already. These are candidates for integration tests.

</specifics>

<deferred>

## Deferred Ideas

- Jest E2E test runner (Playwright is already available)
- Real DB integration tests with testcontainers
- Contract testing between API and web
- Load/performance tests
- Visual regression tests (Chromatic)
- CV worker containerization (Dockerfile for FastAPI)
- ONNX runtime integration

</deferred>

---

*Phase: 10-hardening*
*Context gathered: 2026-05-01 via codebase exploration*
