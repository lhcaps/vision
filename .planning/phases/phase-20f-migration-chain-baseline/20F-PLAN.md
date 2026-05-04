# Phase 20F Plan — Migration Chain Baseline & Backfill Hardening

**Phase:** 20F
**Depends on:** Phase 20E
**Status:** Draft
**Created:** 2026-05-04

## Problem Statement

Phase 20E added an explicit migration SQL (`20260504_evaluation_report_integrity_columns`) that safely adds the 7 EvaluationReport integrity columns and indexes to existing databases. However, the migration chain has three remaining gaps that prevent a true 10/10 score:

1. **No baseline migration** — there is no `00000000000000_init` baseline migration that creates the full schema from scratch. The Phase 20E patch assumes `EvaluationReport` already exists.

2. **No `prisma migrate deploy` proof** — CI uses `db:push` throughout, which overwrites the schema without creating migration history. This means fresh databases cannot be created from migration history.

3. **Backfill script logic issues** — the backfill script incorrectly treats `row.iouThreshold = null` + `metricsJson.iouThreshold = 0.5` as corruption instead of a backfill candidate. It also doesn't validate JSON hash values before applying when the row hash is null.

4. **Phase 20E harness minor issues** — logFail uses green color code instead of red, and latest report query doesn't use explicit `ORDER BY createdAt DESC`.

## Implementation Plan

### A. Baseline Migration (`infra/prisma/migrations/00000000000000_init/migration.sql`)

Generate from current Prisma schema using `pnpm exec prisma migrate diff --from-empty --to-schema-datamodel infra/prisma/schema.prisma --script`. The migration must include:

- All enum `CREATE TYPE` statements
- All table `CREATE TABLE` statements: Project, MediaAsset, AssetDerivative, MediaProcessingJob, Dataset, DatasetVersion, DatasetVersionAsset, LabelClass, AnnotationSet, Annotation, ModelArtifact, Pipeline, InferenceJob, Prediction, EvaluationReport (with all integrity columns from Phase 20D), AuditLog
- All foreign key constraints
- All indexes and unique constraints
- EvaluationReport integrity columns from Phase 20D: `datasetVersionId`, `pipelineId`, `modelId`, `algorithmVersion`, `iouThreshold`, `inputHash`, `metricsHash`

**Critical ordering check:** Phase 20E patch migration adds `ADD COLUMN IF NOT EXISTS` for the integrity columns. Since the baseline migration already creates `EvaluationReport` with those columns (from the current schema), the `ADD COLUMN IF NOT EXISTS` in Phase 20E will be a no-op. The Phase 20E validation `DO` block will also be a no-op since all rows already have values from the seed. **Both migrations are safe to run in sequence.**

### B. Production Migration Scripts (`package.json`)

Add:

- `db:migrate:deploy`: `prisma migrate deploy --schema infra/prisma/schema.prisma`
- `db:migrate:status`: `prisma migrate status --schema infra/prisma/schema.prisma`

Keep existing `db:push` for local dev convenience.

### C. Phase 20F Migration Chain Harness (`scripts/harness/phase20f-migration-chain-check.ts`)

12-point read-only harness verifying:

1. `--strict` mode fails if DATABASE_URL missing
2. `_prisma_migrations` table exists
3. Baseline migration `00000000000000_init` applied
4. Phase 20E migration `20260504_evaluation_report_integrity_columns` applied
5. No failed migrations (finished_at is null and rolled_back_at is null)
6. Expected tables exist: Project, DatasetVersion, EvaluationReport, InferenceJob, Prediction
7. EvaluationReport integrity columns exist (7 columns)
8. Unique index for [inferenceJobId, inputHash] exists
9. At least one EvaluationReport row after seed
10. Phase 20E harness passes independently
11. Phase 20D harness passes independently
12. Phase 20C harness passes independently

### D. CI Migration Chain Job (`.github/workflows/ci.yml`)

Add `migration-chain` job:

- PostgreSQL service
- `pnpm install`
- `pnpm db:generate`
- `pnpm db:migrate:deploy`
- `pnpm db:migrate:status`
- `pnpm seed:db -- --reset`
- All phase harnesses (phase20c, phase20d, phase20e, phase20f)

`build` job depends on `migration-chain`.

### E. Backfill Script Hardening (`scripts/migrations/backfill-evaluation-report-integrity.ts`)

Classification rules:

1. row null/empty + JSON valid => needsBackfill
2. row non-null + row equals JSON => consistent
3. row non-null + JSON missing => corrupt
4. row non-null + JSON different => corrupt
5. row null/empty + JSON missing (required field) => corrupt
6. row null/empty + JSON missing (optional field) => OK
7. hash JSON values must match `/^[a-f0-9]{16}$/` before apply
8. hash row values must match `/^[a-f0-9]{16}$/` if non-null
9. iouThreshold JSON must be valid number between 0 and 1
10. iouThreshold row null + JSON valid => needsBackfill (not issue)

Tracking counters: totalRows, rowsNeedingBackfill, rowsConsistent, rowsCorrupt, duplicateGroups, invalidJsonHashRows, missingRequiredJsonRows

`--check`: no mutations, exits 1 if corrupt/duplicates/invalid required JSON, exits 0 if safe

`--apply`: refuses if any corruption/duplicates/invalid required JSON, updates only rows needing backfill, does not update already consistent rows, does not modify metricsJson, does not recompute hashes

### F. Phase 20E Harness Fixes (`scripts/harness/phase20e-evaluation-migration-check.ts`)

1. Fix `logFail` color code: `32m` -> `31m`
2. Fix latest report strict-parse: query with explicit `ORDER BY "createdAt" DESC LIMIT 1`

## Verification

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:migrate:status
pnpm seed:db -- --reset
pnpm migration:eval-report:check
pnpm migration:eval-report:apply
pnpm harness:phase20c
pnpm harness:phase20d
pnpm harness:phase20e
pnpm harness:phase20f
pnpm typecheck
pnpm test
pnpm build
pnpm lint
pnpm format:check
```

## Success Criteria

1. Baseline migration exists at `infra/prisma/migrations/00000000000000_init/migration.sql`
2. Fresh DB can run `db:migrate:deploy` with both baseline and Phase 20E migrations
3. `db:migrate:deploy` and `db:migrate:status` scripts exist in package.json
4. Phase 20F harness exists and passes
5. CI has `migration-chain` job that proves `migrate deploy` works
6. `build` job depends on `migration-chain`
7. Backfill script correctly treats null row + valid JSON as backfill candidate
8. Backfill script validates JSON hash values before applying
9. Phase 20E harness logFail is red
10. Phase 20E latest report query uses `ORDER BY createdAt DESC`
11. Docs explain `db:push` is local/dev, `db:migrate:deploy` is production-grade
12. STATE/ROADMAP/MILESTONES/STATE updated
