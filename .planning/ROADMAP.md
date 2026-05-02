# Roadmap

Status date: 2026-05-02
Current milestone: v1.1 — Production Hardening & Real Vertical Slice
Phase 15.10 complete — Pre-16 Completion Track done — next: Phase 16A Frontend Split Minimum

## Legend

- Done: implemented and verified in the current codebase.
- Partial: visible scaffold or schema exists, but the real production workflow is not complete.
- Planned: not implemented yet.
- Blocked: cannot start until dependency is complete.

---

# v1.0 — Prototype Foundation

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

## Phase 3, Dataset Versioning — Done

- Immutable version rules.
- Dataset version assets and split summaries.
- Version timeline UI.

Completed scope includes shared dataset contracts, Nest dataset endpoints, Prisma and memory fallback service paths, duplicate assignment protection, locked-version mutation rejection, computed split summaries, and an upgraded Versions workbench.

## Phase 4, Annotation Engine — Done

- Bounding-box CRUD in image coordinates.
- Annotation canvas, label selector, keyboard actions, save queue.

Completed scope includes shared annotation contracts, Nest annotation CRUD with Prisma and memory fallback paths, project-scoped ownership checks, mutation audit rows, image-coordinate BBox validation/clamping, and a polished React annotation workbench with visible save queue states.

Post-phase UI polish is also complete for the current workbench shell: navigation rail, threshold control, dataset version builder, media asset table, annotation canvas framing, and mobile pipeline layout were audited across desktop, tablet, and mobile.

## Phase 5, Pipeline Builder — Done

- React Flow builder.
- Pipeline schema persistence.
- Graph validation and inspector.

Completed scope includes typed pipeline create/update/validate/list contracts, structured backend graph validation, Prisma and memory fallback persistence paths, API audit logging for persisted mutations, and an upgraded React Flow workbench with API sync, save/validate actions, selected-node parameter controls, validation issue highlighting, and mobile-friendly layout.

## Phase 6, Inference Orchestrator — Done

- BullMQ queue.
- Worker state machine scaffold.
- SSE progress.

Completed scope includes typed job creation contracts, locked dataset and persisted pipeline validation, BullMQ queue wiring, memory worker fallback, explicit job transition scaffold, SSE snapshot/log/progress/complete events, API job list/detail/create routes, and a Jobs workbench that follows backend progress without client-side simulation.

## Phase 7, CV Worker — Done

- Typed CV worker contracts.
- Deterministic mock detector dispatch.
- Explicit ONNX capability guard.
- Evaluation endpoint.

Completed scope includes shared CV worker request/response and evaluation contracts, FastAPI worker capability metadata, deterministic threshold-filtered mock detections, explicit ONNX unavailable/runtime/model errors without silent fallback, IoU-based evaluation metrics, Nest inference worker dispatch to the CV worker, Prisma prediction persistence when the database path is active, and Jobs logs that expose detector mode plus persisted prediction counts.

## Phase 8, Prediction Overlay And Evaluation — Done

- Job detail.
- Ground-truth comparison.
- Prediction overlay and per-job metric presentation.

Completed scope includes shared evaluation contracts, `EvaluationService` with dual-path Prisma and memory fallback evaluation, `CvWorkerClient.evaluate()`, Nest API routes for job evaluation and predictions, `PredictionOverlayCanvas`, `EvaluationMetricsPanel`, and upgraded `JobsPanel` wired to API state.

## Phase 9, Timeline Replay And Motion Polish — Done

- BBox morphs.
- Dataset diffs.
- Node execution flow.

Completed scope includes `TimelineReplayPanel`, `DatasetVersionDiff`, `PipelineExecutionFlow`, global CSS audit, unified `inner-border-*` design system, refined animation timing, reduced-motion fallback, and motion token consistency across `packages/motion`.

## Phase 10, Prototype Hardening & Internal Tooling — Done

- Unified Vitest workspace.
- CI scaffold.
- ESLint and Prettier setup.
- One-command boot scripts.
- Demo data validator.
- Playwright E2E scaffolding.

Completed scope includes per-package Vitest configs, 118 tests across 4 packages, GitHub Actions CI scaffold, E2E workflow scaffold, ESLint 9 flat config, Prettier with Tailwind plugin, `.editorconfig`, quick-start documentation scaffold, boot scripts for Unix and Windows PowerShell, demo data validator script, and Playwright navigation/pipeline/annotation specs.

Note: v1.0 proves the prototype surface. v1.1 is responsible for proving the production path.

---

# v1.1 — Production Hardening & Real Vertical Slice

## Goal

Convert VisionFlow Studio from a strong prototype into a production-hardened local-first portfolio project with one real, reproducible, end-to-end computer vision workflow.

## Target Vertical Slice

```
upload image
→ generate real thumbnail artifact
→ create dataset version
→ add asset to version
→ draw bounding-box annotation
→ lock dataset version
→ export deterministic COCO
→ run real detector job
→ persist predictions
→ evaluate predictions against ground truth
→ view overlay and metrics
→ prove the full flow with Playwright and demo video
```

## Target Proof

v1.1 is complete only when the repository has:

- One real dataset.
- One real annotation flow.
- One real async job.
- One real worker artifact.
- One real prediction persistence path.
- One real evaluation report.
- One deterministic COCO export.
- One clean public README.
- One working local setup.
- One Playwright E2E test using real services.
- One demo GIF or video suitable for portfolio review.

## Phase 11, Public README & Portfolio First Impression — Done

**Goal:** Make the repository understandable and credible within the first 60 seconds.

**Requirements:**

- Root README.md with: VisionFlow Studio description, product screenshots or demo GIF, architecture diagram, feature overview, implemented vs planned matrix, local setup, env vars reference, run commands for web/API/CV worker/Redis/MinIO/Postgres, migration commands, test commands, known limitations, **security note stating this project is for local/private use and must not be exposed publicly without authentication and rate limiting**
- Architecture diagram showing: Web App → NestJS API → Postgres/Prisma + MinIO + BullMQ/Redis → FastAPI CV Worker → Artifacts + Predictions + Evaluation Reports

**Depends on:** Phase 10

**Success criteria:**

1. Root README.md exists and renders correctly on GitHub.
2. README explains what VisionFlow Studio is without requiring code reading.
3. Architecture diagram shows the complete data flow.
4. Setup section allows a new developer to run the stack locally.
5. Features section clearly separates implemented, partial, and planned work.
6. Known limitations honestly state that v1.1 is hardening the real production path.
7. Demo screenshot or GIF is embedded or linked.

**Completed scope:** Root README.md upgraded with Demo section, ASCII architecture diagram, Implementation Status table (14 done / 15 in progress / 5 out of scope), Database Migrations section, Testing section, Known Limitations (5 subsections), Contributing guide updated. docs/demo/README-DEMO.md created with complete demo recording instructions.

**Note:** v1.0 proves the prototype surface. v1.1 is responsible for proving the production path.

## Phase 12A, CI/CD Completeness — Done

**Completed scope:** GitHub Actions CI pipeline enhanced with job dependency graph: `lint → [typecheck, format, pytest, test] → build`. Added `pnpm db:generate` step before typecheck to validate Prisma schema. Added dedicated `format` job running `pnpm format:check` with `CI=true` to prevent style drift. Added `pytest` job using `actions/setup-python@v5` with Python 3.11, pip caching, and `pip install -r requirements-dev.txt`. Added `WEB_ORIGIN` env var to test job. CI badge added to README. All 6 success criteria met.

## Phase 12B, Local Stack & Seed Reliability — Done

**Completed scope:** Docker compose enhanced with MinIO bucket initialization via `minio-init` service (waits for MinIO health, then `mc mb local/visionflow-artifacts --ignore-existing`). MinIO healthcheck fixed from broken `mc ready local` to working `curl -f http://localhost:9000/minio/health/live`. Named Docker network `visionflow-network` for deterministic hostnames. Container names made explicit (`visionflow-postgres`, `visionflow-redis`, `visionflow-minio`) and aligned with boot scripts. Both Unix and Windows boot scripts enhanced with: Docker/pnpm prerequisite checks, PostgreSQL/Redis/MinIO health waits with retry loops, colored output, and trap for cleanup. Seed script enhanced with `--api` mode for creating demo data via API. `.env.example` completed with 8 sections and 16 documented variables.

## Phase 13, Security & Input Validation Hardening — Planned

**Goal:** Close the basic attack surface of a media upload platform.

**Requirements:**

- Enable global NestJS ValidationPipe: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- CORS explicit allowlist from `WEB_ORIGIN`.
- Upload hardening: file size limit, MIME allowlist, magic byte validation, reject corrupted images/videos, never trust original filename, deterministic object keys from SHA-256, project-scoped checksum dedupe, signed URL or controlled asset proxy, no public MinIO bucket requirement.
- Error responses must be structured and safe. API must not leak internal filesystem paths, stack traces, or storage credentials.

**Depends on:** Phase 11, Phase 12A

**Success criteria:**

1. Unknown fields in request payloads are rejected.
2. CORS only allows configured origins.
3. Oversized uploads return 413 Payload Too Large.
4. MIME type is validated by both declared type and magic bytes.
5. Corrupted media is rejected.
6. Duplicate upload returns existing asset, not a new row.
7. Assets are served through signed URLs or controlled API proxy.
8. Security behavior is documented in README.

## Phase 14A, Adapter Boundary Cleanup — Completed 2026-05-01

**Goal:** Remove environment branching from business services. Production and demo behavior must be selected at module bootstrap, not inside service logic.

**Requirements:**

- Introduce interfaces: `MediaRepository`, `DatasetRepository`, `AnnotationRepository`, `PipelineRepository`, `InferenceJobRepository`, `PredictionRepository`, `StorageRepository`, `JobQueue`, `AuditLogger`
- Implementations: `PrismaMediaRepository`, `MemoryMediaRepository`, `MinioStorageRepository`, `LocalStorageRepository`, `BullMqJobQueue`, `NoopJobQueue`, `PrismaAuditLogger`, `MemoryAuditLogger`
- Rules: No `if (process.env.DATABASE_URL)` inside business service methods. No storage implementation detail inside domain services. No queue implementation detail inside inference orchestration service. Demo mode selects adapters in module setup. Production mode selects Prisma, MinIO, BullMQ, and real audit logger.

**Depends on:** Phase 12

**Success criteria:**

1. Business services depend on interfaces, not concrete implementations.
2. No environment branching exists inside service method bodies.
3. Memory and Prisma implementations share the same contract.
4. Adapter selection happens at module bootstrap.
5. Tests can swap implementations without patching service internals.
6. Production path can be tested without modifying app code.

## Phase 14B, Domain Invariants & State Machines — Completed 2026-05-01

**Goal:** Make invalid domain states impossible or explicitly rejected.

**Requirements:**

- Validate annotation geometry JSON at API boundary with Zod.
- Validate pipeline graph JSON at API boundary with Zod.
- Enforce inference job transitions through a state machine: `QUEUED → RUNNING → SUCCEEDED`, `QUEUED → RUNNING → FAILED`, `QUEUED → CANCELLED`, `RUNNING → CANCELLED`. Reject invalid transitions.
- Prediction records must trace: `modelArtifactId`, `pipelineId`, `datasetVersionId`, `inferenceJobId`, `mediaAssetId`.
- Dataset version lock state must be checked before mutation.
- Audit logs must record important mutation events.

**Depends on:** Phase 14A

**Success criteria:**

1. Invalid annotation geometry is rejected before persistence.
2. Invalid pipeline graph is rejected before persistence.
3. Invalid job state transitions throw explicit domain errors.
4. Prediction traceability fields are present and populated.
5. Dataset version mutations respect version state.
6. Audit rows exist for lock, annotation mutation, pipeline mutation, job start, job finish, and job failure.

## Phase 15, Observability & Health Checks — Done

**Goal:** Make every job traceable across API, queue, worker, database, and storage.

**Requirements:**

- [x] Add request ID per API request.
- [x] Add job correlation ID for inference and media-processing jobs.
- [x] Structured logs for: API request start/end, upload accepted/rejected, job enqueued, job state transition, worker request, worker response, artifact persisted, prediction persisted, evaluation persisted.
- [x] Health endpoint checks: API process, Postgres, Redis, MinIO, CV worker.
- [x] Add `/api/health/deep` for full dependency checks.
- [x] Add `/api/health/live` for lightweight liveness.

**Depends on:** Phase 14A

**Success criteria:**

1. [x] A single job can be traced from upload to final evaluation.
2. [x] Logs include request ID and job ID.
3. [x] Deep health check fails when DB, Redis, MinIO, or CV worker is unavailable.
4. [x] Liveness check stays lightweight.
5. [x] README documents health endpoints.

**Artifacts:**
- `15-CONTEXT.md` — Technical decisions for logging library selection, request ID strategy, job correlation strategy, health check design
- `15-01-PLAN.md` — Wave 1: Structured logging + Request ID interceptor
- `15-02-PLAN.md` — Wave 2: Health endpoints
- `15-03-PLAN.md` — Wave 3: CV Worker observability
- `15-04-PLAN.md` — Wave 4: README documentation
- `15-REVIEW.md` — Code review findings (2 critical, 8 warnings, 8 info)
- `15-EVAL-REVIEW.md` — Evaluation review (7/7 requirements covered)

## Pre-16 Completion Track

**Goal:** Finish all local reliability, product-truth, UX, visual-system, motion, and regression-test work before starting Phase 16 frontend extraction. Phase 16 is intentionally out of scope for this track.

### Phase 12C, Dev Flow & Local Reliability Closeout — Done

**Goal:** Make the local stack and documented commands reliable before UX polish.

**Requirements:**

- [x] Fix Unix and Windows full-stack boot scripts.
- [x] Align Postgres container/user/database checks with Docker Compose.
- [x] Align CV worker port to 8000 everywhere.
- [x] Add `db:push`, `db:migrate`, and `db:studio` root scripts.
- [x] Ensure README setup commands match `package.json`.
- [x] Verify fresh-clone local boot.

**Success criteria:**

1. [x] `pnpm db:generate` passes.
2. [x] `pnpm db:push` passes.
3. [x] `pnpm dev:full` starts web, API, CV worker, and Docker infra.
4. [x] `pnpm dev:full:win` uses the same service names and ports.
5. [x] API health is reachable at `http://localhost:3000/api/health`.
6. [x] CV worker health is reachable at `http://localhost:8000/health`.

### Phase 15.5, Runtime Truth & State Consistency — Done

**Goal:** Remove contradictory frontend runtime states.

**Requirements:**

- [x] Add a single workbench runtime state model (`WorkbenchRuntimeState`).
- [x] Derive run and evaluation eligibility from the runtime state.
- [x] Job state drives pipeline execution, prediction overlay, and evaluation UI.
- [x] Failed jobs do not show running pipeline execution.
- [x] Failed jobs do not show fresh predictions unless clearly marked as cached/demo.
- [x] Inspector summary does not mix demo fallback state with API state.

**Artifacts:**

- `apps/web/src/shared/state/workbench-runtime.ts` — Single source of truth model
- `apps/web/src/shared/state/runtime-selectors.ts` — Eligibility selectors
- `apps/web/src/App.tsx` — Refactored to use runtime state and pass eligibility to panels

**Success criteria:**

1. [x] No screen shows `FAILED` job and `RUNNING` pipeline simultaneously.
2. [x] No screen claims a locked dataset with assets from demo state while API state says none exists.
3. [x] Run inference is disabled with a reason when no valid locked dataset exists.
4. [x] Evaluation is disabled with a reason unless a successful job and predictions exist.
5. [x] Fallback/mock/degraded state is explicitly labeled.

### Phase 15.6, Workflow Guidance & Primary Next Action — Done

**Goal:** Make every page explain the next correct user action.

**Requirements:**

- [x] Add a `NextAction` model.
- [x] Each page exposes one primary action.
- [x] Disabled primary actions explain why via `ActionHint` and `DisabledReason`.
- [x] Failed job state includes a recovery path via `FailedJobErrorState`.

**Artifacts:**

- `apps/web/src/shared/workflow/next-action.ts` — NextAction type and ActionSectionId
- `apps/web/src/shared/ui/DisabledReason.tsx` — DisabledReason and ActionDisabledNote
- `apps/web/src/shared/ui/ActionHint.tsx` — Inline action hints
- `apps/web/src/shared/ui/ErrorState.tsx` — FailedJobErrorState with recovery path

**Success criteria:**

1. [x] ShellHeader "Run" button is disabled with `ActionHint` explaining why.
2. [x] Overview "Queue job" button is disabled with inline reason when eligibility fails.
3. [x] Jobs page shows `FailedJobErrorState` with recovery path when job fails.
4. [x] Evaluation button in Jobs panel is disabled with `ActionHint` explaining why.
5. [x] All disabled primary CTAs expose a reason.

### Phase 15.7, Contextual Inspector — Done

**Goal:** Replace the global static inspector with section-aware and selection-aware inspectors.

**Requirements:**

- [x] Implement inspectors for Overview, Media, Datasets, Annotation, Pipeline, Jobs.
- [x] Inspector content matches active section and selected entity.
- [x] Remove the old global `InspectorPanel` from pages where it does not apply.

**Artifacts:**

- `apps/web/src/features/inspector/inspector.types.ts` — Inspector data types
- `apps/web/src/features/inspector/MediaInspector.tsx` — Asset detail inspector
- `apps/web/src/features/inspector/DatasetInspector.tsx` — Version/split inspector
- `apps/web/src/features/inspector/AnnotationInspector.tsx` — Box geometry inspector
- `apps/web/src/features/inspector/PipelineInspector.tsx` — Node params inspector
- `apps/web/src/features/inspector/JobInspector.tsx` — Job status/log inspector
- `apps/web/src/features/inspector/index.ts` — Barrel export

**Success criteria:**

1. [x] Media inspector shows selected asset/storage/processing data.
2. [x] Dataset inspector shows selected version/split/lock/export data.
3. [x] Annotation inspector shows selected box geometry/label/source/dirty state.
4. [x] Pipeline inspector shows selected node config/validation/model binding.
5. [x] Jobs inspector shows job status/log/prediction/evaluation data.

### Phase 15.8, UX States & Table Actions — Done

**Goal:** Make every empty, loading, error, and disabled state actionable.

**Requirements:**

- [x] Add shared EmptyState, ErrorState, DisabledReason, ActionHint, and RowActions components.
- [x] Every empty state explains what is missing and what to do next.
- [x] Every recoverable error includes a recovery CTA.
- [x] Media, dataset, and job surfaces include useful row/bulk actions.

**Artifacts:**

- `apps/web/src/shared/ui/EmptyState.tsx` — Generic and variant-specific empty states
- `apps/web/src/shared/ui/ErrorState.tsx` — ErrorState and FailedJobErrorState
- `apps/web/src/shared/ui/DisabledReason.tsx` — DisabledReason and ActionDisabledNote
- `apps/web/src/shared/ui/ActionHint.tsx` — Inline action hints
- `apps/web/src/shared/ui/RowActions.tsx` — RowActionDef and RowActions component

**Success criteria:**

1. [x] Evaluation empty state explains that a successful inference job is required.
2. [x] Media empty state points to upload.
3. [x] Dataset empty state points to draft/version creation.
4. [x] Failed job state points to the exact fix path.
5. [x] Media rows support view/copy/add/retry/delete actions as appropriate.
6. [x] Dataset assets support bulk selection and split assignment.

### Phase 15.9, Visual System Hardening — Done

**Goal:** Preserve the dark technical identity while making color, spacing, focus states, and density production-grade.

**Requirements:**

- [x] CSS design tokens already established (OKLCH tokens, semantic colors).
- [x] All interactive controls have focus-visible states.
- [x] Status colors are semantic and consistent (signal=success, scan=active, amber=warning, red=failed).
- [x] Table density is consistent across media, datasets, and jobs.
- [x] Chips and status pills share one visual language.
- [x] Reduced-motion behavior is handled via `@media (prefers-reduced-motion: reduce)`.

**Artifacts:**

- `apps/web/src/index.css` — Comprehensive design system with OKLCH tokens

**Success criteria:**

1. [x] All interactive controls have focus-visible states.
2. [x] Status colors are semantic and consistent.
3. [x] Table density is consistent across media, datasets, and jobs.
4. [x] Chips and status pills share one visual language.
5. [x] UI remains polished at mobile, tablet, and desktop widths.

### Phase 15.10, Motion, Portfolio Mode & Regression Tests — Done

**Goal:** Make motion purposeful and protect the polished UX from regression.

**Requirements:**

- [x] Remove unnecessary page/card load animations (kept only purposeful microinteractions).
- [x] Motion only for meaningful state transitions (page: 120-180ms, selection: spring, save: 140-180ms, graph: 120-160ms).
- [x] Add `isPortfolioSafe` selector for portfolio/demo-safe state detection.
- [x] Add regression tests for major state contradiction cases.

**Artifacts:**

- `apps/web/src/shared/state/runtime-selectors.test.ts` — 32 regression tests covering 7 rules
- `apps/web/src/shared/state/runtime-selectors.ts` — `isPortfolioSafe` selector

**Success criteria:**

1. [x] Failed job does not show running pipeline execution.
2. [x] Failed job disables evaluation with a reason.
3. [x] No locked dataset disables Run with a reason.
4. [x] Media page inspector does not show annotation geometry unless relevant.
5. [x] Pipeline page inspector shows selected node parameters.
6. [x] Portfolio screenshot mode avoids contradictory fallback/demo states.
7. [x] Typecheck, lint, and web tests pass.

### Pre-16 Gate

**Status:** PASSED

All gates confirmed passing:

- [x] `pnpm db:generate` passes.
- [x] `pnpm db:push` passes.
- [x] `pnpm --filter @visionflow/api typecheck` passes.
- [x] `pnpm --filter @visionflow/web typecheck` passes.
- [x] `pnpm --filter @visionflow/web test` passes (63 tests).
- [x] `pnpm lint` passes.
- [x] `pnpm format:check` passes.

**Phase 16 may now begin.**

**Out of scope for Pre-16 track:**
- Do not split App.tsx into full app/routes/features architecture.
- Do not perform Phase 16 frontend extraction.
- Do not implement real media processing, real ONNX, or new ML features.

## Patch 15.10.1, Pre-merge App Wiring Fix — Done

**Goal:** Wire runtime state and contextual inspectors to real App state before Phase 16.

**Requirements:**

- [x] Derive `runtimeState` from `job.status`, `job.source`, `predictions`, `evaluationReport` — not from `createInitialRuntimeState`.
- [x] Header Run button `disabled` includes `!inferenceEligibility.ok`.
- [x] `PipelinePanel` selected node synced to `InspectorRouter` via lifted state.
- [x] `InspectorRouter` extracted to `features/inspector/InspectorRouter.tsx`.
- [x] `selectedMediaAssetId` and `selectedDatasetVersionId` tracked at App level; real data passed to `MediaInspector` and `DatasetInspector`.
- [x] Fallback inspector no longer references `demoSnapshot` for project/dataset/asset fields.

**Artifacts:**

- `apps/web/src/features/inspector/InspectorRouter.tsx` — extracted router component
- `apps/web/src/features/inspector/index.ts` — barrel export updated
- `apps/web/src/App.tsx` — runtimeState derive, lifted pipeline/dataset/media state, inspector data wiring

**P0: API Cache Fix Patch — Done**

**Goal:** Prevent 304 Not Modified responses from breaking the frontend `fetch` wrapper.

**Requirements:**

- [x] `apps/web/src/lib/http.ts`: `apiJson` now sends `cache: 'no-store'` and `Cache-Control: no-cache`.
- [x] `apps/api/src/main.ts`: disabled ETag generation and added explicit no-cache middleware for all API responses.

**Gates:** All 4 packages typecheck + lint pass. Web tests: 63/63 pass.

## Phase 16A, Frontend Split Minimum — Planned

**Goal:** Reduce risk before real worker and detector work by extracting high-change areas from the monolithic frontend.

**Requirements:**

- Create initial frontend structure: `src/app/` (App.tsx, AppShell.tsx, routes.tsx), `src/shared/` (api/client.ts, ui/\*, hooks/, types/), `src/features/media/` (MediaPage, MediaUploader, MediaGrid, media.api.ts, media.types.ts), `src/features/inference/` (JobList, JobDetail, PredictionOverlay, EvaluationReport, inference.api.ts, inference.types.ts)
- Scope control: This phase only extracts media and inference first. Avoid visual redesign. Preserve existing UX.

**Depends on:** Phase 11

**Success criteria:**

1. App.tsx is reduced significantly.
2. Media API calls are isolated in features/media.
3. Inference API calls are isolated in features/inference.
4. Shared API client handles base URL, errors, and typed responses.
5. Existing UI behavior is preserved.
6. No circular dependencies are introduced.

## Phase 17, Real Media Processing — Planned

**Goal:** Make the CV worker produce real derivative artifacts. Stop returning fake successful media-processing results.

**Architecture rule: API is source of truth for database state.** The FastAPI CV worker reads source objects and writes derivative objects to MinIO, but never writes to the PostgreSQL database. A NestJS BullMQ consumer owns all database transitions.

**Data ownership:**

- NestJS API: owns job metadata, job state transitions, derivative metadata persistence, audit logs.
- FastAPI CV worker: reads source object keys from job payload, writes derivative artifacts to MinIO, returns artifact metadata (objectKey, width, height, checksum) to the API consumer.

**Worker contract:**

- NestJS BullMQ consumer dispatches job to FastAPI worker with `{ jobId, sourceObjectKey, operation }`.
- FastAPI worker fetches source from MinIO, processes media, writes derivative to MinIO, returns `{ objectKey, width, height, checksum }`.
- NestJS consumer persists derivative metadata, transitions job state, writes audit log.

**Requirements:**

- `/cv/create-thumbnail`: Uses Pillow or OpenCV, reads a real source image from MinIO, produces a real thumbnail image, writes derivative artifact to MinIO, returns artifact metadata.
- `/cv/extract-frames`: Uses ffmpeg or OpenCV, reads a real source video from MinIO, produces real frame images, writes frame artifacts to MinIO, returns artifact metadata list.
- BullMQ payload contains only job ID and source object key — no blob data.
- Worker flow: NestJS consumer enqueues job → FastAPI reads source → processes → writes derivative → returns metadata → NestJS consumer updates DB → transitions job to SUCCEEDED.
- Failure flow: NestJS consumer transitions job to FAILED → saves error details → writes audit row → exposes failure in UI.

**Depends on:** Phase 14A, Phase 14B, Phase 15

**Success criteria:**

1. Thumbnail endpoint produces a real image artifact.
2. Frame extraction endpoint produces real frame images.
3. Derivative artifacts are persisted to MinIO.
4. Derivative artifacts are retrievable from the web UI.
5. Queue payload contains only job ID and source object key — no blob data.
6. NestJS consumer owns all DB writes — FastAPI worker has no database access.
7. FastAPI returns artifact metadata; NestJS persists it.
8. Failed media processing writes structured error details via NestJS audit log.
9. Worker never returns SUCCEEDED for mocked media processing.
10. Integration test proves upload → thumbnail artifact end-to-end with real services.

## Phase 18, Dataset Locking & Deterministic COCO Export — Planned

**Goal:** Make locked dataset versions reproducible and exportable.

**Requirements:**

- When `DatasetVersion.status = LOCKED`, reject: asset assignment, asset removal, annotation create/update/delete, split mutation. Return 409 Conflict for locked-version mutation attempts.
- Implement COCO export endpoint: `GET /datasets/:datasetId/versions/:versionId/export/coco`.
- COCO export includes: images, annotations, categories, dataset metadata, project ID, dataset version ID, export checksum.
- Export must be deterministic: stable ordering, stable IDs or stable mapping, no random fields, no side effects.
- README documents locked-version behavior and export behavior.

**Depends on:** Phase 14B

**Success criteria:**

1. Locked version rejects asset assignment with 409.
2. Locked version rejects annotation create/update/delete with 409.
3. COCO export works for locked dataset versions.
4. Same locked version produces deterministic JSON.
5. COCO export includes images, annotations, and categories.
6. Export checksum is stable for unchanged data.
7. API integration test proves deterministic export.
8. README documents reproducibility guarantees.

## Phase 19, Real ONNX Detector & Prediction Persistence — Planned

**Goal:** Run a real detector pipeline and persist predictions with full traceability.

**Detector target:**

- Default model: YOLOv8n ONNX or another pinned lightweight detector.
- Input shape: 640x640.
- Preprocess: Load image, resize or letterbox, normalize, convert to model tensor.
- Postprocess: Decode boxes, apply confidence threshold, apply NMS, convert boxes back to original image coordinates.
- Default thresholds: Confidence 0.25, NMS IoU 0.45.

**Requirements:**

- `/cv/run-pipeline` executes real ONNX Runtime inference.
- ONNX model path/version is explicit.
- ONNX unavailable/runtime/model errors are surfaced clearly.
- No silent fallback from real mode to mock mode.
- Deterministic mock detector remains available for local development.
- Predictions persisted with: `inferenceJobId`, `mediaAssetId`, `datasetVersionId`, `pipelineId`, `modelArtifactId`, class label, confidence, bbox coordinates in image space, raw detector metadata where useful.
- **Model artifact policy:** Model is NOT committed to the repo if > 10MB. Model downloaded via deterministic script from a pinned URL. `ModelArtifact` row stores: name, version, runtime, input shape (H×W), and SHA-256 checksum. On load, checksum is verified before inference. CI uses a small fixture ONNX or mocked ONNX test mode — no internet download required in CI.
- **Model download script:** `scripts/download-model.sh` / `.ps1` downloads YOLOv8n from `https://github.com/...` (Ultralytics CDN) with pinned version and SHA-256 verification. Script is idempotent and prints the checksum on success.

**Depends on:** Phase 17, Phase 18

**Success criteria:**

1. ONNX detector runs on at least one real image.
2. NMS removes overlapping duplicate predictions.
3. Confidence threshold filters low-confidence predictions.
4. Predictions are persisted to DB.
5. Predictions are traceable to job, model, pipeline, dataset version, and media asset.
6. ONNX errors are explicit and visible in job logs.
7. Mock detector remains available only when explicitly selected.
8. Model artifact has name, version, runtime, input shape, and SHA-256 checksum.
9. Model loading path is documented and reproducible from a fresh clone.
10. API integration test proves prediction persistence on the production database path.

## Phase 20, Evaluation Report End-to-End — Planned

**Goal:** Compare real predictions against ground-truth annotations and persist reproducible metrics.

**Evaluation algorithm:**

- For each class: sort predictions by confidence descending; match each prediction to an unmatched ground-truth box of the same class; match is valid only when IoU >= threshold; one GT box can match at most one prediction; unmatched predictions count as false positives; unmatched GT boxes count as false negatives.
- Default thresholds: IoU 0.5, confidence inherited from inference job config.
- Metrics: Overall precision, recall, F1, mean IoU, per-class precision/recall/F1/TP/FP/FN.

**Requirements:**

- Evaluation runs against: locked dataset version, persisted ground-truth annotations, persisted predictions, specific inference job, specific model artifact.
- Evaluation report is persisted to DB.
- Evaluation report is displayed in frontend.
- Evaluation is reproducible from locked dataset version + model artifact + pipeline config.

**Depends on:** Phase 19

**Success criteria:**

1. Evaluation runs against real annotations and real predictions.
2. Overall metrics are computed and persisted.
3. Per-class metrics are computed and persisted.
4. TP/FP/FN counts are visible in UI.
5. Prediction overlay shows ground truth and predictions together.
6. Evaluation report links back to job, dataset version, pipeline, and model artifact.
7. Same inputs produce same evaluation report.
8. API test validates the matching algorithm.

## Phase 21, Frontend Feature Split Completion — Planned

**Goal:** Finish the frontend architecture cleanup and remove the monolithic app structure.

**Requirements:**

- Final frontend structure: `src/app/` (App.tsx, AppShell.tsx, routes.tsx), `src/shared/` (api/client.ts, ui/\*, hooks/, types/, utils/), `src/features/media/`, `src/features/datasets/` (DatasetPage, DatasetVersionPanel, SplitAssigner, DatasetLockBanner, CocoExportPanel, datasets.api.ts, datasets.types.ts), `src/features/annotations/` (AnnotationWorkbench, CanvasStage, BoundingBoxLayer, LabelInspector, AnnotationToolbar, annotations.api.ts, annotations.types.ts), `src/features/pipelines/` (PipelineBuilder, PipelineNode, PipelineInspector, PipelineValidationPanel, pipelines.api.ts, pipelines.types.ts), `src/features/inference/` (JobList, JobDetail, PredictionOverlay, EvaluationReport, JobLogs, inference.api.ts, inference.types.ts)
- Rules: No UI file over 400 lines. Feature-specific API calls stay inside feature modules. Shared UI components must be generic. No circular imports. No visual regression.

**Depends on:** Phase 20

**Success criteria:**

1. App.tsx is under 400 lines.
2. Every feature module is independently importable.
3. Shared UI components are reused across features.
4. API calls are co-located with their feature.
5. No circular dependencies exist.
6. Existing visual design is preserved.
7. Frontend tests still pass.

## Phase 22A, Test Harness & Fixtures — Planned

**Goal:** Establish a deterministic test infrastructure before building real features. Without a harness, Phase 22 production-path tests become extremely painful.

**Requirements:**

- `docker compose test-stack.yml`: Postgres, Redis, MinIO seeded with deterministic fixtures — runs independently of dev stack.
- Deterministic image fixture: a known 640x480 RGB JPEG image committed to the repo (e.g. `fixtures/sample.jpg`, < 100KB). Must produce deterministic SHA-256 and thumbnail across runs.
- Deterministic video fixture: a known 5-frame MP4 committed to the repo (e.g. `fixtures/sample.mp4`). Must produce deterministic frame count and frame hashes.
- Seeded MinIO bucket: `fixtures/` directory pre-loaded into the test bucket so tests don't depend on network.
- Redis test config: isolated Redis database for queue tests.
- `scripts/test-stack-up.sh` / `.ps1`: one-command test infrastructure boot.
- `scripts/test-stack-down.sh` / `.ps1`: teardown.
- `scripts/test-stack-reset.sh` / `.ps1`: reset state between test runs.
- Pytest fixtures for CV worker: fast unit fixtures (mock ONNX), slow integration fixtures (real YOLOv8n if available).
- API integration test bootstrap: factory helpers to create project/dataset/media/annotation/pipeline in tests.
- Test environment variables: `TEST_DATABASE_URL`, `TEST_MINIO_ENDPOINT`, `TEST_REDIS_URL` — no shared state with dev.

**Depends on:** Phase 14A

**Success criteria:**

1. `docker compose -f infra/test-stack.yml up` starts Postgres, Redis, MinIO with fixtures in < 30s.
2. `pnpm test:integration` runs against the test stack.
3. `python -m pytest apps/cv-worker/tests` runs against the test worker.
4. Deterministic image fixture produces the same SHA-256 and thumbnail output across runs.
5. Test stack is isolated from dev stack (different ports, different databases).
6. CI runs test stack provisioning before running production-path tests.

## Phase 22B, Production-Path Test Suite — Planned

**Goal:** Prove the real path, not just memory/demo fallback.

**Requirements:**

- Add tests for: API integration (Prisma/Postgres path, dataset locking, COCO export, upload validation, prediction persistence, evaluation persistence), storage integration (upload object, read object, persist thumbnail derivative, persist extracted frame derivative, signed URL or controlled proxy behavior), queue integration (enqueue media job, enqueue inference job, worker consumes job, job retry behavior, failed job behavior), CV worker tests (real thumbnail generation, real frame extraction, mock detector deterministic output, ONNX unavailable error, ONNX runtime error, evaluation matching algorithm), contract tests (shared Zod schemas match API expectations, frontend consumes typed API responses).

**Depends on:** Phase 17, Phase 18, Phase 19, Phase 20, Phase 22A

**Success criteria:**

1. Production database path is covered by tests.
2. Storage path is covered by tests.
3. Queue path is covered by tests.
4. CV worker real media-processing path is covered by tests.
5. Evaluation algorithm is covered by deterministic fixtures.
6. Memory fallback tests remain, but are not the only coverage.
7. CI runs the production-path test suite via Phase 22A harness.

## Phase 23, Full E2E Playwright & Demo Video — Planned

**Goal:** Close the loop with a real end-to-end test and portfolio-ready demo.

**E2E flow:**

```
open app → create or select project
→ upload image
→ wait for real thumbnail artifact
→ create dataset
→ add image to dataset version
→ draw bounding-box annotation
→ lock dataset version
→ export COCO
→ create or select detector pipeline
→ run detector job
→ watch SSE job progress
→ view persisted predictions
→ run evaluation
→ view metrics report
→ verify overlay displays GT and predictions
```

**Requirements:**

- Playwright uses real services: Postgres, Redis, MinIO, NestJS API, FastAPI CV worker, web app.
- Test must not use memory fallback.
- Test fixtures are deterministic.
- Demo GIF or video is recorded from the same vertical slice.
- README embeds or links the demo.
- README includes final feature matrix and known limitations.

**Depends on:** Phase 22B

**Success criteria:**

1. Full E2E flow passes locally.
2. Full E2E flow passes in CI or documented CI-compatible workflow.
3. E2E test uses real database path.
4. E2E test uses real storage path.
5. E2E test uses real queue path.
6. Demo GIF or video is embedded in README.
7. README demonstrates the real vertical slice clearly.
8. Repository is ready to show as a portfolio project.
9. Fresh clone → setup → run demo path is documented and verified.

## v1.1 Completion Definition

v1.1 is complete only when all of the following are true:

**Product proof:**

- User can upload a real image.
- System generates a real thumbnail artifact.
- User can create a dataset version.
- User can add image to dataset version.
- User can draw a bounding-box annotation.
- User can lock the dataset version.
- System rejects mutation on locked versions.
- User can export deterministic COCO.
- User can run a real detector job.
- System persists predictions.
- User can view prediction overlay.
- User can run evaluation.
- System persists evaluation report.
- User can inspect precision, recall, F1, IoU, TP, FP, FN.

**Engineering proof:**

- No production service relies on hidden memory fallback.
- No business service contains environment branching.
- Queue payloads contain IDs, not blobs.
- CV worker produces real media artifacts.
- ONNX mode never silently falls back to mock mode.
- Job state transitions are explicit.
- Prediction traceability is complete.
- Locked dataset versions are reproducible.
- COCO export is deterministic.
- Production path is covered by tests.
- Full vertical slice is covered by Playwright.

**Portfolio proof:**

- README is clean, honest, and visual.
- Architecture diagram is clear.
- Demo video or GIF exists.
- Setup works from a fresh clone.
- CI is green.
- Known limitations are documented.
- The repo can be shown without verbal explanation.

## Recommended Execution Order

| #   | Phase                                       | Blocked By                                        |
| --- | ------------------------------------------- | ------------------------------------------------- |
| 11  | Public README & Portfolio First Impression  | Phase 10                                          |
| 12A | CI/CD Completeness                          | Phase 10                                          |
| 12B | Local Stack & Seed Reliability              | Phase 12A                                         |
| 12C | Dev Flow & Local Reliability Closeout          | Phase 12A                                         |
| 13  | Security & Input Validation Hardening       | Phase 11, Phase 12A                               |
| 14A | Adapter Boundary Cleanup                    | Phase 12A                                         |
| 14B | Domain Invariants & State Machines          | Phase 14A                                         |
| 15  | Observability & Health Checks               | Phase 14A                                         |
| 15.5| Runtime Truth & State Consistency          | Phase 15                                           |
| 15.6| Workflow Guidance & Primary Next Action   | Phase 15.5                                         |
| 15.7| Contextual Inspector                      | Phase 15.5                                         |
| 15.8| UX States & Table Actions                 | Phase 15.6, Phase 15.7                             |
| 15.9| Visual System Hardening                  | Phase 15.8                                         |
| 15.10| Motion, Portfolio Mode & Regression Tests | Phase 15.9                                         |
| 16A | Frontend Split Minimum                    | Phase 15.10                                        |
| 17  | Real Media Processing                     | Phase 14A, Phase 14B, Phase 15                    |
| 18  | Dataset Locking & Deterministic COCO Export | Phase 14B                                         |
| 19  | Real ONNX Detector & Prediction Persistence | Phase 17, Phase 18                                |
| 20  | Evaluation Report End-to-End                | Phase 19                                          |
| 21  | Frontend Feature Split Completion           | Phase 20                                          |
| 22A | Test Harness & Fixtures                     | Phase 14A                                         |
| 22B | Production-Path Test Suite                  | Phase 17, Phase 18, Phase 19, Phase 20, Phase 22A |
| 23  | Full E2E Playwright & Demo Video            | Phase 22B                                         |

## Brutal Scope Rules

These are hard rules for v1.1:

- No new flashy UI features until the real vertical slice works.
- No new animation work unless it improves clarity of the real workflow.
- No training pipeline in v1.1.
- No multi-user RBAC in v1.1.
- No billing, teams, or enterprise features in v1.1.
- No segmentation or keypoint annotation in v1.1.
- No silent fallback from real mode to mock mode.
- No fake successful worker status.
- No public MinIO bucket requirement.
- No direct database writes from the Python CV worker unless explicitly designed and documented. NestJS API owns all database transitions.
- No unpinned model artifact in ONNX mode. Every model artifact has a checksum and a reproducible loading path.
- No hidden external download requirement in CI. ONNX model in CI is either a small fixture or mocked — no internet download at test time.
- No fresh-clone setup that depends on private local files or network-dependent model downloads at startup.
- No claim of production readiness until E2E real-service flow passes.
- v1.1 proves the production path. v1.2 handles the rest.

## v1.2 Backlog

Explicitly out of scope for v1.1:

- Authentication.
- RBAC.
- Multi-project collaboration.
- Model registry UI.
- Training jobs.
- Segmentation masks.
- Keypoint annotation.
- Active learning.
- Dataset quality scoring.
- Model comparison dashboard.
- Batch export formats beyond COCO.
- Cloud deployment guide.
- Docker image publishing.
- Role-based audit views.
- Advanced annotation shortcuts.
- Human-in-the-loop review queues.

## Final v1.1 Positioning

After v1.1, VisionFlow Studio should be positioned as:

**A production-hardened local-first computer vision workbench prototype for dataset versioning, bounding-box annotation, async inference, prediction overlay, deterministic COCO export, and reproducible evaluation.**

Not: A complete Roboflow replacement. Not: A production SaaS platform. Not: A training platform.

**The winning message is simple:**

> This repo proves I can design and build a serious fullstack CV platform slice: typed contracts, real storage, real queue, real worker, real detector, real evaluation, reproducible dataset versioning, and clean product UI.
