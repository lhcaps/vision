# Phase 18 Summary — Dataset Locking & Deterministic COCO Export

**Phase:** 18
**Status:** Completed 2026-05-04
**Commits:** `feat(datasets): export locked versions as deterministic COCO`

## What Was True Before Phase 18

- `DatasetVersion.status` had `DRAFT/LOCKED/ARCHIVED` enum values but locking did not enforce export-readiness invariants.
- `lockVersion()` could lock a version with zero assets, UNASSIGNED splits, missing image dimensions, or no annotations.
- Annotation create/update/delete had no dataset version lock check — locked datasets were mutable.
- `MediaAsset.width` and `MediaAsset.height` were not persisted during upload. COCO export would have no real image dimensions.
- No COCO export endpoint existed.
- COCO format was not defined in contracts.

## What Is True After Phase 18

### Lock-Readiness Invariants

`DatasetLockValidator` enforces 8 checks before a version can be locked:

1. Version must be DRAFT.
2. At least one asset assigned.
3. No UNASSIGNED splits.
4. All IMAGE-type assets have valid width and height.
5. At least one annotation set exists.
6. At least one BBox annotation exists.
7. All annotation asset IDs belong to the version.
8. All BBox geometry has positive width and height.

All rejection messages are safe, actionable, and do not leak internal error details.

### Annotation Immutability

`AnnotationsService` now queries `DatasetRepository.getVersionStatusByAnnotationSet()` before every mutation (create/update/delete). If the parent dataset version is LOCKED or ARCHIVED, a `409 Conflict` is returned with `"Annotations are immutable once the dataset version is locked."`. Reading locked annotations still works.

### Real Image Dimensions

- `extractImageMetadata()` uses `sharp().metadata()` to extract real width/height from uploaded images.
- `MediaIngestionPlan` carries `width`/`height` through the upload path.
- `MediaProcessingService` persists real source image dimensions from the CV worker thumbnail response.
- `MediaAsset` rows now have real `width`/`height` persisted on creation and updated on thumbnail completion.

### Deterministic COCO Export

`GET /api/projects/:projectId/dataset-versions/:versionId/export/coco`

- Requires version to be LOCKED.
- Exports only IMAGE-type assets with valid dimensions, BBox annotations, and categories used by those annotations.
- **Deterministic ordering:** images by (split: TRAIN>VALID>TEST, storageKey asc, id asc), categories by (name asc, labelClassId asc), annotations by (image_id asc, category_id asc, id asc).
- COCO IDs are assigned sequentially starting at 1 after sorting.
- SHA-256 hash computed from canonical JSON of stable content only (excluding `date_created` and `generatedAt`).
- Export response includes `metadata` with VisionFlow-specific fields: projectId, datasetId, datasetVersionId, datasetVersion, status, assetCount, annotationCount, categoryCount, splits, deterministicHash.

### Contracts

`packages/contracts/src/coco.ts` defines:

- `CocoInfoSchema` / `CocoImageSchema` / `CocoCategorySchema` / `CocoAnnotationSchema`
- `CocoDatasetSchema` / `CocoExportMetadataSchema` / `CocoExportResponseSchema`

All exported from `@visionflow/contracts`.

## Key Files

| File                                                   | Purpose                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| `packages/contracts/src/coco.ts`                       | COCO Zod schemas and TypeScript types                       |
| `apps/api/src/datasets/coco-export.service.ts`         | Deterministic COCO export logic                             |
| `apps/api/src/datasets/dataset-lock.validator.ts`      | Lock-readiness invariant enforcement                        |
| `apps/api/src/common/utils/media-integrity.ts`         | `extractImageMetadata()` for real dimensions                |
| `apps/api/src/media/media-ingestion.ts`                | Dimensions in `MediaIngestionPlan`                          |
| `apps/api/src/repositories/media.repository.ts`        | `width`/`height` in `create()`                              |
| `apps/api/src/repositories/dataset.repository.ts`      | `getVersionSnapshot()`, `getVersionStatusByAnnotationSet()` |
| `apps/api/src/repositories/dataset.repository.impl.ts` | Prisma implementations                                      |
| `apps/api/src/repositories/dataset.memory.ts`          | Memory implementations                                      |
| `apps/api/src/annotations/annotations.service.ts`      | Lock check on create/update/delete                          |
| `apps/api/src/datasets/datasets.controller.ts`         | `GET /export/coco` endpoint                                 |

## Tests Added

- `coco-export.service.spec.ts` — 15 tests: schema validation, deterministic sort, stable hash
- `dataset-lock.validator.spec.ts` — 15 tests: all lock-readiness invariant rejections and acceptances
- `annotations.service.test.ts` — updated for `DatasetRepository` dependency
- `datasets.service.test.ts` — updated expectations

## What Phase 18 Enables

- Dataset versions are now genuine training artifacts: lock freezes state, COCO proves reproducibility.
- The v1.1 vertical slice can now complete: upload → thumbnail → dataset → annotation → lock → deterministic COCO export → real detector (Phase 19).
- The COCO export endpoint is stable and deterministic — repeated calls produce identical output.

## What Remains

- Phase 19: Real ONNX inference with YOLOv8n
- Phase 20: Evaluation E2E
- Phase 21: Frontend feature split completion
- Phase 22A/B: Test harness and production-path test suite
- Phase 23: Full E2E Playwright and demo video
