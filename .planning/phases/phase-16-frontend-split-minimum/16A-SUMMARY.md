# Phase 16A — Frontend Split Minimum

## Summary

**Status:** Done
**Date:** 2026-05-03
**Commit:** `95d52bc10ab60068eec0882b83d8276e870249fc`
**Duration:** Single session
**Phase:** Phase 16A of v1.1

---

## Objective

Reduce risk before real worker and detector phases by extracting the highest-change frontend areas from the monolithic `App.tsx`. This was a surgical refactor: move code without changing behavior.

---

## What Changed

### Shared API Boundary

Established a canonical shared API boundary at `shared/api/client.ts`:
- `API_BASE_URL` — single source of truth for API base URL
- `apiJson` — typed JSON fetch with no-cache headers
- `apiUpload` — FormData upload without hardcoded Content-Type
- `readApiError` — unified error parsing across all API calls

`lib/http.ts`, `lib/media-upload.ts`, and `lib/inference.ts` now delegate to canonical modules. No more duplicated error parsing or base URL definitions.

### Feature: Media Module (`features/media/`)

- `media.types.ts` — `MediaUploadRow`, `MediaUploadAsset` types
- `media.api.ts` — `uploadMediaFile`, `checksumFile`
- `index.ts` — barrel export

### Feature: Inference Module (`features/inference/`)

- `inference.types.ts` — `JobSourceState`, `JobUiState` types
- `inference.api.ts` — All inference API functions: `listInferenceJobs`, `createInferenceJob`, `getInferenceJob`, `getJobPredictions`, `getEvaluationReport`, `runEvaluation`, `openInferenceJobEvents`, `mergeJobEvent`
- `index.ts` — barrel export

### App.tsx

- Imports media types/functions from `features/media`
- Imports inference types/functions from `features/inference`
- `lib/media-upload.ts` and `lib/inference.ts` serve as backward-compatible re-export layers
- `demoSnapshot` kept at `data/demo.ts` (Phase 17+ concern, not touched)

---

## Key Decisions

1. **Delegation over replacement:** `lib/` files delegate to canonical modules rather than being deleted outright. This preserves all existing import chains without breaking callers.
2. **No UI changes:** Phase 16A is purely structural. No visual changes, no component rewrites.
3. **Backward compatibility:** `lib/http.ts` re-exports from `shared/api` so `lib/datasets.ts` and `lib/pipelines.ts` (which import from `lib/http.ts`) continue to work without modification.
4. **Runtime selectors untouched:** `shared/state/` and `WorkbenchRuntimeState` were not moved or changed. Phase 15.5 contract preserved.

---

## What Was Preserved

- `WorkbenchRuntimeState` and all runtime selectors in `shared/state/`
- `demoSnapshot` at `data/demo.ts`
- All existing UI components, layout, and behavior
- SSE stream behavior (`openInferenceJobEvents`, `mergeJobEvent`)
- Backend API contracts

---

## What Was NOT Done (Out of Scope)

- Dataset, annotation, pipeline, timeline feature extraction (Phase 21 scope)
- Visual redesign
- Backend or API changes
- Phase 17+ real media processing, ONNX, COCO export, evaluation E2E

---

## Phase 17 Pre-flight: P0 Blockers

No blockers prevent starting Phase 17. The following P0 issues are correctly scoped as Phase 17 deliverables:

| P0 | Description | Location |
| --- | --- | --- |
| P0-1 | CV worker returns `mock_thumbnailer`/`mock_frame_extractor`, not real Pillow/OpenCV output | `apps/cv-worker/src/main.py` |
| P0-2 | No `minio`, `boto3`, `opencv-python-headless`, or video stack in `requirements.txt` | `apps/cv-worker/requirements.txt` |
| P0-3 | No BullMQ consumer for `media-processing` queue | `apps/api/src/` |
| P0-4 | `AssetDerivative` missing `checksum` field | `infra/prisma/schema.prisma` |

See `16A-PLAN.md` Phase 17 Pre-flight section for full detail.

---

## Verification Evidence

| Check | Result |
| --- | --- |
| `pnpm --filter @visionflow/web typecheck` | Pass |
| `pnpm --filter @visionflow/web test` | Pass (63 tests) |
| `pnpm lint` | Pass |
| `pnpm format:check` | Pass |
| `pnpm build` | Pass |
| No circular dependencies | Verified |
| No behavior regression | Verified |

Commit verified:
```
95d52bc refactor(web): split media and inference frontend modules
```

Changed files:
- `shared/api/client.ts` — new
- `shared/api/index.ts` — new
- `features/media/media.types.ts` — new
- `features/media/media.api.ts` — new
- `features/media/index.ts` — new
- `features/inference/inference.types.ts` — new
- `features/inference/inference.api.ts` — new
- `features/inference/index.ts` — new
- `lib/http.ts` — re-export
- `lib/media-upload.ts` — delegates
- `lib/inference.ts` — re-export
- `App.tsx` — imports from feature modules

---

## Key Files

| File | Role |
| --- | --- |
| `apps/web/src/shared/api/client.ts` | Canonical API boundary |
| `apps/web/src/shared/api/index.ts` | Barrel export |
| `apps/web/src/features/media/media.api.ts` | Media API functions |
| `apps/web/src/features/media/media.types.ts` | Media types |
| `apps/web/src/features/inference/inference.api.ts` | Inference API functions + SSE |
| `apps/web/src/features/inference/inference.types.ts` | Inference types |
| `apps/web/src/lib/http.ts` | Backward-compatible re-export |
| `apps/web/src/lib/media-upload.ts` | Backward-compatible delegation |
| `apps/web/src/lib/inference.ts` | Backward-compatible re-export |
| `apps/web/src/App.tsx` | Composes feature modules |
