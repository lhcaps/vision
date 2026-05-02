# Phase 12 Context

## Phase 12A: CI/CD Completeness

**Goal:** Make every push prove that the repo still builds, tests, formats, and generates Prisma clients correctly.

**Requirements:**

- CI runs: `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, `pnpm format --check`, `pnpm test`, `pnpm build`, `python -m pytest apps/cv-worker/tests`
- CI must run on push and PR
- CI must fail on type errors, format drift, test failure, or build failure
- E2E workflow remains separate until real services are wired

**Depends on:** Phase 10

**Success criteria:**

1. Every push and PR runs the full CI pipeline
2. Prisma client generation is validated in CI
3. Python pytest suite runs in CI
4. Format check prevents style drift
5. Build failure blocks merge
6. CI badge is visible in README

---

## Phase 12B: Local Stack & Seed Reliability

**Goal:** Ensure a fresh clone runs the full stack without manual intervention.

**Requirements:**

- `docker compose -f infra/docker-compose.yml`: Postgres, Redis, MinIO — starts with one command
- `pnpm dev:full` / `pnpm dev:full:win`: starts Docker infra + generates Prisma client + launches web + API + CV worker
- Seed script creates demo project with media, dataset, annotation labels, and pipeline
- `.env.example` is complete: all env vars documented with defaults and descriptions
- Teardown/reset command: `pnpm kill` stops all Docker containers cleanly
- Local stack works on both Unix (bash) and Windows (PowerShell)
- No external network dependency at boot time

**Depends on:** Phase 12A

**Success criteria:**

1. Fresh clone → `pnpm install` → `cp .env.example .env` → `pnpm dev:full` starts everything in < 60 seconds
2. Web app accessible at `http://localhost:5173`
3. API accessible at `http://localhost:3000`
4. Swagger docs at `http://localhost:3000/api/docs`
5. Demo data loads automatically
6. `pnpm kill` cleanly stops all services
7. Works on Windows PowerShell without WSL
8. README setup section matches actual boot experience
