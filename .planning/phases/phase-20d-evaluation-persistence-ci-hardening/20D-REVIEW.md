# Phase 20D Code Review — Evaluation Persistence & CI Hardening

**Phase:** 20D
**Status:** Complete
**Review date:** 2026-05-04

## Severity Scale

- **CRITICAL**: Data loss risk, security vulnerability, broken invariants
- **HIGH**: Incorrect behavior, missing functionality, performance regression
- **MEDIUM**: Non-blocking issues, code quality concerns
- **LOW**: Minor style, documentation, or future improvements

---

## Findings

### CRITICAL

_(none)_

### HIGH

#### H-1: CI `test` job missing schema synchronization

**File:** `.github/workflows/ci.yml`

**Issue:** The `test` job sets `DATABASE_URL` (triggering DB-backed integration tests and test suite mode), but does not run `db:generate` or `db:push` before `pnpm test`. If the schema has changed since the last Prisma generation, integration tests may fail with cryptic Prisma errors.

**Fix (Phase 20E):** Add `pnpm db:generate` and `pnpm db:push` steps before `pnpm test` in the test job.

---

#### H-2: No explicit migration SQL for Phase 20D schema changes

**File:** `infra/prisma/schema.prisma`

**Issue:** Phase 20D changed the `EvaluationReport` model (added 7 columns, 5 indexes, 1 unique constraint) but there is no documented migration SQL. Local dev uses `db:push`, which is not production-safe and does not preserve the backfill logic.

**Fix (Phase 20E):** Add `infra/prisma/migrations/20260504_evaluation_report_integrity_columns/migration.sql` with safe-backfill logic.

---

### MEDIUM

#### M-1: Phase 20D harness uses TypeScript-side null checks rather than SQL `information_schema` queries

**File:** `scripts/harness/phase20d-evaluation-db-index-check.ts`

**Issue:** Check 2 verifies columns are non-null using TypeScript checks (`!== null && !== undefined && !== ''`) on Prisma query results. This only verifies the seeded row. It does not verify the database schema itself enforces NOT NULL.

**Fix (Phase 20E):** `phase20e` harness uses `information_schema` queries for schema-level verification.

---

### LOW

#### L-1: Phase 20D artifacts incomplete

**Files:** `20D-SUMMARY.md`, `20D-REVIEW.md`

**Issue:** Missing. These artifacts are needed for Phase 20E closeout.

**Fix (Phase 20E):** Created.

#### L-2: Phase 20D PLAN.md still says "In Progress"

**File:** `.planning/phases/phase-20d-evaluation-persistence-ci-hardening/20D-PLAN.md`

**Issue:** STATUS field says "In Progress" after Phase 20D was completed.

**Fix (Phase 20E):** Updated to "Complete".

---

## Phase 20D Items NOT Addressed in Phase 20E

These require deeper changes beyond migration discipline:

- No Prisma migration history tracking (repo uses `db:push` for local dev)
- No column comment descriptions in the schema (would need schema re-generation)
- No `metricsJson` cleanup/migration path (kept as canonical payload indefinitely)
