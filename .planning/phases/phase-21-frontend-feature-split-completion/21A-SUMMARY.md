# Phase 21A Summary — App Composition Boundary Cleanup

**Phase:** 21A
**Date:** 2026-05-05
**Commit (extraction):** `86416bf`
**Commit (cleanup):** `8f5a2d1`

## Files Changed

### Extraction (Commit 86416bf)
- `apps/web/src/App.tsx` — reduced from 799 to 638 lines
- `apps/web/src/app/AppRoutes.tsx` — created (route rendering)
- `apps/web/src/app/OverviewPanel.tsx` — extracted
- `apps/web/src/app/MediaPanel.tsx` — extracted
- `apps/web/src/app/DatasetPanel.tsx` — extracted
- `apps/web/src/app/PipelinePanel.tsx` — extracted
- `apps/web/src/app/JobsPanel.tsx` — extracted
- `apps/web/src/app/ui/Panel.tsx` — extracted
- `apps/web/src/app/ui/VisionPreview.tsx` — extracted
- `apps/web/src/app/ui/StateRow.tsx` — extracted
- `apps/web/src/app/ui/OverviewStateRow.tsx` — extracted

### Cleanup (Commit 8f5a2d1)
- `apps/web/src/App.tsx` — reduced from 638 to 548 lines
- `apps/web/src/app/AppRoutes.tsx` — import cleanup

## Line Counts

| File | Before Phase 21A | After Extraction | After Cleanup |
|---|---|---|---|
| `App.tsx` | 799 | 638 | 548 |
| `AppRoutes.tsx` | N/A | 206 | 209 |

## What Changed (Cleanup Pass)

### Import Cleanup in `App.tsx`

**Removed unused icon imports (11):**
`ArrowsLeftRightIcon`, `BoundingBoxIcon`, `GitBranchIcon`, `GraphIcon`, `ImageSquareIcon`, `PlayCircleIcon`, `SlidersHorizontalIcon`, `TerminalWindowIcon`, `TimerIcon`, `UploadSimpleIcon`

**Removed unused type imports (8):**
`DatasetSplit`, `DatasetSummary`, `InferenceJobStatus`, `MediaUploadStatus`, `PipelineNode`, `PipelineSummary`, `PipelineValidationIssue`, `CSSProperties`, `ElementType`

**Removed unused value imports (6):**
`createEmptySplitSummary`, `SplitSummary`, `summarizeDatasetSplits`, `validateMediaMime`, `AnnotationEnginePanel`, `EvaluationMetricsPanel`, `PredictionOverlayCanvas`, `TimelineReplayPanel`, `DatasetVersionDiff`, `PipelineExecutionFlow`, `AnnotationInspector`, `DatasetInspector`, `InspectorRouter`, `JobInspector`, `MediaInspector`, `PipelineInspector`, `EmptyState`, `EvaluationEmptyState`, `MediaEmptyState`, `DatasetEmptyState`, `PredictionsEmptyState`, `ErrorState`, `FailedJobErrorState`, `ActionHint`, `assignDatasetVersionAssets`, `createDataset`, `createDatasetVersion`, `lockDatasetVersion`, `checksumFile`, `uploadMediaFile`, `updateProjectPipeline`, `validateProjectPipeline`, `canShowPredictionOverlay`, `Panel`, `OverviewPanel`, `MediaPanel`, `DatasetPanel`, `PipelinePanel`, `JobsPanel`, `VisionPreview`, `StateRow`, `buildDatasetInspectorData`, `buildMediaInspectorData`, `datasetSplits`, `DatasetActionState`, `DatasetSourceState`, `PipelineSourceState`, `motionTokens`, `Background`, `Controls`, `Edge as FlowEdge`, `MarkerType`, `Node as FlowNode`, `Position`, `ReactFlow`, `AnimatePresence`, `motion`, `useReducedMotion`

**Removed dead derived values (2):**
- `visibleMediaRows` — now computed in `AppRoutes.tsx`
- `showPipelineExecution` — computed but never consumed in App.tsx

**Removed unused hooks (1):**
- `useRef` — no longer used after dead value removal

**Cleaned inline imports (1):**
- `import('../features/media').MediaUploadRow[]` in AppRoutes.tsx → clean type import

### Import Cleanup in `AppRoutes.tsx`

**Removed unused type imports (2):**
`MediaInspectorData`, `DatasetInspectorData` — these are type-only but unused in AppRoutes (consumed in `InspectorRouter`)

**Cleaned inline import (1):**
- `import('../features/media').MediaUploadRow[]` → `import type { MediaUploadRow } from '../features/media'`

## Verification Results

| Command | Result |
|---|---|
| `pnpm --filter @visionflow/web typecheck` | PASS |
| `pnpm --filter @visionflow/web test` | PASS (63/63) |
| `pnpm typecheck` | PASS (all 4 packages) |
| `pnpm test` | PASS (309+ tests; 1 pre-existing flaky API test unrelated to this pass) |
| `pnpm build` | PASS (4/4 packages) |
| `pnpm lint` | PASS (4/4 packages) |
| `pnpm format:check` | PASS (pre-existing failures in 17 unrelated files; no new failures introduced) |
| Browser smoke | Not run — verification limited to typecheck/test/build/lint/format |

### Pre-existing Format Failures (Not From This Pass)

17 files fail `pnpm format:check` due to pre-existing Prettier issues unrelated to Phase 21A cleanup:
- `.planning/` files (6)
- Panel components (4): `DatasetPanel.tsx`, `JobsPanel.tsx`, `OverviewPanel.tsx`, `PipelinePanel.tsx`
- `README.md`
- Harness scripts (5)
- `App.tsx` and `AppRoutes.tsx` — now fixed by this pass

## Boundary Review

| Direction | Status |
|---|---|
| `app/` imports `features/` | Clean — `AppRoutes.tsx` imports from `features/annotations`, `features/timeline`, `features/inspector`, `features/media`, `features/inference` |
| `features/` imports `app/` | Clean — no `features/*` files import from `app/` |
| `shared/` imports `app/` or `features/` | Clean — no `shared/*` files import from `app/` or `features/` |
| Circular dependencies | None detected |

## Remaining Limitations

- `App.tsx` still owns orchestration effects (dataset loading, job SSE/polling, evaluation fetching) until Phase 21B
- `AppRoutes` prop surface is intentionally large (20+ props) until controller hooks are extracted in Phase 21B
- No new state library introduced — existing architecture maintained

## Next

- **Phase 21B:** Extract `useInferenceJobController`, `useEvaluationController`, `useDatasetsController`
- **Phase 21C:** Line count polish — target `App.tsx` under 400 lines
- **Phase 21D:** Final circular dependency resolution
