# Roadmap

## Phase 0, Boot

- Install GSD locally.
- Create product and design context.
- Create monorepo, infra files, and shared contracts.

## Phase 1, Foundation Vertical Slice

- Web workbench shell with seeded VisionFlow data.
- API skeleton with health, OpenAPI, and demo project endpoints.
- Prisma domain schema.
- CV worker mock detector endpoint.
- Verification through typecheck, tests, and build.

## Phase 2, Media Ingestion

- MinIO-backed upload API.
- Asset metadata, checksum dedupe, thumbnails.
- Media grid with progress, empty, and failure states.

## Phase 3, Dataset Versioning

- Immutable version rules.
- Dataset version assets and split summaries.
- Version timeline UI.

## Phase 4, Annotation Engine

- Bounding-box CRUD in image coordinates.
- Annotation canvas, label selector, keyboard actions, save queue.

## Phase 5, Pipeline Builder

- React Flow builder.
- Pipeline schema persistence.
- Graph validation and inspector.

## Phase 6, Inference Orchestrator

- BullMQ queue.
- Worker state machine.
- SSE or WebSocket progress.

## Phase 7, CV Worker

- Mock detector stable response.
- ONNX detector path.
- Evaluation endpoint.

## Phase 8, Prediction Overlay And Evaluation

- Job detail.
- Ground-truth comparison.
- IoU metrics, precision, recall, F1.

## Phase 9, Timeline Replay And Motion Polish

- BBox morphs.
- Dataset diffs.
- Node execution flow.

## Phase 10, Hardening

- Tests, CI, README, one-command boot, demo script.
