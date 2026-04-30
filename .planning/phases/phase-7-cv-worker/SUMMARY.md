# Phase 7 Summary, CV Worker

Status: passed
Date: 2026-05-01

## What Changed

- Added shared CV worker contracts for run-pipeline requests, detector predictions, worker responses, evaluation requests, and evaluation metrics.
- Hardened the FastAPI CV worker:
  - `/health` now reports worker capabilities and version metadata.
  - `/cv/run-pipeline` supports detector mode and confidence threshold.
  - Mock detection is deterministic, bounded in image coordinates, and threshold-filtered.
  - ONNX mode fails loudly with actionable unavailable/runtime/model errors instead of silently falling back to mock.
  - `/cv/evaluate-detections` computes IoU-based precision, recall, F1, mean IoU, true positives, false positives, and false negatives.
- Added a Nest `CvWorkerClient` and connected inference job execution to the worker using locked dataset assets and media dimensions.
- Persisted CV worker predictions on the Prisma-backed path so Phase 8 can build overlays and per-job evaluation UI on real stored output.
- Kept local/demo execution deterministic with the existing memory fallback when no external worker URL is configured.
- Added worker-visible logs to the Jobs flow for locked dataset resolution, detector dispatch, prediction count, persistence, and successful completion.

## Key Files

- `.env.example`
- `packages/contracts/src/cv-worker.ts`
- `packages/contracts/src/jobs.ts`
- `packages/contracts/src/__tests__/cv-worker.test.ts`
- `apps/cv-worker/src/main.py`
- `apps/cv-worker/tests/test_worker.py`
- `apps/api/src/inference/cv-worker.client.ts`
- `apps/api/src/inference/cv-worker.client.test.ts`
- `apps/api/src/inference/inference.service.ts`
- `apps/api/src/inference/inference.service.test.ts`
- `apps/api/src/inference/inference.module.ts`
- `apps/api/src/datasets/datasets.service.ts`
- `apps/api/src/media/media.module.ts`

## Verification Evidence

- `pnpm --filter @visionflow/contracts test` passed, 28 tests.
- `python -m pytest apps/cv-worker/tests -q` passed, 8 tests.
- `pnpm --filter @visionflow/api test` passed, 23 tests.
- `pnpm --filter @visionflow/api typecheck` passed.
- `pnpm --filter @visionflow/web typecheck` passed.
- API + CV worker smoke passed on ports 3117 and 8017:
  - worker health returned version `0.2.0`, mock detector support, ONNX unavailable metadata, and evaluation support,
  - API created an inference job,
  - SSE emitted CV worker dispatch and prediction-count logs,
  - final job reached `SUCCEEDED` at `100`.
- Final API + CV worker smoke passed on ports 3118 and 8018:
  - API job `inference_job_proj_parking_lot_1777571638682_1` reached `SUCCEEDED` at `100`,
  - SSE history included the CV worker prediction-count log.
- Final browser smoke passed on API 3118 and web 5178:
  - Jobs tab completed on desktop and 390px mobile,
  - completion logs included `CV worker mock_detector completed 3 predictions.`,
  - no horizontal overflow was detected,
  - screenshots saved to `tmp/phase7-jobs-desktop-final.png` and `tmp/phase7-jobs-mobile-final.png`.
- `pnpm verify` passed after implementation.

## Notes

- `CV_WORKER_URL` opts the API into an external FastAPI worker; without it, mock-mode local development remains deterministic through the in-process fallback.
- ONNX execution is deliberately not mocked. Until `onnxruntime`, a model artifact, and postprocess configuration exist, ONNX requests return explicit HTTP errors.
- Final review added a regression guard for tiny images so mock worker boxes stay bounded even when the image is smaller than the normal mock-box minimum.
- Phase 8 can now focus on prediction overlays and ground-truth comparison because worker prediction persistence is already in place for the Prisma path.
