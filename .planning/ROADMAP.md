# Roadmap

Status date: 2026-05-01 (v1.0 milestone complete — starting v1.1)

Legend:

- Done: implemented and verified in the current codebase.
- Partial: visible scaffold or schema exists, but the real workflow is not complete.
- Planned: not implemented yet.

## Phase 0, Boot — Done

- Install GSD locally.
- Create product and design context.
- Create monorepo, infra files, and shared contracts.

## Phase 1, Foundation Vertical Slice — Done

- Web workbench shell with seeded VisionFlow data.
- API skeleton with health, OpenAPI, and demo project endpoints.
- Prisma domain schema.
- CV worker mock detector endpoint.
- Verification through typecheck, tests, and build.

## Phase 2, Media Ingestion — Done

- MinIO-backed upload API.
- Asset metadata, checksum dedupe, thumbnails.
- Media grid with progress, empty, and failure states.

Completed scope includes real multipart upload, MIME validation, deterministic SHA-256 object keys, project-scoped dedupe, Prisma metadata rows, audit rows, queued media processing jobs, CV thumbnail/frame job contracts, and web uploader states.

## Phase 3, Dataset Versioning - Done

- Immutable version rules.
- Dataset version assets and split summaries.
- Version timeline UI.

Completed scope includes shared dataset contracts, Nest dataset endpoints, Prisma and memory fallback service paths, duplicate assignment protection, locked-version mutation rejection, computed split summaries, and an upgraded Versions workbench.

## Phase 4, Annotation Engine - Done

- Bounding-box CRUD in image coordinates.
- Annotation canvas, label selector, keyboard actions, save queue.

Completed scope includes shared annotation contracts, Nest annotation CRUD with Prisma and memory fallback paths, project-scoped ownership checks, mutation audit rows, image-coordinate BBox validation/clamping, and a polished React annotation workbench with visible save queue states.

Post-phase UI polish is also complete for the current workbench shell: navigation rail, threshold control, dataset version builder, media asset table, annotation canvas framing, and mobile pipeline layout were audited across desktop, tablet, and mobile.

## Phase 5, Pipeline Builder - Done

- React Flow builder.
- Pipeline schema persistence.
- Graph validation and inspector.

Completed scope includes typed pipeline create/update/validate/list contracts, structured backend graph validation, Prisma and memory fallback persistence paths, API audit logging for persisted mutations, and an upgraded React Flow workbench with API sync, save/validate actions, selected-node parameter controls, validation issue highlighting, and mobile-friendly layout.

## Phase 6, Inference Orchestrator - Done

- BullMQ queue.
- Worker state machine.
- SSE or WebSocket progress.

Completed scope includes typed job creation contracts, locked dataset and persisted pipeline validation, BullMQ queue wiring, memory worker fallback, explicit job state transitions, SSE snapshot/log/progress/complete events, API job list/detail/create routes, and a Jobs workbench that follows backend progress without client-side simulation.

## Phase 7, CV Worker - Done

- Typed CV worker contracts.
- Deterministic mock detector dispatch.
- Explicit ONNX capability guard.
- Evaluation endpoint.

Completed scope includes shared CV worker request/response and evaluation contracts, FastAPI worker capability metadata, deterministic threshold-filtered mock detections, explicit ONNX unavailable/runtime/model errors without silent fallback, IoU-based evaluation metrics, Nest inference worker dispatch to the CV worker, Prisma prediction persistence when the database path is active, and Jobs logs that expose detector mode plus persisted prediction counts.

## Phase 8, Prediction Overlay And Evaluation - Done

- Job detail.
- Ground-truth comparison.
- Prediction overlay and per-job metric presentation.

Completed scope includes shared evaluation contracts (`EvaluationReport`, `PerClassMetric`, `PredictionSummary` schemas), `EvaluationService` with dual-path Prisma and memory fallback evaluation (IoU-based metrics computed in-process when no CV worker URL is configured), `CvWorkerClient.evaluate()` method with inline fallback, Nest API routes for `GET /inference-jobs/:jobId/evaluation`, `POST /inference-jobs/evaluate`, and `GET /inference-jobs/:jobId/predictions`, `PredictionOverlayCanvas` component with layered GT/prediction bounding-box rendering, toggle controls, and atmospheric canvas design, `EvaluationMetricsPanel` with color-coded metric blocks, TP/FP/FN count tiles, per-class table with collapsible rows, and `Run evaluation` CTA, and upgraded `JobsPanel` with three-column grid (job detail / overlay canvas / metrics panel) wired to API state.

## Phase 9, Timeline Replay And Motion Polish — Done

- BBox morphs.
- Dataset diffs.
- Node execution flow.

Completed scope includes `TimelineReplayPanel` with frame strip, draggable scrubber, spring-physics BBox morph engine using Framer Motion `layoutId`, playback controls with speed selector, GT/Pred overlay toggle, and reduced-motion fallback; `DatasetVersionDiff` with dual version selectors, color-coded diff engine (added/removed/changed), ghost outline + connector lines for changed geometry, summary strip with count badges, and self-contained demo simulation; `PipelineExecutionFlow` with 5-node sequential pipeline graph, pulsing node states, flowing edge particles via SVG `stroke-dashoffset` animation, timing strip, collapsible worker log panel, and auto-loop demo simulation; global CSS audit consolidating all inline `<style>` blocks into `index.css`, unified `inner-border-*` design system, refined `@keyframes scan` timing, and motion token consistency across `packages/motion`.

## Phase 10, Hardening - Done

- Tests, CI, README, one-command boot, demo script.

Completed scope includes unified Vitest workspace with per-package configs (`vitest.workspace.ts`), 118 tests across 4 packages (api, web, contracts, motion), GitHub Actions CI workflow (lint, typecheck, test, build) and E2E workflow, ESLint 9 flat config with TypeScript/React/Tailwind rules, Prettier with Tailwind plugin, `.editorconfig`, project README with quick start and feature overview, one-command boot scripts for Unix and Windows PowerShell, demo data validator script, and Playwright E2E test scaffolding (navigation, pipeline, annotation specs).

---

## v1.1 — Production Hardening & Real Vertical Slice

Goal: Convert the prototype into a production-hardened platform. Build one real end-to-end vertical slice: upload → annotate → run detector job → view prediction/evaluation → export COCO. Fix structural issues: no README, mixed memory/production paths, mock CV workers, monolithic frontend, missing security hardening, and untested production paths.

Target: One real dataset, one real annotation flow, one real async job, one real worker artifact, one real prediction persistence, one real evaluation report, one real export, one clean README, one clean demo video.

## Phase 11, README & Portfolio First Impression — Planned

**Requirements:**
- README.md at repo root with: VisionFlow Studio description, demo GIF or screenshots, architecture diagram, features implemented vs planned, local setup, env vars reference, run commands (web/api/cv-worker), run migrations, run tests, known limitations
- Architecture diagram showing Web App → NestJS API → Postgres/Prisma + MinIO + BullMQ/Redis → FastAPI CV Worker → Artifacts/Predictions/Evaluation Reports

**Depends on:** Phase 10

**Success criteria:**
1. Root README exists and renders correctly on GitHub
2. Architecture diagram shows the full data flow
3. Setup section allows a new developer to run the stack locally
4. Features section distinguishes implemented vs planned clearly
5. Demo screenshot or GIF is embedded or linked

## Phase 12, CI/CD Completeness — Planned

**Goal:** Close the CI pipeline and ensure every PR is type-checked, tested, and built before merge.

**Requirements:**
- GitHub Actions CI: `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `python -m pytest apps/cv-worker/tests`, `pnpm format --check`
- No merge without green CI

**Depends on:** Phase 11

**Success criteria:**
1. Every push and PR runs the full CI pipeline
2. `db:generate` is included so Prisma schema changes are validated
3. Python pytest suite runs in CI
4. Format check prevents style drift
5. CI failure blocks merge

## Phase 13, Security & Validation Hardening — Planned

**Goal:** Close the attack surface on a media upload platform. Every untrusted input must be validated, limited, and sanitized.

**Requirements:**
- Enable NestJS `ValidationPipe` globally: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- CORS explicit allowlist from `WEB_ORIGIN` env var
- Upload hardening: file size limit, MIME allowlist, magic number sniffing, checksum dedupe, never trust original filename, signed URL or controlled asset serving, reject corrupted image/video

**Depends on:** Phase 11

**Success criteria:**
1. `ValidationPipe` rejects payloads with unknown fields
2. CORS only allows configured origins
3. File uploads reject oversized files with 413
4. MIME type validated by both extension and magic bytes
5. Duplicate uploads (same checksum) return existing asset, not a new row
6. Signed URLs or a proxy serve assets — direct MinIO bucket is not public

## Phase 14, Repository Abstraction — Planned

**Goal:** Eliminate `if (process.env.DATABASE_URL)` logic from business services. Production and demo paths must be chosen at module setup, not scattered through service code.

**Requirements:**
- Introduce abstractions: `MediaRepository`, `StorageRepository`, `JobQueue`, `AuditLogger`
- Implementations: `PrismaMediaRepository`, `MemoryMediaRepository`, `MinioStorageRepository`, `LocalStorageRepository`, `BullMqJobQueue`, `NoopJobQueue`
- Demo mode selects adapters at module bootstrap — not inside service logic
- Annotation geometry JSON validated with Zod at API boundary
- Pipeline graph JSON validated with Zod at API boundary
- Job transitions enforced by a state machine
- Prediction traces `modelArtifactId`, `pipelineId`, `datasetVersionId`

**Depends on:** Phase 11

**Success criteria:**
1. No `if (process.env.*)` inside service logic
2. `PrismaMediaRepository` implements the same interface as `MemoryMediaRepository`
3. Adapter selection happens at module bootstrap
4. Zod validates annotation geometry JSON on create/update
5. Zod validates pipeline graph JSON on create/update
6. Job state transitions follow an explicit state machine (no invalid transitions)

## Phase 15, Real Media Processing — Planned

**Goal:** Make CV worker produce real artifacts — thumbnails and frame extraction — using Pillow/OpenCV/ffmpeg. Stop mocking successful media processing.

**Requirements:**
- `/cv/create-thumbnail` — real Pillow thumbnail generation, output artifact persisted to storage
- `/cv/extract-frames` — real ffmpeg/OpenCV frame extraction, output artifact persisted to storage
- BullMQ job payload contains only job ID (not blob)
- Worker consumer: fetch job by ID → transition QUEUED → RUNNING → process media → store derivative artifact → transition RUNNING → SUCCEEDED; on error → transition to FAILED, save error log, write audit row
- Never mock successful media processing; mock detector only

**Depends on:** Phase 14

**Success criteria:**
1. Thumbnail endpoint produces a real image artifact and persists to MinIO
2. Frame extraction endpoint produces real frame images and persists to MinIO
3. BullMQ job payload contains only the job ID
4. Worker transitions states explicitly (QUEUED → RUNNING → SUCCEEDED/FAILED)
5. Failed media processing writes an audit log with error details
6. Derivative artifacts are retrievable from storage

## Phase 16, Real Detector & Prediction Persistence — Planned

**Goal:** Run a real ONNX model inference pipeline with NMS, confidence threshold, and prediction persistence. Persist predictions with full traceability.

**Requirements:**
- `/cv/run-pipeline` — real ONNX Runtime execution with NMS, confidence threshold
- Prediction persistence: modelArtifactId + pipelineId + datasetVersionId traceable
- ONNX error cases handled explicitly (no silent fallback to mock)
- Deterministic mock detector retained for local development without ONNX

**Depends on:** Phase 15

**Success criteria:**
1. ONNX pipeline execution runs real model inference
2. NMS deduplicates overlapping predictions
3. Confidence threshold filters low-confidence predictions
4. Predictions are persisted to DB with full traceability
5. ONNX errors are surfaced with context, not silent fallback
6. Mock detector remains available for local dev without ONNX

## Phase 17, Frontend Feature Split — Planned

**Goal:** Break the monolithic App.tsx into feature modules. Rule: no UI file over 300-400 lines.

**Requirements:**
- `src/features/media/` — MediaPage, MediaUploader, MediaGrid, media.api.ts, media.types.ts
- `src/features/datasets/` — DatasetPage, DatasetVersionPanel, SplitAssigner
- `src/features/annotations/` — AnnotationWorkbench, CanvasStage, BoundingBoxLayer, LabelInspector
- `src/features/pipelines/` — PipelineBuilder, PipelineNode, PipelineInspector
- `src/features/inference/` — JobList, JobDetail, PredictionOverlay, EvaluationReport
- `src/shared/` — api/client, ui (Button, Panel, EmptyState, ErrorState), hooks, types
- `src/app/` — App.tsx (thin shell), AppShell.tsx, routes.tsx

**Depends on:** Phase 11

**Success criteria:**
1. App.tsx reduced to < 400 lines
2. Each feature module is independently importable
3. Shared UI components (Button, Panel, EmptyState, ErrorState) are reusable
4. Feature-specific API calls are co-located with feature code
5. No circular dependencies between feature modules

## Phase 18, Dataset Version Lock & Immutable Behavior — Planned

**Goal:** Enforce immutability of LOCKED dataset versions. Locked versions cannot be mutated; this is the foundation of reproducibility.

**Requirements:**
- When `DatasetVersion.status = LOCKED`, reject all mutation operations (assignments, annotations)
- COCO export is reproducible — same locked version always produces same export
- Annotation mutation creates audit log with version state
- API returns HTTP 409 Conflict on mutation attempt against locked version

**Depends on:** Phase 14

**Success criteria:**
1. Locked version rejects asset assignment with 409
2. Locked version rejects annotation create/update/delete with 409
3. COCO export from locked version is deterministic (no side effects)
4. Audit log records lock state changes
5. Dataset version lock behavior is documented in README

## Phase 19, Evaluation Report End-to-End — Planned

**Goal:** Deliver the complete evaluation pipeline — precision, recall, F1, IoU — end-to-end with real data.

**Requirements:**
- Run detector job on annotated dataset version
- Compare predictions against ground-truth annotations
- Compute per-class and overall precision, recall, F1, IoU
- Persist evaluation report to DB with job reference
- Display report in frontend: metrics panel, TP/FP/FN counts, per-class breakdown

**Depends on:** Phase 16, Phase 18

**Success criteria:**
1. Evaluation runs against real annotation + prediction data
2. Precision, recall, F1, IoU computed and persisted
3. Report displayed in frontend with clear metric visualization
4. Evaluation is reproducible from locked dataset version + model artifact
5. Per-class metrics show class-level performance

## Phase 20, E2E Playwright & Demo Video — Planned

**Goal:** Close the loop with a real E2E test covering the full vertical slice and a demo video for the README.

**Requirements:**
- Playwright E2E: upload image → create dataset → add image to version → draw bbox annotation → lock version → run detector job → view predictions → view evaluation report
- Test uses real database path, not memory fallback
- Demo GIF or screen recording embedded in README
- README demo section shows the full vertical slice in action

**Depends on:** Phase 19

**Success criteria:**
1. Full E2E flow works end-to-end with real services
2. Playwright test runs in CI
3. Demo GIF/screenshot in README
4. README demonstrates the real vertical slice
5. Repository is ready to be shown as a portfolio piece
