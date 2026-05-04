# Phase 20B Summary — Evaluation Correctness Hardening

**Phase:** 20B
**Status:** Completed
**Depends on:** Phase 20 (FULL PASS 10/10)
**Completed:** 2026-05-04
**Commit:** `fix(evaluation): harden deterministic evaluation correctness`

## What Was Fixed

Phase 20B addressed 7 correctness blockers found in the Phase 20 audit that prevented the evaluation subsystem from being production-correct. The demo happy-path still passes (3 predictions, 3 GT, identical boxes, TP=3, FP=0, FN=0, P=R=F1=IoU=1.0), but the underlying logic was corrected.

### Fix 4.1: Per-Class Aggregation (`evaluation-algorithm.ts`)

**Bug:** The algorithm grouped by `${assetId}|${classKey}` and stored metrics into `classMetrics` using only `classKey` as the key. This meant that if "car" appeared in asset a1 and asset a2, only the last one's TP/FP/FN survived — producing incorrect per-class aggregates.

**Fix:** Introduced a `classAccumulator` Map that accumulates TP/FP/FN/IoUs across all `assetId|classKey` groups sharing the same `classKey`. After processing all groups, the accumulator is converted into sorted per-class rows.

```
// Before (overwriting):
classMetrics.set(classKey, { tp, fp, fn, ious: [...] });

// After (accumulating):
if (!acc.tp) acc = { label, tp: 0, fp: 0, fn: 0, ious: [] };
acc.tp += tp; acc.fp += fp; acc.fn += fn; acc.ious.push(...ious);
```

**Result:** If "car" in asset a1 (TP=1) and "car" in asset a2 (FP=1, FN=1), the final per-class "car" row has TP=1, FP=1, FN=1.

### Fix 4.2: LOCKED Dataset Version Enforcement (`evaluation.service.ts`)

**Bug:** Evaluation could run against DRAFT or ARCHIVED dataset versions, producing incorrect or stale results.

**Fix:** Before loading assets/GT, `runEvaluation()` now queries the `DatasetVersion` by `job.datasetVersionId`. If `status !== 'LOCKED'`, throws `ConflictException("Evaluation requires a LOCKED dataset version. Current status: <status>.")`. Memory/demo mode is unaffected.

### Fix 4.3: GT Scoping via AnnotationSet (`evaluation.service.ts`)

**Bug:** Ground truth was loaded via `link.asset.annotations` (all annotations on the asset), which could include annotations from annotation sets belonging to other dataset versions.

**Fix:** Ground truth is now loaded exclusively from `AnnotationSet` rows that belong to the evaluated `DatasetVersion`. The query loads `DatasetVersion` with `annotationSets` included, then collects annotations filtered by `source='MANUAL'` and `assetId` in the version's asset set.

**Note:** FP-only results are correctly produced when there are predictions but no GT annotations for a locked dataset version.

### Fix 4.4: Strict Report Parsing (`evaluation.service.ts`)

**Bug:** `getEvaluationReport()` used `EvaluationReportSchema.partial().safeParse(raw)` and cast the result to `EvaluationReport`, accepting any partial data as a full report.

**Fix:** Two-tier validation:

1. Strict `EvaluationReportSchema.safeParse(raw)` first — if valid, return it
2. Legacy adapter for known old shapes — explicit checks for essential fields (`jobId`, `datasetVersionId`, `perClassMetrics`)
3. `null` if neither succeeds — prevents corrupted data from being presented as valid

### Fix 4.5: Non-Lossy InputHash (`evaluation-algorithm.ts`)

**Bug:** `canonicalPredId` used `toFixed(1)` for geometry and `toFixed(3)` for confidence, causing hash collisions for very similar predictions.

**Fix:** Replaced lossy string concatenation with deterministic canonical JSON:

- `algorithmVersion` included in canonical content
- Predictions and GTs sorted by `id` (not `assetId`)
- Exact numeric values for `geometry` and `confidence` (no rounding)
- Full SHA-256 computed, 16-char hex prefix returned
- Seed's inline hash computation updated to match the new approach

**Result:** Same IDs in different order → identical hash; tiny geometry diff (0.0001) → different hash; tiny confidence diff → different hash.

### Fix 4.6: EvaluationMatch Persisted (`evaluation.ts`, `evaluation.service.ts`)

**Bug:** `EvaluationMatchSchema` existed in contracts and was computed by the algorithm, but never persisted or returned in the final report.

**Fix:** Extended `EvaluationReportSchema` with optional `matches: EvaluationMatchSchema[]`. `runEvaluation()` now includes `result.matches` in the persisted `metricsJson`. `runMemoryEvaluation()` also includes matches.

### Fix 4.7: metricsHash Full Payload (`evaluation.service.ts`)

**Bug:** `metricsHash` was computed from only 8 fields (jobId, inputHash, TP/FP/FN, P/R/F1/meanIoU), missing perClassMetrics and matches.

**Fix:** `metricsHash` is now computed from a canonical JSON representation of the full report payload, including:

- jobId, datasetVersionId, pipelineId, modelId, algorithmVersion, iouThreshold, inputHash
- Overall metrics: precision, recall, f1, meanIoU, truePositives, falsePositives, falseNegatives
- predictionCount, groundTruthCount, assetCount
- perClassMetrics (sorted deterministically)
- matches (sorted deterministically, if present)

**Excluded:** `metricsHash` itself, `id`, `evaluatedAt` (non-deterministic across re-runs).

## Files Changed

| File                                                  | Change Type      | Key Changes                                                                                 |
| ----------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `apps/api/src/inference/evaluation-algorithm.ts`      | Correctness fix  | Accumulator per-class agg, non-lossy hash, matches in result                                |
| `apps/api/src/inference/evaluation.service.ts`        | Correctness fix  | LOCKED check, GT scoping, strict parsing, matches persisted, full metricsHash               |
| `apps/api/src/inference/evaluation-algorithm.test.ts` | Test expansion   | 10 new tests: cross-asset agg, hash precision, order stability, matches, legacy parsing     |
| `packages/contracts/src/evaluation.ts`                | Schema extension | Optional `matches[]` in `EvaluationReportSchema`                                            |
| `packages/contracts/src/evaluation.test.ts`           | Test fixture fix | Updated all fixtures to match Phase 20 schema (missing required fields)                     |
| `scripts/seed-db.ts`                                  | Seed alignment   | Updated hash computation to match non-lossy algorithm, `meanIoU=1.0`, `matches[]` in report |

## Verification Results

```
pnpm --filter @visionflow/api typecheck  ✅
pnpm --filter @visionflow/api test       ✅ (279 tests: 173 API + 43 contracts + 63 web)
pnpm typecheck                           ✅
pnpm test                                ✅
pnpm build                               ✅
pnpm lint                                ✅
pnpm format:check                        ✅
```

**Unit test coverage (31 algorithm tests, 10 new):**

- Cross-asset: same class in 2 assets → aggregated per-class row
- Cross-asset: car TP in a1, car FP+FN in a2 → aggregated
- Hash precision: tiny geometry diff (0.0001) → different hash
- Hash precision: tiny confidence diff → different hash
- Hash order: same IDs in different array order → identical hash
- Hash identity: different IDs → different hash
- Matches: report includes predictionId, groundTruthId, assetId, classKey, iou
- Matches: deterministic ordering preserved
- FP-only: no GT for locked version with predictions
- Legacy: partial report with missing perClassMetrics → null

## What Was Preserved

- Demo happy path: 3 predictions, 3 GT, identical boxes, TP=3, FP=0, FN=0, P=R=F1=IoU=1.0
- Algorithm matching logic (greedy IoU, deterministic ordering)
- Label mapping behavior (labelClassId priority, cocoLabel fallback, unmapped prefix)
- Existing contract shapes (matches is optional for backward compat)
- Seed data structure (same asset, same annotations, same predictions)
