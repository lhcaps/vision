# Phase 20C Code Review — Evaluation Integrity Finalization

**Phase:** 20C — Evaluation Integrity Finalization
**Review date:** 2026-05-04
**Reviewer:** Claude (automated + self-review)
**Depends on:** Phase 20B

## Files Reviewed

| File                                                      | Change Type     | Key Changes                                                         |
| --------------------------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `apps/api/src/inference/evaluation-hash.ts`               | New             | Shared pure hash utilities                                          |
| `apps/api/src/inference/evaluation-hash.test.ts`          | New             | 15 hash utility tests                                               |
| `apps/api/src/inference/evaluation-report-schema.test.ts` | New             | 15 schema validation tests                                          |
| `apps/api/src/inference/evaluation-algorithm.ts`          | Refactor        | Import from `evaluation-hash.ts`, re-export                         |
| `apps/api/src/inference/evaluation.service.ts`            | Correctness fix | Remove local metricsHash, fix legacy adapter                        |
| `scripts/seed-db.ts`                                      | Correctness fix | Import shared hash, remove toFixed helpers, remove seed_placeholder |
| `scripts/harness/phase20c-evaluation-integrity-check.ts`  | New             | 12-point DB harness                                                 |
| `package.json`                                            | Addition        | `harness:phase20c` script                                           |
| `README.md`                                               | Documentation   | Phase status, ONNX description                                      |

---

## Finding Severity Guide

| Severity | Meaning                                            |
| -------- | -------------------------------------------------- |
| CRITICAL | Security, data loss, or broken invariant           |
| HIGH     | Incorrect metric computation, wrong business logic |
| MEDIUM   | Tech debt, edge case not covered, maintainability  |
| LOW      | Style, minor optimization                          |
| INFO     | Observation, non-blocking                          |

---

## FINDING-01: Seed hash used lossy toFixed approach while runtime used JSON.stringify — FIXED

**File:** `scripts/seed-db.ts`
**Severity:** HIGH

### Description (pre-fix)

The seed's `canonicalPredId` used:

```typescript
p.id +
  '|' +
  p.assetId +
  '|' +
  p.label +
  '|' +
  g.x.toFixed(1) +
  '|' +
  g.y.toFixed(1) +
  '|' +
  g.width.toFixed(1) +
  '|' +
  g.height.toFixed(1) +
  '|' +
  p.confidence.toFixed(3);
```

The runtime's `computeInputHash` used:

```typescript
JSON.stringify({
  jobId,
  datasetVersionId,
  iouThreshold,
  algorithmVersion,
  predictions: sortedPreds.map((p) => ({ id, assetId, classKey, geometry, confidence })),
  groundTruth: sortedGt.map((gt) => ({ id, assetId, classKey, geometry })),
});
```

These are byte-for-byte different approaches. The seed also used `label` where the runtime used `classKey`, and sorted by `id` but built the canonical string differently.

### Fix Applied

Created shared `evaluation-hash.ts` with pure hash functions. Seed imports these directly. Both now use identical canonical JSON.

**Verdict:** FIXED.

---

## FINDING-02: Seed had metricsHash = 'seed_placeholder' — FIXED

**File:** `scripts/seed-db.ts`
**Severity:** HIGH

### Description

The seeded `evaluationReport` had `metricsHash: 'seed_placeholder'` instead of a real canonical hash.

### Fix Applied

Seed now computes `metricsHash` using `computeEvaluationMetricsHash(seededReport)` from the shared module.

**Verdict:** FIXED.

---

## FINDING-03: Legacy adapter used unsafe partial cast — FIXED

**File:** `apps/api/src/inference/evaluation.service.ts`
**Severity:** HIGH

### Description (pre-fix)

```typescript
const legacyResult = EvaluationReportSchema.partial().safeParse(raw);
if (legacyResult.success) {
  const partial = legacyResult.data;
  if (partial.jobId && partial.datasetVersionId && partial.perClassMetrics) {
    return partial as EvaluationReport; // Cast from Partial<EvaluationReport> to EvaluationReport
  }
}
```

This would accept any subset with at least jobId/datasetVersionId/perClassMetrics.

### Fix Applied

- Check ALL required summary fields before attempting adaptation
- Build adapted object with explicit type assertions
- Re-validate adapted object against full `EvaluationReportSchema`
- Return null if strict parse or re-validation fails

**Verdict:** FIXED.

---

## FINDING-04: No Phase 20C harness — FIXED

**File:** `scripts/harness/phase20c-evaluation-integrity-check.ts`
**Severity:** MEDIUM

### Description

No harness existed to verify seed/runtime hash consistency from the database.

### Fix Applied

Created 12-point harness that:

- Reads DB directly (read-only, no mutations)
- Recomputes `inputHash` from live predictions + scoped GT
- Recomputes `metricsHash` from live report data
- Compares against persisted values
- Fails loudly with precise error messages

**Verdict:** FIXED.

---

## FINDING-05: README described Phase 19/20 as "Planned" — FIXED

**File:** `README.md`
**Severity:** LOW

### Description

The Implementation Status table had Phase 19 and Phase 20 listed as "Planned" with Phase 20 as a future target.

### Fix Applied

Updated to "Done" with phase references. Added Phase 20B and Phase 20C entries.

**Verdict:** FIXED.

---

## FINDING-06: README described CV Worker ONNX as "(stub)" — FIXED

**File:** `README.md`
**Severity:** LOW

### Description

CV Worker feature list and Known Limitations section described ONNX inference as a stub.

### Fix Applied

Updated to describe YOLOv8n detector and real ONNX path.

**Verdict:** FIXED.

---

## FINDING-07: Phase 20B artifacts overclaimed seed alignment — DOCUMENTED

**Files:** Phase 20B SUMMARY/REVIEW
**Severity:** INFO

### Description

Phase 20B SUMMARY and REVIEW claimed the seed was aligned with the runtime. In reality, the seed used the old lossy approach.

### Resolution

Phase 20C artifacts include a correction note explicitly stating this was overclaimed.

**Verdict:** DOCUMENTED in Phase 20C artifacts.

---

## Summary

| Finding                                           | Severity | Status     |
| ------------------------------------------------- | -------- | ---------- |
| 01 Seed hash used toFixed while runtime used JSON | HIGH     | FIXED      |
| 02 metricsHash was 'seed_placeholder'             | HIGH     | FIXED      |
| 03 Legacy adapter used unsafe partial cast        | HIGH     | FIXED      |
| 04 No Phase 20C harness                           | MEDIUM   | FIXED      |
| 05 README Phase 19/20 listed as Planned           | LOW      | FIXED      |
| 06 README CV Worker described as stub             | LOW      | FIXED      |
| 07 Phase 20B overclaimed seed alignment           | INFO     | DOCUMENTED |

**Total findings:** 7 (3 HIGH, 1 MEDIUM, 2 LOW, 1 INFO)
**Resolved:** 6/7
**Documented:** 1/7
**Blocking:** 0

---

## Test Coverage

**New tests (30):**

Hash utility tests (`evaluation-hash.test.ts`, 15 tests):

- Same inputs → same hash
- Same IDs in different order → same hash
- Tiny geometry diff (0.0001) → different hash
- Tiny confidence diff → different hash
- Different IDs → different hash
- Returns 16-char lowercase hex
- algorithmVersion in canonical
- iouThreshold in canonical
- Same report, different evaluatedAt → same metricsHash
- Same report, different id → same metricsHash
- Changed perClassMetrics → different metricsHash
- Changed matches → different metricsHash
- No matches → stable metricsHash
- 16-char hex output
- perClassMetrics sorted deterministically

Schema validation tests (`evaluation-report-schema.test.ts`, 15 tests):

- Full report passes strict parse
- Without matches passes (optional)
- Missing perClassMetrics fails
- Missing jobId fails
- Missing inputHash fails
- Missing metricsHash fails
- Missing evaluatedAt fails
- Wrong precision type fails
- inputHash not 16 chars fails
- metricsHash not 16 chars fails
- Partial jobId/datasetVersionId/perClassMetrics fails
- Empty object fails
- Legacy without matches passes
- inputHash regex: valid passes
- metricsHash regex: valid passes
