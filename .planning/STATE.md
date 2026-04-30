# State

Current milestone: v1.1 — Production Hardening & Real Vertical Slice

Current phase: Phase 11 (Planned — README & Portfolio First Impression)

Last updated: 2026-05-01.

## Current Position

Phase: Phase 11 — README & Portfolio First Impression
Plan: Not planned yet
Status: Ready to plan

## Accumulated Context

### Roadmap Evolution

- Phase 11 added: README & Portfolio First Impression
- Phase 12 added: CI/CD Completeness
- Phase 13 added: Security & Validation Hardening
- Phase 14 added: Repository Abstraction
- Phase 15 added: Real Media Processing
- Phase 16 added: Real Detector & Prediction Persistence
- Phase 17 added: Frontend Feature Split
- Phase 18 added: Dataset Version Lock & Immutable Behavior
- Phase 19 added: Evaluation Report End-to-End
- Phase 20 added: E2E Playwright & Demo Video

### Key Decisions

- v1.0 (phases 0-10) archived as complete milestone. v1.1 (phases 11-20) is new active milestone.
- Phases are numbered 11-20 to continue from v1.0.
- Architecture target: Web App → NestJS API → Postgres/Prisma + MinIO + BullMQ/Redis → FastAPI CV Worker → Artifacts/Predictions/Evaluation Reports
- Repository adapter pattern: select Prisma/Minio vs Memory/Local at module bootstrap, never inside service logic.
- Real vertical slice focus: upload → annotate → run job → evaluate → export. No new features outside this slice.

### Prior Milestone Accomplishments (v1.0)

- Read `Vision Plan.docx` and derived the VisionFlow Studio vertical-slice plan.
- Installed local GSD/Codex artifacts for this repo.
- Created product and design context in `PRODUCT.md` and `DESIGN.md`.
- Built the pnpm/turbo monorepo with `apps/web`, `apps/api`, `apps/cv-worker`, `packages/contracts`, `packages/motion`, and `infra`.
- Implemented Phase 1 foundation: web workbench shell, API health/OpenAPI/demo routes, Prisma domain schema, CV mock endpoint, shared contracts, and root verification scripts.
- Implemented Phase 2 media ingestion: multipart API upload, MIME validation, SHA-256 checksum dedupe, MinIO original storage, Prisma metadata row, audit row, queued media processing job, CV thumbnail/frame contracts, and web uploader states.
- Implemented Phase 3 dataset versioning: shared contracts, Prisma/memory-backed dataset API, draft asset assignment, locked-version mutation rejection, computed split summaries, and upgraded Versions workbench UI.
- Implemented Phase 4 annotation engine: shared annotation contracts, API workspace/CRUD endpoints, Prisma and memory fallback service paths, image-coordinate BBox clamping, mutation audit logs, and annotation workbench UI with label selector, keyboard actions, and save queue.
- Completed a cross-screen UI polish audit after Phase 4, covering Overview, Media, Versions, Annotate, Pipeline, and Jobs across desktop, tablet, and mobile.
- Refined the workbench shell and detail components: calmer navigation rail, custom threshold slider, responsive media asset table, polished dataset version controls, custom asset selection controls, and mobile-friendly pipeline layout.
- Stabilized Phase 3 dataset API runtime injection with explicit Nest `@Inject(...)` annotations.
- Pushed the current codebase to `https://github.com/lhcaps/Vision.git` on `main`.
- Implemented Phase 5 pipeline builder: typed pipeline contracts, structured graph validation, API persistence through Prisma/memory paths, mutation audit logging, API sync/save/validate web client, and a polished React Flow inspector with node parameter controls and validation highlighting.
- Implemented Phase 6 inference orchestrator: typed job creation and stream contracts, locked dataset and valid pipeline validation, BullMQ queue wiring with memory fallback, explicit async worker transitions, SSE job progress, API job list/detail/create routes, and a Jobs workbench that follows backend truth.
- Implemented Phase 7 CV worker integration: shared CV worker contracts, FastAPI capability metadata, deterministic thresholded mock detections, explicit ONNX unavailable/runtime/model failures without silent fallback, IoU evaluation metrics, API dispatch from inference jobs to the worker, prediction persistence on the Prisma path, and Jobs logs with worker mode/count evidence.
- Implemented Phase 8 prediction overlay and evaluation: evaluation contracts, evaluation service with Prisma and memory fallback paths, CvWorkerClient.evaluate() method, API routes for GET/PRED evaluation and job predictions, PredictionOverlayCanvas component with GT/prediction toggle layers, EvaluationMetricsPanel with color-coded metric blocks and per-class breakdown, upgraded JobsPanel with real overlay and metrics integration, and full App.tsx state wiring.
- Implemented Phase 9 timeline replay and motion polish: `TimelineReplayPanel` with BBox morph engine, `DatasetVersionDiff` with IoU-based diff computation, `PipelineExecutionFlow` with particle edge animations, and global CSS consolidation.
- Implemented Phase 10 hardening: unified Vitest workspace with 118 tests across 4 packages, GitHub Actions CI + E2E workflows, ESLint + Prettier with root config, project README, one-command boot scripts (Unix + PowerShell), demo data validator, and Playwright E2E test scaffolding.

### Prior Verification Evidence (v1.0)

- `pnpm verify` passed: typecheck, tests, and production build.
- `python -m pytest apps/cv-worker/tests -q` passed with 4 tests.
- Local API smoke on port 3101 passed for fallback dataset list, draft creation, asset assignment, lock, and post-lock HTTP 409 rejection.
- Playwright desktop/mobile smoke passed for Versions, Annotate, Pipeline, Jobs, Media tabs.
- Docker Compose config validated.
- Local real-ingestion smoke passed with PostgreSQL and MinIO.
- Phase 6/7/8/10 focused checks passed.
- 118 tests across 4 packages, all 4 package typechecks, production build.

## Active Goals

- Plan and execute Phase 11: README & Portfolio First Impression.
- Push Phase 11 to GitHub.

## Known Partial Areas (v1.1 Focus)

- Repository lacks root README with architecture diagram and demo assets.
- Core services contain memory fallback logic mixed with production paths (to be fixed in Phase 14).
- CV worker produces mock artifacts rather than real thumbnail/frame extraction (Phase 15).
- ONNX inference execution requires model artifact supply (Phase 16).
- Frontend App.tsx is a single large file (Phase 17).
- No upload hardening beyond MIME validation (Phase 13).
- No signed URL or controlled asset serving layer (Phase 13).
- No real production-path test matrix (Phase 12).
- COCO/YOLO export deferred to Phase 18-20.

