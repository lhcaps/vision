# Milestones

## v1.0 — Foundation & Core Workbench

**Completed:** 2026-05-01  
**Phases:** 0–10

### Scope

Established the VisionFlow Studio monorepo with a full-stack workbench covering dataset versioning, annotation, pipeline definition, inference orchestration, CV worker integration, prediction overlay, evaluation metrics, timeline replay, motion polish, and CI/CD hardening.

### Phases

| # | Name | Goal |
|---|------|------|
| 0 | Boot | GSD artifacts, monorepo, shared contracts |
| 1 | Foundation Vertical Slice | Web shell, API skeleton, Prisma schema, CV mock |
| 2 | Media Ingestion | MinIO upload, MIME validation, checksum dedupe, queued jobs |
| 3 | Dataset Versioning | Immutable versions, split summaries, lock behavior |
| 4 | Annotation Engine | BBox CRUD, annotation canvas, label selector, save queue |
| 5 | Pipeline Builder | React Flow builder, graph validation, persistence |
| 6 | Inference Orchestrator | BullMQ queue, worker state machine, SSE progress |
| 7 | CV Worker | FastAPI worker, mock detector, ONNX capability guard |
| 8 | Prediction Overlay & Evaluation | IoU metrics, GT comparison, overlay canvas, per-class report |
| 9 | Timeline Replay & Motion Polish | BBox morphs, dataset diffs, pipeline execution flow |
| 10 | Hardening | 118 tests, CI workflows, README, boot scripts, Playwright scaffold |

### Key Outcomes

- Monorepo: `apps/web`, `apps/api`, `apps/cv-worker`, `packages/contracts`, `packages/motion`, `infra`
- 118 unit/integration tests across 4 packages
- GitHub Actions CI + E2E workflows
- One-command boot scripts (Unix + PowerShell)
- Responsive workbench shell covering Overview, Media, Versions, Annotate, Pipeline, Jobs

### Known Partial Areas

- BullMQ live smoke requires Redis-backed environment (memory fallback used locally)
- ONNX inference gated on model artifact supply (fails loudly, no silent mock fallback)
- Playwright E2E tests require `pnpm exec playwright install chromium` locally
- Repository lacks root README with architecture diagram and demo assets
- Core services contain memory fallback logic mixed with production paths
- CV worker produces mock artifacts rather than real thumbnail/frame extraction
- Frontend App.tsx is a single large file (not yet split into feature modules)
- No upload hardening beyond MIME validation
- No signed URL or controlled asset serving layer
- No real production-path test matrix
- COCO/YOLO export deferred

---

## v1.1 — Production Hardening & Real Vertical Slice

**Status:** In progress  
**Started:** 2026-05-01  
**Phases:** 11–

### Goal

Convert the prototype into a production-hardened platform with one real end-to-end vertical slice: upload media → annotate → run detector job → view prediction/evaluation → export COCO. Fix structural issues: no README, mixed memory/production paths, mock CV workers, monolithic frontend, missing security hardening, and untested production paths.

### Target

Build a deployable portfolio piece — one real dataset, one real annotation flow, one real async job, one real worker artifact, one real prediction persistence, one real evaluation report, one real export, one clean README, one clean demo video.
