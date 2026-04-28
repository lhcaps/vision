# VisionFlow Studio

## Source

Derived from `Vision Plan.docx` on 2026-04-28.

## Thesis

VisionFlow Studio should be built as vertical slices, not horizontal layers. The core V1 engine is dataset versioning, annotation storage, pipeline definition, asynchronous inference orchestration, prediction persistence, evaluation, audit logs, and export.

## V1 Product Slice

Upload media -> create dataset version -> annotate bounding boxes -> build pipeline -> run job -> inspect prediction/evaluation/timeline -> export.

## Stack

- Monorepo: pnpm + turbo.
- Web: React, Vite, TypeScript, Tailwind, Motion, React Flow.
- API: NestJS, Prisma, PostgreSQL, Redis, BullMQ, MinIO, OpenAPI.
- CV worker: Python FastAPI, mock detector first, ONNX later.
- Shared contracts: Zod and TypeScript types.

## Constraints

- Build the real workbench first, not a landing page first.
- V1 stores bounding boxes in image coordinates.
- V1 supports mock detector and ONNX detector.
- V1 does not train models.
- V1 does not include billing, enterprise RBAC, segmentation masks, keypoints, or real-time collaboration.
