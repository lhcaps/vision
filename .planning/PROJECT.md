# VisionFlow Studio

## Current Milestone: v1.1 — Production Hardening & Real Vertical Slice

**Goal:** Convert VisionFlow Studio from a strong prototype into a production-hardened local-first portfolio project. Build one real, reproducible, end-to-end CV workflow: upload image → generate real thumbnail → create/lock dataset version → annotate → export deterministic COCO → run real YOLOv8n ONNX detector → persist predictions → evaluate → view overlay and metrics. Prove the production path, not the demo path. Do not claim production-grade platform — this is a local-first prototype for portfolio use.

**Target proof:**
- One real dataset, one real annotation flow, one real async job, one real worker artifact
- One real prediction persistence, one real evaluation report, one deterministic COCO export
- One clean README, one working local setup, one real-service Playwright E2E, one demo video

**13 phases (11–23):** README → CI/CD → Security → Adapter Boundary → Domain Invariants → Observability → Frontend Split Minimum → Real Media Processing → Dataset Locking & COCO Export → Real ONNX Detector → Evaluation E2E → Frontend Split Completion → Production Tests → E2E & Demo Video

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

VisionFlow Studio should be built as vertical slices, not horizontal layers. The core engine is dataset versioning with immutable locked versions, bounding-box annotation storage, pipeline definition, asynchronous inference orchestration with BullMQ, real media processing workers, real ONNX detector, prediction persistence with full traceability, evaluation, COCO export, and audit logs.

v1.0 proved the prototype surface. v1.1 proves the production path — real services, real artifacts, real persistence, real evaluation, deterministic COCO export, and reproducible exports. The architecture is production-hardened at the local-first level: typed contracts, clean adapter boundaries, explicit state machines, observability, and no silent fallback.

## v1.1 Product Slice

upload image → generate real thumbnail artifact → create dataset version → add asset → draw bounding-box annotation → lock dataset version → export deterministic COCO → run real detector job (YOLOv8n ONNX) → persist predictions → evaluate against ground truth → view overlay and metrics → prove the full flow with Playwright E2E.

## Stack

- Monorepo: pnpm + turbo.
- Web: React, Vite, TypeScript, Tailwind, Motion, React Flow.
- API: NestJS, Prisma, PostgreSQL, Redis, BullMQ, MinIO, OpenAPI.
- CV worker: Python FastAPI, Pillow/OpenCV/ffmpeg for real media processing, YOLOv8n ONNX Runtime for inference.
- Shared contracts: Zod and TypeScript types.
- Repository adapters: Prisma + MinIO + BullMQ for production; in-memory + local filesystem for demo.

## Constraints

- v1.1 proves the real production path. Demo mode is retained for local dev without infra, but production mode requires real services.
- v1.1 stores bounding boxes in image coordinates.
- v1.1 supports real media processing (Pillow/ffmpeg) and real ONNX detector (YOLOv8n ONNX).
- v1.1 does not train models.
- v1.1 does not include billing, enterprise RBAC, segmentation masks, keypoints, or real-time collaboration.
- No silent fallback from real mode to mock mode — ONNX and media processing must fail loudly without fallback.
