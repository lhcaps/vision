# Phase 20D Summary — Evaluation Persistence & CI Hardening

**Phase:** 20D
**Status:** Complete (completed 2026-05-04)
**Depends on:** Phase 20C

## What Was Delivered

Phase 20D pushed the Phase 20 evaluation subsystem from "correct runtime logic" to "production-grade persistence and verification" by adding dedicated DB columns, upsert-by-hash, hex validation, strict harness, DB-backed integration tests, and CI wiring.

## Completed Scope

### A. EvaluationReport DB Columns

`EvaluationReport` model now has dedicated scalar columns: `datasetVersionId`, `pipelineId`, `modelId`, `algorithmVersion`, `iouThreshold`, `inputHash`, `metricsHash`. Indexes added: `[inferenceJobId, createdAt]`, `[datasetVersionId, createdAt]`, `[inputHash]`, `[metricsHash]`, `[algorithmVersion]`. Unique constraint added: `@@unique([inferenceJobId, inputHash])`.

### B. Upsert-by-Hash

`runEvaluation()` uses `prisma.evaluationReport.upsert()` keyed on `[inferenceJobId, inputHash]`. Re-running the same job with identical inputs updates the existing row — zero duplicate rows.

### C. Read Consistency Check

`getEvaluationReport()` cross-checks row scalar columns against parsed `metricsJson`. Any mismatch returns `null` rather than accepting inconsistent data.

### D. Hash Schema Enforces Lowercase Hex

`Hex16Schema = z.string().regex(/^[a-f0-9]{16}$/)` enforces lowercase hex, rejects uppercase/non-hex/wrong-length.

### E. Phase 20C Harness Strict Fix

`--strict` flag causes exit code 1 if `DATABASE_URL` is absent.

### F. Phase 20D Harness

12-point read-only DB check verifying all new columns, constraints, and row/JSON consistency.

### G. DB-Backed Integration Tests

Three tests: DRAFT reject (409), annotation leak isolation, upsert dedupe.

### H. CI Wiring

New `db-harness` job with PostgreSQL service: `db:generate` → `db:push` → `seed:db --reset` → `harness:phase20c` → `harness:phase20d`. `build` depends on `db-harness`.

## Files Created

- `scripts/harness/phase20d-evaluation-db-index-check.ts`
- `apps/api/src/inference/evaluation.integration.spec.ts`

## Files Changed

- `infra/prisma/schema.prisma` — EvaluationReport new columns + indexes + unique
- `apps/api/src/inference/evaluation.service.ts` — upsert + read consistency
- `scripts/seed-db.ts` — write all new columns
- `packages/contracts/src/evaluation.ts` — `Hex16Schema` enforces lowercase hex
- `packages/contracts/src/evaluation.test.ts` — fixtures updated
- `apps/api/src/inference/evaluation-report-schema.test.ts` — non-hex/uppercase rejection tests
- `scripts/harness/phase20c-evaluation-integrity-check.ts` — `--strict` exits 1 without DB
- `.github/workflows/ci.yml` — added `db-harness` job
- `package.json` — added `harness:phase20d` script
- `.planning/STATE.md` — Phase 20D status
- `.planning/ROADMAP.md` — Phase 20D entry
- `.planning/MILESTONES.md` — Phase 20D entry
- `README.md` — Phase 20D status

## Verification

All acceptance criteria passed: `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm harness:phase20c`, `pnpm harness:phase20d`.

## Note

Phase 20D over-relied on `db:push` for migration. Phase 20E adds explicit migration SQL, backfill scripts, CI fixes, and completes the artifact closeout.
