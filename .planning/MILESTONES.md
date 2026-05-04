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

- CV worker produces mock artifacts rather than real thumbnail/frame extraction
- Frontend App.tsx is a single large file (not yet split into feature modules)
- No real production-path test matrix
- COCO/YOLO export deferred

---

## v1.1 — Production Hardening & Real Vertical Slice

**Status:** In progress
**Started:** 2026-05-01
**Phases:** 11–23
**Completed in v1.1:** 11, 12, 12C, 13, 14A, 14B, 15, 15.5–15.10, 16A, 17, 18, 19, 20

### Goal

Convert the prototype into a production-hardened platform with one real end-to-end vertical slice: upload media → annotate → run detector job → view prediction/evaluation → export COCO. Fix structural issues: no README, mixed memory/production paths, mock CV workers, monolithic frontend, missing security hardening, and untested production paths.

### Target

Build a deployable portfolio piece — one real dataset, one real annotation flow, one real async job, one real worker artifact, one real prediction persistence, one real evaluation report, one real export, one clean README, one clean demo video.

### Phase Progress

| #     | Name                                        | Goal                                                                                         | Status       |
| ----- | ------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------ |
| 11    | Public README & Portfolio First Impression  | Root README, architecture diagram, demo GIF, setup docs                                      | ✅ Done      |
| 12A   | CI/CD Completeness                          | Full CI pipeline, db:generate, format check, pytest                                          | ✅ Done      |
| 12B   | Local Stack & Seed Reliability              | Docker compose, boot scripts, seed, .env.example                                             | ✅ Done      |
| 12C   | Dev Flow & Local Reliability Closeout       | DB scripts, CV port alignment, script fixes                                                  | ✅ Done      |
| 13    | Security & Input Validation Hardening       | ValidationPipe, CORS, upload hardening, safe errors                                          | ✅ Done      |
| 14A   | Adapter Boundary Cleanup                    | Repository interfaces, adapter implementations                                               | ✅ Done      |
| 14B   | Domain Invariants & State Machines          | Zod validation, job state machine, audit logs                                                | ✅ Done      |
| 15    | Observability & Health Checks               | Request IDs, structured logs, /health endpoints                                              | ✅ Done      |
| 15.5  | Runtime Truth & State Consistency           | WorkbenchRuntimeState, eligibility selectors                                                 | ✅ Done      |
| 15.6  | Workflow Guidance & Primary Next Action     | NextAction model, disabled reasons, recovery paths                                           | ✅ Done      |
| 15.7  | Contextual Inspector                        | Section-aware inspectors (Media, Dataset, Annotation, Pipeline, Jobs)                        | ✅ Done      |
| 15.8  | UX States & Table Actions                   | EmptyState, ErrorState, DisabledReason, RowActions                                           | ✅ Done      |
| 15.9  | Visual System Hardening                     | Focus-visible, semantic colors, consistent spacing                                           | ✅ Done      |
| 15.10 | Motion, Portfolio Mode & Regression Tests   | Purposeful motion, isPortfolioSafe, 32 regression tests                                      | ✅ Done      |
| 16A   | Frontend Split Minimum                      | Feature module extraction (media, inference)                                                 | ✅ Done      |
| 17    | Real Media Processing                       | Pillow thumbnails, MinIO read/write, BullMQ consumer, derivative persistence, checksum field | ✅ Done      |
| 18    | Dataset Locking & COCO Export               | Lock invariants, annotation immutability, deterministic COCO export, real image dimensions   | ✅ Done      |
| 19    | Real ONNX Detector & Prediction Persistence | YOLOv8n ONNX, prediction traceability, SHA-256 pinned, runtime smoke verified                | ✅ FULL PASS |
| 20    | Evaluation Report E2E                       | IoU matching, persisted reports, per-class metrics, label mapping                            | ✅ FULL PASS |
| 21    | Frontend Split Completion                   | All feature modules, shared components                                                       | Planned      |
| 22A   | Test Harness & Fixtures                     | Docker test stack, deterministic fixtures                                                    | Planned      |
| 22B   | Production-Path Test Suite                  | Real path tests, contract tests                                                              | Planned      |
| 23    | Full E2E Playwright & Demo Video            | Complete E2E flow, demo GIF/video                                                            | Planned      |

### Phase 11 Key Outcomes

- Root `README.md` with full architecture diagram (ASCII), Quick Start (5 steps), Features section, Tech Stack table, Development commands, Environment Variables, Project Structure, Known Limitations, Contributing guide
- `docs/demo/README-DEMO.md` with complete demo recording instructions

### Phase 12 Key Outcomes

- **CI/CD (12A):** GitHub Actions pipeline with job dependency graph `lint → [typecheck, format, pytest, test] → build`. Prisma client generation validated before typecheck. Python pytest suite (8 tests) runs in isolated job. Prettier format check prevents style drift. CI badge in README.
- **Local Stack (12B):** Docker compose with named network, MinIO bucket initialization, fixed healthchecks. Both Unix and Windows boot scripts with prerequisite checks, service health waits, colored output. Seed script with `--api` mode for API-based demo data creation. Complete `.env.example` with 16 documented variables in 8 sections.

### Phase 13 Key Outcomes

- **Input Validation:** Global NestJS `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. Unknown fields in request payloads rejected with HTTP 400.
- **CORS Policy:** Explicit allowlist from `WEB_ORIGIN` env var. Cross-origin requests blocked when not configured.
- **Upload Hardening:** Magic byte validation (`magic-bytes.ts` + tests), corrupted media detection (`media-integrity.ts`), 250MB file size limit, MIME type allowlist (JPEG, PNG, WebP, MP4, MOV).
- **Asset Access:** `SignedUrlService` for MinIO presigned URLs; `streamFile()` API proxy fallback when `SIGNED_URL_EXPIRY_SECONDS` is not set.
- **Safe Filenames:** `sanitize-filename.ts` strips path traversal attempts from original filenames.
- **Structured Errors:** All error responses are consistently formatted `{ statusCode, message, error, timestamp }`. Internal details never leaked to clients.
- Full Security section in README documenting all controls.

### Phase 14A Key Outcomes

- **Repository Interfaces:** 9 interfaces defined in `provider-tokens.ts`: `MediaRepository`, `DatasetRepository`, `AnnotationRepository`, `PipelineRepository`, `InferenceRepository`, `PredictionRepository`, `EvaluationRepository`, `StorageRepository`, `JobQueue`, `AuditLogger`.
- **Adapter Implementations:** `Prisma*` implementations (media, dataset, annotation, inference, prediction, evaluation), `MinioStorageRepository`, `BullMqJobQueue`, `PrismaAuditLogger` for production. `Memory*` and `LocalStorageRepository`, `NoopJobQueue`, `MemoryAuditLogger` for demo.
- **Module Bootstrap Pattern:** `AppMode` enum drives adapter selection. No `if (process.env.DATABASE_URL)` inside service methods. All infrastructure wired in `app.module.ts`.
- Clean separation: API module owns DB writes, CV worker owns MinIO artifact writes.

### Phase 14B Key Outcomes

- **Zod Validation at Boundary:** `annotation-geometry.validator.ts` validates BBox geometry via `BBoxGeometrySchema` before persistence. Pipeline graph validation via `pipeline-definition.integration.spec.ts`.
- **Inference Job State Machine:** `inference-job-state-machine.ts` enforces valid transitions (`QUEUED → RUNNING → SUCCEEDED/FAILED`, `QUEUED → CANCELLED`, `RUNNING → CANCELLED`). Invalid transitions throw `InferenceJobTransitionError`.
- **Progress Rewind Guard:** `assertValidProgress()` prevents progress percentage from decreasing (unless transitioning to FAILED).
- **Audit Logger Interface:** `AuditLogger` interface with `log(event: AuditEvent)` method. `PrismaAuditLogger` persists audit events; `MemoryAuditLogger` for demo.
- Prediction traceability: all predictions link to `inferenceJobId`, `mediaAssetId`, `datasetVersionId`, `pipelineId`.

### Phase 20 Key Outcomes

- **Deterministic evaluation algorithm:** `computeEvaluationMetrics()` — pure function, greedy IoU-based matching (threshold 0.5), deterministic ordering (confidence desc, id asc for predictions; IoU desc, id asc for GT candidates)
- **inputHash:** SHA-256 of canonical inputs (jobId, datasetVersionId, sorted predictions, sorted GTs, iouThreshold), 16-char hex, stable across re-runs
- **Label mapping:** `resolvePredictionClass()` from `labelClassId`, `metadata.cocoLabel`, or `unmapped:unknown`; real class names (car/van/truck) in per-class metrics
- **EvaluationService refactored:** Removed `DATABASE_URL` branching, removed CV worker delegation, removed `Date.now()` in report ID, added full traceability fields
- **Contracts extended:** `PerClassMetricSchema` +`classKey`/`meanIou`, `EvaluationMatchSchema`, `EvaluationReportSummarySchema` + traceability + hash fields
- **21 algorithm unit tests:** Covering all EVAL-09 fixture cases (perfect match, duplicates, low IoU, wrong class, missing pred, multi-class, empty states, determinism, mean IoU, geometry validation, match sorting)
- **Runtime results:** TP=3, FP=0, FN=0; Precision=1.0, Recall=1.0, F1=1.0, Mean IoU=1.0 (seed data: identical GT/prediction boxes)
