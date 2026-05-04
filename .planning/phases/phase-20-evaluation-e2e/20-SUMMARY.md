# Phase 20 Summary — Evaluation Report End-to-End

**Phase:** 20
**Status:** Completed
**Depends on:** Phase 19 (FULL PASS 10/10)
**Completed:** 2026-05-04
**Commit:** `db5fb65` (Phase 19) + `feat(evaluation): persist deterministic evaluation reports`

## What Was Built

Phase 20 replaced the opaque, non-deterministic evaluation implementation with a production-grade, auditable, and reproducible evaluation pipeline:

### Core Evaluation Algorithm (`apps/api/src/inference/evaluation-algorithm.ts`)

- `computeEvaluationMetrics()` — pure function implementing deterministic IoU-based matching
- `computeInputHash()` — SHA-256 of canonical inputs (jobId, datasetVersionId, sorted predictions, sorted GTs, iouThreshold)
- `ALGORITHM_VERSION = 'eval-v1-iou-0.5-greedy-class-aware'`, `DEFAULT_IOU_THRESHOLD = 0.5`
- Greedy matching: predictions sorted by confidence desc + id asc; best IoU GT selected from unmatched pool; IoU >= 0.5 → TP, else FP; unmatched GT → FN
- Per-class metrics with stable ordering (label asc, classKey asc)
- Geometry validation rejecting invalid BBox inputs loudly

### Label Mapping (`apps/api/src/inference/label-mapper.ts`)

- `resolvePredictionClass()` — resolves class labels from `labelClassId` or `metadata.cocoLabel`
- Normalization: lowercase, trim, collapse whitespace
- Falls back to `unmapped:${normalizedCocoLabel}` for unknown COCO labels
- Handles all three paths: (1) labelClassId exists, (2) cocoLabel maps to LabelClass, (3) unmapped

### Refactored EvaluationService (`apps/api/src/inference/evaluation.service.ts`)

- **Removed** `process.env.DATABASE_URL` branching from service methods — uses `isDatabaseMode()`
- **Removed** CV worker evaluation call — API layer owns the full computation
- **Removed** `Date.now()` in report ID — replaced with `inputHash`-based deterministic ID
- **Replaced** hardcoded `"vehicle"` with real class labels from `LabelClass` table
- **Improved** `getPredictionsForJob()` — uses `metadata.cocoLabel` when `labelClassId` is null
- **Added** traceability fields: `datasetVersionId`, `pipelineId`, `modelId`, `algorithmVersion`, `iouThreshold`, `inputHash`, `metricsHash`, `predictionCount`, `groundTruthCount`
- **Added** `metricsHash` helper for output stability verification
- Validates job status SUCCEEDED before evaluation
- Validates dataset version has assets

### Extended Contracts (`packages/contracts/src/evaluation.ts`)

- `PerClassMetricSchema` extended with `classKey` and `meanIou`
- `EvaluationMatchSchema` — matched prediction-GT pairs with IoU
- `EvaluationReportSummarySchema` extended with all traceability + hash fields
- `EvaluationReportSchema` extends summary with `perClassMetrics[]`
- `PredictionSummarySchema` extended with optional `metadata` field
- `RunEvaluationRequestSchema` extended with optional `iouThreshold`

### Updated Seed Data (`scripts/seed-db.ts`)

- All `DEMO_ANNOTATIONS` now `source: 'MANUAL'` (ground truth)
- `DEMO_PREDICTIONS` geometry precisely aligned with `DEMO_ANNOTATIONS` (perfect IoU = 1.0)
- Seeded `evaluationReport` row conforms to new contract (inputHash, metricsHash placeholder, per-class metrics for car/van/truck)
- Inline `computeInputHash` helper generates correct hash for seeded predictions

### Unit Tests (`apps/api/src/inference/evaluation-algorithm.test.ts`)

21 test cases covering:

- Perfect match, duplicate predictions, low IoU FP, wrong class FP, missing prediction FN
- Multi-class metrics, empty predictions, empty ground truth, unmapped COCO label
- Deterministic ordering, mean IoU calculation, geometry validation rejection

### Harness Scripts

- `scripts/harness/phase20-db-spot-check.ts` — verifies DB state: no stale jobs, SUCCEEDED demo job, valid predictions, EvaluationReport exists with full traceability, inputHash is 16-char hex, per-class metrics use real labels (not "vehicle")
- `scripts/harness/phase19-db-spot-check.ts` — updated for seed-data compatibility (WARN for missing transient smoke artifacts, explicit Check 2b for persistent seed predictions)
- `scripts/smoke/phase20-evaluation-smoke.ts` — runtime smoke: health, GET evaluation, POST evaluate, determinism re-run, GET predictions

## Files Changed

### New Files

- `apps/api/src/inference/evaluation-algorithm.ts` — pure evaluation function
- `apps/api/src/inference/evaluation-algorithm.test.ts` — 21 unit tests
- `apps/api/src/inference/label-mapper.ts` — label resolution helper
- `scripts/harness/phase20-db-spot-check.ts` — Phase 20 DB harness
- `scripts/smoke/phase20-evaluation-smoke.ts` — Phase 20 runtime smoke

### Modified Files

- `apps/api/src/inference/evaluation.service.ts` — full refactor
- `packages/contracts/src/evaluation.ts` — extended schemas
- `scripts/seed-db.ts` — ground-truth predictions + seeded report
- `scripts/harness/phase19-db-spot-check.ts` — seed-data compatibility fix
- `package.json` — added `harness:phase20` script

## Verification Results

| Check            | Command                                   | Result                                                        |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Typecheck        | `pnpm --filter @visionflow/api typecheck` | PASS                                                          |
| Typecheck        | `pnpm --filter @visionflow/web typecheck` | PASS                                                          |
| Unit tests       | `pnpm --filter @visionflow/api test`      | PASS (all 21 algorithm tests)                                 |
| Lint             | `pnpm lint`                               | PASS                                                          |
| Format           | `pnpm format:check`                       | PASS                                                          |
| Build            | `pnpm build`                              | PASS                                                          |
| DB generate      | `pnpm db:generate`                        | PASS                                                          |
| Phase 19 harness | `pnpm harness:phase19`                    | PASS                                                          |
| Phase 20 harness | `pnpm harness:phase20`                    | PASS                                                          |
| API health       | `curl localhost:3000/api/health`          | PASS                                                          |
| GET evaluation   | smoke script                              | PASS (report exists, all traceability fields present)         |
| POST evaluate    | smoke script                              | PASS (precision=1, recall=1, f1=1, meanIoU=1, 3 TP/0 FP/0 FN) |
| Determinism      | smoke script (re-run)                     | PASS (inputHash unchanged: `0c59dbe9c7062999`)                |
| GET predictions  | smoke script                              | PASS (3 predictions, label=car/van/truck)                     |

## Algorithm Behavior

Given seed data: 3 predictions (car/van/truck, identical geometry to GT, confidence 0.941/0.923/0.906):

- **3 TP, 0 FP, 0 FN** — all predictions matched to their respective GT boxes
- **Precision = 1.0, Recall = 1.0, F1 = 1.0** — perfect detection
- **Mean IoU = 1.0** — all predictions are pixel-perfect matches to GT
- **Per-class:** car/van/truck each with P=1, R=1, F1=1, meanIoU=1.0
- **inputHash = `0c59dbe9c7062999`** — stable across re-runs
- **Deterministic ID:** `eval_0c59dbe9c7062999_job202604282036`

## Persistence Behavior

- `EvaluationReport` row created in `evaluation_report` table on each `POST /evaluate`
- `metricsJson` contains full `EvaluationReport` contract with all traceability fields
- `confusionMatrixJson` set to `Prisma.JsonNull` (reserved for future per-class confusion matrix)
- Row is not upserted by inputHash — each `POST` creates a new row. This is intentional: `inputHash` is computed and stored for future deduplication capability, but current implementation creates a new row per evaluation run. The hash enables idempotent behavior to be added in a future phase.

## Frontend Behavior

No frontend changes were needed. The existing `JobInspector`, `PredictionOverlayCanvas`, and `EvaluationMetricsPanel` already:

- Render metrics from API response (no frontend metric computation)
- Show GT + prediction overlay with toggle controls
- Display per-class metrics table
- Handle empty/error states correctly

## What Phase 20 Did NOT Change

- Did not redesign the UI broadly
- Did not use memory fallback as the proof path
- Did not hide backend failures with frontend fallbacks
- Did not compute evaluation from CV worker for the DB path
- Did not use `Date.now()` for any deterministic field
- Did not hardcode "vehicle" or any generic class label
- Did not regress Phase 19 guarantees (predictions still persist, traceability still complete)
