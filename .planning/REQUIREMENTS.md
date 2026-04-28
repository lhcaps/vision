# Requirements

## Must Have

- Project shell with app navigation and technical workbench layout.
- API health endpoint and OpenAPI setup.
- Prisma schema covering project, media assets, dataset versions, annotation sets, annotations, model artifacts, pipelines, inference jobs, predictions, evaluation reports, and audit logs.
- Shared contracts for bounding boxes, pipeline validation, inference job states, and media ingestion responses.
- CV worker health endpoint, mock pipeline inference endpoint, thumbnail contract, and frame extraction contract.
- Docker Compose for PostgreSQL, Redis, and MinIO.
- Web UI with visible states for media, dataset versioning, annotation, pipeline execution, jobs, and evaluation.
- Real media upload path with MIME validation, SHA-256 checksum dedupe, deterministic MinIO object keys, Prisma metadata rows, audit rows, and queued processing jobs.

## Quality Gates

- Loading, empty, and error states exist in the web shell.
- Duplicate uploads are detected by project-scoped checksum.
- Unsupported media types fail before storage work.
- Upload failure must not create broken metadata rows.
- Media object keys are deterministic: `projects/{projectId}/originals/{sha256}.{ext}`.
- Pipeline graph validation checks input/output count, cycles, node connectivity, and detector model configuration.
- Job state transitions are explicit.
- Reduced-motion users do not get decorative movement.
- Build/typecheck/test commands exist from the repo root.

## Deferred

- Dataset versioning APIs and immutable version rules.
- Annotation CRUD and save queue.
- Pipeline persistence and API-side validation.
- Real BullMQ worker execution.
- ONNX model execution.
- Prediction overlay and evaluation metrics.
- YOLO/COCO export implementation.
- Playwright end-to-end suite.
