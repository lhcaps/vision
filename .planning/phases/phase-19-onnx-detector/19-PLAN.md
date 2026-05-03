# Phase 19 Plan: Real ONNX Detector & Prediction Persistence

## Context

Phase 18 completed: Dataset locking & deterministic COCO export.

Phase 19 goal: Implement real ONNX detector execution path and prediction persistence.

Current state:

- `_run_onnx_pipeline()` in `main.py` throws HTTP 501 "not configured"
- `onnxruntime` not in `requirements.txt`
- Mock detector (`_mock_prediction()`) is deterministic but not real
- Prediction persistence is wired in `InferenceService.persistPredictions()`
- `CV_WORKER_DETECTOR_MODE=mock` in `.env`, no ONNX-specific env vars
- No ONNX env vars in `.env.example`

## DET-01 through DET-08 Acceptance Criteria

| ID     | Criterion                                                                 | Implementation Location                                    |
| ------ | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| DET-01 | `/cv/run-pipeline` executes real ONNX Runtime inference with YOLOv8n ONNX | `src/detectors/onnx_yolo.py` + `main.py`                   |
| DET-02 | Input shape 640x640 with resize/letterbox preprocessing                   | `src/detectors/onnx_yolo.py` (`preprocess_letterbox`)      |
| DET-03 | Postprocess: decode boxes, confidence 0.25, NMS IoU 0.45, original coords | `src/detectors/onnx_yolo.py` (`postprocess_yolo`)          |
| DET-04 | Predictions persisted to DB with full traceability fields                 | `InferenceService.persistPredictions()` (existing, verify) |
| DET-05 | ONNX errors surfaced clearly — no silent fallback                         | `src/detectors/onnx_yolo.py` + `main.py` guards            |
| DET-06 | Mock detector only when explicitly selected                               | `main.py` `detectorMode == "onnx"` branch                  |
| DET-07 | ONNX model path/version explicit in config                                | `CV_WORKER_ONNX_MODEL_PATH` env var                        |
| DET-08 | API integration test proves prediction persistence                        | `inference.service.spec.ts` new test                       |

## Non-Goals

- No model training
- No segmentation masks
- No keypoints
- No model registry UI
- No Phase 20 evaluation E2E

## Implementation Sequence

### Wave 19-01: ONNX Dependencies + Env Vars

1. Add `onnxruntime>=1.19.0` to `requirements.txt`
2. Add ONNX env vars to `.env.example`:
   - `CV_WORKER_DETECTOR_MODE=mock`
   - `CV_WORKER_ONNX_MODEL_PATH=<local path>`
   - `CV_WORKER_ONNX_MODEL_VERSION=yolov8n-640`
   - `CV_WORKER_CONFIDENCE_THRESHOLD=0.25`
   - `CV_WORKER_NMS_IOU_THRESHOLD=0.45`
   - `CV_WORKER_INPUT_SIZE=640`
3. Add same vars to `.env`

### Wave 19-02: ONNX Detector Module

Files to create:

- `apps/cv-worker/src/detectors/__init__.py` — exports
- `apps/cv-worker/src/detectors/base.py` — `Detector` ABC + `Detection` dataclass
- `apps/cv-worker/src/detectors/mock_detector.py` — existing mock logic extracted
- `apps/cv-worker/src/detectors/onnx_yolo.py` — YOLOv8n ONNX implementation

Key implementation details:

- `OnnxYoloDetector.__init__()`: validate model path, load session once
- `preprocess_letterbox()`: 640x640 letterbox, return tensor + scale/pad metadata
- `postprocess_yolo()`: decode YOLOv8 output, NMS, convert to original coords
- Explicit errors for: missing model, invalid model, ONNX runtime unavailable, image decode error
- No fallback to mock in ONNX mode

### Wave 19-03: Wire into main.py

- Update `_run_onnx_pipeline()` to use `OnnxYoloDetector`
- Update `run_pipeline()` to use `MockDetector` explicitly when mode is `mock`
- Update health endpoint to expose ONNX detector status/config
- Update worker version to 0.3.0

### Wave 19-04: Model Download Script

Files to create:

- `scripts/download-model.ps1` (Windows)
- `scripts/download-model.sh` (Unix)

Downloads YOLOv8n from Ultralytics CDN with SHA-256 verification.

### Wave 19-05: API Prediction Traceability Verification

- Verify `InferenceService.persistPredictions()` links: `inferenceJobId`, `assetId`, `labelClassId`
- Verify metadata includes: `workerMode`, `workerVersion`, `modelVersion` (when ONNX)
- Add `datasetVersionId` and `pipelineId` to prediction metadata if not already present

### Wave 19-06: Seed Data

- `scripts/seed-db.ts`: add `ModelArtifact` row for YOLOv8n if not present

### Wave 19-07: Tests

CV worker pytest:

- `tests/test_onnx_detector.py`: mock ONNX unavailable, invalid model path, letterbox mapping, NMS behavior

API Vitest:

- Extend `inference.service.spec.ts`: ONNX error transitions job to FAILED, prediction persistence with traceability

## Files to Create

| File                                                 | Purpose                     |
| ---------------------------------------------------- | --------------------------- |
| `src/detectors/__init__.py`                          | Detector exports            |
| `src/detectors/base.py`                              | ABC + Detection dataclass   |
| `src/detectors/mock_detector.py`                     | Extracted mock detector     |
| `src/detectors/onnx_yolo.py`                         | YOLOv8n ONNX implementation |
| `tests/test_onnx_detector.py`                        | ONNX detector unit tests    |
| `scripts/download-model.ps1`                         | Windows model download      |
| `scripts/download-model.sh`                          | Unix model download         |
| `.planning/phases/phase-19-onnx-detector/19-PLAN.md` | This plan                   |

## Files to Modify

| File                                               | Change                                        |
| -------------------------------------------------- | --------------------------------------------- |
| `apps/cv-worker/requirements.txt`                  | Add `onnxruntime>=1.19.0`                     |
| `apps/cv-worker/src/main.py`                       | Wire detectors, update `_run_onnx_pipeline()` |
| `.env.example`                                     | Add ONNX env vars                             |
| `.env`                                             | Add ONNX env vars                             |
| `packages/contracts/src/cv-worker.ts`              | Extend response schema if needed              |
| `scripts/seed-db.ts`                               | Seed YOLOv8n ModelArtifact                    |
| `apps/api/src/inference/inference.service.ts`      | Verify/add traceability fields                |
| `apps/api/src/inference/inference.service.test.ts` | Add ONNX error path test                      |
| `README.md`                                        | Document ONNX mode and env vars if needed     |

## Verification

1. `pnpm db:generate` passes
2. `pnpm typecheck` passes
3. `pnpm test` passes
4. `pnpm build` passes
5. `pnpm lint` passes
6. `pnpm format:check` passes
7. `python -m pytest apps/cv-worker/tests/ -v` passes
8. Runtime smoke: `curl http://localhost:3000/api/health`
9. Inference smoke: job creation, prediction persistence, ONNX mode failure (no model)

## Depends On

Phase 17, Phase 18
