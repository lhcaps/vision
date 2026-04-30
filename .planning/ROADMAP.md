# Roadmap

Status date: 2026-05-01

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

## Phase 9, Timeline Replay And Motion Polish - Planned

- BBox morphs.
- Dataset diffs.
- Node execution flow.

## Phase 10, Hardening - Planned

- Tests, CI, README, one-command boot, demo script.
