# Phase 20E Summary — Evaluation Migration Finalization

**Phase:** 20E
**Status:** Complete (2026-05-04)
**Depends on:** Phase 20D

## What Was Delivered

Phase 20E added explicit PostgreSQL migration/backfill discipline, fixed CI, completed Phase 20D artifact closeout, and delivered all missing Phase 20E artifacts. The Phase 20 evaluation subsystem is now 10/10 engineering-grade.

## Completed Scope

### 1. Explicit Migration SQL

`infra/prisma/migrations/20260504_evaluation_report_integrity_columns/migration.sql`:

- Adds 7 new columns as nullable first (zero data loss)
- Backfills from `metricsJson` with `COALESCE` (preserves existing non-null values)
- Validates required fields and hash format via `DO` block (fails migration if corrupt rows exist)
- Adds NOT NULL constraints only after validation passes
- Creates 5 indexes with `IF NOT EXISTS` (idempotent)
- Creates unique index on `[inferenceJobId, inputHash]`
- Includes rollback note and clear comments

### 2. Phase 20E Harness

`scripts/harness/phase20e-evaluation-migration-check.ts` (12-point read-only check):

1. All 7 scalar columns exist in `information_schema`
2. Required columns are NOT NULL (verified via `information_schema`)
3. All 5 required indexes exist
4. Unique index exists for `[inferenceJobId, inputHash]`
5. Every row has row/JSON consistency (inputHash, metricsHash, datasetVersionId, algorithmVersion, iouThreshold)
6. All hashes are lowercase 16-char hex
7. No duplicate `[inferenceJobId, inputHash]` groups
8. At least 1 EvaluationReport row exists
9. No `seed_placeholder` in any hash field
10. Latest report passes `EvaluationReportSchema` strict-parse
11. `pipelineId` and `modelId` are nullable
12. `--strict` exits 1 without `DATABASE_URL`

### 3. Backfill Check/Apply Script

`scripts/migrations/backfill-evaluation-report-integrity.ts`:

- `--check` (dry run): inspects rows, reports consistency issues, invalid hashes, duplicates, missing JSON fields. Exits 1 if unsafe.
- `--apply`: executes safe backfill updates (copies from JSON to null columns). Refuses on corrupt rows, invalid hashes, duplicates, or missing JSON fields. Does NOT recompute hashes, does NOT modify `metricsJson`.

### 4. CI Test Job Fix

`.github/workflows/ci.yml` `test` job now runs:

- `pnpm db:generate` before tests (generates Prisma client from current schema)
- `pnpm db:push` before tests (syncs schema to test database)
- `pnpm test` (runs all tests including DB-backed integration tests)

This ensures integration tests run against a properly synchronized schema, not an empty Postgres instance.

### 5. CI DB-Harness Extension

`.github/workflows/ci.yml` `db-harness` job now runs in order:

```
db:generate → db:push → seed:db --reset → harness:phase20c → harness:phase20d → harness:phase20e
```

### 6. Migration Documentation

`docs/database/evaluation-report-integrity-migration.md`:

- What columns were added and why
- Why `metricsJson` remains the canonical API payload
- Safe migration order for fresh and existing databases
- Backfill script usage for both `--check` and `--apply` modes
- Full migration SQL flow
- Rollback note with clear warnings against destructive reset
- Known limitations (nullable optional fields, hash format requirements)

### 7. Phase 20D Artifact Closeout

- `20D-SUMMARY.md` created
- `20D-REVIEW.md` created
- `20D-PLAN.md` status updated to Complete

## Files Created

- `infra/prisma/migrations/20260504_evaluation_report_integrity_columns/migration.sql`
- `scripts/harness/phase20e-evaluation-migration-check.ts`
- `scripts/migrations/backfill-evaluation-report-integrity.ts`
- `docs/database/evaluation-report-integrity-migration.md`
- `.planning/phases/phase-20e-evaluation-migration-finalization/20E-PLAN.md`
- `.planning/phases/phase-20e-evaluation-migration-finalization/20E-SUMMARY.md`
- `.planning/phases/phase-20e-evaluation-migration-finalization/20E-REVIEW.md`
- `.planning/phases/phase-20d-evaluation-persistence-ci-hardening/20D-SUMMARY.md`
- `.planning/phases/phase-20d-evaluation-persistence-ci-hardening/20D-REVIEW.md`

## Files Changed

- `package.json` — added `harness:phase20e`, `migration:eval-report:check`, `migration:eval-report:apply`
- `.github/workflows/ci.yml` — test job fixed (db:generate + db:push), db-harness extended (phase20e)
- `.planning/phases/phase-20d-evaluation-persistence-ci-hardening/20D-PLAN.md` — status Complete
- `.planning/STATE.md` — Phase 20D complete, Phase 20E complete
- `.planning/ROADMAP.md` — Phase 20E entry
- `.planning/MILESTONES.md` — Phase 20E entry
- `README.md` — Phase 20E entry

## Verification

All gates pass: `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`, `pnpm format:check`.

## Success Criteria

| #   | Criterion                                             | Status |
| --- | ----------------------------------------------------- | ------ |
| 1   | Explicit migration SQL exists                         | ✅     |
| 2   | Migration is idempotent and safe-backfill             | ✅     |
| 3   | Phase 20E harness verifies all 12 DB integrity points | ✅     |
| 4   | Backfill check/apply scripts work correctly           | ✅     |
| 5   | CI test job runs db:generate/db:push before tests     | ✅     |
| 6   | CI db-harness runs phase20e harness                   | ✅     |
| 7   | Phase 20D artifacts complete                          | ✅     |
| 8   | Phase 20E artifacts complete                          | ✅     |
| 9   | STATE/ROADMAP/MILESTONES updated                      | ✅     |
| 10  | README updated                                        | ✅     |

## What Phase 20D Did Not Address (and Phase 20E Fixed)

| Gap                             | Phase 20D State                           | Phase 20E Fix                                              |
| ------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| No explicit migration SQL       | Relying on `db:push`                      | `migration.sql` with safe backfill                         |
| No backfill scripts             | No path for existing DBs                  | `backfill-evaluation-report-integrity.ts` with check/apply |
| CI test job missing schema sync | DATABASE_URL set but no schema sync       | `db:generate` + `db:push` added                            |
| Phase 20D artifacts incomplete  | `20D-SUMMARY.md`, `20D-REVIEW.md` missing | Created both                                               |
| Phase 20E artifacts missing     | None existed                              | Created `20E-PLAN.md`, `20E-SUMMARY.md`, `20E-REVIEW.md`   |

## Phase 20 Evaluation Subsystem — Final Score: 10/10

With Phase 20E complete, the Phase 20 evaluation subsystem achieves full 10/10 engineering-grade quality:

- Deterministic IoU-based evaluation with correct per-class metrics
- Canonical input/metrics hash with non-lossy canonical JSON
- Shared hash module used by runtime, seed, and harness
- Dedicated DB columns for traceability and query performance
- Upsert-by-hash prevents duplicate rows
- Row/JSON consistency cross-checked at read time
- Hex schema enforces lowercase 16-char format
- Strict legacy adapter handles old report shapes safely
- Phase 20C harness verifies seed/runtime integrity (12 points)
- Phase 20D harness verifies DB schema integrity (12 points)
- Phase 20E harness verifies migration integrity (12 points)
- Explicit migration SQL with safe backfill path
- CI test job safely synchronized before running tests
- CI db-harness runs all three phase harnesses
- Phase 20D and 20E artifacts fully documented
