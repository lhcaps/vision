# Phase 18 Plan — Dataset Locking & Deterministic COCO Export

**Phase:** 18
**Name:** Dataset Locking & Deterministic COCO Export
**Status:** Executed
**Date:** 2026-05-04

## Mission

Make dataset versions genuinely immutable after locking and export locked dataset versions as deterministic COCO JSON suitable for object detection training/evaluation.

## Target Vertical Slice

```
upload image → thumbnail pipeline → dataset version → assign asset
→ create BBox annotation → lock dataset version
→ COCO export (deterministic, stable across repeated calls)
```

## Waves

### Wave 18-01 — COCO Export Contracts

**Goal:** Define typed Zod schemas for COCO JSON export.

**Files:**

- `packages/contracts/src/coco.ts` (created)
- `packages/contracts/src/index.ts` (updated)

**Schemas:**

- `CocoInfoSchema` — description, version, year, date_created
- `CocoImageSchema` — id, file_name, width, height
- `CocoCategorySchema` — id, name, supercategory
- `CocoAnnotationSchema` — id, image_id, category_id, bbox, area, iscrowd
- `CocoDatasetSchema` — info, images, annotations, categories
- `CocoExportMetadataSchema` — VisionFlow-specific: projectId, datasetId, datasetVersionId, datasetVersion, status, assetCount, annotationCount, categoryCount, splits, deterministicHash
- `CocoExportResponseSchema` — extends CocoDatasetSchema with metadata

**Acceptance:**

- All new schemas parse valid output.
- Invalid bbox/category/image rows fail schema validation.
- TypeScript exports available from `@visionflow/contracts`.

---

### Wave 18-02 — Persist Image Dimensions

**Goal:** Capture and persist real image width/height during upload, required for COCO export.

**Files:**

- `apps/api/src/common/utils/media-integrity.ts` — added `extractImageMetadata()` using `sharp().metadata()`
- `apps/api/src/media/media-ingestion.ts` — `MediaIngestionPlan` extended with `width/height`
- `apps/api/src/repositories/media.repository.ts` — `create()` accepts `width/height`
- `apps/api/src/repositories/media.repository.impl.ts` — persists `width/height` on `MediaAsset`
- `apps/api/src/repositories/dataset.memory.ts` — memory repo also accepts `width/height`
- `apps/api/src/media/media.service.ts` — passes dimensions from plan to repo
- `apps/api/src/media/media-processing.service.ts` — persists real dimensions from CV worker response

**Key changes:**

- `extractImageMetadata(buffer, mimeType)` extracts `width`/`height` from JPEG/PNG/WebP using sharp
- `buildMediaIngestionPlan()` calls `extractImageMetadata` for image types
- `PrismaMediaRepository.create()` persists `data.width` and `data.height` to `MediaAsset`
- `MediaProcessingService.updateAssetThumbnailKey()` persists dimensions returned by CV worker

**Acceptance:**

- New uploaded image `MediaAsset` has real `width` and `height`.
- COCO export refuses assets with missing dimensions (via lock validator).
- No hard-coded default dimensions for COCO.

---

### Wave 18-03 — Lock-Readiness Invariants

**Goal:** Prevent locking a dataset version that is not export-ready.

**Files:**

- `apps/api/src/datasets/dataset-lock.validator.ts` (created)
- `apps/api/src/datasets/dataset-lock.validator.spec.ts` (created)
- `apps/api/src/repositories/dataset.repository.ts` — added `getVersionSnapshot()`, `getVersionStatusByAnnotationSet()`, `VersionSnapshotAsset.storageKey`, `VersionSnapshotAnnotation.labelClassId`
- `apps/api/src/repositories/dataset.repository.impl.ts` — implemented `getVersionSnapshot()`, `getVersionStatusByAnnotationSet()`, integrated `DatasetLockValidator` into `lockVersion()`
- `apps/api/src/repositories/dataset.memory.ts` — memory implementations
- `apps/api/src/datasets/datasets.module.ts` — exports `DatasetLockValidator`

**Invariants enforced:**

1. Version must be DRAFT.
2. At least one asset.
3. No UNASSIGNED assets.
4. All exportable assets must have width and height.
5. Version must have at least one annotation set.
6. At least one BBox annotation.
7. All annotation asset IDs must belong to the version.
8. All BBox geometry must have positive width and height.

**Error messages:** Explicit, safe, actionable — no stack traces or internal DB errors leaked.

**Acceptance:**

- Lock empty version => 409.
- Lock version with UNASSIGNED asset => 409.
- Lock version with missing dimensions => 409.
- Lock valid annotated version => 200 + LOCKED status.
- Locking already LOCKED version is idempotent.

---

### Wave 18-04 — Annotation Immutability After Lock

**Goal:** Reject annotation mutations on locked dataset versions.

**Files:**

- `apps/api/src/annotations/annotations.module.ts` — imports `DATASET_REPOSITORY`
- `apps/api/src/annotations/annotations.service.ts` — injected `DatasetRepository`, pre-check on create/update/delete
- `apps/api/src/datasets/datasets.module.ts` — exports `DATASET_REPOSITORY`

**Behavior:**

- `createPrismaAnnotation()` — checks version status before creating
- `updatePrismaAnnotation()` — checks version status before updating
- `deletePrismaAnnotation()` — checks version status before deleting
- Returns `409 Conflict` with message "Annotations are immutable once the dataset version is locked." when version is LOCKED or ARCHIVED.
- Reading (workspace loading) is unaffected.

**Acceptance:**

- Create annotation on locked version => 409.
- Update annotation on locked version => 409.
- Delete annotation on locked version => 409.
- Load annotation workspace on locked version => 200.
- DRAFT version mutations still work.

---

### Wave 18-05 — Deterministic COCO Export Service

**Goal:** Implement deterministic COCO JSON export for locked dataset versions.

**Files:**

- `apps/api/src/datasets/coco-export.service.ts` (created)
- `apps/api/src/datasets/coco-export.service.spec.ts` (created)
- `apps/api/src/datasets/datasets.controller.ts` — added `GET /export/coco` endpoint
- `apps/api/src/datasets/datasets.module.ts` — exports `CocoExportService`

**Endpoint:** `GET /api/projects/:projectId/dataset-versions/:versionId/export/coco`

**Export behavior:**

- Requires version to be LOCKED. DRAFT/ARCHIVED => 409.
- Fetches `VersionSnapshot` including assets (with dimensions, storageKey) and annotation sets.
- Filters to IMAGE-type assets with valid width/height.
- Builds COCO images, annotations, and categories arrays.

**Deterministic ordering:**

- Images: split order TRAIN > VALID > TEST, then storageKey asc, then asset id asc.
- Categories: label name asc, then labelClassId asc.
- Annotations: image_id asc, then category_id asc, then annotation id asc.
- COCO IDs assigned sequentially starting at 1 after sorting.

**Deterministic hash:** SHA-256 of canonical JSON string (sorted keys, stable content only — excluding volatile fields like `date_created` and `generatedAt`).

**Acceptance:**

- Repeated export calls produce identical content and identical `deterministicHash`.
- Export locked dataset returns valid COCO JSON.
- Export draft dataset returns 409.
- Export excludes assets outside the dataset version.
- Export is based on database truth, not demo fallback.

---

### Wave 18-06 — Optional UI Wiring

**Status:** SKIPPED

Wave 18-06 was explicitly marked optional. Wiring `onExportCoco` through the component tree (App.tsx → InspectorRouter → DatasetInspector) would require significant state propagation changes beyond "minimal and non-disruptive". Backend correctness was the mandatory goal.

---

### Wave 18-07 — Tests

**Files:**

- `apps/api/src/datasets/coco-export.service.spec.ts` — 15 tests covering schema parsing, deterministic sort stability, category/image/annotation ID assignment
- `apps/api/src/datasets/dataset-lock.validator.spec.ts` — 15 tests covering all lock-readiness invariants
- `apps/api/src/annotations/annotations.service.test.ts` — updated to mock `DatasetRepository`
- `apps/api/src/datasets/datasets.service.test.ts` — updated test expectations

**Test coverage:**

1. COCO contract schema parses valid export.
2. COCO export stable sort — shuffled DB rows produce same output.
3. COCO category IDs deterministic by label name.
4. COCO image IDs deterministic by split/storageKey/id.
5. COCO annotation IDs deterministic.
6. Draft version export returns 409.
7. Empty version lock returns 409.
8. UNASSIGNED asset lock returns 409.
9. Missing width/height lock returns 409.
10. Valid version lock returns LOCKED.
11. Assign asset after lock returns 409.
12. Create annotation after lock returns 409.
13. Update annotation after lock returns 409.
14. Delete annotation after lock returns 409.
15. Repeated export hash is identical.
16. Export does not include annotations for assets outside version.

---

## Files Changed

### Created

- `packages/contracts/src/coco.ts`
- `apps/api/src/datasets/coco-export.service.ts`
- `apps/api/src/datasets/coco-export.service.spec.ts`
- `apps/api/src/datasets/dataset-lock.validator.ts`
- `apps/api/src/datasets/dataset-lock.validator.spec.ts`

### Modified

- `packages/contracts/src/index.ts`
- `apps/api/src/common/utils/media-integrity.ts`
- `apps/api/src/media/media-ingestion.ts`
- `apps/api/src/repositories/media.repository.ts`
- `apps/api/src/repositories/media.repository.impl.ts`
- `apps/api/src/repositories/dataset.repository.ts`
- `apps/api/src/repositories/dataset.repository.impl.ts`
- `apps/api/src/repositories/dataset.memory.ts`
- `apps/api/src/media/media.service.ts`
- `apps/api/src/media/media-processing.service.ts`
- `apps/api/src/annotations/annotations.module.ts`
- `apps/api/src/annotations/annotations.service.ts`
- `apps/api/src/annotations/annotations.service.test.ts`
- `apps/api/src/datasets/datasets.module.ts`
- `apps/api/src/datasets/datasets.controller.ts`
- `apps/api/src/datasets/datasets.service.test.ts`

---

## Verification

| Command             | Result           |
| ------------------- | ---------------- |
| `pnpm typecheck`    | PASS             |
| `pnpm test`         | PASS (235 tests) |
| `pnpm build`        | PASS             |
| `pnpm lint`         | PASS             |
| `pnpm format:check` | PASS             |

---

## Out of Scope

- Real ONNX inference (Phase 19)
- Model training
- Frame extraction
- Evaluation report E2E (Phase 20)
- Full frontend redesign (Phase 21)
- App.tsx split (Phase 21)
- COCO file storage in MinIO
- Authentication/authorization beyond existing
