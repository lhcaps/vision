# Phase 8 Summary — Prediction Overlay and Evaluation

Status: executed
Date: 2026-05-01

## What Was Delivered

### Wave 1 — Backend

**Contracts** (`packages/contracts/src/evaluation.ts`):
- `PerClassMetricSchema` — per-class precision/recall/F1/TP/FP/FN/count
- `EvaluationReportSummarySchema` — top-level IoU metrics (without per-class breakdown)
- `EvaluationReportSchema` — full report with `perClassMetrics[]`
- `PredictionSummarySchema` — bounding-box prediction with label, color, geometry, confidence
- `EvaluationReportListResponseSchema`, `EvaluationRunResponseSchema`, `PredictionListResponseSchema`, `RunEvaluationRequestSchema`

**EvaluationService** (`apps/api/src/inference/evaluation.service.ts`):
- `getEvaluationReport(jobId)` — reads cached report from Prisma or memory cache
- `runEvaluation(dto)` — computes IoU-based metrics (in-process fallback when CV_WORKER_URL absent), persists to Prisma
- `getPredictionsForJob(jobId)` — returns prediction rows with label/color metadata
- Dual-path architecture: Prisma when DATABASE_URL is set, memory fallback otherwise

**CvWorkerClient.evaluate()** (`apps/api/src/inference/cv-worker.client.ts`):
- HTTP POST to `CV_WORKER_URL/cv/evaluate-detections` when configured
- Inline IoU fallback when no CV worker is available

**API Routes** (`apps/api/src/inference/inference.controller.ts`):
- `GET /projects/:projectId/inference-jobs/:jobId/evaluation` — returns latest report
- `POST /projects/:projectId/inference-jobs/evaluate` — runs evaluation, returns full report
- `GET /projects/:projectId/inference-jobs/:jobId/predictions` — returns prediction rows

**Module Wiring** (`apps/api/src/inference/inference.module.ts`):
- `EvaluationService` added to providers, injected into `InferenceController`

### Wave 2 — Frontend

**PredictionOverlayCanvas** (`apps/web/src/features/evaluation/PredictionOverlayCanvas.tsx`):
- Layered canvas with radial gradient base, atmospheric bottom fade, atmospheric grid overlay
- GT boxes: dashed border, green tint fill, label tag
- Prediction boxes: solid border, amber tint fill, confidence tag
- Toggle controls bar: backdrop blur, inner-glow active state (NO border), phosphor icons
- Three toggle buttons: GT (Eye), Pred (Crosshair), IoU (Lightning)
- Scanline animation for populated state, reduced-motion instant opacity
- Loading skeleton, empty, error states

**EvaluationMetricsPanel** (`apps/web/src/features/evaluation/EvaluationMetricsPanel.tsx`):
- Three primary metric cards (Precision / Recall / F1) with color-coded values
- Mean IoU card, TP/FP/FN count tiles with signal/amber/red color coding
- Evaluated-at and asset-count meta block
- Collapsible per-class breakdown table with sortable columns
- Skeleton loaders during evaluation
- "Run evaluation" primary CTA button with signal green, press feedback
- Retry button on error

**JobsPanel upgrade** (`apps/web/src/App.tsx`):
- Three-column grid: Job detail (left) / Prediction overlay canvas (center) / Evaluation metrics (right)
- App state for evaluationReport, isEvaluating, evaluationError, predictions
- Effect to fetch evaluation and predictions when job reaches SUCCEEDED
- `handleRunEvaluation` async handler wiring "Run evaluation" to `POST /evaluate`
- API client added: `getEvaluationReport`, `runEvaluation`, `getJobPredictions`

### Wave 3 — Verification

- `pnpm verify` passes: all 6 packages, 51 tests, production build
- 28 contracts tests pass
- 23 API tests pass
- All 4 packages typecheck clean

## Key Decisions

1. **Inline IoU fallback in CvWorkerClient** — when CV_WORKER_URL is not set, evaluation computes IoU in-process rather than failing. This matches the pattern used for pipeline run in Phase 7.
2. **Memory eval cache** — `memoryEvalCache` module-level Map holds computed reports keyed by jobId so repeated calls return the same result without re-computation.
3. **No border on any UI element** — all selection states use background tint + inner glow per the design system. Toggle buttons in the canvas controls bar use the same inner-glow pattern as nav items and pipeline node selection.
4. **Three-column JobsPanel** — layout expands from the previous two-column to three-column (job detail / overlay / metrics) to give evaluation results full-width presence.
5. **Full EvaluationReport returned by GET endpoint** — both GET and POST evaluation endpoints return the full `EvaluationReport` with `perClassMetrics` for consistency.
