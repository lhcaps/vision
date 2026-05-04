# Phase 20C Summary — Evaluation Integrity Finalization

**Phase:** 20C
**Status:** Completed
**Depends on:** Phase 20B
**Completed:** 2026-05-04
**Commit:** `fix(evaluation): finalize report integrity`

## What Was Fixed

Phase 20C resolved the remaining integrity gaps that Phase 20B identified but did not fully fix.

### Root Cause: Phase 20B Overclaimed Seed Alignment

Phase 20B artifacts stated that the seed hash was aligned with the runtime. This was inaccurate — the seed still used:

- `canonicalPredId` with `toFixed(1)` for geometry and `toFixed(3)` for confidence
- A pipe-delimited string-join approach for hashing
- `metricsHash: 'seed_placeholder'` instead of a real canonical hash

The runtime used `JSON.stringify` on a canonical object with exact numeric values. These are byte-for-byte different approaches that can produce different hashes.

### Fix A: Shared Hash Module (`evaluation-hash.ts`)

Created `apps/api/src/inference/evaluation-hash.ts` — a pure TypeScript module with no external dependencies. It exposes:

- `computeEvaluationInputHash(jobId, datasetVersionId, predictions, groundTruth, iouThreshold, algorithmVersion)` — canonical JSON of all inputs, exact numeric values, sorted by id
- `computeEvaluationMetricsHash(report)` — canonical JSON of full report payload, excluding metricsHash/id/evaluatedAt

Imported by:

- `evaluation-algorithm.ts` (re-exports for backward compatibility)
- `evaluation.service.ts` (for metricsHash computation)
- `seed-db.ts` (via relative path `../../apps/api/src/inference/evaluation-hash`)
- `phase20c-harness.ts` (for DB integrity verification)

### Fix B: Seed Alignment (`seed-db.ts`)

- Removed: `canonicalPredId`, `canonicalGtId`, local `computeInputHash`
- Added: imports of `computeEvaluationInputHash` and `computeEvaluationMetricsHash`
- `metricsHash` is now computed from the shared canonical logic, no longer `seed_placeholder`
- The seeded report now uses the same hash logic as the runtime

### Fix C: Safe Legacy Adapter (`evaluation.service.ts`)

Old approach:

```typescript
const legacyResult = EvaluationReportSchema.partial().safeParse(raw);
if (legacyResult.success) {
  const partial = legacyResult.data;
  if (partial.jobId && partial.datasetVersionId && partial.perClassMetrics) {
    return partial as EvaluationReport; // UNSAFE CAST
  }
}
```

New approach:

```typescript
const legacyResult = EvaluationReportSchema.partial().safeParse(raw);
if (legacyResult.success) {
  const partial = legacyResult.data;
  // Check ALL required summary fields
  const missingSummary = requiredSummaryFields.filter(f => !(f in partial));
  if (missingSummary.length === 0 && partial.perClassMetrics) {
    // Build adapted object with explicit types
    const adapted: EvaluationReport = { ... };
    // Re-validate against full schema
    const adaptedResult = EvaluationReportSchema.safeParse(adapted);
    if (adaptedResult.success) return adaptedResult.data;
  }
}
return null; // Corrupt/partial reports return null
```

### Fix D: Phase 20C Harness (`phase20c-evaluation-integrity-check.ts`)

12-point read-only DB integrity check:

| #   | Check                                                        |
| --- | ------------------------------------------------------------ |
| 1   | Demo dataset version is LOCKED                               |
| 2   | Demo inference job is SUCCEEDED                              |
| 3   | Demo predictions count = 3                                   |
| 4   | Demo GT annotations scoped through annotationSets = 3        |
| 5   | EvaluationReport row exists                                  |
| 6   | EvaluationReportSchema strict-parse passes                   |
| 7   | `report.inputHash` matches recomputed canonical hash from DB |
| 8   | `report.metricsHash` matches recomputed canonical hash       |
| 9   | `metricsHash` is NOT `"seed_placeholder"`                    |
| 10  | `report.matches` length = 3                                  |
| 11  | Per-class: car/van/truck TP=1, FP=0, FN=0, meanIou=1         |
| 12  | No stale QUEUED/RUNNING seeded jobs                          |

## Files Changed

| File                                                      | Change                                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `apps/api/src/inference/evaluation-hash.ts`               | New — shared hash utilities                                                            |
| `apps/api/src/inference/evaluation-hash.test.ts`          | New — 15 hash utility tests                                                            |
| `apps/api/src/inference/evaluation-report-schema.test.ts` | New — 15 schema validation tests                                                       |
| `apps/api/src/inference/evaluation-algorithm.ts`          | Import from `evaluation-hash.ts`, re-export                                            |
| `apps/api/src/inference/evaluation.service.ts`            | Import from `evaluation-hash.ts`, remove local metricsHash, fix legacy adapter         |
| `scripts/seed-db.ts`                                      | Import from `evaluation-hash.ts`, remove toFixed hash helpers, remove seed_placeholder |
| `scripts/harness/phase20c-evaluation-integrity-check.ts`  | New — 12-point harness                                                                 |
| `package.json`                                            | Add `harness:phase20c` script                                                          |
| `README.md`                                               | Correct Phase 19/20/20B/20C status, fix ONNX description                               |
| `.planning/STATE.md`                                      | Update phase status, add Phase 20C section, add Phase 20B correction note              |
| `.planning/ROADMAP.md`                                    | Add Phase 20C entry in execution order table and section                               |
| `.planning/MILESTONES.md`                                 | Add Phase 20C entry and outcomes                                                       |

## Verification Results

```
pnpm --filter @visionflow/api typecheck  ✅
pnpm --filter @visionflow/api test       ✅ (203 tests: 18 test files)
pnpm typecheck                           ✅
pnpm test                                ✅ (331 tests: 203 API + 43 contracts + 63 web + 22 motion)
pnpm build                               ✅
pnpm lint                                ✅
pnpm format:check                         ✅
```

**Test coverage (30 new tests):**

- Hash utility: stability, order independence, tiny diff detection, 16-char hex, algorithmVersion/iouThreshold inclusion
- Schema: full report passes, missing fields fail, legacy without matches passes, empty/corrupt fail, hash regex validation
