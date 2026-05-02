# Phase 12 — CI/CD Completeness + Local Stack & Seed Reliability

## Phase 12A: CI/CD Completeness

**Goal:** Make every push prove that the repo still builds, tests, formats, and generates Prisma clients correctly.

### Requirements

- GitHub Actions CI runs: `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, `pnpm format --check`, `pnpm test`, `pnpm build`, `python -m pytest apps/cv-worker/tests`
- CI must run on push and pull request.
- CI must fail on type errors, format drift, test failure, or build failure.
- E2E workflow remains separate until real services are wired.

### Success Criteria

1. Every push and PR runs the full CI pipeline.
2. Prisma client generation is validated in CI.
3. Python pytest suite runs in CI.
4. Format check prevents style drift.
5. Build failure blocks merge.
6. CI badge is visible in README.

---

## Phase 12B: Local Stack & Seed Reliability

**Goal:** Ensure a fresh clone runs the full stack without manual intervention. README without a working local setup is a portfolio killer.

### Requirements

- `docker compose -f infra/docker-compose.yml`: Postgres, Redis, MinIO — starts with one command.
- `pnpm dev:full` / `pnpm dev:full:win`: starts Docker infra + generates Prisma client + launches web + API + CV worker.
- Seed script creates demo project with media, dataset, annotation labels, and pipeline — no manual data entry needed.
- `.env.example` is complete: all env vars documented with defaults and descriptions.
- Teardown/reset command: `pnpm kill` stops all Docker containers cleanly.
- Local stack works on both Unix (bash) and Windows (PowerShell).
- No external network dependency at boot time (models, weights, datasets downloaded on demand — not at startup).

### Success Criteria

1. Fresh clone → `pnpm install` → `cp .env.example .env` → `pnpm dev:full` starts everything in < 60 seconds on a standard machine.
2. Web app is accessible at `http://localhost:5173` after boot.
3. API is accessible at `http://localhost:3100` after boot.
4. Swagger docs accessible at `http://localhost:3100/api/docs`.
5. Demo data loads automatically — no manual setup required.
6. `pnpm kill` cleanly stops all services.
7. Stack works on Windows PowerShell without WSL.
8. README setup section is accurate and matches the actual boot experience.

---

## Execution Plan

### Wave 1 — Infrastructure Files (parallel)

1. **CI/CD Enhancement** — Add `db:generate`, `format:check`, pytest job to `.github/workflows/ci.yml`
2. **Docker Compose Enhancement** — Add MinIO bucket init via `mc alias set` / `mc mb` healthcheck bootstrap, ensure container names match PowerShell script expectations, add MinIO healthcheck using `mc ready local`
3. **`.env.example` Completion** — Document all env vars with defaults, descriptions, add missing vars (`WEB_ORIGIN`, `API_BASE_URL`, `NODE_ENV`, `LOG_LEVEL`)

### Wave 2 — Boot Scripts & Seed (parallel)

4. **Boot Script Enhancement** — Fix PowerShell script container name (`visionflow-postgres`), improve healthcheck robustness, add MINIO_ENDPOINT health wait, ensure proper process cleanup
5. **Seed Script Enhancement** — Ensure seed creates complete demo data: project, media assets with URLs, dataset with version, annotation labels, pipeline with nodes/edges, demo job
6. **README Enhancement** — Add CI badge `[![CI](https://github.com/lhcaps/Vision/actions/workflows/ci.yml/badge.svg)]`, update Implementation Status matrix to show Phase 12A/12B as in-progress/complete

---

## Technical Notes

- Docker container names must be consistent between `docker-compose.yml` and PowerShell healthcheck commands (currently `vision-postgres-1` in shell script vs `visionflow-postgres` in compose)
- MinIO healthcheck requires `mc` (MinIO Client) which is not installed by default in the `minio/minio:latest` image. Use a separate init container or embedded healthcheck with `mc ready local`
- `pnpm dev:full:win` currently starts apps in separate PowerShell windows that inherit `$ROOT` correctly
- The `python -m uvicorn` command for CV worker uses `--port 8001` in the script but env var says `8000` — reconcile these
