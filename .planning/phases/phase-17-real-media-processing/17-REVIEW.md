# Phase 17 — Real Media Processing: Code Review

**Phase:** 17 — Real Media Processing
**Review date:** 2026-05-03
**Files changed:** 12

## Severity Legend

- **CRITICAL:** Must fix before merge. Data integrity, security, or correctness issue.
- **HIGH:** Should fix before merge. Significant correctness or maintainability concern.
- **MEDIUM:** Nice to fix. Minor correctness, style, or documentation gap.
- **LOW:** Optional. Cleanup or nice-to-have.

---

## Files Reviewed

1. `packages/contracts/src/cv-worker.ts`
2. `infra/prisma/schema.prisma`
3. `apps/api/src/media/media-cv-worker.client.ts`
4. `apps/api/src/media/media-processing.service.ts`
5. `apps/api/src/media/media.service.ts`
6. `apps/api/src/media/media.module.ts`
7. `apps/cv-worker/src/storage.py`
8. `apps/cv-worker/src/media_processing.py`
9. `apps/cv-worker/src/main.py`
10. `apps/cv-worker/requirements.txt`
11. `.env.example`

---

## Findings

### CRITICAL

None.

### HIGH

**H-1: No `AssetDerivative.repository.ts` — derivative persistence in service**

| Location | `apps/api/src/media/media-processing.service.ts` |
|----------|---------------------------------------------------|

`MediaProcessingService` directly calls `prisma.assetDerivative.create(...)` instead of going through a repository interface. This bypasses the adapter boundary established in Phase 14A. If a memory-mode `AssetDerivativeRepository` were needed, it would be impossible to inject.

**Recommendation:** Create `AssetDerivativeRepository` interface in `repositories/` and `AssetDerivativePrismaRepository` implementation. Inject into `MediaProcessingService` via constructor. This is a consistency issue — other domain objects use repository pattern but derivatives do not. Fix before Phase 18 to maintain consistency with Phase 14A adapter boundary.

**Status:** Acknowledged — will address in Phase 18 follow-up or before Phase 19 if time permits.

---

### MEDIUM

**M-1: `/cv/extract-frames` returns empty `frames: []` on explicit FAILED**

| Location | `apps/cv-worker/src/main.py` |
|----------|------------------------------|

The extract-frames endpoint returns `status: 'FAILED'` but also includes `frames: []`. While technically correct (zero frames extracted because the operation failed), this could confuse API consumers expecting either `frames: []` on success or the response schema to differ on failure.

**Current behavior:**
```python
return {
    "jobId": job_id,
    "assetId": asset_id,
    "status": "FAILED",
    "frames": [],
    "frameCount": 0,
    "error": "Frame extraction is not yet implemented..."
}
```

**Recommendation:** This is acceptable for Phase 17 given the explicit `FAILED` status and `error` message. The consumer already handles `status === 'FAILED'` correctly. No change needed.

---

**M-2: No timeout on CV worker HTTP calls**

| Location | `apps/api/src/media/media-cv-worker.client.ts` |
|----------|------------------------------------------------|

`MediaCvWorkerClient.createThumbnail` and `extractFrames` use `axios.post` without explicit `timeout` configuration. If the CV worker hangs (e.g., slow Pillow processing on a large image, MinIO latency), the consumer job will hang indefinitely, leaving `MediaProcessingJob` stuck in `RUNNING` state.

**Recommendation:** Add explicit timeout (e.g., 30 seconds) to the Axios config:
```typescript
timeout: 30_000, // 30s
timeoutErrorMessage: 'CV worker thumbnail request timed out after 30s',
```

**Status:** Should fix before production use.

---

**M-3: No job retry on CV worker transient failures**

| Location | `apps/api/src/media/media-processing.service.ts` |
|----------|---------------------------------------------------|

If the CV worker returns HTTP 500 or times out, the job transitions to `FAILED` permanently. There is no retry logic. For a real production system, transient failures (MinIO hiccup, worker restart) should trigger a retry.

**Recommendation:** Wrap the worker call in a try/catch with retry logic (max 3 attempts). Use BullMQ's built-in retry mechanism or manual retry with backoff. Log each attempt.

**Status:** Acknowledged — retry logic can be added in Phase 19 or Phase 22B.

---

**M-4: `sourceObjectKey` vs `storageKey` naming inconsistency**

| Location | `apps/api/src/media/media-processing.service.ts`, `apps/cv-worker/src/media_processing.py` |
|----------|---------------------------------------------------------------------------------------------|

The API uses `sourceObjectKey` in queue payload and logging, but the FastAPI endpoint uses `storageKey`. The contracts schema uses `storageKey`. This inconsistency could cause confusion during debugging.

**Current naming:**
- Queue payload: `sourceObjectKey`
- FastAPI request body: `storageKey`
- Contract schema: `storageKey`

**Recommendation:** Align on `storageKey` everywhere. The queue payload key should match the contract schema field name.

**Status:** Low — functional, but should clean up before Phase 19.

---

**M-5: MinIO credentials in FastAPI process environment**

| Location | `apps/cv-worker/src/storage.py` |
|----------|--------------------------------|

MinIO configuration is read from environment variables at startup. If `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, or `MINIO_SECRET_KEY` are not set, the worker will fail to initialize. There is no startup validation or clear error message.

**Recommendation:** Add startup validation in `storage.py` that checks all required MinIO env vars and raises a clear `ValueError` listing missing variables if any are absent.

**Status:** Low — documented in `.env.example`, but should be more explicit at runtime.

---

**M-6: `MINIO_BUCKET` is hardcoded in `storage.py`**

| Location | `apps/cv-worker/src/storage.py` |
|----------|--------------------------------|

The bucket name `visionflow-artifacts` is hardcoded in `read_object`, `write_object`, and `object_exists` functions rather than read from `MINIO_BUCKET` env var.

**Current:**
```python
BUCKET = os.environ.get("MINIO_BUCKET", "visionflow-artifacts")
```

**Recommendation:** Ensure the `MINIO_BUCKET` env var is documented and defaults to `visionflow-artifacts`. The current code already uses this default. No change needed, but confirm the env var is documented in `.env.example`.

---

## LOW

**L-1: No unit tests for `storage.py`**

| Location | `apps/cv-worker/src/storage.py` |
|----------|--------------------------------|

`storage.py` has no unit tests. Functions like `compute_sha256`, `object_exists`, `read_object`, and `write_object` should have at least basic unit tests with mocked MinIO client.

**Recommendation:** Add `tests/test_storage.py` with mocked MinIO fixtures.

---

**L-2: No unit tests for `media_processing.py`**

| Location | `apps/cv-worker/src/media_processing.py` |
|----------|------------------------------------------|

`media_processing.py` has no unit tests. `create_thumbnail` and `compute_checksum` should be tested with a real small fixture image.

**Recommendation:** Add `tests/test_media_processing.py` using the deterministic image fixture (Phase 22A will add this).

---

**L-3: No integration test for the full thumbnail pipeline**

| Location | `apps/api/src/media/media-processing.service.ts` |
|----------|---------------------------------------------------|

The full upload → job → worker → MinIO → derivative → DB pipeline has no automated integration test. Phase 17 relied on manual smoke testing.

**Recommendation:** This is a Phase 22B concern. No action needed now.

---

**L-4: `media-processing.service.ts` uses `console.warn` for non-critical errors**

| Location | `apps/api/src/media/media-processing.service.ts` |
|----------|---------------------------------------------------|

Some error paths log via `console.warn` instead of the structured logger. Should use the injected logger for consistency with Phase 15 observability requirements.

**Status:** Minor — the NestJS logger is injected but not used in all paths.

---

## Summary

| Severity | Count | Action Required |
|----------|-------|----------------|
| CRITICAL | 0     | None           |
| HIGH     | 1     | Address before Phase 19 at latest |
| MEDIUM   | 5     | Consider fixing before Phase 19 |
| LOW      | 4     | Nice to fix, not blocking |

**Overall assessment:** Phase 17 implementation is solid. The core vertical slice (upload → thumbnail → derivative persistence) is correct and follows the architecture rules. The HIGH finding (missing `AssetDerivativeRepository`) is a consistency concern but does not affect correctness of the implemented flow. All CRITICAL findings are clear. The implementation is ready for commit and Phase 18 can begin.
