# Architecture Overview

VisionFlow Studio is organized as a vertical-slice monorepo.

```text
apps/
  web/        React workbench for media, datasets, annotation, pipelines, jobs
  api/        NestJS API with OpenAPI and Prisma-backed modules
  cv-worker/  FastAPI worker for mock and ONNX inference
packages/
  contracts/  Zod DTOs, geometry helpers, pipeline validation, state machines
  motion/     Motion tokens and state recipes
infra/
  prisma/     Domain schema
  docker-compose.yml
```

The V1 data path is:

```text
MediaAsset -> DatasetVersion -> AnnotationSet -> Pipeline -> InferenceJob -> Prediction -> EvaluationReport
```

Queue payloads carry IDs. Large media and artifacts live in object storage.

## Current Implementation Status

- Phase 0 and Phase 1 are complete: the monorepo, web shell, API skeleton, CV worker, shared contracts, Prisma schema, and Docker infrastructure are in place.
- Phase 2 is complete for the ingestion slice: uploaded media is validated, hashed, stored in MinIO, deduped by project checksum, written to Prisma metadata tables, audited, and paired with a queued media processing job.
- Phase 3 is complete for dataset versioning: mutable dataset identities produce immutable version candidates, assets are assigned with split summaries, and locked versions reject mutation.
- Phase 4 is complete for annotation: BBox annotations have shared contracts, project-scoped API CRUD, memory fallback, mutation audit logs, and a React workbench with image-coordinate drawing, labels, keyboard actions, and save queue states.
- Phase 5 is complete for pipeline building: pipeline definitions have shared contracts, structured graph validation, API persistence, memory fallback, mutation audit logs, and a React Flow workbench with API sync, save/validate actions, selected-node parameter controls, and validation issue highlighting.
- The current web shell has passed a cross-screen UI polish audit across Overview, Media, Versions, Annotate, Pipeline, and Jobs. Responsive fixes now keep media tables, dataset controls, and the pipeline graph legible without page-level horizontal overflow.
- Later product surfaces are intentionally scaffolded: BullMQ orchestration, prediction overlay, and evaluation still need their dedicated phases.

## Media Ingestion Path

```text
Web uploader
  -> POST /api/projects/:projectId/media/upload
  -> MIME validation
  -> SHA-256 checksum
  -> project-scoped dedupe
  -> MinIO original object
  -> MediaAsset row
  -> MediaProcessingJob row
  -> AuditLog row
```

The deterministic original object key is:

```text
projects/{projectId}/originals/{sha256}.{ext}
```

## Dataset Versioning Path

```text
MediaAsset rows
  -> Dataset mutable identity
  -> DatasetVersion draft snapshot
  -> DatasetVersionAsset rows with TRAIN, VALID, TEST, or UNASSIGNED split
  -> DatasetVersion LOCKED status
  -> AnnotationSet and InferenceJob consume the locked version
```

The API exposes dataset identity separately from immutable versions:

- `POST /api/projects/:projectId/datasets`
- `GET /api/projects/:projectId/datasets`
- `POST /api/projects/:projectId/datasets/:datasetId/versions`
- `GET /api/projects/:projectId/datasets/:datasetId/versions`
- `POST /api/projects/:projectId/dataset-versions/:versionId/assets`
- `POST /api/projects/:projectId/dataset-versions/:versionId/lock`

Draft versions accept asset assignment. Locked versions reject mutation. Split summaries are computed
from `DatasetVersionAsset` rows in the API response so the UI reads the same truth that later
annotation, inference, and evaluation workflows will consume.

## Annotation Path

```text
DatasetVersion
  -> AnnotationSet
  -> LabelClass
  -> Annotation rows with BBox geometryJson in image coordinates
  -> AuditLog rows for create, update, and delete
```

The API exposes a workspace endpoint plus focused mutation endpoints:

- `GET /api/projects/:projectId/dataset-versions/:versionId/annotation-workspace`
- `POST /api/projects/:projectId/annotation-sets/:annotationSetId/annotations`
- `PATCH /api/projects/:projectId/annotations/:annotationId`
- `DELETE /api/projects/:projectId/annotations/:annotationId`

The web workbench keeps local edits inspectable through a save queue. Boxes are drawn and edited in
image coordinates, then clamped to the selected asset bounds before API persistence.

## Pipeline Path

```text
Project
  -> Pipeline definition JSON
  -> Backend graph validation
  -> AuditLog rows for create and update
  -> InferenceJob consumes the persisted Pipeline id
```

The API exposes persisted graph definitions separately from future inference execution:

- `GET /api/projects/:projectId/pipelines`
- `POST /api/projects/:projectId/pipelines/validate`
- `POST /api/projects/:projectId/pipelines`
- `PATCH /api/projects/:projectId/pipelines/:pipelineId`

Definitions are validated before persistence. Validation checks schema shape, duplicate ids, input
and output counts, edge references, connectivity, input reachability, output reachability, cycles,
and detector model binding. The web Pipeline tab uses those validation results to mark graph
blockers and keep the inspector tied to the same backend contract that later inference jobs will use.
