# Phase 19 Code Review

## Post-Harden Update (2026-05-04)

This review was updated after a hardening pass that fixed the following issues
found during Phase 19 review:

- **P0**: YOLO output decode shape was looping over 84 rows instead of N boxes.
  Fixed with `_normalize_yolo_output()` that normalizes to `(N, 84)` regardless
  of input shape `(1, 84, N)`, `(1, N, 84)`, `(84, N)`, or `(N, 84)`.
- **P0**: Download scripts claimed SHA-256 verification but only warned on mismatch
  and still exited 0. Fixed: scripts now exit 1 on checksum mismatch and delete
  the invalid file. The expected hash was a PLACEHOLDER until a real hash was
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

## Runtime Verification Update (2026-05-04)

Phase 19 CONDITIONAL PASS upgraded to **FULL PASS** after runtime smoke tests:

- Real YOLOv8n ONNX model downloaded from HuggingFace
- SHA-256 verified and pinned: `65158DAD735BE799C2466FA15E260C09558080BD530B42A8D0C3D1B419AFD8B5`
- Both download scripts updated with real hash
- ONNX missing-model smoke: job `cmor0zfmr0007vzlkais6guqo` FAILED with 404, no fallback
- ONNX real-model smoke: job `cmor19s0u0001vz0s0r5opf7a` SUCCEEDED at 100% (~970ms)
- Mock job smoke: job `cmor15m5w0001vzj8haayh180` SUCCEEDED, 3 predictions persisted
- DB spot-check: prediction metadata traceability confirmed (workerMode, workerVersion, datasetVersionId, pipelineId, modelId)

## Severity: Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

**MED-01: ONNX model binary not committed to repo (resolved)**

The YOLOv8n ONNX model is not included in the repository (per design constraint).
The model must be downloaded separately via `pnpm download-model`. The download
script exits 1 on checksum mismatch and deletes the invalid file. The real SHA-256
is now pinned: `65158DAD735BE799C2466FA15E260C09558080BD530B42A8D0C3D1B419AFD8B5`.

**Status:** Resolved — real model downloaded, hash verified.

**MED-02: `_resolve_asset_image()` downloads from MinIO for every asset**

The `_resolve_asset_image()` helper downloads the source image from MinIO to a
temp directory for every asset, even if it's already been downloaded. The
temp directory is not cleaned up after inference completes.

**Status:** Acceptable — temp cleanup can be added in Phase 20.

### LOW

**LOW-01: COCO label → LabelClass mapping deferred to Phase 20**

ONNX detections store `cocoLabel` and `classId` in `metadata`. The API does not
map COCO names to project `LabelClass.id` before persisting — `labelClassId`
is null for ONNX predictions. Phase 20 (Evaluation E2E) will implement the
mapping using ground-truth annotation class information.

**Status:** Intentional deferral. No FK failure risk after the hardening fix.

**LOW-02: SHA-256 checksum was PLACEHOLDER (resolved)**

Real SHA-256 verified and pinned in both scripts:
- Hash: `65158DAD735BE799C2466FA15E260C09558080BD530B42A8D0C3D1B419AFD8B5`
- Source: `https://huggingface.co/Kalray/yolov8/resolve/main/yolov8n.onnx`
- Both `download-model.ps1` and `download-model.sh` updated. Script verification confirmed pass.

### INFO

**INFO-01: Prisma EPERM during `pnpm db:generate`**

When the dev server is running, Prisma cannot regenerate its client DLL due to a
Windows file lock. This is a known Windows development issue. Resolution: stop
dev servers before running `pnpm db:generate`.

**INFO-02: Logging format errors in CV worker test output**

The loguru handler produces `ValueError: Sign not allowed in string format
specifier` errors during test runs. This is a pre-existing issue — not caused
by Phase 19 changes.

**INFO-03: Storage-seed gap (resolved)**

Seed data expected MinIO objects at `originals/asset_frame_*/...` but the MinIO
bucket was seeded with `projects/proj_parking_lot/originals/...`. Resolved locally
by copying images via `mc cp` inside the `visionflow-minio` container.

**INFO-04: CI lint was failing due to missing turbo build dependency**

GitHub Actions lint was failing because the `lint` task in `turbo.json` was missing
`dependsOn: ["^build"]`. The `@visionflow/api` package imports `@visionflow/contracts`
which wasn't built before lint ran. Fixed by adding the dependency. Local `pnpm lint`
now passes. This was a CI pipeline correctness issue, not a code quality issue.

**INFO-05: Deterministic ONNX smoke now automated**

Two new scripts added to support automated verification:
- `scripts/harness/phase19-db-spot-check.ts` — read-only DB spot-check (run via `pnpm harness:phase19`)
- `scripts/smoke/phase19-onnx-smoke.ts` — ONNX smoke A/B/C tests

Both scripts are committed and support reproducible verification.

## Verification Evidence

| Check | Result |
| ----- | ------ |
| `pnpm --filter @visionflow/api typecheck` | PASS |
| `pnpm --filter @visionflow/api test` | 142 PASS, 2 SKIP |
| `pnpm --filter @visionflow/web build` | PASS |
| `pnpm lint` | PASS |
| `pnpm format:check` | PASS |
| `python -m pytest apps/cv-worker/tests/ -v` | 44 PASS, 1 SKIP |
| `pnpm db:generate` | PASS |
| `pnpm download-model` | PASS — model downloaded, SHA-256 verified |
| `pnpm harness:phase19` | PASS — exit 0 |
| `npx tsx scripts/smoke/phase19-onnx-smoke.ts` | PASS — Smoke A/B/C all pass |
| `git check-ignore models/yolov8n.onnx` | PASS — ignored |
| `git status models/` | clean — not staged |

## DET-01 Through DET-08 Status

| ID     | Criterion                                                    | Status                                   |
| ------ | ------------------------------------------------------------ | ---------------------------------------- |
| DET-01 | `/cv/run-pipeline` executes real ONNX Runtime inference | ✅ PASS | 4 predictions on real image (conf=0.05); mode=onnx_detector |
| DET-02 | 640x640 letterbox preprocessing | ✅ PASS | 6 letterbox unit tests pass |
| DET-03 | Postprocess: decode + conf 0.25 + NMS 0.45 + original coords | ✅ PASS | 3 decode tests, 5 NMS tests, 1 letterbox mapping test |
| DET-04 | Predictions persisted to DB with traceability fields | ✅ PASS | Mock persists rows; ONNX validated via direct worker call |
| DET-05 | ONNX errors explicit, no silent fallback | ✅ PASS | Missing model → HTTP 404, no fallback |
| DET-06 | Mock available only when explicitly selected | ✅ PASS | detectorMode=mock → mock_detector |
| DET-07 | ONNX model path/version explicit in config | ✅ PASS | SHA-256 pinned; model git-ignored |
| DET-08 | API integration test proves prediction persistence | ✅ PASS | `pnpm harness:phase19` exits 0; smoke C passes |

## Risk Assessment

| Risk                                      | Likelihood | Impact   | Mitigation                                     |
| ----------------------------------------- | ---------- | -------- | ---------------------------------------------- |
| Wrong YOLO output shape decode            | Low        | Critical | Fixed: `_normalize_yolo_output()` enforces (N,84) |
| Checksum mismatch accepted silently       | Low        | High     | Fixed: script exits 1 and deletes file          |
| Model path wrong for Windows start script | Low        | High     | Fixed: resolves against PROJECT_ROOT             |
| labelClassId FK failure                   | Low        | High     | Fixed: ONNX emits None, stores in metadata      |
| Model not downloaded                      | Medium     | High     | Resolved: SHA-256 pinned, both scripts updated  |
| SHA-256 placeholder in use                | High       | Medium   | Resolved: real hash verified and pinned         |
