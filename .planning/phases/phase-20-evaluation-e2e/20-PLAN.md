# Phase 20 Plan — Evaluation Report End-to-End

**Phase:** 20
**Status:** Planned
**Depends on:** Phase 19 (FULL PASS 10/10)
**Target:** Production-grade evaluation E2E with deterministic matching and persisted reports

## Problem Statement

Current `EvaluationService` has 6 known deficiencies:

1. **`process.env.DATABASE_URL` branching inside service methods** — violates adapter boundary rules
2. **CV worker evaluation call for DB path** — opaque worker-side metrics, non-deterministic
3. **`Date.now()` in report ID** — violates deterministic report requirement (EVAL-08)
4. **Per-class metrics hardcode `"vehicle"`** — not real class labels
5. **`getPredictionsForJob()` returns `"unknown"`** — should use `metadata.cocoLabel` fallback
6. **New row each evaluation run** — no inputHash deduplication

## Execution Checklist

### Core Algorithm

- [x] `evaluation-algorithm.ts`: pure function IoU matching, deterministic ordering, per-class metrics
- [x] `label-mapper.ts`: resolve COCO label to LabelClass.name, handle unmapped
- [x] Contracts: extend `EvaluationReport` with `inputHash`, `algorithmVersion`, `iouThreshold`, traceability fields
- [x] Unit tests: 9 fixture cases for algorithm

### EvaluationService Refactor

- [x] Remove `process.env.DATABASE_URL` branching — use adapter path via `isDatabaseMode()`
- [x] Replace CV worker `evaluate()` call with TypeScript algorithm
- [x] Replace `Date.now()` report ID with deterministic `inputHash` computation
- [x] Replace hardcoded `"vehicle"` with real class labels from LabelClass
- [x] Add `inputHash` to persisted report for deduplication
- [x] Add `evaluate()` method to `InferenceRepository` interface or query directly
- [x] Update `getPredictionsForJob()`: use `metadata.cocoLabel` fallback when `labelClassId` is null

### Persistence

- [x] `EvaluationReport` schema: `inputHash` (String?), `algorithmVersion` (String?)
- [x] Upsert by `inputHash` — reuse existing report if same inputs
- [x] Traceability: jobId, datasetVersionId, pipelineId, modelId in metricsJson

### Seed Data

- [x] Seed predictions with ground-truth-like geometry aligned to annotations
- [x] Seed predictions with `labelClassId` set to real label IDs (car, van, truck)
- [x] Seed prediction `metadataJson.cocoLabel` for ONNX-compatible predictions

### Frontend (minimal, focused)

- [x] EvaluationMetricsPanel: renders from API — already correct, no changes needed
- [x] PredictionOverlayCanvas: shows GT + predictions — already correct, no changes needed
- [x] JobInspector: already wires evaluation run — no changes needed

### Harness

- [x] `scripts/harness/phase20-evaluation-spot-check.ts`: DB spot-check for persisted reports
- [x] Phase 19 regression check via `pnpm harness:phase19`
- [x] Phase 20 smoke script if needed

### Artifacts

- [x] `20-SUMMARY.md`
- [x] `20-REVIEW.md`
- [x] `20-METAHARNESS.md`
- [x] Update `STATE.md`, `ROADMAP.md`, `MILESTONES.md`, `REQUIREMENTS.md`

## Algorithm Specification

### `evaluation-algorithm.ts`

Pure function: `computeEvaluationMetrics(input, config) => EvaluationResult`

Input shapes:

```typescript
interface EvaluationInput {
  predictions: Array<{
    id: string;
    assetId: string;
    classKey: string; // normalized class label
    label: string; // display name
    geometry: BBoxGeometry;
    confidence: number;
    labelClassId: string | null;
    cocoLabel?: string;
  }>;
  groundTruth: Array<{
    id: string;
    assetId: string;
    classKey: string;
    label: string;
    geometry: BBoxGeometry;
  }>;
  labelClasses: Map<string, { id: string; name: string; color: string }>;
}

interface Config {
  iouThreshold: number; // default 0.5
  algorithmVersion: string; // "eval-v1-iou-0.5-greedy-class-aware"
}
```

Matching rules:

1. Group by (assetId, classKey)
2. Sort predictions: confidence DESC, id ASC
3. For each prediction (greedy):
   - Find unmatched GT in same asset/class
   - Choose highest IoU GT
   - If IoU >= threshold: TP, mark GT matched
   - Else: FP
4. Unmatched GT after all predictions: FN

Metrics:

- Precision = TP / (TP + FP), 0 if zero
- Recall = TP / (TP + FN), 0 if zero
- F1 = 2*P*R/(P+R), 0 if P+R=0
- Mean IoU = avg IoU of TP matches, 0 if no matches
- Per-class: same metrics by classKey
- Class ordering: label ASC, classKey ASC (stable)

## Label Mapping

`resolvePredictionClass(prediction, projectLabelClasses)`:

1. If `labelClassId` exists in LabelClass → use LabelClass.name
2. Else if `metadata.cocoLabel` exists → normalize (lowercase, trim, collapse whitespace) → find LabelClass match → use that name
3. Else → classKey = `unmapped:unknown`, label = "unknown"

## inputHash Computation

```
inputHash = SHA-256(canonical([
  sorted(jobId),
  sorted(datasetVersionId),
  sorted(predictions by id: assetId|classKey|x|y|w|h|confidence),
  sorted(groundTruth by id: assetId|classKey|x|y|w|h)
].join('|')))
```

## Files to Change

### New Files

- `apps/api/src/inference/evaluation-algorithm.ts` — pure function
- `apps/api/src/inference/label-mapper.ts` — COCO label mapping
- `apps/api/src/inference/evaluation.service.test.ts` — unit tests
- `scripts/harness/phase20-db-spot-check.ts` — harness

### Modified Files

- `apps/api/src/inference/evaluation.service.ts` — refactored
- `packages/contracts/src/evaluation.ts` — extended contract
- `scripts/seed-db.ts` — ground-truth predictions
- `package.json` — `harness:phase20` script

## Verification Commands

```
pnpm db:generate
pnpm --filter @visionflow/api typecheck
pnpm --filter @visionflow/api test
pnpm --filter @visionflow/web typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm harness:phase19
pnpm harness:phase20
pnpm dev:full:win
# then smoke POST /api/projects/proj_parking_lot/inference-jobs/evaluate
# then smoke GET /api/projects/proj_parking_lot/inference-jobs/<id>/evaluation
```
