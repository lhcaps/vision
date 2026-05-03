# Phase 16A — Frontend Split Minimum

## Code Review

**Reviewer:** Agent
**Date:** 2026-05-03
**Commit reviewed:** `95d52bc10ab60068eec0882b83d8276e870249fc`
**Files reviewed:** `shared/api/client.ts`, `shared/api/index.ts`, `features/media/`, `features/inference/`, `lib/http.ts`, `lib/media-upload.ts`, `lib/inference.ts`, `App.tsx`

---

## Findings

### ✅ No Critical Issues

No critical or blocking issues found. The refactor is clean and surgical.

---

### ⚠️ Warnings

#### 16A-W1: `apiUpload` does not send Content-Type header

**Severity:** Low (by design)
**File:** `apps/web/src/shared/api/client.ts`

The `apiUpload` function intentionally does not set a `Content-Type` header when sending `FormData`. This is correct — browsers automatically set `multipart/form-data` with the correct boundary when no `Content-Type` is specified. This was verified in the phase plan and confirmed intentional.

**Verdict:** Accept as-is.

---

#### 16A-W2: `lib/` files create import chain: `lib/` → `features/` → `shared/`

**Severity:** Info
**File:** `apps/web/src/lib/inference.ts`

`lib/inference.ts` re-exports from `features/inference/inference.api.ts`, which imports from `shared/api/client.ts`. Callers importing from `lib/` will resolve through two hops before reaching the canonical source. This is acceptable for backward compatibility but adds indirection.

**Verdict:** Accept. The delegation chain is documented and intentional. Phase 21 may consolidate imports.

---

### ℹ️ Info / Notes

#### 16A-I1: 16A-PLAN.md was stale after Phase 16A execution

**File:** `.planning/phases/phase-16-frontend-split-minimum/16A-PLAN.md`

The plan file had `**Planned — executing now.**` status. This was updated to `**Done — Completed 2026-05-03.**` during artifact cleanup.

#### 16A-I2: `demoSnapshot` not touched — correct decision

Phase 16A scope explicitly excluded `demoSnapshot` cleanup. This is Phase 17+ concern since Phase 16A was meant to be surgical.

#### 16A-I3: Runtime selectors not modified

`shared/state/workbench-runtime.ts` and `shared/state/runtime-selectors.ts` were not touched. Phase 15.5 contract preserved.

---

## Phase 17 P0 Blockers (from review findings)

The following issues were identified during review of the codebase. These are correctly scoped as Phase 17 deliverables — no blockers prevent beginning Phase 17.

### P0-1: CV Worker Fake-Success Artifacts

**Severity:** High (Phase 17 core deliverable)
**Files:** `apps/cv-worker/src/main.py`

`/cv/create-thumbnail` returns:
```python
{
    "status": "SUCCEEDED",
    "derivative": {
        "type": "THUMBNAIL",
        "storageKey": req.targetKey,
        "width": min(req.width or 512, 512),
        "height": min(req.height or 512, 512),
    },
    "metadata": {
        "runtime": "mock_thumbnailer",
        "sourceKey": req.storageKey,
    },
}
```

This does NOT read from MinIO, does NOT write to MinIO, and does NOT produce a real image. Same for `/cv/extract-frames` with `mock_frame_extractor`.

**Fix (Phase 17):** Implement real Pillow thumbnail generation and OpenCV/ffmpeg frame extraction. Read source from MinIO, write derivative to MinIO, return real artifact metadata.

### P0-2: Missing Dependencies for Real Media Processing

**Severity:** High
**File:** `apps/cv-worker/requirements.txt`

Current dependencies:
```
fastapi==0.115.12
uvicorn[standard]==0.34.2
pydantic==2.11.3
numpy==2.2.5
pillow==11.2.1
loguru==0.7.3
```

Missing for Phase 17:
- `minio` or `boto3` — MinIO/S3 client
- `opencv-python-headless` — video frame extraction
- `ffmpeg-python` or subprocess wrapper — video processing

**Fix (Phase 17):** Add `minio>=7.0.0`, `opencv-python-headless>=4.10.0`, and ffmpeg wrapper to `requirements.txt`.

### P0-3: No Media Processing BullMQ Consumer

**Severity:** High
**Files:** `apps/api/src/` (consumer not found)

`MediaService.upload()` creates `MediaProcessingJob` record and queues it, but no consumer exists to process the job, call the CV worker endpoint, and persist the result.

**Fix (Phase 17):** Implement `BullMQ` consumer for `media-processing` queue. Consumer must: (1) fetch job from queue, (2) call `/cv/create-thumbnail` or `/cv/extract-frames`, (3) persist derivative metadata to `AssetDerivative`, (4) transition job to `SUCCEEDED`/`FAILED`, (5) write audit log.

### P0-4: AssetDerivative Schema Missing `checksum`

**Severity:** Medium
**File:** `infra/prisma/schema.prisma`

Current `AssetDerivative` model:
```prisma
model AssetDerivative {
  id         String              @id @default(cuid())
  assetId    String
  type       AssetDerivativeType
  storageKey String
  width      Int?
  height     Int?
  createdAt  DateTime            @default(now())
  ...
}
```

Phase 17 ROADMAP requires the worker to return `checksum` metadata. Schema currently lacks this field.

**Fix (Phase 17):** Add `checksum String?` to `AssetDerivative` and generate migration.

---

## Summary

| Category | Count |
| --- | --- |
| Critical | 0 |
| Warnings | 2 |
| Info | 3 |
| Phase 17 P0 | 4 |

Phase 16A is clean. The 4 P0 items are correctly scoped as Phase 17 work. No code-level blockers prevent Phase 17 execution.

**Recommendation:** Proceed to Phase 17. Address P0-1 through P0-4 within Phase 17 implementation.
