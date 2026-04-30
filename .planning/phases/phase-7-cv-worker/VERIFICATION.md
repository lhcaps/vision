# Phase 7 Verification, CV Worker

Status: passed
Date: 2026-05-01

## Goal Check

Phase 7 required the CV worker to become a real typed runtime slice behind inference orchestration. The implemented path now dispatches inference jobs to the worker, returns deterministic detector output, rejects unavailable ONNX execution explicitly, evaluates detections with IoU metrics, and persists predictions for later overlay work.

## Must-Haves

- Stable mock detector response: passed. The worker returns deterministic, threshold-filtered bounding boxes bounded by each image's dimensions.
- ONNX detector path: passed as an explicit capability guard. ONNX mode requires a model artifact and runtime support and returns actionable errors when unavailable; it never silently falls back to mock.
- Evaluation endpoint: passed. `/cv/evaluate-detections` computes precision, recall, F1, mean IoU, true positives, false positives, and false negatives.
- API integration: passed. The inference worker resolves the locked dataset, loads asset dimensions, dispatches to the CV worker client, and records worker logs.
- Prediction persistence: passed for the Prisma path. Predictions are written with job, asset, label, confidence, and image-space bounding box data.
- Jobs UX evidence: passed. Existing Jobs UI surfaces backend logs and reached completion on desktop and mobile without layout overflow.

## Automated Checks

- `pnpm --filter @visionflow/contracts test`: passed.
- `python -m pytest apps/cv-worker/tests -q`: passed.
- `pnpm --filter @visionflow/api test`: passed.
- `pnpm --filter @visionflow/api typecheck`: passed.
- `pnpm --filter @visionflow/web typecheck`: passed.
- `pnpm verify`: passed.

## Runtime Smokes

- CV worker smoke on port 8017:
  - `GET /health` returned version `0.2.0`.
  - Capabilities included mock detector support, ONNX unavailable metadata, and evaluation support.
- API smoke on port 3117 with `CV_WORKER_URL=http://127.0.0.1:8017`:
  - Created job `inference_job_proj_parking_lot_1777570839602_1`.
  - SSE emitted `snapshot`, `log`, `progress`, and `complete` events.
  - Worker logs included `CV worker mock_detector completed 3 predictions.`
  - Final status was `SUCCEEDED` with progress `100`.
- Final API smoke on port 3118 with CV worker on 8018:
  - Created job `inference_job_proj_parking_lot_1777571638682_1`.
  - SSE history included the CV worker prediction-count log.
  - Final status was `SUCCEEDED` with progress `100`.
- Final browser smoke on web port 5178:
  - Desktop 1440x900 Jobs run completed.
  - Mobile 390x844 Jobs run completed.
  - No horizontal overflow was detected.
  - Screenshots: `tmp/phase7-jobs-desktop-final.png`, `tmp/phase7-jobs-mobile-final.png`.

## Residual Risk

- Redis-backed BullMQ live smoke remains environment-dependent; local verification used the intended memory worker fallback.
- ONNX execution is intentionally blocked until the project supplies an actual model artifact and postprocess configuration.
