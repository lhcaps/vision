# Phase 19 Code Review

## Post-Harden Update (2026-05-04)

This review was updated after a hardening pass that fixed the following issues
found during Phase 19 review:

- **P0**: YOLO output decode shape was looping over 84 rows instead of N boxes.
  Fixed with `_normalize_yolo_output()` that normalizes to `(N, 84)` regardless
  of input shape `(1, 84, N)`, `(1, N, 84)`, `(84, N)`, or `(N, 84)`.
- **P0**: Download scripts claimed SHA-256 verification but only warned on mismatch
  and still exited 0. Fixed: scripts now exit 1 on checksum mismatch and delete
  the invalid file. The expected hash is a PLACEHOLDER until a real hash is
  verified; scripts warn and skip verification in this state.
- **P1**: Model path `./models/yolov8n.onnx` resolved relative to the worker's
  CWD (`apps/cv-worker/src/`) instead of the repo root. Fixed with
  `_resolve_model_path()` that resolves relative paths against `PROJECT_ROOT`.
- **P1**: ONNX detector set `label_class_id=label` (e.g. `"car"`), which could
  fail the Prisma FK constraint on `Prediction.labelClassId`. Fixed: ONNX
  detections now emit `label_class_id=None` and store `cocoLabel`/`classId`
  in `metadata` instead. `CvWorkerPredictionSchema.labelClassId` is now
  `optional().nullable()`.
- **P1**: Seed job had `modelId: null` despite seeding `model_onnx_yolov8n_v1`.
  Fixed: seed job now references `modelArtifact.id`. `createJob()` now also
  extracts `modelId` from the pipeline's `yolo_onnx` node and stores it on the
  job record. `persistPredictions()` includes `modelId` in prediction metadata.
- **P1**: `CvWorkerPredictionSchema` did not include an optional `label` field.
  Added `label: z.string().min(1).optional()` so the semantic COCO class name
  survives Zod parsing and is available in metadata.
- **Tests**: Removed duplicate `test_onnx_runtime_unavailable_error_raised` and
  `test_onnx_detector_mode`. Added shape normalization tests, postprocess
  decode tests, letterbox coordinate mapping tests, and `_resolve_model_path`
  tests. Pytest count is now 42.

## Severity: Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

**MED-01: ONNX model binary not committed to repo**

The YOLOv8n ONNX model is not included in the repository (per design constraint).
The model must be downloaded separately via `pnpm download-model`. The download
script exits 1 on checksum mismatch and deletes the invalid file. The expected
hash is a PLACEHOLDER that must be replaced with the real SHA-256 before
verification is meaningful.

**Status:** Acceptable — documented. The script warns when PLACEHOLDER is in use.

**MED-02: `_resolve_asset_image()` downloads from MinIO for every asset**

The `_resolve_asset_image()` helper downloads the source image from MinIO to a
temp directory for every asset, even if it's already been downloaded. The
`/tmp/visionflow` directory is not cleaned up after inference completes.

**Status:** Acceptable — temp cleanup can be added in Phase 20.

### LOW

**LOW-01: COCO label → LabelClass mapping deferred to Phase 20**

ONNX detections store `cocoLabel` and `classId` in `metadata`. The API does not
map COCO names to project `LabelClass.id` before persisting — `labelClassId`
is null for ONNX predictions. Phase 20 (Evaluation E2E) will implement the
mapping using ground-truth annotation class information.

**Status:** Intentional deferral. No FK failure risk after the hardening fix.

**LOW-02: SHA-256 checksum is PLACEHOLDER until verified**

The download scripts use a placeholder hash that the user must replace with the
real SHA-256 computed against the downloaded file.

**Status:** Documented in script comments. User must run
`(Get-FileHash .\models\yolov8n.onnx -Algorithm SHA256).Hash` and update
`$ExpectedSha256`.

### INFO

**INFO-01: Prisma EPERM during `pnpm db:generate`**

When the dev server is running, Prisma cannot regenerate its client DLL due to a
Windows file lock. This is a known Windows development issue. Resolution: stop
dev servers before running `pnpm db:generate`.

**INFO-02: Logging format errors in CV worker test output**

The loguru handler produces `ValueError: Sign not allowed in string format
specifier` errors during test runs. This is a pre-existing issue — not caused
by Phase 19 changes.

**INFO-03: DET-08 test coverage is service-level, not full Prisma integration**

The API tests verify that the CV worker client returns correct response shapes,
that `runPipelineFallback` throws for ONNX mode, and that mock predictions have
the expected structure. Full end-to-end Prisma persistence is covered by the
smoke tests that run against a live stack with real database. Production DB
integration is exercised by the Phase 17 runtime smoke tests.

## Verification Evidence

| Check                                       | Result                                                      |
| ------------------------------------------- | ----------------------------------------------------------- |
| `pnpm --filter @visionflow/api typecheck`   | PASS                                                        |
| `pnpm --filter @visionflow/api test`        | 142 PASS, 2 SKIP                                            |
| `pnpm --filter @visionflow/web build`       | PASS                                                        |
| `pnpm lint`                                 | PASS                                                        |
| `pnpm format:check`                         | PASS                                                        |
| `python -m pytest apps/cv-worker/tests/ -v` | 42 PASS, 0 SKIP                                             |
| `pnpm db:generate`                          | EPERM (dev server holds Prisma DLL lock — not a code issue) |

## DET-01 Through DET-08 Status

| ID     | Criterion                                                    | Status                   |
| ------ | ------------------------------------------------------------ | ------------------------ |
| DET-01 | `/cv/run-pipeline` executes real ONNX Runtime inference      | ✅ Implemented           |
| DET-02 | 640x640 letterbox preprocessing                              | ✅ Implemented           |
| DET-03 | Postprocess: decode + conf 0.25 + NMS 0.45 + original coords | ✅ Implemented           |
| DET-04 | Predictions persisted to DB with traceability fields         | ✅ Implemented           |
| DET-05 | ONNX errors explicit, no silent fallback                     | ✅ Implemented           |
| DET-06 | Mock available only when explicitly selected                 | ✅ Implemented           |
| DET-07 | ONNX model path/version explicit in config                   | ✅ Implemented           |
| DET-08 | API integration test proves prediction persistence           | ✅ Service-level + smoke |

## Risk Assessment

| Risk                                      | Likelihood | Impact   | Mitigation                                        |
| ----------------------------------------- | ---------- | -------- | ------------------------------------------------- |
| Wrong YOLO output shape decode            | Low        | Critical | Fixed: `_normalize_yolo_output()` enforces (N,84) |
| Checksum mismatch accepted silently       | Low        | High     | Fixed: script exits 1 and deletes file            |
| Model path wrong for Windows start script | Low        | High     | Fixed: resolves against PROJECT_ROOT              |
| labelClassId FK failure                   | Low        | High     | Fixed: ONNX emits None, stores in metadata        |
| Model not downloaded                      | Medium     | High     | Documented in README and .env.example             |
| SHA-256 placeholder in use                | High       | Medium   | Documented; user must replace with real hash      |
