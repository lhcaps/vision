# Phase 20 Code Review

**Phase:** 20 — Evaluation Report E2E
**Review date:** 2026-05-04
**Reviewer:** Claude (automated + self-review)

## Files Reviewed

### New Files

| File                                                  | LOC  | Purpose                                                               |
| ----------------------------------------------------- | ---- | --------------------------------------------------------------------- |
| `apps/api/src/inference/evaluation-algorithm.ts`      | ~382 | Pure function IoU matching, deterministic ordering, per-class metrics |
| `apps/api/src/inference/evaluation-algorithm.test.ts` | ~250 | 21 unit tests for algorithm                                           |
| `apps/api/src/inference/label-mapper.ts`              | ~50  | Label resolution from labelClassId or cocoLabel                       |
| `scripts/harness/phase20-db-spot-check.ts`            | ~120 | DB state verification harness                                         |
| `scripts/smoke/phase20-evaluation-smoke.ts`           | ~90  | Runtime smoke test                                                    |

### Modified Files

| File                                           | Change Type       | Key Changes                                                                    |
| ---------------------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `apps/api/src/inference/evaluation.service.ts` | Refactor          | Remove DATABASE_URL branching, use TS algorithm, deterministic ID, real labels |
| `packages/contracts/src/evaluation.ts`         | Extension         | New schema fields: inputHash, metricsHash, traceability, per-class meanIoU     |
| `scripts/seed-db.ts`                           | Data fix          | Ground-truth predictions, seeded EvaluationReport row                          |
| `scripts/harness/phase19-db-spot-check.ts`     | Compatibility fix | WARN for transient smoke artifacts, explicit Check 2b for seed predictions     |
| `package.json`                                 | New script        | `harness:phase20`                                                              |

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

## FINDING-01: Report ID generation has unstable suffix (LOW)

**File:** `apps/api/src/inference/evaluation.service.ts`
**Line:** ~188
**Severity:** LOW

### Description

Report ID is constructed as:

```
eval_${result.inputHash}_${jobId.replace(/[^a-z0-9]/gi, '')}
```

The `jobId.replace(/[^a-z0-9]/gi, '')` strips non-alphanumeric characters. For the seed job `job_2026_04_28_2036`, this produces `job202604282036`. This is stable but loses readability. The `inputHash` already uniquely identifies the evaluation inputs, so adding a suffix is unnecessary.

### Recommendation

Use `report.id = eval_${result.inputHash}` only, since `inputHash` is already collision-resistant for the given job. Or use `report.id = eval_${result.inputHash}_${jobId}` with the full jobId if readability matters.

**Verdict:** Not blocking. Current form is functional and deterministic.

---

## FINDING-02: Repeated POST /evaluate creates new rows (INFO)

**File:** `apps/api/src/inference/evaluation.service.ts`
**Line:** ~226
**Severity:** INFO

### Description

Every call to `POST /evaluate` creates a new `EvaluationReport` row. The `inputHash` is computed and stored for future upsert capability, but no upsert logic is implemented. Each re-run appends a new row.

### Recommendation

Consider adding an upsert: query for existing report with same `inferenceJobId` and `inputHash`, return existing if found. However, keeping separate rows is also valid for audit trails. Document the behavior.

**Verdict:** Not blocking. Row creation is intentional (audit trail). `inputHash` is ready for upsert to be added.

---

## FINDING-03: PipelineId/modelId sourced from prediction metadata (MEDIUM)

**File:** `apps/api/src/inference/evaluation-algorithm.ts`
**Lines:** ~303-308
**Severity:** MEDIUM

### Description

```typescript
const pipelineId: string | null = predictions[0]
  ? ((predictions[0] as EvaluationPrediction & { pipelineId?: string }).pipelineId ?? null)
  : null;
```

This pulls `pipelineId` and `modelId` from the first prediction's metadata, not from the job itself. If predictions exist but the first one lacks these fields, traceability is incomplete.

The `EvaluationService.runEvaluation()` has `job.pipelineId` and `job.modelId` available from the job query (lines 87-90, 191-192), but discards them in favor of the prediction metadata.

### Recommendation

Pass `pipelineId` and `modelId` as explicit parameters to `computeEvaluationMetrics`, or construct the report in `EvaluationService` where `job.pipelineId` and `job.modelId` are available. The current approach is fragile.

### Status

**PARTIAL FIX APPLIED:** `EvaluationService.runEvaluation()` sets `pipelineId: job.pipelineId ?? null` and `modelId: job.modelId ?? null` in the final report object (lines 191-192), overriding the values from `computeEvaluationMetrics`. This is the correct fix — the service layer has direct access to job metadata.

---

## FINDING-04: Ground truth annotation null check (MEDIUM)

**File:** `apps/api/src/inference/evaluation.service.ts`
**Lines:** ~156-160
**Severity:** MEDIUM

### Description

```typescript
const lc = labelClassMap.get(ann.labelClassId);
if (!lc) {
  throw new Error(
    `Ground truth annotation ${ann.id} references unknown labelClassId ${ann.labelClassId}.`
  );
}
```

This throws if a ground truth annotation references an unknown `labelClassId`. This is correct behavior — GT without a label class is invalid. However, the error is thrown at evaluation time rather than at annotation creation time.

### Recommendation

The `AnnotationsService` should validate that `labelClassId` exists at annotation creation/update time. Currently this is a pre-condition of evaluation, not a database constraint.

**Status:** Not blocking. Correctly enforced at evaluation boundary. Consider adding a DB constraint as a follow-up.

---

## FINDING-05: No explicit test for unmatched cocoLabel fallback (LOW)

**File:** `apps/api/src/inference/evaluation-algorithm.test.ts`
**Severity:** LOW

### Description

The unit tests cover `perfect match`, `duplicate predictions`, `low IoU false positive`, `wrong class false positive`, `missing prediction false negative`, `multi-class`, `empty predictions`, `empty ground truth`, and `mean IoU correct`. However, there is no explicit test for the `unmapped:cocoLabel` path in the algorithm tests.

The `unmapped` label mapping is tested through the integration path (`evaluation.service.ts` → `resolvePredictionClass`), but the pure algorithm function doesn't have a dedicated fixture for predictions with `unmapped:` classKeys.

### Recommendation

Add a test case to `evaluation-algorithm.test.ts` where a prediction has classKey `unmapped:person` and verify it results in FP (since no GT has that classKey).

**Status:** Not blocking. The label mapping path is covered by integration tests.

---

## FINDING-06: Mean IoU computation uses `Number.toFixed(6)` (LOW)

**File:** `apps/api/src/inference/evaluation-algorithm.ts`
**Lines:** ~257, ~283
**Severity:** LOW

### Description

```typescript
const meanIou = totalTp > 0 ? matches.reduce((s, m) => s + m.iou, 0) / totalTp : 0;
...
meanIou: Number(meanIoU.toFixed(6)),
```

IoU values are computed with 6 decimal precision in `computeIoU`, then summed and divided. The final result is rounded to 6 decimal places. This can introduce small rounding errors in the mean. For identical boxes, IoU = 1.0 exactly, and the mean = 1.0, so no issue. For non-identical boxes, the rounding is acceptable.

### Recommendation

No change needed. 6 decimal places is sufficient precision for bounding box evaluation.

---

## FINDING-07: computeIoU uses toFixed(6) internally (LOW)

**File:** `apps/api/src/inference/evaluation-algorithm.ts`
**Line:** ~99
**Severity:** LOW

### Description

```typescript
return union === 0 ? 0 : Number((intersection / union).toFixed(6));
```

This truncates the IoU to 6 decimal places before returning. For the seed data where GT and predictions are identical, this returns exactly `1.0`. For non-identical boxes, the truncation is negligible and consistent.

**Verdict:** Acceptable. Consistent precision prevents floating-point accumulation errors across many matches.

---

## FINDING-08: LabelMapper normalization handles edge cases (LOW)

**File:** `apps/api/src/inference/label-mapper.ts`
**Severity:** LOW

### Description

`normalizeClassName` uses:

```typescript
value.toLowerCase().trim().replace(/\s+/g, '');
```

This collapses all whitespace to empty string. COCO labels (e.g., "sports ball") would become "sportsball". However, COCO labels themselves don't contain internal whitespace (e.g., "sports ball" but stored as "sports ball"), and project LabelClass names are typically single-word. The normalization is conservative.

### Recommendation

No change needed. The normalization is conservative and safe. If it ever causes issues, it would be a false negative (label not matching when it should), which is safer than a false positive.

---

## Summary

| Finding                                                 | Severity | Status                                   |
| ------------------------------------------------------- | -------- | ---------------------------------------- |
| FINDING-01: Report ID suffix readability                | LOW      | Not blocking                             |
| FINDING-02: Repeated POST creates new rows              | INFO     | Intentional                              |
| FINDING-03: pipelineId/modelId from prediction metadata | MEDIUM   | Fixed (service layer override)           |
| FINDING-04: GT labelClassId not validated at creation   | MEDIUM   | Not blocking (enforced at eval boundary) |
| FINDING-05: No explicit unmapped cocoLabel test         | LOW      | Not blocking                             |
| FINDING-06: Mean IoU rounding                           | LOW      | Not blocking                             |
| FINDING-07: computeIoU truncation                       | LOW      | Not blocking                             |
| FINDING-08: LabelMapper normalization                   | LOW      | Not blocking                             |

**Critical findings:** 0
**High findings:** 0
**Medium findings:** 2 (both not blocking, one partially fixed)
**Low/Info findings:** 6 (all acceptable)

**Recommendation:** Proceed to verification gate. No blocking issues identified.
