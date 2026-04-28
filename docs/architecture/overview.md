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
