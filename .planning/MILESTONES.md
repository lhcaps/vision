# Milestones

## v1.0 — Foundation & Core Workbench

**Completed:** 2026-05-01  
**Phases:** 0–10

### Scope

Established the VisionFlow Studio monorepo with a full-stack workbench covering dataset versioning, annotation, pipeline definition, inference orchestration, CV worker integration, prediction overlay, evaluation metrics, timeline replay, motion polish, and CI/CD hardening.

### Phases

| #   | Name                            | Goal                                                               |
| --- | ------------------------------- | ------------------------------------------------------------------ |
| 0   | Boot                            | GSD artifacts, monorepo, shared contracts                          |
| 1   | Foundation Vertical Slice       | Web shell, API skeleton, Prisma schema, CV mock                    |
| 2   | Media Ingestion                 | MinIO upload, MIME validation, checksum dedupe, queued jobs        |
| 3   | Dataset Versioning              | Immutable versions, split summaries, lock behavior                 |
| 4   | Annotation Engine               | BBox CRUD, annotation canvas, label selector, save queue           |
| 5   | Pipeline Builder                | React Flow builder, graph validation, persistence                  |
| 6   | Inference Orchestrator          | BullMQ queue, worker state machine, SSE progress                   |
| 7   | CV Worker                       | FastAPI worker, mock detector, ONNX capability guard               |
| 8   | Prediction Overlay & Evaluation | IoU metrics, GT comparison, overlay canvas, per-class report       |
| 9   | Timeline Replay & Motion Polish | BBox morphs, dataset diffs, pipeline execution flow                |
| 10  | Hardening                       | 118 tests, CI workflows, README, boot scripts, Playwright scaffold |

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
**Phases:** 11–23
**Completed in v1.1:** 11, 12

### Goal

Convert the prototype into a production-hardened platform with one real end-to-end vertical slice: upload media → annotate → run detector job → view prediction/evaluation → export COCO. Fix structural issues: no README, mixed memory/production paths, mock CV workers, monolithic frontend, missing security hardening, and untested production paths.

### Target

Build a deployable portfolio piece — one real dataset, one real annotation flow, one real async job, one real worker artifact, one real prediction persistence, one real evaluation report, one real export, one clean README, one clean demo video.

### Phase Progress

| #   | Name                                        | Goal                                                    | Status  |
| --- | ------------------------------------------- | ------------------------------------------------------- | ------- |
| 11  | Public README & Portfolio First Impression  | Root README, architecture diagram, demo GIF, setup docs | ✅ Done |
| 12A | CI/CD Completeness                          | Full CI pipeline, db:generate, format check, pytest     | ✅ Done |
| 12B | Local Stack & Seed Reliability              | Docker compose, boot scripts, seed, .env.example        | ✅ Done |
| 13  | Security & Input Validation Hardening       | ValidationPipe, CORS, upload hardening, safe errors     | 🔄 Next |
| 14A | Adapter Boundary Cleanup                    | Repository interfaces, adapter implementations          | Planned |
| 14B | Domain Invariants & State Machines          | Zod validation, job state machine, audit logs           | Planned |
| 15  | Observability & Health Checks               | Request IDs, structured logs, /health endpoints         | Planned |
| 16A | Frontend Split Minimum                      | Feature module extraction (media, inference)            | Planned |
| 17  | Real Media Processing                       | Pillow thumbnails, ffmpeg frames, BullMQ consumer       | Planned |
| 18  | Dataset Locking & COCO Export               | Lock enforcement, deterministic COCO export             | Planned |
| 19  | Real ONNX Detector & Prediction Persistence | YOLOv8n ONNX, prediction traceability                   | Planned |
| 20  | Evaluation Report E2E                       | Evaluation metrics, persisted reports, UI display       | Planned |
| 21  | Frontend Split Completion                   | All feature modules, shared components                  | Planned |
| 22A | Test Harness & Fixtures                     | Docker test stack, deterministic fixtures               | Planned |
| 22B | Production-Path Test Suite                  | Real path tests, contract tests                         | Planned |
| 23  | Full E2E Playwright & Demo Video            | Complete E2E flow, demo GIF/video                       | Planned |

### Phase 11 Key Outcomes

- Root `README.md` with full architecture diagram (ASCII), Quick Start (5 steps), Features section, Tech Stack table, Development commands, Environment Variables, Project Structure, Known Limitations, Contributing guide
- `docs/demo/README-DEMO.md` with complete demo recording instructions

### Phase 12 Key Outcomes

- **CI/CD (12A):** GitHub Actions pipeline with job dependency graph `lint → [typecheck, format, pytest, test] → build`. Prisma client generation validated before typecheck. Python pytest suite (8 tests) runs in isolated job. Prettier format check prevents style drift. CI badge in README.
- **Local Stack (12B):** Docker compose with named network, MinIO bucket initialization, fixed healthchecks. Both Unix and Windows boot scripts with prerequisite checks, service health waits, colored output. Seed script with `--api` mode for API-based demo data creation. Complete `.env.example` with 16 documented variables in 8 sections.
