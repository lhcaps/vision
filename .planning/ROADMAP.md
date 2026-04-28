# Roadmap

Status date: 2026-04-29

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

## Phase 5, Pipeline Builder - Next / Partial

- React Flow builder.
- Pipeline schema persistence.
- Graph validation and inspector.

Current code has a seeded React Flow UI, mobile-friendly graph layout, and shared validation helpers. Persistence and backend validation remain planned.

## Phase 6, Inference Orchestrator — Partial

- BullMQ queue.
- Worker state machine.
- SSE or WebSocket progress.

Current code has a preview endpoint and simulated web progress. BullMQ, Redis worker execution, and streaming progress remain planned.

## Phase 7, CV Worker — Partial

- Mock detector stable response.
- ONNX detector path.
- Evaluation endpoint.

Current code has FastAPI health, mock pipeline, thumbnail, and frame extraction contracts. ONNX and evaluation remain planned.

## Phase 8, Prediction Overlay And Evaluation — Planned

- Job detail.
- Ground-truth comparison.
- IoU metrics, precision, recall, F1.

## Phase 9, Timeline Replay And Motion Polish — Planned

- BBox morphs.
- Dataset diffs.
- Node execution flow.

## Phase 10, Hardening — Planned

- Tests, CI, README, one-command boot, demo script.
