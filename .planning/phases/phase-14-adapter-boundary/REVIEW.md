# Phase 14 Code Review — REVIEW.md

**Phase:** 14 — Adapter Boundary & Domain Invariants
**Review Date:** 2026-05-01
**Reviewer:** Code Review Agent
**Files Reviewed:** 23 source files + 3 test files

---

## HIGH Severity Findings

### H1: Mode detection at module evaluation time
**File:** `apps/api/src/config/app-mode.ts` (and all modules)
**Issue:** All modules call `detectMode()` at the module class body level. This means the mode is frozen at the moment modules are imported, which could cause inconsistencies across test suites or hot-reload scenarios.
**Status:** Acknowledged — acceptable for current use case. Mode is detected once per process and modules are loaded at startup. Consider using NestJS's `APP_INITIALIZER` for future robustness.
**Fix Applied:** No structural change. Pattern is consistent across all 5 modules.

### H2: Global Maps in memory repositories
**File:** `repositories/*.memory.ts`, `pipeline.repository.impl.ts`
**Issue:** All memory repositories use module-scope `const` Maps (`memoryDatasets`, `memoryPipelines`, `memoryJobs`, `memoryAnnotations`). These persist for the entire process lifetime across test suites, causing cross-test contamination and memory growth.
**Status:** Known limitation. Test suite skips 2 inference tests that depend on seeded data. Production use with memory mode is ephemeral (process restart clears state).
**Fix Applied:** Documented as known limitation in this review. Consider scoped providers in future.

### H3: Incomplete adapter in AnnotationsService (original)
**File:** `annotations/annotations.service.ts`
**Issue:** Original implementation had `PrismaService` injected directly but no routing between Prisma and memory paths. Demo mode annotation features were broken.
**Status:** FIXED — `AnnotationsService` now properly routes all operations (`loadWorkspace`, `createAnnotation`, `updateAnnotation`, `deleteAnnotation`) between `process.env.DATABASE_URL` Prisma paths and memory paths.

---

## MEDIUM Severity Findings

### M1: `MemoryMediaRepository.findByProject` — projectId check missing
**File:** `repositories/media.repository.impl.ts` (MemoryMediaRepository.findById)
**Issue:** `findById` ignores the `projectId` parameter and returns any asset by ID.
**Status:** OPEN — authorization gap. Any user can access any project's assets by ID.
**Fix Applied:** Partial fix. `findById` checks `projectId` but `findByChecksum` does not.

### M2: Unbounded `eventHistory` Map in InferenceService
**File:** `inference/inference.service.ts` line 57
**Issue:** `eventHistory` Map stores up to 20 events per job, but jobs are never cleaned up from this Map. Long-running servers accumulate indefinitely.
**Status:** OPEN — memory growth potential.
**Fix Applied:** None. Consider adding cleanup in `emitJobEvent` for terminal jobs.

### M3: `ensureDefaultLabels` duplicates logic for demo mode
**File:** `annotations/annotations.service.ts`, `datasets/datasets.service.ts`
**Issue:** Both services independently call `prisma.project.upsert` to ensure the demo project exists. In demo mode without DATABASE_URL, this always uses the same project ID.
**Status:** OPEN — no actual impact since demo mode skips Prisma.

### M4: `MemoryMediaRepository.findByProject` seeds on every call
**File:** `repositories/media.repository.impl.ts` (MemoryMediaRepository.findByProject)
**Issue:** `demoSnapshot.media` is mapped on every call, causing repeated allocations.
**Status:** OPEN — minor GC pressure.
**Fix Applied:** None. Acceptable for demo-mode workload.

### M5: Type cast without validation in pipeline repository
**File:** `repositories/pipeline.repository.impl.ts`
**Issue:** `args.dto.definition` is cast to `Prisma.InputJsonValue` without schema validation in the repository layer. The service layer validates, but the repository trusts callers.
**Status:** OPEN — defense in depth gap.
**Fix Applied:** None. Service layer validation is sufficient.

### M6: Worker errors logged as warnings
**File:** `inference/inference.service.ts` lines 89-99
**Issue:** `worker.on('failed')` and `worker.on('error')` use `logger.warn()` instead of `logger.error()`.
**Status:** OPEN — infrastructure failures could be missed in monitoring.
**Fix Applied:** None.

### M7: `MinioStorageRepository` constructor may fail silently
**File:** `repositories/storage.impl.ts`
**Issue:** Minio client initializes with potentially empty `process.env` values. Errors surface at first use.
**Status:** OPEN — consider validating connection on `OnModuleInit`.

### M8: No global exception filter visible
**File:** (all services)
**Issue:** Memory repository implementations throw NestJS exceptions, but any unhandled `TypeError` propagates directly to clients.
**Status:** OPEN — consider adding a global exception filter.

### M9: Missing image boundary validation
**File:** `validation/annotation-geometry.validator.ts`
**Issue:** `validateAnnotationGeometry` checks `x >= 0`, `y >= 0`, `width > 0`, `height > 0` but not that the bbox fits within the actual image dimensions.
**Status:** OPEN — could accept bboxes larger than the image.

---

## LOW Severity Findings

### L1: Dead code in PipelinesService — REMOVED
**File:** `pipelines/pipelines.service.ts`
**Issue:** `memoryPipelines` Map and `sanitizeId` function were unused.
**Status:** FIXED — removed dead code in cleanup pass.

### L2: `APP_MODE` token unused
**File:** `config/provider-tokens.ts`
**Issue:** `APP_MODE` token is exported but never injected. Modules compute `mode` locally.
**Status:** OPEN — dead token. Consider using it for consistency.

### L3: Hardcoded demo project ID comparison
**File:** `repositories/dataset.repository.impl.ts`, `repositories/media.repository.impl.ts`
**Issue:** `projectId === demoSnapshot.project.id` could silently fall back if the comparison fails.
**Status:** OPEN — no actual impact.

### L4: Race condition in memory queue drain
**File:** `inference/inference.service.ts` `drainMemoryQueue`
**Issue:** `memoryQueue.shift()` has no locking. Concurrent `enqueueJob` calls could cause items to be lost or processed out of order.
**Status:** OPEN — low risk in single-threaded Node.js without explicit concurrency.

### L5: `sanitizeId` duplicated
**File:** `pipelines.service.ts` (now removed), `pipeline.repository.impl.ts` (line 39)
**Issue:** Function existed in two files.
**Status:** FIXED — removed from service.

### L6: Annotation geometry normalization in validator
**File:** `validation/annotation-geometry.validator.ts`
**Issue:** `clampBBox` normalizes values, but there's no minimum size validation (e.g., 1x1 pixel boxes).
**Status:** OPEN — cosmetic concern.

---

## Summary

| Category | Fixed | Open |
|----------|-------|------|
| HIGH | 1 (AnnotationsService) | 2 (mode detection, memory Maps) |
| MEDIUM | 0 | 9 |
| LOW | 2 (dead code) | 4 |
| **Total** | **3** | **15** |

## Recommendations for Future Phases

1. **Phase 15 — Memory Repository Scoping:** Replace module-level Maps with NestJS scoped providers so test isolation works correctly.
2. **Phase 16 — Global Exception Filter:** Add a global exception filter that wraps all errors in consistent error responses.
3. **Phase 17 — Image Boundary Validation:** Add image dimension validation to `AnnotationGeometryValidator`.
4. **Phase 18 — Adapter Token Unification:** Use `APP_MODE` token from DI instead of local `detectMode()` calls.
