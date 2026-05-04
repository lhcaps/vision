# Phase 20E Plan — Evaluation Migration Finalization

**Phase:** 20E
**Status:** Complete
**Depends on:** Phase 20D
**Target:** Production-grade migration discipline for EvaluationReport integrity columns

## Problem Statement

Phase 20D added EvaluationReport integrity columns to the Prisma schema but relied on `db:push` for local dev and lacked:

1. **No explicit migration SQL** — no documented, idempotent, safe-backfill migration path
2. **No backfill check/apply scripts** — existing rows in production DBs cannot be migrated safely
3. **CI test job unsafe** — `test` job has `DATABASE_URL` but no `db:generate/db:push` before running tests, so DB-backed integration tests may run against an empty Postgres schema
4. **Phase 20D artifacts incomplete** — `20D-SUMMARY.md` and `20D-REVIEW.md` are missing, `20D-PLAN.md` says "In Progress"
5. **Phase 20E artifacts missing** — `20E-PLAN.md`, `20E-SUMMARY.md`, `20E-REVIEW.md` do not exist

## Non-Negotiable Acceptance Criteria

### A. Explicit Migration SQL

`infra/prisma/migrations/20260504_evaluation_report_integrity_columns/migration.sql`:

1. Add 7 new columns as nullable
2. Backfill from `metricsJson` with `COALESCE`
3. Validate required fields and hash format
4. Add NOT NULL constraints only after validation
5. Create 5 indexes
6. Create unique index on `[inferenceJobId, inputHash]`
7. Idempotent (`IF NOT EXISTS`)
8. Clear comments, rollback note

### B. Phase 20E Harness

`scripts/harness/phase20e-evaluation-migration-check.ts` (12-point read-only check):

1. All 7 scalar columns exist in `information_schema`
2. Required columns are NOT NULL
3. All 5 indexes exist
4. Unique index exists for `[inferenceJobId, inputHash]`
5. Every row has row/JSON consistency
6. All hashes are lowercase 16-char hex
7. No duplicate `[inferenceJobId, inputHash]` groups
8. At least 1 EvaluationReport row exists
9. No `seed_placeholder` in any hash field
10. Latest report passes strict schema parse
11. `pipelineId` and `modelId` are nullable
12. `--strict` exits 1 without `DATABASE_URL`

### C. Backfill Check/Apply Script

`scripts/migrations/backfill-evaluation-report-integrity.ts`:

- `--check`: dry run, no mutations, reports issues, exits 1 if unsafe
- `--apply`: executes safe backfill, refuses on corrupt rows

### D. CI Test Job Fix

`.github/workflows/ci.yml` `test` job:

```yaml
- run: pnpm db:generate # BEFORE pnpm test
- run: pnpm db:push # BEFORE pnpm test
- run: pnpm test
```

### E. CI DB-Harness Extension

`.github/workflows/ci.yml` `db-harness` job adds:

```yaml
- run: pnpm harness:phase20e
```

### F. Migration Documentation

`docs/database/evaluation-report-integrity-migration.md`:

- What columns were added
- Why `metricsJson` remains
- Safe migration order
- Backfill script usage
- Rollback note
- Warning against destructive reset

### G. Phase 20D Artifacts Complete

- `20D-SUMMARY.md` — created
- `20D-REVIEW.md` — created
- `20D-PLAN.md` — status updated to Complete
- `STATE.md` — Phase 20D marked complete

### H. Phase 20E Artifacts

- `20E-PLAN.md` — this file
- `20E-SUMMARY.md` — created
- `20E-REVIEW.md` — created

## Files to Create

### New Files

- `infra/prisma/migrations/20260504_evaluation_report_integrity_columns/migration.sql`
- `scripts/harness/phase20e-evaluation-migration-check.ts`
- `scripts/migrations/backfill-evaluation-report-integrity.ts`
- `docs/database/evaluation-report-integrity-migration.md`
- `.planning/phases/phase-20e-evaluation-migration-finalization/20E-PLAN.md`
- `.planning/phases/phase-20e-evaluation-migration-finalization/20E-SUMMARY.md`
- `.planning/phases/phase-20e-evaluation-migration-finalization/20E-REVIEW.md`
- `.planning/phases/phase-20d-evaluation-persistence-ci-hardening/20D-SUMMARY.md`
- `.planning/phases/phase-20d-evaluation-persistence-ci-hardening/20D-REVIEW.md`

### Modified Files

- `package.json` — add `harness:phase20e`, `migration:eval-report:check`, `migration:eval-report:apply`
- `.github/workflows/ci.yml` — fix test job (db:generate/db:push), extend db-harness (phase20e)
- `.planning/phases/phase-20d-evaluation-persistence-ci-hardening/20D-PLAN.md` — status Complete
- `.planning/STATE.md` — Phase 20D complete, Phase 20E current
- `.planning/ROADMAP.md` — Phase 20E entry
- `.planning/MILESTONES.md` — Phase 20E entry
- `README.md` — Phase 20E entry

## Verification Commands

```
pnpm typecheck
pnpm test
pnpm build
pnpm lint
pnpm format:check
pnpm db:generate
pnpm db:push
pnpm seed:db -- --reset
pnpm migration:eval-report:check
pnpm migration:eval-report:apply
pnpm harness:phase20c
pnpm harness:phase20d
pnpm harness:phase20e
```
