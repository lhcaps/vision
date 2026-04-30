# VisionFlow Studio

## Current Milestone: v1.1 — Production Hardening & Real Vertical Slice

**Goal:** Convert the prototype into a production-hardened CV dataset workbench. Build one real end-to-end vertical slice: upload media → annotate → run detector job → view prediction/evaluation → export COCO. Fix structural issues that prevent the repo from being a portfolio-ready piece.

**Target features:**
- README with architecture diagram, demo assets, setup guide
- Complete CI/CD pipeline
- Security & validation hardening (ValidationPipe, CORS, upload hardening)
- Repository abstraction (no memory/production mixing in service logic)
- Real media processing (thumbnail, frame extraction)
- Real ONNX detector pipeline with prediction persistence
- Feature-split frontend (no file > 400 lines)
- Immutable dataset version lock
- Complete evaluation report (precision, recall, F1, IoU)
- E2E Playwright test + demo video

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

## Source

Derived from `Vision Plan.docx` on 2026-04-28.

## Thesis

VisionFlow Studio should be built as vertical slices, not horizontal layers. The core V1 engine is dataset versioning, annotation storage, pipeline definition, asynchronous inference orchestration, prediction persistence, evaluation, audit logs, and export.

v1.1 adds production hardening: repository abstraction to eliminate mixed memory/production paths, real media processing workers, complete ONNX inference pipeline, feature-split frontend, immutable dataset versions, and end-to-end evaluation with reproducible exports.

## V1.1 Product Slice

Upload media → create dataset version → annotate bounding boxes → lock version → run detector job → view prediction/evaluation → export COCO. One real flow, built to production quality.

## Stack

- Monorepo: pnpm + turbo.
- Web: React, Vite, TypeScript, Tailwind, Motion, React Flow.
- API: NestJS, Prisma, PostgreSQL, Redis, BullMQ, MinIO, OpenAPI.
- CV worker: Python FastAPI, Pillow/OpenCV/ffmpeg for real media processing, ONNX Runtime for inference.
- Shared contracts: Zod and TypeScript types.
- Repository adapters: Prisma + MinIO for production; in-memory + local filesystem for demo.

## Constraints

- Build the real workbench first, not a landing page first.
- v1.1 stores bounding boxes in image coordinates.
- v1.1 supports real media processing (Pillow/ffmpeg) and ONNX detector.
- v1.1 does not train models.
- v1.1 does not include billing, enterprise RBAC, segmentation masks, keypoints, or real-time collaboration.
