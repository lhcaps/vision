# Phase 12 Manifest

**Phase:** 12 — CI/CD Completeness + Local Stack & Seed Reliability
**Created:** 2026-05-01
**Status:** In Progress

## Files Created/Modified

### Wave 1 — Infrastructure Files

| File                       | Change                                                           | Status  |
| -------------------------- | ---------------------------------------------------------------- | ------- |
| `.github/workflows/ci.yml` | Add db:generate, format:check, pytest job; fix lint ordering     | Planned |
| `infra/docker-compose.yml` | Add MinIO bucket init, fix container names, enhance healthchecks | Planned |
| `.env.example`             | Complete env var documentation with descriptions and defaults    | Planned |

### Wave 2 — Boot Scripts & Seed

| File                    | Change                                                               | Status  |
| ----------------------- | -------------------------------------------------------------------- | ------- |
| `scripts/start-dev.sh`  | Fix container name reference, add MinIO wait, improve error messages | Planned |
| `scripts/start-dev.ps1` | Fix container name, improve MinIO wait, fix process cleanup          | Planned |
| `scripts/seed-demo.ts`  | Enhance to create full demo project with complete data               | Planned |
| `README.md`             | Add CI badge, update Implementation Status matrix                    | Planned |

## Verification Checklist

- [ ] `pnpm verify` (typecheck + test + build) passes
- [ ] `pnpm format:check` passes
- [ ] CI workflow has all required jobs
- [ ] Python pytest runs in CI
- [ ] `pnpm db:generate` runs successfully
- [ ] `docker compose -f infra/docker-compose.yml config` validates YAML
- [ ] Boot scripts have correct container names
- [ ] `.env.example` has all documented vars
- [ ] Seed script validates without Docker running
- [ ] README CI badge URL is correct for `lhcaps/Vision`
- [ ] All changes pass `pnpm lint`

## Git Commits

1. `infra: add MinIO bucket init and fix container names in docker-compose.yml`
2. `ci: add db:generate, format-check, pytest to GitHub Actions pipeline`
3. `env: complete .env.example with full variable documentation`
4. `scripts: fix boot scripts for Windows and Unix compatibility`
5. `seed: enhance demo data validator with complete project structure`
6. `docs: add CI badge and update README implementation status`
