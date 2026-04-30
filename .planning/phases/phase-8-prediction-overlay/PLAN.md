# Phase 8 Plan, Prediction Overlay and Evaluation

Status: planned
Date: 2026-05-01

## Goal

Deliver Phase 8: real prediction overlay canvas, ground-truth comparison, and per-job evaluation metrics. Build on the Phase 7 foundation where predictions are already persisted to Prisma and evaluation contracts exist.

## Wave 1 — Backend (contracts + API)

### 1. API Evaluation Endpoint

<read_first>

- packages/contracts/src/cv-worker.ts
- packages/contracts/src/jobs.ts
- packages/contracts/src/annotations.ts
- apps/api/src/inference/inference.service.ts
  </read_first>

<action>
Add `POST /inference/evaluate` endpoint in `apps/api/src/inference/` that:

1. Accepts `{ jobId: string }` in the request body.
2. Loads the `InferenceJob` from the database, returns 404 if not found.
3. Loads all `Prediction` rows for the job's asset IDs.
4. Loads all `Annotation` rows (ground truth) for the same asset IDs, filtered to `source === 'MANUAL'`.
5. Groups predictions and annotations by `assetId`.
6. For each asset with both predictions and annotations, calls the CV worker evaluation endpoint (`POST {CV_WORKER_URL}/cv/evaluate-detections`) with the matched pairs.
7. Persists the returned `EvaluationReport` to Prisma (`EvaluationReport` model).
8. Returns the evaluation report in the response.

Create `apps/api/src/inference/evaluation.service.ts` with an `runEvaluation(jobId)` method. The existing `InferenceService` stays responsible for job creation and dispatch. Evaluation is a separate concern.

The endpoint should also work on the memory fallback path: when `DATABASE_URL` is not set, it computes IoU-based metrics in-memory using the same contracts and returns them without persisting.
</action>

<acceptance_criteria>

- `POST /inference/evaluate` returns 404 for unknown job IDs
- Returns an evaluation report with precision, recall, F1, meanIoU, truePositives, falsePositives, falseNegatives, and perClassMetrics fields
- All evaluation fields match the shapes defined in `packages/contracts/src/cv-worker.ts` (EvaluationResponseSchema)
- API typecheck passes
- API tests pass for the evaluation endpoint (happy path + 404)
  </acceptance_criteria>

### 2. API Evaluation Contract

<read_first>

- packages/contracts/src/cv-worker.ts
  </read_first>

<action>
Add `EvaluationReportSchema`, `EvaluationMetricBlockSchema`, and `PerClassMetricSchema` to `packages/contracts/src/evaluation.ts` (new file). Re-export from the index. The schema must include:
- `id: string`
- `jobId: string`
- `precision: number`
- `recall: number`
- `f1: number`
- `meanIoU: number`
- `truePositives: number`
- `falsePositives: number`
- `falseNegatives: number`
- `perClassMetrics: PerClassMetric[]`
- `evaluatedAt: string` (ISO timestamp)
- `assetCount: number` (how many assets were evaluated)

Per class:

- `label: string`
- `precision: number`
- `recall: number`
- `f1: number`
- `truePositives: number`
- `falsePositives: number`
- `falseNegatives: number`
- `count: number` (total GT boxes for this class)

Add `EvaluationReportSummary` type for API responses (without the full per-class data for list views).
</action>

<acceptance_criteria>

- `packages/contracts/src/evaluation.ts` exists with Zod schemas matching the shapes above
- Index exports the new schemas
- `pnpm --filter @visionflow/contracts test` passes
  </acceptance_criteria>

## Wave 2 — Frontend Canvas and Evaluation Panel

### 3. PredictionOverlayCanvas Component

<read_first>

- apps/web/src/features/annotations/AnnotationEngine.tsx (existing canvas pattern)
- apps/web/src/index.css
- DESIGN.md
- .planning/phases/phase-8-prediction-overlay/UI-SPEC.md
  </read_first>

<action>
Create `apps/web/src/features/evaluation/PredictionOverlayCanvas.tsx` as a new feature component.

Props:

```typescript
type Props = {
  mediaAsset: MediaAssetRow;
  groundTruth: AnnotationSummary[];
  predictions: PredictionSummary[];
  overlayMode: 'gt' | 'pred' | 'both';
  selectedBoxId?: string;
  onSelectBox?: (id: string) => void;
  showIoUOverlay?: boolean;
};
```

Rendering layers (bottom to top):

1. Media image as base (use the asset URL or a placeholder with the correct aspect ratio)
2. Ground-truth BBox layer — boxes rendered with dashed green stroke, translucent green fill, label tag
3. Prediction BBox layer — boxes rendered with solid amber stroke, translucent amber fill, confidence tag
4. IoU overlay — semi-transparent green fill on the intersection rectangle
5. Canvas controls bar — fixed bottom strip

BBox rendering (use absolute positioning with percentage coordinates matching the image):

- GT boxes: `border: 1.5px dashed oklch(80% 0.13 152)`, `background: rgba(106,217,161,0.12)`, `border-radius: 4px`
- Prediction boxes: `border: 1.5px solid oklch(82% 0.13 88)`, `background: rgba(255,183,77,0.12)`, `border-radius: 4px`
- Intersection: `background: rgba(106,217,161,0.35)`
- Label tags: positioned above the box, using the same color as the box border

Canvas controls bar:

- Background: `bg-graphite-950/84 backdrop-blur`
- Border: `border-white/[0.06]` on the top edge only
- Toggle buttons: icon buttons using the inner-glow pattern (NO border)
  - GT toggle (Eye icon): active = `bg-signal-300/10` + inner glow
  - Pred toggle (Crosshair icon): active = `bg-amber-300/10` + inner glow (amber tone)
  - IoU overlay toggle: active = `bg-scan-300/10` + inner glow
- Coordinates: display current hovered box coordinates in monospace

States:

- Loading: skeleton shimmer covering the canvas area
- Empty (no predictions): centered message "No predictions for this asset"
- Error: red-tinted message with retry button
- Populated: full overlay rendering

Use `useReducedMotion` from motion/react for reduced-motion users — skip the shimmer and use instant opacity transitions.
</action>

<acceptance_criteria>

- PredictionOverlayCanvas renders GT boxes (dashed green) and prediction boxes (solid amber) simultaneously in "both" mode
- Toggle buttons immediately show/hide respective layers
- Canvas controls bar is visually integrated with the new design system (inner glow, no white borders)
- Reduced-motion users see instant transitions
- Typecheck passes
  </acceptance_criteria>

### 4. EvaluationMetricsPanel Component

<read_first>

- apps/web/src/features/annotations/AnnotationEngine.tsx (MetricPanel pattern)
- apps/web/src/index.css
- .planning/phases/phase-8-prediction-overlay/UI-SPEC.md
  </read_first>

<action>
Create `apps/web/src/features/evaluation/EvaluationMetricsPanel.tsx`.

Props:

```typescript
type Props = {
  evaluationReport: EvaluationReport | null;
  isLoading: boolean;
  error: string | null;
  onRunEvaluation: () => void;
  isEvaluating: boolean;
};
```

Layout: vertically stacked metric blocks + run evaluation button.

Metric blocks (use bg-white/[0.03] with NO border):

- Precision: large monospace number with label
- Recall: large monospace number with label
- F1: large monospace number with label
- Mean IoU: large monospace number with label
- TP / FP / FN: three small metric tiles with color coding (green/amber/red)

Per-class breakdown: collapsible section with table rows, selected row gets `bg-signal-300/07` + inner glow.

Color coding:

- Precision/Recall/F1 >= 0.8: `text-signal-300`
- > = 0.5: `text-amber-300`
- < 0.5: `text-red-300`

Run evaluation button: primary action button in signal green, using the same button style as other primary actions in the workbench.

States:

- Loading: 5 skeleton metric blocks
- Empty (no evaluation): centered "Run evaluation to see metrics" with Run button
- Error: error message with retry
- Populated: full metrics display
  </action>

<acceptance_criteria>

- EvaluationMetricsPanel shows skeleton loaders while isEvaluating is true
- Shows "Run evaluation" button when evaluationReport is null and not loading
- Displays all 8 metric values (precision, recall, F1, meanIoU, TP, FP, FN) with correct color coding
- Per-class table is collapsible and highlights selected rows
- Typecheck passes
  </acceptance_criteria>

### 5. Replace Job Detail Panels in App.tsx

<read_first>

- apps/web/src/App.tsx (JobDetail section around line 2340)
- apps/web/src/App.tsx (JobsPanel section around line 1720)
  </read_first>

<action>
Replace the existing `JobDetail` function in `App.tsx` (around line 2340) to wire up the new components:

1. Rename the `JobDetail` component's right panel — replace the static `Prediction overlay` panel with `EvaluationMetricsPanel`.
2. Replace the static `VisionPreview` with `PredictionOverlayCanvas`.
3. Add API integration for evaluation:
   - On mount, check if the job has an existing evaluation report (fetch from `GET /inference/jobs/:jobId/evaluation`)
   - If no report exists, show the "Run evaluation" button
   - When "Run evaluation" is clicked, call `POST /inference/evaluate` with the job ID
   - Show loading state during evaluation
4. Wire up prediction data:
   - Fetch predictions from `GET /inference/jobs/:jobId/predictions`
   - Pass predictions to `PredictionOverlayCanvas`
   - Use the same annotation data (ground truth) that the annotation engine uses
5. Apply the new design system classes (inner glow, no white borders) throughout the updated panels.
6. Keep the log stream and job metadata display from the existing implementation.

The canvas controls bar should be rendered inside `PredictionOverlayCanvas`, not in a separate component.

Add state for:

- `evaluationReport: EvaluationReport | null`
- `isEvaluating: boolean`
- `evaluationError: string | null`
- `showGT: boolean` (default true)
- `showPredictions: boolean` (default true)
- `showIoUOverlay: boolean` (default false)
  </action>

<acceptance_criteria>

- Job detail shows PredictionOverlayCanvas with GT + prediction boxes overlaid on the media image
- EvaluationMetricsPanel is visible in the right panel
- "Run evaluation" button triggers API call and transitions metrics from skeleton to populated
- Toggling GT/Pred layers in the canvas controls bar immediately hides/shows respective BBox layers
- All panels follow the new design system (no border-white/10, inner glow for selection)
- Typecheck passes
- Browser smoke passes for Jobs tab desktop and mobile
  </acceptance_criteria>

## Wave 3 — Integration and Verification

### 6. API Evaluation Routes

<read_first>

- apps/api/src/inference/inference.module.ts
- apps/api/src/inference/inference.controller.ts
  </read_first>

<action>
Add evaluation routes to the inference controller:

1. `GET /inference/jobs/:jobId/evaluation` — returns the evaluation report for a job, or 404 if none exists
2. `POST /inference/evaluate` — accepts `{ jobId: string }`, runs evaluation, returns the report
3. `GET /inference/jobs/:jobId/predictions` — returns all prediction rows for a job, with asset metadata

Wire these into the module. Add tests covering:

- GET evaluation returns 404 when no report exists
- POST evaluate runs and returns a report
- GET predictions returns the correct prediction rows
  </action>

<acceptance_criteria>

- All three routes are wired and return correct HTTP status codes
- API typecheck passes
- API tests pass for the new routes
  </acceptance_criteria>

### 7. Prisma Evaluation Report Schema

<read_first>

- infra/prisma/schema.prisma
  </read_first>

<action>
Check that the `EvaluationReport` model exists in `infra/prisma/schema.prisma` with all required fields matching the `EvaluationReportSchema` contract. If the model is missing or incomplete, add it.

Run `pnpm --filter @visionflow/api db:generate` to regenerate the Prisma client.

Note: This is a non-breaking additive schema change — no migration needed for local development.
</action>

<acceptance_criteria>

- EvaluationReport model exists with all fields
- `pnpm --filter @visionflow/api db:generate` succeeds
- API typecheck passes
  </acceptance_criteria>

## Verification

- `pnpm --filter @visionflow/contracts test`
- `pnpm --filter @visionflow/api test`
- `pnpm --filter @visionflow/api typecheck`
- `pnpm --filter @visionflow/web typecheck`
- `pnpm verify`
- Runtime smoke: create a job, wait for completion, open job detail, run evaluation, see metrics
- Browser smoke: Jobs tab → select job → see prediction overlay → run evaluation → see metrics on desktop and 390px mobile

## Key Files Modified/Created

Created:

- `packages/contracts/src/evaluation.ts`
- `apps/api/src/inference/evaluation.service.ts`
- `apps/web/src/features/evaluation/PredictionOverlayCanvas.tsx`
- `apps/web/src/features/evaluation/EvaluationMetricsPanel.tsx`
- `.planning/phases/phase-8-prediction-overlay/UI-SPEC.md`

Modified:

- `apps/api/src/inference/inference.controller.ts`
- `apps/api/src/inference/inference.module.ts`
- `apps/api/src/inference/inference.service.ts`
- `infra/prisma/schema.prisma`
- `apps/web/src/App.tsx`
- `apps/web/src/index.css` (if additional canvas styles needed)
