# Requirements

Status: v1.1 milestone active (phases 11-23)

## v1.1 Requirements

### README & Portfolio (P0)

- [ ] **PORT-01**: Root README.md exists with VisionFlow Studio description, demo GIF/screenshots, architecture diagram, features implemented vs planned, local setup, env vars, run commands (web/API/CV worker/Redis/MinIO/Postgres), migration commands, test commands, known limitations, security note
- [ ] **PORT-02**: Architecture diagram shows Web App → NestJS API → Postgres/Prisma + MinIO + BullMQ/Redis → FastAPI CV Worker → Artifacts + Predictions + Evaluation Reports
- [ ] **PORT-03**: Setup section allows a new developer to run the full stack locally from zero
- [ ] **PORT-04**: Features section clearly separates implemented, partial, and planned work
- [ ] **PORT-05**: Known limitations honestly state that v1.1 is hardening the real production path
- [ ] **PORT-06**: Demo screenshot or GIF is embedded or linked

### CI/CD (P0)

- [x] **CI-01**: GitHub Actions CI runs on every push and PR: `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `python -m pytest apps/cv-worker/tests` — Phase 12A
- [x] **CI-02**: CI must fail on type errors, format drift, test failure, or build failure — Phase 12A
- [x] **CI-03**: CI badge is visible in README — Phase 12A
- [x] **CI-04**: E2E workflow remains separate until real services are wired (production-path test suite) — Phase 12A

### Security & Validation (P1)

- [ ] **SEC-01**: NestJS `ValidationPipe` enabled globally with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- [ ] **SEC-02**: CORS uses explicit allowlist from `WEB_ORIGIN` env var
- [ ] **SEC-03**: File uploads enforce size limit and reject oversized files with HTTP 413
- [ ] **SEC-04**: MIME type validated by both extension and magic number sniffing
- [ ] **SEC-05**: Corrupted media is rejected before storage
- [ ] **SEC-06**: Never trust original filename — sanitize or generate new names
- [ ] **SEC-07**: Deterministic object keys from SHA-256 hash
- [ ] **SEC-08**: Duplicate uploads detected by checksum; existing asset returned, not new row
- [ ] **SEC-09**: Assets served via signed URLs or controlled API proxy — direct MinIO bucket not public
- [ ] **SEC-10**: Error responses are structured and safe — no internal paths, stack traces, or credentials
- [ ] **SEC-11**: Security hardening behavior documented in README

### Adapter Boundary (P1)

- [ ] **ABS-01**: `MediaRepository`, `DatasetRepository`, `AnnotationRepository`, `PipelineRepository`, `InferenceJobRepository`, `PredictionRepository`, `StorageRepository`, `JobQueue`, `AuditLogger` interfaces exist
- [ ] **ABS-02**: `Prisma*Repository` implementations use concrete Prisma client
- [ ] **ABS-03**: `Memory*Repository` implementations use in-memory stores
- [ ] **ABS-04**: `MinioStorageRepository` and `LocalStorageRepository` implement `StorageRepository`
- [ ] **ABS-05**: `BullMqJobQueue` and `NoopJobQueue` implement `JobQueue`
- [ ] **ABS-06**: `PrismaAuditLogger` and `MemoryAuditLogger` implement `AuditLogger`
- [ ] **ABS-07**: No `if (process.env.*)` inside business service method bodies
- [ ] **ABS-08**: Adapter selection happens at module bootstrap, not inside service logic
- [ ] **ABS-09**: Tests can swap implementations without patching service internals
- [ ] **ABS-10**: Production path can be tested without modifying app code

### Domain Invariants & State Machines (P1)

- [ ] **DOM-01**: Annotation geometry JSON validated with Zod at API boundary on create/update
- [ ] **DOM-02**: Pipeline graph JSON validated with Zod at API boundary on create/update
- [ ] **DOM-03**: Job state machine enforces: QUEUED → RUNNING → SUCCEEDED, QUEUED → RUNNING → FAILED, QUEUED → CANCELLED, RUNNING → CANCELLED
- [ ] **DOM-04**: Invalid state transitions throw explicit domain errors
- [ ] **DOM-05**: Prediction records include `modelArtifactId`, `pipelineId`, `datasetVersionId`, `inferenceJobId`, `mediaAssetId`
- [ ] **DOM-06**: Dataset version lock state checked before mutation operations
- [ ] **DOM-07**: Audit rows exist for: lock, annotation mutation, pipeline mutation, job start, job finish, job failure

### Observability & Health Checks (P1)

- [x] **OBS-01**: Request ID added to every API request (UUID or correlation ID) — Phase 15
- [x] **OBS-02**: Job correlation ID added to inference and media-processing jobs — Phase 15
- [x] **OBS-03**: Structured logs cover: API request start/end, upload accepted/rejected, job enqueued, job state transition, worker request/response, artifact persisted, prediction persisted, evaluation persisted — Phase 15
- [x] **OBS-04**: `/api/health/deep` checks API process, Postgres, Redis, MinIO, CV worker health — Phase 15
- [x] **OBS-05**: `/api/health/live` returns lightweight liveness check — Phase 15
- [x] **OBS-06**: Deep health check fails when any dependency is unavailable — Phase 15
- [x] **OBS-07**: README documents health endpoint URLs and behavior — Phase 15

### Pre-16 Completion Track (P1)

- [x] **PRE16-01**: Single `WorkbenchRuntimeState` model for frontend runtime truth — Phase 15.5
- [x] **PRE16-02**: `canRunInference` and `canRunEvaluation` selectors with explicit reason fields — Phase 15.5
- [x] **PRE16-03**: Job status drives pipeline execution, prediction overlay, evaluation UI — Phase 15.5
- [x] **PRE16-04**: FAILED job does not show RUNNING pipeline simultaneously — Phase 15.5
- [x] **PRE16-05**: `NextAction` model with label, description, severity, disabled, disabledReason — Phase 15.6
- [x] **PRE16-06**: Every disabled primary CTA exposes a reason via ActionHint or DisabledReason — Phase 15.6
- [x] **PRE16-07**: Failed job state includes recovery path via FailedJobErrorState — Phase 15.6
- [x] **PRE16-08**: Section-aware inspector router (Overview, Media, Datasets, Annotation, Pipeline, Jobs) — Phase 15.7
- [x] **PRE16-09**: Shared EmptyState component with evaluation/media/dataset/predictions variants — Phase 15.8
- [x] **PRE16-10**: Shared ErrorState component with FailedJobErrorState recovery — Phase 15.8
- [x] **PRE16-11**: Shared DisabledReason and ActionHint components — Phase 15.8
- [x] **PRE16-12**: Shared RowActions component with row/bulk action support — Phase 15.8
- [x] **PRE16-13**: Visual system hardening: focus-visible, semantic colors, consistent spacing — Phase 15.9
- [x] **PRE16-14**: Motion rules: page 120-180ms, selection spring, save 140-180ms — Phase 15.10
- [x] **PRE16-15**: `isPortfolioSafe` selector for portfolio/demo-safe state detection — Phase 15.10
- [x] **PRE16-16**: Regression tests for state contradictions (FAILED+RUNNING, no dataset+Run enabled, etc.) — Phase 15.10
- [x] **PRE16-17**: All gates pass: typecheck, test (63 tests), lint, format — Phase 15.10

### Frontend Split Minimum (P2)

- [ ] **UI-01**: `src/app/` directory exists with App.tsx, AppShell.tsx, routes.tsx
- [ ] **UI-02**: `src/shared/` directory exists with api/client.ts, ui/\*, hooks/, types/
- [ ] **UI-03**: `src/features/media/` has MediaPage, MediaUploader, MediaGrid, media.api.ts, media.types.ts
- [ ] **UI-04**: `src/features/inference/` has JobList, JobDetail, PredictionOverlay, EvaluationReport, inference.api.ts, inference.types.ts
- [ ] **UI-05**: Shared API client handles base URL, errors, and typed responses
- [ ] **UI-06**: Media API calls isolated in features/media (not in App.tsx)
- [ ] **UI-07**: Inference API calls isolated in features/inference (not in App.tsx)
- [ ] **UI-08**: Existing UI behavior preserved — no visual regression
- [ ] **UI-09**: No circular dependencies introduced

### Real Media Processing (P1)

- [ ] **MED-01**: `/cv/create-thumbnail` uses Pillow or OpenCV to read real source image and produce real thumbnail
- [ ] **MED-02**: `/cv/extract-frames` uses ffmpeg or OpenCV to read real source video and produce real frame images
- [ ] **MED-03**: Derivative artifacts written to MinIO with deterministic object keys
- [ ] **MED-04**: Derivative artifacts retrievable from web UI
- [ ] **MED-05**: BullMQ job payload contains only job ID — no blob data
- [ ] **MED-06**: Worker flow: fetch job → QUEUED→RUNNING → fetch source → process → write artifact → update DB → RUNNING→SUCCEEDED
- [ ] **MED-07**: Failure flow: transition to FAILED → save error details → write audit row → expose in UI
- [ ] **MED-08**: Worker never returns SUCCEEDED for mocked media processing
- [ ] **MED-09**: Integration test proves upload → thumbnail artifact end-to-end

### Dataset Locking & COCO Export (P2)

- [ ] **LOCK-01**: `DatasetVersion.status = LOCKED` rejects asset assignment with HTTP 409
- [ ] **LOCK-02**: `DatasetVersion.status = LOCKED` rejects annotation create/update/delete with HTTP 409
- [ ] **LOCK-03**: `DatasetVersion.status = LOCKED` rejects split mutation with HTTP 409
- [ ] **LOCK-04**: COCO export endpoint: `GET /datasets/:datasetId/versions/:versionId/export/coco`
- [ ] **LOCK-05**: COCO export includes: images, annotations, categories, metadata, project ID, dataset version ID, export checksum
- [ ] **LOCK-06**: COCO export is deterministic: stable ordering, stable IDs, no random fields, no side effects
- [ ] **LOCK-07**: Same locked version produces same COCO JSON on repeated exports
- [ ] **LOCK-08**: API integration test proves deterministic COCO export
- [ ] **LOCK-09**: README documents locked-version behavior and reproducibility guarantees

### Real ONNX Detector (P2)

- [x] **DET-01**: `/cv/run-pipeline` executes real ONNX Runtime inference with YOLOv8n ONNX — Phase 19
- [x] **DET-02**: Input shape is 640x640 with resize/letterbox preprocessing — Phase 19
- [x] **DET-03**: Postprocessing: decode boxes, apply confidence threshold (default 0.25), apply NMS (IoU 0.45), convert to original image coordinates — Phase 19
- [x] **DET-04**: Predictions persisted to DB with full traceability fields — Phase 19
- [x] **DET-05**: ONNX unavailable/runtime/model errors surfaced clearly in job logs — no silent fallback — Phase 19
- [x] **DET-06**: Mock detector available only when explicitly selected (not as fallback) — Phase 19
- [x] **DET-07**: ONNX model path/version is explicit in configuration — Phase 19
- [x] **DET-08**: API integration test proves prediction persistence on production database path — Phase 19

### Evaluation Report E2E (P2)

- [x] **EVAL-01**: Evaluation runs against locked dataset version, ground-truth annotations, and persisted predictions
- [x] **EVAL-02**: Algorithm: per-class match predictions to GT by IoU >= 0.5 threshold, compute TP/FP/FN
- [x] **EVAL-03**: Metrics computed: overall precision/recall/F1, mean IoU, per-class precision/recall/F1/TP/FP/FN
- [x] **EVAL-04**: Evaluation report persisted to DB
- [x] **EVAL-05**: Evaluation report displayed in frontend with metric visualization
- [x] **EVAL-06**: Prediction overlay shows ground truth and predictions together with toggle
- [x] **EVAL-07**: Evaluation report links back to job, dataset version, pipeline, and model artifact
- [x] **EVAL-08**: Same inputs produce same evaluation report (deterministic)
- [x] **EVAL-09**: API test validates the matching algorithm with deterministic fixtures

### Frontend Split Completion (P2)

- [ ] **FSC-01**: App.tsx is under 400 lines
- [ ] **FSC-02**: `src/features/datasets/` has DatasetPage, DatasetVersionPanel, SplitAssigner, DatasetLockBanner, CocoExportPanel, datasets.api.ts, datasets.types.ts
- [ ] **FSC-03**: `src/features/annotations/` has AnnotationWorkbench, CanvasStage, BoundingBoxLayer, LabelInspector, AnnotationToolbar, annotations.api.ts, annotations.types.ts
- [ ] **FSC-04**: `src/features/pipelines/` has PipelineBuilder, PipelineNode, PipelineInspector, PipelineValidationPanel, pipelines.api.ts, pipelines.types.ts
- [ ] **FSC-05**: `src/features/inference/` has JobList, JobDetail, PredictionOverlay, EvaluationReport, JobLogs, inference.api.ts, inference.types.ts
- [ ] **FSC-06**: `src/shared/ui/` has Button, Panel, EmptyState, ErrorState, LoadingState, MetricCard
- [ ] **FSC-07**: Every feature module independently importable
- [ ] **FSC-08**: No circular dependencies between feature modules
- [ ] **FSC-09**: Existing visual design preserved — no visual regression
- [ ] **FSC-10**: Frontend tests still pass after split

### Production-Path Test Suite (P2)

- [ ] **TEST-01**: API integration tests cover Prisma/Postgres path (not memory fallback)
- [ ] **TEST-02**: Tests cover dataset locking behavior
- [ ] **TEST-03**: Tests cover deterministic COCO export
- [ ] **TEST-04**: Tests cover upload validation (size, MIME, magic bytes, dedupe)
- [ ] **TEST-05**: Tests cover prediction persistence
- [ ] **TEST-06**: Tests cover evaluation persistence
- [ ] **TEST-07**: Storage integration tests cover upload, read, thumbnail derivative, frame derivative
- [ ] **TEST-08**: Queue integration tests cover enqueue, consume, retry, and failed job behavior
- [ ] **TEST-09**: CV worker tests cover real thumbnail generation, real frame extraction, mock deterministic output, ONNX unavailable error, ONNX runtime error
- [ ] **TEST-10**: Evaluation algorithm tested with deterministic fixtures
- [ ] **TEST-11**: Shared Zod schemas verified against API expectations (contract tests)
- [ ] **TEST-12**: CI runs the production-path test suite
- [ ] **TEST-13**: Memory fallback tests remain but are not the only coverage

### E2E & Demo (P2)

- [ ] **E2E-01**: Playwright E2E covers full vertical slice: upload → thumbnail → create dataset → add image → annotate → lock version → export COCO → run job → view predictions → run evaluation → view metrics → verify overlay
- [ ] **E2E-02**: Playwright uses real services: Postgres, Redis, MinIO, NestJS API, FastAPI CV worker, web app
- [ ] **E2E-03**: E2E test does not use memory fallback
- [ ] **E2E-04**: E2E fixtures are deterministic
- [ ] **E2E-05**: Full E2E flow passes locally
- [ ] **E2E-06**: Full E2E flow passes in CI or has documented CI-compatible workflow
- [ ] **E2E-07**: Demo GIF or video recorded from the same vertical slice
- [ ] **E2E-08**: Demo embedded or linked in README
- [ ] **E2E-09**: README demonstrates the real vertical slice clearly
- [ ] **E2E-10**: Repository is ready to show as a portfolio project

## Deferred

The following are explicitly out of scope for v1.1:

- Authentication and RBAC
- Multi-project collaboration and model registry UI
- Model training jobs, segmentation masks, keypoint annotation
- Active learning, dataset quality scoring, model comparison dashboard
- Batch export formats beyond COCO, cloud deployment guide, Docker image publishing
- Role-based audit views, advanced annotation shortcuts, human-in-the-loop review queues

## Traceability

| REQ-ID                    | Phase      | Status  |
| ------------------------- | ---------- | ------- |
| PORT-01 through PORT-06   | 11         | Done    |
| CI-01 through CI-04       | 12         | Done    |
| SEC-01 through SEC-11     | 13         | Pending |
| ABS-01 through ABS-10     | 14A        | Pending |
| DOM-01 through DOM-07     | 14B        | Pending |
| OBS-01 through OBS-07     | 15         | Done    |
| PRE16-01 through PRE16-17 | 15.5-15.10 | Done    |
| UI-01 through UI-09       | 16A        | Pending |
| MED-01 through MED-09     | 17         | Pending |
| LOCK-01 through LOCK-09   | 18         | Pending |
| DET-01 through DET-08     | 19         | Done    |
| EVAL-01 through EVAL-09   | 20         | Done    |
| FSC-01 through FSC-10     | 21         | Pending |
| TEST-01 through TEST-13   | 22         | Pending |
| E2E-01 through E2E-10     | 23         | Pending |

**Total:** 149 requirements | **Covered:** 55 | **Remaining:** 94
