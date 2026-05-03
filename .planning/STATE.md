# State

Current milestone: v1.1 — Production Hardening & Real Vertical Slice

Current phase: Phase 19 (Completed — Real ONNX Detector & Prediction Persistence)

Last updated: 2026-05-04.

## Current Position

Phase: Phase 18 — Dataset Locking & Deterministic COCO Export
Status: Completed

## Accumulated Context

**v1.0 Complete:** Monorepo, Web shell, Media ingestion, Dataset versioning, Bounding-box annotation, Pipeline builder, Job orchestration, CV worker scaffold, Prediction overlay, Evaluation metrics, Timeline replay, CI/CD, Linting, One-command boot

**v1.1 Complete:** Phase 11 (README), Phase 12 (CI/CD), Phase 13 (Security hardening), Phase 14A (Adapter boundary), Phase 14B (Domain invariants), Phase 15 (Observability & health), Phase 15.5-15.10 (Pre-16 Completion Track), Phase 16A (Frontend Split Minimum), Phase 17 (Real Media Processing)

**v1.1 In Progress:** Phase 18 complete — Phase 19 (Real ONNX inference) next

## Accumulated Context

**v1.0 Complete:** Monorepo, Web shell, Media ingestion, Dataset versioning, Bounding-box annotation, Pipeline builder, Job orchestration, CV worker scaffold, Prediction overlay, Evaluation metrics, Timeline replay, CI/CD, Linting, One-command boot

**v1.1 Progress:**

- Phase 11 (README) ✅ Done
- Phase 12 (CI) ✅ Done
- Phase 13 (Security) ✅ Done
- Phase 14A (Adapter boundary) ✅ Done
- Phase 14B (Domain invariants) ✅ Done
- Phase 15 (Observability & health) ✅ Done
- Phase 15.5-15.10 (Pre-16 Completion Track) ✅ Done
- Phase 16A (Frontend split min) ✅ Done
- Phase 17 (Real media processing) ✅ Done — Pillow thumbnail, MinIO read/write, BullMQ consumer, derivative persistence, AssetDerivative.checksum field
- Phase 17.1 (Runtime fixes) ✅ Done — Race condition fix, CV worker import fix, full-stack dev boot, storage error classification, duplicate FAILED fix
- Phase 18 (Dataset lock & COCO export) completed — lock invariants, annotation immutability, deterministic COCO export, real image dimensions persisted
- Phase 19 (Real ONNX inference) pending
- Phase 20 (Evaluation E2E) pending
- Phase 21 (Frontend split completion) pending
- Phase 22A (Test harness) pending
- Phase 22B (Production test suite) pending
- Phase 23 (E2E & demo) pending

## What Was True Before Phase 15

- No structured logging — NestJS used `console.log`/`console.error` for bootstrap only
- No request ID propagation — logs from different services couldn't be correlated
- No job correlation IDs — BullMQ jobs had no correlation back to API request
- No health check endpoints — `/api/health` returned a static `{ ok: true }`
- No MinIO health check — storage health couldn't be verified
- No CV worker health check — couldn't detect worker downtime
- CV worker had no structured logging — no visibility into worker operations
- CV worker had no correlation ID propagation — couldn't trace jobs through worker
- README lacked observability documentation

## What Is True After Phase 15

- **pino** for structured JSON logging in NestJS with `AsyncLocalStorage` for request context propagation
- **loguru** for structured logging in FastAPI CV worker with `contextvars` for correlation ID propagation
- `x-request-id` header on every API request (auto-generated or passthrough)
- `x-correlation-id` header propagated from API through BullMQ to CV worker and back
- 17+ distinct structured log events covering the full request lifecycle
- `/api/health/live` — lightweight liveness, always HTTP 200
- `/api/health/deep` — full dependency checks (Postgres, Redis, MinIO, CV Worker), HTTP 200/503
- CV worker `/health` endpoint returns logging configuration info
- All health checks include response time measurements and timeout handling
- README updated with comprehensive observability documentation
- 2 security vulnerabilities fixed (SSRF, raw error propagation) via code review
- 10 new tests added (2 CV worker, 8 implicitly via typecheck)

### Roadmap Evolution

- v1.0 (phases 0-10) archived as complete milestone.
- v1.1 (phases 11-23) is the new active milestone.
- Roadmap upgraded: 10 phases → 13 phases (11-23) with full scope.
- Phase 14 split into 14A (Adapter Boundary) and 14B (Domain Invariants & State Machines).
- Phase 16 split into 16A (Frontend Split Minimum) and remaining phases.
- New phases added: Phase 15 (Observability & Health Checks), Phase 22 (Production-Path Tests), Phase 23 (E2E & Demo Video).
- COCO export is dedicated Phase 18 (separate from annotation).
- Brutal scope rules: no new features until real vertical slice works, no silent fallback.

### Key Decisions

- v1.0 archived as complete. v1.1 is new active milestone.
- Architecture: Web → NestJS API → Postgres/Prisma + MinIO + BullMQ/Redis → FastAPI CV Worker → Artifacts/Predictions/Evaluation.
- Adapter pattern: select Prisma/Minio/BullMQ vs Memory/Local/Noop at module bootstrap, never inside service logic.
- ONNX detector target: YOLOv8n ONNX (640x640 input, confidence 0.25, NMS IoU 0.45).
- No silent fallback from real mode to mock mode — must fail loudly.
- Real vertical slice focus: 14-step flow from upload image to demo video.
- v1.1 complete only when product + engineering + portfolio proofs are all satisfied.

### Prior Milestone Accomplishments (v1.0)

- Read `Vision Plan.docx` and derived the VisionFlow Studio vertical-slice plan.
- Installed local GSD/Codex artifacts for this repo.
- Created product and design context in `PRODUCT.md` and `DESIGN.md`.
- Built the pnpm/turbo monorepo with `apps/web`, `apps/api`, `apps/cv-worker`, `packages/contracts`, `packages/motion`, and `infra`.
- Implemented Phase 1 foundation: web workbench shell, API health/OpenAPI/demo routes, Prisma domain schema, CV mock endpoint, shared contracts, and root verification scripts.
- Implemented Phase 2 media ingestion: multipart API upload, MIME validation, SHA-256 checksum dedupe, MinIO original storage, Prisma metadata row, audit row, queued media processing job, CV thumbnail/frame contracts, and web uploader states.
- Implemented Phase 3 dataset versioning: shared contracts, Prisma/memory-backed dataset API, draft asset assignment, locked-version mutation rejection, computed split summaries, and upgraded Versions workbench UI.
- Implemented Phase 4 annotation engine: shared annotation contracts, API workspace/CRUD endpoints, Prisma and memory fallback service paths, image-coordinate BBox clamping, mutation audit logs, and annotation workbench UI with label selector, keyboard actions, and save queue.
- Implemented Phase 5 pipeline builder: typed pipeline contracts, structured graph validation, API persistence through Prisma/memory paths, mutation audit logging, API sync/save/validate web client, and React Flow inspector with node parameter controls and validation highlighting.
- Implemented Phase 6 inference orchestrator: typed job creation and stream contracts, locked dataset and valid pipeline validation, BullMQ queue wiring with memory fallback, explicit async worker transitions, SSE job progress, API job list/detail/create routes, and Jobs workbench that follows backend truth.
- Implemented Phase 7 CV worker integration: shared CV worker contracts, FastAPI capability metadata, deterministic thresholded mock detections, explicit ONNX unavailable/runtime/model failures without silent fallback, IoU evaluation metrics, API dispatch from inference jobs to the worker, prediction persistence on the Prisma path.
- Implemented Phase 8 prediction overlay and evaluation: evaluation contracts, evaluation service with Prisma and memory fallback paths, CvWorkerClient.evaluate() method, API routes for job evaluation and predictions, PredictionOverlayCanvas with GT/prediction toggle layers, EvaluationMetricsPanel with color-coded metric blocks and per-class breakdown.
- Implemented Phase 9 timeline replay and motion polish: TimelineReplayPanel with BBox morph engine, DatasetVersionDiff with IoU-based diff computation, PipelineExecutionFlow with particle edge animations, and global CSS consolidation.
- Implemented Phase 10 hardening: unified Vitest workspace with 118 tests across 4 packages, GitHub Actions CI + E2E workflows, ESLint + Prettier with root config, project README, one-command boot scripts (Unix + PowerShell), demo data validator, and Playwright E2E test scaffolding.

### Prior Verification Evidence (v1.0)

- `pnpm verify` passed: typecheck, tests, and production build.
- `python -m pytest apps/cv-worker/tests -q` passed with 4 tests.
- Local API smoke on port 3101 passed for fallback dataset list, draft creation, asset assignment, lock, and post-lock HTTP 409 rejection.
- Playwright desktop/mobile smoke passed for Versions, Annotate, Pipeline, Jobs, Media tabs.
- Docker Compose config validated.
- Local real-ingestion smoke passed with PostgreSQL and MinIO.
- Phase 6/7/8/10 focused checks passed.
- 118 tests across 4 packages, all 4 package typechecks, production build.

## Active Goals

- Execute Phase 20: Evaluation Report E2E.
- Phase 19 complete — real ONNX detector wired, predictions persisted with full traceability.
- Phase 18 complete — dataset versions are immutable after lock, deterministic COCO export works.

## Known Partial Areas (v1.1 Focus)

Phase 19 complete. The following areas remain pending:

- Evaluation needs real data path end-to-end (Phase 20).
- Evaluation needs real data path end-to-end (Phase 20).
- App.tsx is a monolithic file needing continued feature split (Phase 21).
- No production-path test suite (Phase 22A/B).
- No real-service E2E test or demo video (Phase 23).

## What Is True After Phase 16A (Complete)

Phase 16A is complete. All Phase 16A deliverables delivered via commit `95d52bc10ab60068eec0882b83d8276e870249fc`.

- Shared API boundary established at `shared/api/client.ts`: single `API_BASE_URL`, single `apiJson`, single `apiUpload`, single `readApiError`. No more duplicated error parsing across lib files.
- `lib/http.ts`, `lib/media-upload.ts`, `lib/inference.ts` now delegate to canonical modules.
- `features/media/` module: `MediaUploadRow` type, `uploadMediaFile`, `checksumFile` isolated.
- `features/inference/` module: `JobUiState`, `JobSourceState`, all inference API functions, SSE (`openInferenceJobEvents`), event merging (`mergeJobEvent`) isolated.
- `App.tsx` imports inference types/functions from `features/inference`, media types/functions from `features/media`.
- Runtime truth selectors (`shared/state/`) remain untouched — Phase 15.5 contract preserved.
- `demoSnapshot` usage unchanged in App.tsx — Phase 17+ concern.
- No circular dependencies introduced: `shared/` → `features/` chain is clean.

**Phase 17 pre-flight found 4 P0 issues to address within Phase 17 implementation:**

1. CV worker returns `mock_thumbnailer`/`mock_frame_extractor` instead of real Pillow/OpenCV output.
2. `requirements.txt` missing `minio`, `boto3`, `opencv-python-headless`, and video stack.
3. No BullMQ consumer processes `media-processing` queue jobs.
4. `AssetDerivative` schema missing `checksum` field.

## What Is True After Phase 17 (Complete)

All 4 P0 blockers resolved. Commit: `feat(media): process real thumbnail artifacts`.

**CV Worker changes:**

- `apps/cv-worker/src/storage.py`: MinIO client with `read_object`, `write_object`, `object_exists`, `compute_sha256`.
- `apps/cv-worker/src/media_processing.py`: Real Pillow thumbnail generation. 512x512 max bounding box, aspect ratio preserved, no upscaling, SHA-256 checksum computed, output as WebP.
- `apps/cv-worker/src/main.py`: `/cv/create-thumbnail` replaced with real pipeline. `/cv/extract-frames` returns explicit `FAILED` with "not yet implemented". `/health` reflects `thumbnail: True`, `frameExtraction: False`.
- `requirements.txt`: Added `minio>=7.2.0`.

**NestJS API changes:**

- `apps/api/src/media/media-cv-worker.client.ts`: HTTP client for FastAPI media endpoints with correlation ID propagation.
- `apps/api/src/media/media-processing.service.ts`: BullMQ consumer for `visionflow.media-processing`. Transitions job states (QUEUED→RUNNING→SUCCEEDED/FAILED), calls FastAPI, persists `AssetDerivative`, updates `MediaAsset.thumbnailKey`, writes audit logs.
- `apps/api/src/media/media.service.ts`: Enqueues media processing jobs after asset creation.
- `apps/api/src/media/media.module.ts`: Registers `MediaCvWorkerClient` and `MediaProcessingService`.
- `.env.example`: Added `MEDIA_QUEUE_MODE` and `MEDIA_WORKER_CONCURRENCY`.

**Contracts changes:**

- `packages/contracts/src/cv-worker.ts`: Added `CvWorkerMediaProcessingRequestSchema`, `CvWorkerDerivativeArtifactSchema`, `CvWorkerCreateThumbnailResponseSchema`, `CvWorkerExtractFramesResponseSchema` and their TypeScript types.

**Schema changes:**

- `infra/prisma/schema.prisma`: `AssetDerivative.checksum String?` field added.

**Frame extraction deferred:** `/cv/extract-frames` returns explicit `FAILED` with `error: "Frame extraction is not yet implemented. Video frame extraction will be added in a future phase."` — no fake success.

## What Is True After Phase 18 (Completed)

All Phase 18 deliverables completed. Commit: `feat(datasets): export locked versions as deterministic COCO`.

**Lock-readiness invariants (`DatasetLockValidator`):**

- 8 checks before locking: DRAFT status, at least one asset, no UNASSIGNED splits, all IMAGE assets have width/height, annotation set exists, at least one BBox annotation, all annotation assetIds belong to version, all BBox geometry has positive area.
- All rejection messages are safe, actionable, no stack traces or internal error details.

**Annotation immutability (`AnnotationsService`):**

- `getVersionStatusByAnnotationSet()` resolves annotation → annotationSet → datasetVersion status.
- create/update/delete rejected with 409 when parent version is LOCKED or ARCHIVED.
- Read path (workspace loading) unaffected.

**Real image dimensions:**

- `extractImageMetadata()` uses `sharp().metadata()` to extract width/height from uploaded images.
- `MediaIngestionPlan` carries dimensions through upload pipeline.
- `MediaProcessingService` persists dimensions from CV worker thumbnail response.
- `MediaAsset` rows now have real `width`/`height`.

**Deterministic COCO export (`CocoExportService`):**

- `GET /api/projects/:projectId/dataset-versions/:versionId/export/coco`
- Requires LOCKED status. DRAFT/ARCHIVED => 409.
- Deterministic ordering: images by (split TRAIN>VALID>TEST, storageKey, id), categories by (name, labelClassId), annotations by (image_id, category_id, id).
- COCO IDs assigned sequentially starting at 1 after sorting.
- SHA-256 hash of canonical JSON of stable content (excludes `date_created`, `generatedAt`).
- Response includes VisionFlow metadata: projectId, datasetId, datasetVersionId, datasetVersion, status, assetCount, annotationCount, categoryCount, splits, deterministicHash.

**Contracts:**

- `packages/contracts/src/coco.ts` — COCO Zod schemas exported from `@visionflow/contracts`.

## What Is True After Phase 19 (Completed)

All Phase 19 deliverables completed. Commit: `feat(inference): run ONNX detector and persist predictions`.

**ONNX detector module (`src/detectors/`):**

- `base.py`: `Detector` ABC + `Detection` dataclass with `to_dict()` method.
- `mock_detector.py`: Extracted deterministic mock detector, `image_path` param accepted for interface compatibility.
- `onnx_yolo.py`: YOLOv8n ONNX implementation with 640x640 letterbox preprocessing, ONNX Runtime inference, YOLO output decode, confidence threshold (default 0.25), NMS IoU (default 0.45), coordinate conversion back to original image space. Explicit errors for: missing onnxruntime, model load failure, image decode error. No fallback to mock in ONNX mode.
- 80 COCO class names for label mapping.

**CV worker wiring (`src/main.py`):**

- `WORKER_VERSION` updated to `0.3.0`.
- `/cv/run-pipeline` now dispatches to `MockDetector` or `OnnxYoloDetector` based on `detectorMode`.
- `_run_onnx_pipeline()` reads images from MinIO via `_resolve_asset_image()`, runs inference, returns structured response with `modelVersion`.
- Health endpoint exposes: `onnxDetector.available`, `mode`, `modelVersion`, `inputSize`, `confidenceThreshold`, `nmsIouThreshold`, `modelPath` (masked).
- Explicit error codes: 400 (missing modelArtifactKey), 404 (model not found), 422 (invalid model / image decode), 501 (onnxruntime unavailable).

**Prediction traceability (`InferenceService.persistPredictions()`):**

- Each prediction metadata now includes: `workerMode`, `workerVersion`, `datasetVersionId`, `pipelineId`, `modelVersion` (when ONNX).

**Contracts (`packages/contracts/src/cv-worker.ts`):**

- `CvWorkerRunPipelineResponseSchema` extended with optional `modelVersion` field.

**Env vars (`.env.example`, `.env`):**

- `CV_WORKER_DETECTOR_MODE=mock` (default)
- `CV_WORKER_ONNX_MODEL_PATH=./models/yolov8n.onnx`
- `CV_WORKER_ONNX_MODEL_VERSION=yolov8n-640`
- `CV_WORKER_CONFIDENCE_THRESHOLD=0.25`
- `CV_WORKER_NMS_IOU_THRESHOLD=0.45`
- `CV_WORKER_INPUT_SIZE=640`

**Model download scripts:**

- `scripts/download-model.ps1` (Windows) and `scripts/download-model.sh` (Unix) — idempotent, SHA-256 verification, pinned URL.

**Seed data (`scripts/seed-db.ts`):**

- `ModelArtifact` row seeded for `model_onnx_yolov8n_v1` with config: 640 input, confidence 0.25, NMS 0.45, 80 COCO classes.
- Pipeline updated to reference `model_onnx_yolov8n_v1` instead of `model_onnx_parking`.

**Tests:**

- 25 new CV worker tests covering letterbox (7), normalization (2), NMS (5), mock detector (4), ONNX runtime errors (2), mock pipeline endpoint (3), COCO classes (1).
- 2 new API tests: ONNX mode throws without CV_WORKER_URL, mock fallback works, prediction traceability.
- `test_thumbnail_contract_for_image_media` skipped (pre-existing, requires live MinIO).
