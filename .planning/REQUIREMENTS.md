# Requirements

Status: v1.1 milestone active

## v1.1 Requirements

### README & Portfolio (P0)

- [ ] **PORT-01**: Root README.md exists with VisionFlow Studio description, demo GIF/screenshots, architecture diagram, features implemented vs planned, local setup, env vars, run commands, migration, test, and known limitations sections
- [ ] **PORT-02**: Architecture diagram shows the full data flow (Web → API → Postgres/Prisma + MinIO + BullMQ/Redis → CV Worker → Artifacts)
- [ ] **PORT-03**: Setup section enables a new developer to run the full stack locally from zero

### CI/CD (P0)

- [ ] **CI-01**: GitHub Actions CI runs on every push and PR: `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `python -m pytest apps/cv-worker/tests`, `pnpm format --check`
- [ ] **CI-02**: CI failure blocks merge

### Security & Validation (P1)

- [ ] **SEC-01**: NestJS `ValidationPipe` enabled globally with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- [ ] **SEC-02**: CORS uses explicit allowlist from `WEB_ORIGIN` env var
- [ ] **SEC-03**: File uploads enforce size limit and reject oversized files with HTTP 413
- [ ] **SEC-04**: MIME type validated by both extension and magic number sniffing
- [ ] **SEC-05**: Duplicate uploads detected by checksum; existing asset returned, not new row created
- [ ] **SEC-06**: Assets served via signed URLs or controlled proxy — direct MinIO bucket is not public

### Repository Abstraction (P1)

- [ ] **ABS-01**: `MediaRepository`, `StorageRepository`, `JobQueue`, `AuditLogger` abstractions exist
- [ ] **ABS-02**: `PrismaMediaRepository` and `MemoryMediaRepository` implement the same interface
- [ ] **ABS-03**: `MinioStorageRepository` and `LocalStorageRepository` implement the same interface
- [ ] **ABS-04**: `BullMqJobQueue` and `NoopJobQueue` implement the same interface
- [ ] **ABS-05**: Adapter selection happens at module bootstrap — no `if (process.env.*)` inside service logic
- [ ] **ABS-06**: Annotation geometry JSON validated with Zod at API boundary
- [ ] **ABS-07**: Pipeline graph JSON validated with Zod at API boundary
- [ ] **ABS-08**: Job state transitions enforced by explicit state machine
- [ ] **ABS-09**: Prediction traces `modelArtifactId`, `pipelineId`, `datasetVersionId`

### Real Media Processing (P1)

- [ ] **MED-01**: `/cv/create-thumbnail` produces real Pillow thumbnail artifact persisted to storage
- [ ] **MED-02**: `/cv/extract-frames` produces real ffmpeg/OpenCV frame artifacts persisted to storage
- [ ] **MED-03**: BullMQ job payload contains only job ID — no blob data
- [ ] **MED-04**: Worker transitions states explicitly: QUEUED → RUNNING → SUCCEEDED/FAILED
- [ ] **MED-05**: Failed media processing writes audit log with error details
- [ ] **MED-06**: Derivative artifacts are retrievable from storage

### Real Detector & Prediction (P1)

- [ ] **DET-01**: `/cv/run-pipeline` executes real ONNX Runtime inference with NMS
- [ ] **DET-02**: Confidence threshold filters low-confidence predictions
- [ ] **DET-03**: Predictions persisted to DB with full traceability
- [ ] **DET-04**: ONNX errors surfaced with context — no silent fallback
- [ ] **DET-05**: Mock detector available for local development without ONNX

### Frontend Feature Split (P2)

- [ ] **UI-01**: App.tsx reduced to < 400 lines (thin shell only)
- [ ] **UI-02**: Feature modules: `media/`, `datasets/`, `annotations/`, `pipelines/`, `inference/`
- [ ] **UI-03**: Shared UI components: Button, Panel, EmptyState, ErrorState
- [ ] **UI-04**: No circular dependencies between feature modules

### Dataset Version Lock (P2)

- [ ] **VER-01**: LOCKED version rejects asset assignment with HTTP 409
- [ ] **VER-02**: LOCKED version rejects annotation create/update/delete with HTTP 409
- [ ] **VER-03**: COCO export from locked version is deterministic
- [ ] **VER-04**: Audit log records version lock state changes

### Evaluation Report (P2)

- [ ] **EVAL-01**: Evaluation runs on real annotation + prediction data
- [ ] **EVAL-02**: Precision, recall, F1, IoU computed and persisted
- [ ] **EVAL-03**: Report displayed in frontend with metric visualization
- [ ] **EVAL-04**: Per-class metrics show class-level performance
- [ ] **EVAL-05**: Evaluation reproducible from locked dataset version + model artifact

### E2E & Demo (P2)

- [ ] **E2E-01**: Playwright E2E test covers full vertical slice with real database path
- [ ] **E2E-02**: Playwright test runs in CI
- [ ] **E2E-03**: Demo GIF/screenshot embedded in README
- [ ] **E2E-04**: README demonstrates the real vertical slice end-to-end

## Deferred

- YOLO export (beyond COCO)
- Real-time collaboration
- Segmentation masks / keypoints
- Enterprise RBAC / billing
- Model training
- Multi-user authentication

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| PORT-01 | 11 | Pending |
| PORT-02 | 11 | Pending |
| PORT-03 | 11 | Pending |
| CI-01 | 12 | Pending |
| CI-02 | 12 | Pending |
| SEC-01 | 13 | Pending |
| SEC-02 | 13 | Pending |
| SEC-03 | 13 | Pending |
| SEC-04 | 13 | Pending |
| SEC-05 | 13 | Pending |
| SEC-06 | 13 | Pending |
| ABS-01 | 14 | Pending |
| ABS-02 | 14 | Pending |
| ABS-03 | 14 | Pending |
| ABS-04 | 14 | Pending |
| ABS-05 | 14 | Pending |
| ABS-06 | 14 | Pending |
| ABS-07 | 14 | Pending |
| ABS-08 | 14 | Pending |
| ABS-09 | 14 | Pending |
| MED-01 | 15 | Pending |
| MED-02 | 15 | Pending |
| MED-03 | 15 | Pending |
| MED-04 | 15 | Pending |
| MED-05 | 15 | Pending |
| MED-06 | 15 | Pending |
| DET-01 | 16 | Pending |
| DET-02 | 16 | Pending |
| DET-03 | 16 | Pending |
| DET-04 | 16 | Pending |
| DET-05 | 16 | Pending |
| UI-01 | 17 | Pending |
| UI-02 | 17 | Pending |
| UI-03 | 17 | Pending |
| UI-04 | 17 | Pending |
| VER-01 | 18 | Pending |
| VER-02 | 18 | Pending |
| VER-03 | 18 | Pending |
| VER-04 | 18 | Pending |
| EVAL-01 | 19 | Pending |
| EVAL-02 | 19 | Pending |
| EVAL-03 | 19 | Pending |
| EVAL-04 | 19 | Pending |
| EVAL-05 | 19 | Pending |
| E2E-01 | 20 | Pending |
| E2E-02 | 20 | Pending |
| E2E-03 | 20 | Pending |
| E2E-04 | 20 | Pending |

**Total:** 44 requirements | **Covered:** 0 | **Remaining:** 44
