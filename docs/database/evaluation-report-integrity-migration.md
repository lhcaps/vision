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

### For fresh databases (via `pnpm db:push` or `pnpm db:migrate`)

No manual steps needed. Prisma applies the schema directly:

```bash
pnpm db:generate
pnpm db:push          # Local dev: fast, no migration history
# OR
pnpm db:migrate       # Production: creates migration history
```

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
pnpm db:push
pnpm seed:db -- --reset
pnpm migration:eval-report:check
pnpm migration:eval-report:apply
pnpm harness:phase20c
pnpm harness:phase20d
pnpm harness:phase20e
```

## Migration SQL Details

The migration (`infra/prisma/migrations/20260504_evaluation_report_integrity_columns/migration.sql`) applies in this order:

1. **Add columns as nullable** — zero data loss, zero risk of rollback
2. **Backfill from `metricsJson`** — `COALESCE` preserves existing non-null values
3. **Validate** — `DO` block raises exception if any row is missing required fields or has invalid hash format
4. **Add NOT NULL constraints** — only after validation passes
5. **Create indexes** — `IF NOT EXISTS` for idempotency
6. **Create unique index** — for deterministic upsert

## Backfill Script

`scripts/migrations/backfill-evaluation-report-integrity.ts`

### `--check` mode

- No mutations
- Reports total row count
- Reports rows with row/JSON consistency issues
- Reports rows with invalid hex hash format
- Reports duplicate `[inferenceJobId, inputHash]` groups
- Reports rows missing required fields even in `metricsJson`
- **Exits 1** if any unsafe condition is found
- **Exits 0** if safe to apply

### `--apply` mode

- Applies safe backfill updates only (rows that need columns copied from JSON)
- **Refuses** if any rows have data corruption (mismatch, invalid hashes, placeholders, duplicates)
- **Refuses** if any rows are missing required fields in JSON
- Reports updated row count
- Does not modify `metricsJson`

## Harness

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
