# Requirements

## Must Have

- Project shell with app navigation and technical workbench layout.
- API health endpoint and OpenAPI setup.
- Prisma schema covering project, media assets, dataset versions, annotation sets, annotations, model artifacts, pipelines, inference jobs, predictions, evaluation reports, and audit logs.
- Shared contracts for bounding boxes, pipeline validation, and inference job states.
- CV worker health endpoint and mock pipeline inference endpoint.
- Docker Compose for PostgreSQL, Redis, and MinIO.
- Web UI with visible states for media, dataset versioning, annotation, pipeline execution, jobs, and evaluation.

## Quality Gates

- Loading, empty, and error states exist in the web shell.
- Pipeline graph validation checks input/output count, cycles, node connectivity, and detector model configuration.
- Job state transitions are explicit.
- Reduced-motion users do not get decorative movement.
- Build/typecheck/test commands exist from the repo root.

## Deferred

- Real uploads to MinIO.
- Real BullMQ worker execution.
- ONNX model execution.
- YOLO/COCO export implementation.
- Playwright end-to-end suite.
