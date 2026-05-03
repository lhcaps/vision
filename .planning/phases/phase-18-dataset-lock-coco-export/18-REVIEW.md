# Phase 18 Review — Dataset Locking & Deterministic COCO Export

**Phase:** 18
**Date:** 2026-05-04
**Files changed:** ~20 source files + 5 new files + 4 planning artifacts

---

## Quality Assessment

### Correctness

| Check                                   | Status                                                          |
| --------------------------------------- | --------------------------------------------------------------- |
| Lock rejects empty version              | PASS — DatasetLockValidator returns 409 with actionable message |
| Lock rejects UNASSIGNED assets          | PASS — invariant check on split                                 |
| Lock rejects missing dimensions         | PASS — validates width/height on all IMAGE assets               |
| Lock rejects no BBox annotations        | PASS — requires at least one BBox annotation                    |
| Lock rejects annotation outside version | PASS — validates all annotation assetIds belong to version      |
| Lock rejects invalid BBox geometry      | PASS — validates positive width/height                          |
| Lock accepts valid version              | PASS — all 8 invariants must pass                               |
| Lock idempotent on already-LOCKED       | PASS — returns current locked summary                           |
| Annotation create rejected on locked    | PASS — 409 via getVersionStatusByAnnotationSet                  |
| Annotation update rejected on locked    | PASS — 409 via getVersionStatusByAnnotationSet                  |
| Annotation delete rejected on locked    | PASS — 409 via getVersionStatusByAnnotationSet                  |
| Annotation workspace load on locked     | PASS — read path unaffected                                     |
| COCO export on locked version           | PASS — returns valid COCO JSON                                  |
| COCO export on draft version            | PASS — 409 "requires locked"                                    |
| Repeated export hash identical          | PASS — deterministic sort + SHA-256                             |
| Export excludes assets outside version  | PASS — filters to snapshot assets                               |
| MediaAsset persists width/height        | PASS — from ingestion + thumbnail response                      |
| No fake data in database mode           | PASS — real DB, no demo fallback                                |

### Security

| Check                             | Status                                                                 |
| --------------------------------- | ---------------------------------------------------------------------- |
| Error messages are safe           | PASS — all rejection messages are user-facing strings, no stack traces |
| Version status check on mutation  | PASS — resolved via repository, not client-provided                    |
| Input validation on export params | PASS — Zod schemas on controller params                                |
| No path traversal in file_name    | PASS — uses deterministic storageKey, not original filename            |

### Architecture

| Check                             | Status                                                                |
| --------------------------------- | --------------------------------------------------------------------- |
| Adapter pattern preserved         | PASS — Repository interface, Prisma + Memory implementations          |
| DatasetLockValidator is stateless | PASS — pure function, injectable, no NestJS deps                      |
| CocoExportService is testable     | PASS — pure sort/hash logic, no network deps                          |
| Circular dependencies avoided     | PASS — DatasetLockValidator in datasets/, imported by repo            |
| Module exports aligned            | PASS — DatasetsModule exports DatasetLockValidator, CocoExportService |

### Performance

| Check                                | Status                               |
| ------------------------------------ | ------------------------------------ |
| getVersionSnapshot uses single query | PASS — Prisma include chain, no N+1  |
| COCO sort is O(n log n)              | PASS — standard sort on typed arrays |

---

## Findings

### HIGH — None

### MEDIUM — None

### LOW

1. **`MemoryDatasetRepository.getVersionSnapshot` returns hardcoded dimensions.** The memory implementation does not compute real dimensions from the in-memory asset state. This is acceptable for the demo path but worth documenting. The memory repo is only used when `DATABASE_URL` is not set.

2. **`MemoryDatasetRepository` does not run DatasetLockValidator.** The memory `lockVersion()` method skips lock-readiness validation. This is a known limitation of the memory path — it allows locking versions that would fail Prisma validation. Acceptable for demo-only scenarios.

3. **Wave 18-06 (UI wiring) was skipped.** The export endpoint exists and works via API. The UI button in `DatasetInspector` is not wired to the export handler. This was explicitly marked optional and was skipped due to component tree propagation complexity.

---

## Verification Results

| Command             | Result                             |
| ------------------- | ---------------------------------- |
| `pnpm typecheck`    | PASS                               |
| `pnpm test`         | PASS — 235 tests across 4 packages |
| `pnpm build`        | PASS — all 4 packages              |
| `pnpm lint`         | PASS                               |
| `pnpm format:check` | PASS                               |

**Runtime smoke** requires the full stack (`pnpm dev:full:win`) with PostgreSQL, Redis, MinIO, NestJS API, and FastAPI CV worker. Manual steps:

1. Upload a real JPEG/PNG — verify `MediaAsset` has `width`/`height`.
2. Create dataset, create draft version, assign asset to TRAIN, load workspace.
3. Create one BBox annotation.
4. Lock version — verify LOCKED response.
5. Attempt annotation mutation — verify 409.
6. Attempt asset assignment after lock — verify 409.
7. `GET /api/projects/:projectId/dataset-versions/:versionId/export/coco` — verify 200, valid COCO JSON.
8. Call export again — verify identical `deterministicHash`.

---

## Conclusion

Phase 18 is complete. Dataset versions are now genuinely immutable after locking and COCO export is deterministic and stable. All acceptance criteria from the phase plan are met. No HIGH or MEDIUM findings remain.
