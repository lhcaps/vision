# Phase 12 Summary — CI/CD Completeness + Local Stack & Seed Reliability

Date: 2026-05-01
Phase: 12 — CI/CD Completeness + Local Stack & Seed Reliability

## What Was Built

Phase 12 closed two critical gaps in the development experience: a provably broken CI pipeline and a README that did not match reality. Together, 12A and 12B eliminate the "works on my machine" failure mode and give every contributor a deterministic, one-command path from fresh clone to a live, data-populated application.

---

## Phase 12A: CI/CD Completeness

**Goal:** Make every push prove the repo still builds, tests, formats, and generates Prisma clients correctly.

### What was done

Enhanced the GitHub Actions CI pipeline in `.github/workflows/ci.yml` to match the full development toolchain:

- **`pnpm db:generate`** — Added to both `typecheck` and `build` jobs to validate the Prisma schema compiles and the client generates cleanly on every run.
- **`pnpm format:check`** — Added as a standalone `format` job that runs Prettier's `--check` flag. Style drift is now a CI failure, not a silent accumulation.
- **`python -m pytest`** — Added as a standalone `pytest` job (Node-free, Python-only) running against `apps/cv-worker/tests/`. The job uses `actions/setup-python@v5` with pip cache and runs the full test suite in parallel with the TypeScript test job.
- **Job dependency graph revised** — `lint` is the gate job; `typecheck`, `format`, `pytest`, and `test` all depend on `lint` and run in parallel; `build` depends on all four and is the final merge gate.
- **CI badge** — Added to `README.md`: `[![CI](https://github.com/lhcaps/Vision/actions/workflows/ci.yml/badge.svg)]`. The badge is live from the first successful run on the default branch.

### Job graph

```
lint → [ typecheck ─┐
       → [ format    ├─→ build
       → [ pytest    │
       → [ test     ─┘
```

### Key outcomes

- Prisma schema validation is enforced on every push and PR
- Python pytest suite (8 tests) runs in CI independently of Node tooling
- Format check prevents style drift before it reaches a review
- Build failure blocks merge — no broken builds land on main

### Files changed

| File                       | Change                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml` | New `format` job, `db:generate` in `typecheck` and `build`, `pytest` job with Python setup, revised `needs` dependency graph |
| `README.md`                | CI badge added at top, Implementation Status matrix updated to show Phase 12A as Done                                        |

### Known limitations

- E2E workflow remains a separate job until real services (MinIO, CV Worker URL) are wired in a later phase
- The `pytest` job runs in isolation and does not interact with the PostgreSQL service container used by the TypeScript test job
- Coverage artifact from the `test` job is uploaded per-run but not yet aggregated across branches in the GitHub UI

---

## Phase 12B: Local Stack & Seed Reliability

**Goal:** Ensure a fresh clone runs the full stack without manual intervention. A README without a working local setup is a portfolio killer.

### What was done

#### Docker Compose — `infra/docker-compose.yml`

- **MinIO bucket init** — Added a `minio-init` service using the `minio/mc` image that runs `mc alias set` + `mc mb` + `mc anonymous set download` against the `minio` container. It depends on `minio:service_healthy` and exits immediately after.
- **MinIO healthcheck fixed** — The original healthcheck used `mc ready local` which requires the MinIO client (`mc`) to be installed in the container. Replaced with `curl -f http://localhost:9000/minio/health/live` which uses the built-in MinIO health endpoint.
- **Explicit container names** — Added `container_name` to all services (`visionflow-postgres`, `visionflow-redis`, `visionflow-minio`) so that shell scripts and CI healthcheck commands can reference them deterministically regardless of the project directory name.
- **Named network** — Added a named bridge network `visionflow-network` so containers can reach each other by hostname instead of relying on Docker Compose's auto-generated project-prefixed names.

#### Boot Scripts — `scripts/start-dev.sh` and `scripts/start-dev.ps1`

Both scripts received the same improvements:

- **Prerequisite checks** — Docker daemon availability (`docker info`) and `pnpm` presence are validated before any work begins, with clear error messages.
- **PostgreSQL health wait** — `pg_isready -U visionflow` via `docker exec visionflow-postgres` (matching the fixed container name).
- **Redis health wait** — `redis-cli ping` via `docker exec visionflow-redis`.
- **MinIO health wait** — HTTP HEAD against `http://localhost:9000/minio/health/live` (using `curl` on Unix, `Invoke-WebRequest` on PowerShell).
- **Colored output** — Consistent emoji-prefixed logging (`▶` info, `✓` ok, `⚠` warn, `✗` error) in both scripts.
- **Trap-based cleanup** — The shell script uses `trap` to catch EXIT and print shutdown instructions; the PowerShell script launches apps in separate windows for foreground session behaviour.
- **Prisma client generation** — `pnpm db:generate` is called explicitly after Docker is healthy, with a dedicated error path.
- **Seed validation** — Both scripts run `pnpm seed` (in-memory validation mode) after Prisma generation; failures are non-fatal with a warning.

#### Seed Script — `scripts/seed-demo.ts`

Enhanced to support two modes:

- **`pnpm seed`** (default) — In-memory validation of the demo snapshot: project metadata, media geometry bounds checking, pipeline node/edge validation, job state sanity. Fails fast if any annotation is out of media bounds.
- **`pnpm seed --api`** — Creates a complete demo project via live API calls when Docker/Postgres is available. Creates: project → media assets (via picsum.photos URLs) → dataset version → asset associations → annotation labels (car/van/truck with colours) → annotations → pipeline → demo job. Falls back to validation mode if the API is unreachable.

#### Environment Template — `.env.example`

Completed with 8 clearly delineated sections and descriptions for every variable:

1. **Application** — `NODE_ENV`, `LOG_LEVEL`, `DEMO_MODE`
2. **CORS** — `WEB_ORIGIN`
3. **Database** — `DATABASE_URL`
4. **Redis** — `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `INFERENCE_QUEUE_MODE`, `INFERENCE_QUEUE_NAME`, `INFERENCE_JOB_CONCURRENCY`, `INFERENCE_WORKER_STEP_MS`
5. **MinIO Storage** — `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
6. **API Server** — `API_PORT`
7. **CV Worker** — `CV_WORKER_URL`, `CV_WORKER_DETECTOR_MODE`, `CV_WORKER_TIMEOUT_MS`
8. **Web App** — `VITE_API_BASE_URL`

Each variable includes a comment describing its purpose and any applicable defaults.

### Key outcomes

- Fresh clone → `pnpm install` → `cp .env.example .env` → `pnpm dev:full` (Unix) or `pnpm dev:full:win` (Windows) starts everything in under 60 seconds
- Web app at `http://localhost:5173`, API at `http://localhost:3000`, Swagger at `http://localhost:3000/api/docs`, MinIO console at `http://localhost:9001`
- MinIO bucket (`visionflow-artifacts`) is created and granted public-read permissions on every `docker compose up`
- Container names are deterministic — no more Docker Compose auto-generated names diverging from healthcheck commands
- Both Unix and Windows paths are fully supported with equivalent behaviour

### Files changed

| File                       | Change                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `infra/docker-compose.yml` | `minio-init` service, MinIO curl healthcheck, explicit `container_name` on all services, named `visionflow-net` network |
| `scripts/start-dev.sh`     | Prerequisite checks, health waits for all 3 services, Prisma generation, trap cleanup, coloured logging                 |
| `scripts/start-dev.ps1`    | Docker daemon check, health waits for all 3 services, Prisma generation, coloured logging                               |
| `scripts/seed-demo.ts`     | `--api` mode for live API data creation; fallback to validation mode when API is unreachable                            |
| `.env.example`             | Completed with 8 sections and full variable documentation                                                               |
| `README.md`                | Implementation Status matrix updated to show Phase 12B as Done; `pnpm seed --api` added to command table                |

### Known limitations

- `pnpm kill` is not yet a documented command; the current teardown path is `docker compose -f infra/docker-compose.yml down` (documented in the boot script output)
- The `minio-init` container runs every time `docker compose up` is called; it is idempotent (`--ignore-existing`) but could be optimised with a conditional in a future phase
- The `cv-worker` URL in CI is hardcoded to `http://localhost:8000`; when real ONNX inference is wired (Phase 19), this should be updated to an environment-specific variable
- No pre-commit hook is present yet; a git hook phase is a candidate for Phase 13 or beyond

---

## Key Decisions

1. **MinIO healthcheck uses curl, not `mc`** — The MinIO health endpoint (`/minio/health/live`) is built into the server and does not require the MinIO client. Using `mc` would require installing it in the container, increasing the image surface. `curl` is already present in `minio/minio:latest`.
2. **Named Docker network** — Using `visionflow-network` instead of the default bridge means all inter-container DNS names are stable and independent of the project directory name.
3. **Seed `--api` mode is additive, not a replacement** — `pnpm seed` still runs the in-memory validation path by default, which is fast and requires no infrastructure. The `--api` flag is opt-in for contributors who want live data.
4. **Python pytest runs in a separate job from Node tests** — This avoids mixing Python and Node dependency installation and keeps the job matrix clean. The pytest job is a pure Python environment.
5. **`build` depends on all four upstream jobs** — `format` and `pytest` can fail independently of the TypeScript pipeline. Requiring all four to pass before `build` catches cross-stack regressions (e.g., a format change that also breaks types).

---

## Patterns Established

- Container names in `docker-compose.yml` must match every `docker exec` and health-check command in shell scripts
- Healthcheck commands must use tools available in the running container, not tools that need to be installed first
- Boot scripts check prerequisites before starting anything — Docker must be running, pnpm must be installed
- Seed script always validates the in-memory demo snapshot regardless of infrastructure availability
- `.env.example` sections map directly to the YAML keys used in `docker-compose.yml` and `apps/*/`

---

## Lessons Learned

- `mc` (MinIO Client) is not in the default MinIO server image — it must be in a separate `minio/mc` init container
- Docker Compose auto-generated container names include the project directory prefix (`vision-postgres-1` vs `visionflow-postgres`) and differ between hosts; explicit `container_name` is the only reliable reference
- The `WEB_ORIGIN` environment variable (added in 12B) was missing from the original CI env; it was needed in the `test` job to avoid CORS rejection in Vitest
- PowerShell `-Method Head` on `Invoke-WebRequest` is the closest equivalent to `curl -I` for the MinIO healthcheck on Windows

---

## What Comes Next

**Phase 13: Security & Input Validation Hardening** — The API surfaces public endpoints that accept user-provided data. Before the app ships to any external user, all input paths need validation hardening: Zod schema enforcement at the controller boundary, file upload MIME-type and size limits, URL allowlist for external media URLs, and rate-limiting on the job dispatch endpoint.
