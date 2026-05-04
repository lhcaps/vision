# EvaluationReport Integrity Migration

## Overview

Phase 20D added dedicated scalar columns to the `EvaluationReport` model for traceability and query performance. Phase 20E adds an explicit migration/backfill path so these columns can be applied safely to existing databases without destructive operations.

## What Changed

### Columns Added (Phase 20D)

| Column             | Type             | Nullable | Description                                 |
| ------------------ | ---------------- | -------- | ------------------------------------------- |
| `datasetVersionId` | TEXT             | NOT NULL | Dataset version used for evaluation         |
| `pipelineId`       | TEXT             | YES      | Pipeline that produced predictions          |
| `modelId`          | TEXT             | YES      | Model artifact used                         |
| `algorithmVersion` | TEXT             | NOT NULL | Evaluation algorithm version string         |
| `iouThreshold`     | DOUBLE PRECISION | NOT NULL | IoU threshold used                          |
| `inputHash`        | TEXT             | NOT NULL | Canonical input fingerprint (16-char hex)   |
| `metricsHash`      | TEXT             | NOT NULL | Canonical metrics fingerprint (16-char hex) |

### Indexes Added

| Index Name                                        | Columns                         | Type   |
| ------------------------------------------------- | ------------------------------- | ------ |
| `EvaluationReport_inferenceJobId_createdAt_idx`   | `(inferenceJobId, createdAt)`   | B-tree |
| `EvaluationReport_datasetVersionId_createdAt_idx` | `(datasetVersionId, createdAt)` | B-tree |
| `EvaluationReport_inputHash_idx`                  | `(inputHash)`                   | B-tree |
| `EvaluationReport_metricsHash_idx`                | `(metricsHash)`                 | B-tree |
| `EvaluationReport_algorithmVersion_idx`           | `(algorithmVersion)`            | B-tree |

### Unique Constraint

`UNIQUE INDEX EvaluationReport_inferenceJobId_inputHash_key` on `(inferenceJobId, inputHash)` — enables deterministic upsert so re-running evaluation with identical inputs updates the existing row instead of creating duplicates.

## Why `metricsJson` Remains

`metricsJson` is the **canonical API payload**. It contains the full evaluation report as returned by the API. The scalar columns exist for:

1. **Query performance** — filter by `datasetVersionId`, `algorithmVersion`, `inputHash` without scanning JSON
2. **Integrity guarantees** — row scalar columns cross-checked against JSON at read time
3. **Index-backed upsert** — `[inferenceJobId, inputHash]` unique constraint enables deterministic upsert

Dropping `metricsJson` is NOT safe. Always keep it.

## Migration Order

### For fresh databases (via `pnpm db:migrate` or `pnpm db:migrate:deploy`)

No manual steps needed. Prisma applies the full migration chain from the baseline migration:

```bash
pnpm db:generate
pnpm db:migrate:deploy   # Production-grade: creates full migration history
# OR
pnpm db:migrate          # Development: interactive, creates migration history
```

The migration chain for fresh databases:

1. `00000000000000_init` — creates the full schema including EvaluationReport with all integrity columns
2. `20260503120000_add_asset_derivative_checksum` — adds `checksum` to AssetDerivative
3. `20260504_evaluation_report_integrity_columns` — idempotent patch: `ADD COLUMN IF NOT EXISTS` for integrity columns (already exist from baseline), creates indexes

> **Why `db:migrate:deploy` instead of `db:push`?**
>
> - `db:push` overwrites the schema without creating migration history — it is for local development convenience only.
> - `db:migrate:deploy` records each applied migration in `_prisma_migrations`, enabling true production workflows.
> - A fresh database created with `db:migrate:deploy` has full migration history and can be upgraded incrementally by running `db:migrate:deploy` again with new migrations.

### For existing databases with EvaluationReport rows

Apply the migration SQL, then run the backfill check:

```bash
# 1. Ensure Prisma client is generated
pnpm db:generate

# 2. Apply migration SQL (creates columns as nullable, backfills, validates, adds NOT NULL)
pnpm db:migrate       # Or: psql $DATABASE_URL < infra/prisma/migrations/20260504_evaluation_report_integrity_columns/migration.sql

# 3. Dry-run backfill check (reads existing rows, reports issues, NO mutations)
pnpm migration:eval-report:check

# 4. Apply backfill if check passes (only updates rows with null scalar columns)
pnpm migration:eval-report:apply

# 5. Run migration harness to verify all checks pass
pnpm harness:phase20e
```

### Full migration flow

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
```

### Migration chain ordering

| Order | Migration                                      | Purpose                                                                |
| ----- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| 1     | `00000000000000_init`                          | Creates full schema including EvaluationReport                         |
| 2     | `20260503120000_add_asset_derivative_checksum` | Adds `checksum` column to AssetDerivative                              |
| 3     | `20260504_evaluation_report_integrity_columns` | Idempotent: indexes, unique constraint (already present from baseline) |

## Migration SQL Details

The migration (`infra/prisma/migrations/20260504_evaluation_report_integrity_columns/migration.sql`) applies in this order:

1. **Add columns as nullable** — zero data loss, zero risk of rollback
2. **Backfill from `metricsJson`** — `COALESCE` preserves existing non-null values
3. **Validate** — `DO` block raises exception if any row is missing required fields or has invalid hash format
4. **Add NOT NULL constraints** — only after validation passes
5. **Create indexes** — `IF NOT EXISTS` for idempotency
6. **Create unique index** — for deterministic upsert

**Idempotency after baseline migration:** When the Phase 20E patch is applied after the baseline migration (`00000000000000_init`), all `ADD COLUMN IF NOT EXISTS` statements are no-ops because the baseline already created the columns. The `CREATE INDEX IF NOT EXISTS` statements are also no-ops because the baseline already created the indexes. The `DO` validation block runs against rows that were seeded with all integrity fields already populated, so it passes cleanly. The `ALTER TABLE ... SET NOT NULL` statements also pass because the columns already have values. **The Phase 20E patch is safe to apply after the baseline migration on any fresh or seeded database.**

## Backfill Script

`scripts/migrations/backfill-evaluation-report-integrity.ts`

### Classification rules

| Rule | Condition                                | Action        |
| ---- | ---------------------------------------- | ------------- |
| 1    | row null/empty + JSON valid              | needsBackfill |
| 2    | row non-null + row equals JSON           | consistent    |
| 3    | row non-null + JSON missing              | corrupt       |
| 4    | row non-null + JSON different            | corrupt       |
| 5    | row null/empty + JSON missing (required) | corrupt       |
| 6    | row null/empty + JSON missing (optional) | OK            |
| 7    | JSON hash invalid format                 | corrupt       |
| 8    | row hash invalid format (if non-null)    | corrupt       |
| 9    | iouThreshold JSON invalid (not 0-1)      | corrupt       |
| 10   | iouThreshold row null + JSON valid       | needsBackfill |

Required fields: `datasetVersionId`, `algorithmVersion`, `iouThreshold`, `inputHash`, `metricsHash`
Optional fields: `pipelineId`, `modelId`

### `--check` mode

- No mutations
- Reports total row count
- Reports rows with row/JSON consistency issues
- Reports rows with invalid hex hash format in JSON values
- Reports duplicate `[inferenceJobId, inputHash]` groups
- Reports rows missing required fields even in `metricsJson`
- Reports invalid JSON iouThreshold (not 0-1 range)
- Reports invalid hash format in JSON before applying
- **Exits 1** if any unsafe condition is found
- **Exits 0** if safe to apply

Reports tracking counters:

- `totalRows` — all EvaluationReport rows
- `rowsNeedingBackfill` — rows with null columns but valid JSON
- `rowsConsistent` — rows with matching row/JSON values
- `rowsCorrupt` — rows with data issues
- `duplicateGroups` — duplicate [inferenceJobId, inputHash] groups
- `invalidJsonHashRows` — rows with invalid JSON hash format
- `missingRequiredJsonRows` — rows missing required fields in JSON

### `--apply` mode

- Applies safe backfill updates only (rows that need columns copied from JSON)
- **Refuses** if any rows have data corruption (mismatch, invalid hashes, placeholders, duplicates)
- **Refuses** if any rows are missing required fields in JSON
- Reports updated row count
- Does not modify `metricsJson`

## Harness

### Phase 20F Migration Chain Harness

`scripts/harness/phase20f-migration-chain-check.ts` (run via `pnpm harness:phase20f`)

Verifies:

1. `_prisma_migrations` table exists
2. Baseline migration `00000000000000_init` applied
3. Phase 20E migration `20260504_evaluation_report_integrity_columns` applied
4. No failed migrations (finished_at null AND rolled_back_at null)
5. Expected tables exist: Project, DatasetVersion, EvaluationReport, InferenceJob, Prediction
6. EvaluationReport integrity columns exist (all 7)
7. Unique index for [inferenceJobId, inputHash] exists
8. At least one EvaluationReport row exists after seed
9. Phase 20E harness passes independently
10. Phase 20D harness passes independently
11. Phase 20C harness passes independently

### Phase 20E Harness

`scripts/harness/phase20e-evaluation-migration-check.ts` (run via `pnpm harness:phase20e`)

Verifies:

1. All 7 scalar columns exist in `information_schema`
2. Required columns are NOT NULL
3. All 5 required indexes exist
4. Unique index on `[inferenceJobId, inputHash]` exists
5. Every row has row/JSON consistency for all 5 fields
6. All hashes are lowercase 16-char hex
7. No duplicate `[inferenceJobId, inputHash]` groups
8. At least 1 EvaluationReport row exists
9. No `seed_placeholder` in any hash field
10. Latest report passes `EvaluationReportSchema` strict-parse
11. `pipelineId` and `modelId` exist as nullable
12. `--strict` mode exits 1 without `DATABASE_URL`

## Rollback Note

The migration is **not easily reversible** because NOT NULL constraints and data backfill modify existing rows.

**DO NOT:**

- Drop scalar columns without confirming `metricsJson` still contains equivalent data
- Drop `metricsJson` — it is the canonical API payload
- Run `db:push --force-reset` or `db:reset` on a database with existing EvaluationReport rows — these are destructive

**IF rollback is needed:**

1. Keep the data in `metricsJson`
2. Drop the indexes and NOT NULL constraints (non-destructive)
3. Drop the scalar columns only after confirming `metricsJson` integrity
4. Never drop `metricsJson`

## Known Limitations

- `pipelineId` and `modelId` are nullable — some historical rows may not have these values
- Hash values must be lowercase 16-char hex. Historical rows with uppercase or non-hex hashes cannot be backfilled safely
- Destructive `db:push --force-reset` or `db:reset` is NOT acceptable for production data
- This migration does not backfill `pipelineId`/`modelId` if they are absent from `metricsJson` — those fields remain nullable by design
