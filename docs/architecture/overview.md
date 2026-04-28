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
- Later product surfaces are intentionally scaffolded: dataset versioning, annotation, pipeline persistence, BullMQ orchestration, prediction overlay, and evaluation still need their dedicated phases.

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
