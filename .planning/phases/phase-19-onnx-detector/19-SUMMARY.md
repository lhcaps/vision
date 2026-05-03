# Phase 19 Summary: Real ONNX Detector & Prediction Persistence

**Status:** Completed 2026-05-04
**Commit:** `feat(inference): run ONNX detector and persist predictions`
**Precondition:** Phase 18 completed, runtime blocker closed (commit e20d4a0)

## What Was Built

Phase 19 implements the real ONNX detector execution path in the CV worker and wires prediction persistence with full traceability through the NestJS API.

## Architecture

```
NestJS API → BullMQ → FastAPI CV Worker
                        ↓
                  MinIO (read source image)
                        ↓
              OnnxYoloDetector (YOLOv8n ONNX)
                        ↓
              Letterbox preprocessing (640x640)
                        ↓
              ONNX Runtime inference
                        ↓
              YOLO postprocess (decode + NMS + coords)
                        ↓
              Detection[] → API response → Prediction[] in DB
```

## Detector Abstraction

- `Detector` ABC with `detect(asset_id, image_path, width, height)` interface
- `Detection` dataclass with `to_dict()` for Zod-compatible output
- `MockDetector` — extracted from main.py, deterministic, explicit
- `OnnxYoloDetector` — real YOLOv8n ONNX pipeline

## Key Implementation Details

**Letterbox preprocessing:**
- Scales image to 640x640 while preserving aspect ratio
- Pads with gray (114) to avoid distortion
- Returns scale/pad metadata for coordinate remapping

**YOLO postprocessing:**
- Decodes YOLOv8 ONNX output (80 COCO classes)
- Applies confidence threshold (default 0.25)
- Applies NMS within same class (default IoU 0.45)
- Converts boxes back to original image coordinates
- Clamps boxes to image bounds

**Error handling:**
- `OnnxRuntimeUnavailableError` → HTTP 501
- `ModelLoadError` → HTTP 422
- `ImageDecodeError` → HTTP 422
- Missing `modelArtifactKey` → HTTP 400
- Model not found → HTTP 404
- **No silent fallback to mock in ONNX mode**

**Prediction traceability metadata:**
```json
{
  "workerMode": "onnx_detector",
  "workerVersion": "0.3.0",
  "datasetVersionId": "dataset_proj_parking_lot_parking_v3",
  "pipelineId": "pipeline_proj_parking_lot_parking_detector",
  "modelVersion": "yolov8n-640",
  "runtime": "onnx_detector",
  "inputSize": 640
}
```

## Files Changed

### Created
- `apps/cv-worker/src/detectors/__init__.py`
- `apps/cv-worker/src/detectors/base.py`
- `apps/cv-worker/src/detectors/mock_detector.py`
- `apps/cv-worker/src/detectors/onnx_yolo.py`
- `apps/cv-worker/tests/test_onnx_detector.py` (25 tests)
- `scripts/download-model.ps1`
- `scripts/download-model.sh`
- `.planning/phases/phase-19-onnx-detector/19-PLAN.md`

### Modified
- `apps/cv-worker/src/main.py` — wire detectors, `_run_onnx_pipeline()` implementation
- `apps/cv-worker/requirements.txt` — added `onnxruntime>=1.19.0`
- `apps/api/src/inference/inference.service.ts` — traceability metadata
- `apps/api/src/inference/inference.service.test.ts` — ONNX mode tests
- `apps/api/src/prisma/prisma.module.ts` — format fix
- `packages/contracts/src/cv-worker.ts` — `modelVersion` field
- `scripts/seed-db.ts` — YOLOv8n ModelArtifact row
- `.env` — ONNX env vars
- `.env.example` — ONNX env vars documented
- `package.json` — `download-model` script
- `apps/cv-worker/tests/test_worker.py` — version bump + MinIO skip
- `.planning/STATE.md` — Phase 19 section added
- `.planning/ROADMAP.md` — Phase 19 marked Done
- `.planning/MILESTONES.md` — Phase 19 marked Done
- `.planning/REQUIREMENTS.md` — DET-01 through DET-08 marked Done

## Non-Goals Delivered (Out of Scope for Phase 19)

These remain pending for future phases:
- Real ONNX model binary (download via script, not committed)
- Real image inference end-to-end (requires live MinIO + model download)
- Model training / segmentation / keypoints
- Phase 20 Evaluation E2E
