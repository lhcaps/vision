---
name: phase-14-adapter-boundary
phase: 14
milestone: v1.1
status: completed
created: 2026-05-01
completed: 2026-05-01
depends_on: [12, 13]
---

# Phase 14 — Adapter Boundary & Domain Invariants

## Goal

Phase 14A removes environment branching from business services. Production and demo behavior are selected at module bootstrap, not inside service logic. Phase 14B enforces domain invariants and explicit state machines, making invalid states impossible or explicitly rejected.

## Phase 14A — Adapter Boundary Cleanup

### What This Builds

A clean repository/adapter pattern across all NestJS services. Business logic depends on interfaces; concrete implementations (Prisma, MinIO, BullMQ, in-memory) are injected at module bootstrap. Environment branching (`process.env.DATABASE_URL` if-else inside service methods) is eliminated entirely.

### Why It Matters

The current services have dual-path logic scattered through every method: `if (process.env.DATABASE_URL)` calls Prisma, `else` uses in-memory maps. This pattern:
- Duplicates business logic across two paths
- Makes testing harder (cannot swap adapters without patching)
- Makes it impossible to use real DB in demo mode or in-memory in production
- Pollutes every service method with branching concerns

### Interfaces to Introduce

```typescript
// apps/api/src/repositories/media.repository.ts
export interface MediaRepository {
  findByProject(projectId: string): Promise<MediaAssetSummary[]>;
  findById(projectId: string, assetId: string): Promise<MediaAssetSummary | null>;
  findByChecksum(projectId: string, checksum: string): Promise<MediaAssetSummary | null>;
  create(data: CreateMediaAssetData): Promise<MediaAssetSummary>;
  createProcessingJob(data: CreateProcessingJobData): Promise<MediaProcessingJobSummary>;
}

// apps/api/src/repositories/dataset.repository.ts
export interface DatasetRepository {
  findByProject(projectId: string): Promise<DatasetSummary[]>;
  findVersionById(projectId: string, versionId: string): Promise<DatasetVersionSummary | null>;
  listVersionAssetIds(projectId: string, versionId: string): Promise<string[]>;
  assignAssets(projectId: string, versionId: string, assets: AssignDatasetVersionAssetsRequest): Promise<DatasetVersionSummary>;
  lockVersion(projectId: string, versionId: string): Promise<DatasetVersionSummary>;
}

// apps/api/src/repositories/annotation.repository.ts
export interface AnnotationRepository {
  loadWorkspace(projectId: string, datasetVersionId: string, assetId?: string): Promise<AnnotationWorkspaceResponse>;
  create(projectId: string, annotationSetId: string, dto: CreateAnnotationRequest): Promise<AnnotationSummary>;
  update(projectId: string, annotationId: string, dto: UpdateAnnotationRequest): Promise<AnnotationSummary>;
  delete(projectId: string, annotationId: string): Promise<void>;
}

// apps/api/src/repositories/pipeline.repository.ts
export interface PipelineRepository {
  findByProject(projectId: string): Promise<PipelineSummary[]>;
  create(projectId: string, dto: CreatePipelineRequest): Promise<PipelineSummary>;
  update(projectId: string, pipelineId: string, dto: UpdatePipelineRequest): Promise<PipelineSummary>;
}

// apps/api/src/repositories/inference.repository.ts
export interface InferenceRepository {
  findByProject(projectId: string): Promise<InferenceJobSummary[]>;
  findById(projectId: string, jobId: string): Promise<InferenceJobSummary | null>;
  create(projectId: string, dto: CreateInferenceJobRequest): Promise<InferenceJobSummary>;
  updateJobStatus(projectId: string, jobId: string, patch: JobPatch): Promise<void>;
  persistPredictions(payload: InferenceQueuePayload, predictions: CvWorkerPrediction[]): Promise<number>;
}

// apps/api/src/repositories/prediction.repository.ts
export interface PredictionRepository {
  findByJob(projectId: string, jobId: string): Promise<PredictionSummary[]>;
}

// apps/api/src/repositories/evaluation.repository.ts
export interface EvaluationRepository {
  findReportByJob(jobId: string): Promise<EvaluationReport | null>;
  createReport(jobId: string, metrics: EvaluationReport): Promise<void>;
}

// apps/api/src/repositories/storage.repository.ts
export interface StorageRepository {
  putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  getSignedUrl(key: string): Promise<string>;
}

// apps/api/src/queues/job-queue.ts
export interface JobQueue {
  enqueue(payload: unknown): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

// apps/api/src/audit/audit-logger.ts
export interface AuditLogger {
  log(event: AuditEvent): Promise<void>;
}
```

### Concrete Implementations

| Interface | Prisma/Real Impl | In-Memory/Demo Impl |
|---|---|---|
| `MediaRepository` | `PrismaMediaRepository` | `MemoryMediaRepository` |
| `DatasetRepository` | `PrismaDatasetRepository` | `MemoryDatasetRepository` |
| `AnnotationRepository` | `PrismaAnnotationRepository` | `MemoryAnnotationRepository` |
| `PipelineRepository` | `PrismaPipelineRepository` | `MemoryPipelineRepository` |
| `InferenceRepository` | `PrismaInferenceRepository` | `MemoryInferenceRepository` |
| `PredictionRepository` | `PrismaPredictionRepository` | `MemoryPredictionRepository` |
| `EvaluationRepository` | `PrismaEvaluationRepository` | `MemoryEvaluationRepository` |
| `StorageRepository` | `MinioStorageRepository` | `LocalStorageRepository` |
| `JobQueue` | `BullMqJobQueue` | `NoopJobQueue` |
| `AuditLogger` | `PrismaAuditLogger` | `MemoryAuditLogger` |

### Bootstrap Strategy

Create `apps/api/src/config/app-mode.ts`:

```typescript
export type AppMode = 'production' | 'demo';

export function detectMode(): AppMode {
  if (process.env.APP_MODE === 'demo') return 'demo';
  if (process.env.DATABASE_URL) return 'production';
  return 'demo';
}

export function createAdapters(mode: AppMode) {
  const prisma = new PrismaService();
  const storage = mode === 'production'
    ? new MinioStorageRepository()
    : new LocalStorageRepository();
  const queue = mode === 'production'
    ? new BullMqJobQueue()
    : new NoopJobQueue();
  const audit = mode === 'production'
    ? new PrismaAuditLogger(prisma)
    : new MemoryAuditLogger();
  // ... all adapters
  return { prisma, storage, queue, audit, /* repositories */ };
}
```

Module providers are replaced at bootstrap time — services receive interfaces only.

## Phase 14B — Domain Invariants & State Machines

### What This Builds

1. **Zod validation at API boundary** for annotation geometry and pipeline graph JSON.
2. **Inference job state machine** enforcing explicit transitions: `QUEUED → RUNNING → SUCCEEDED`, `QUEUED → RUNNING → FAILED`, `QUEUED → CANCELLED`, `RUNNING → CANCELLED`. Invalid transitions throw explicit `DomainError`.
3. **Prediction traceability** — all predictions must trace to `modelArtifactId`, `pipelineId`, `datasetVersionId`, `inferenceJobId`, `mediaAssetId`.
4. **Dataset version lock enforcement** at domain level (already partially done via `assertDraftDatasetVersion`).
5. **Audit log completeness** — every important mutation gets an audit row.

### State Machine

```typescript
// apps/api/src/domain/inference-job-state-machine.ts
export const VALID_TRANSITIONS: Record<InferenceJobStatus, InferenceJobStatus[]> = {
  QUEUED: ['RUNNING', 'CANCELLED'],
  RUNNING: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

export function assertValidTransition(from: InferenceJobStatus, to: InferenceJobStatus): void {
  const valid = VALID_TRANSITIONS[from];
  if (!valid.includes(to)) {
    throw new DomainError(
      `Invalid inference job transition: ${from} → ${to}. ` +
      `Valid transitions from ${from}: [${valid.join(', ')}]`
    );
  }
}
```

### Domain Errors

```typescript
// apps/api/src/domain/errors.ts
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

// Subclasses for specific domains
export class InferenceJobTransitionError extends DomainError { /* ... */ }
export class AnnotationGeometryError extends DomainError { /* ... */ }
export class PipelineValidationError extends DomainError { /* ... */ }
export class DatasetVersionLockedError extends DomainError { /* ... */ }
```

## Plans

### 14A-01: Core Domain Layer

**Objective:** Create the core domain layer (interfaces, domain errors, state machine).

**Tasks:**

1. Create `apps/api/src/domain/errors.ts` with `DomainError`, `InferenceJobTransitionError`, `AnnotationGeometryError`, `PipelineValidationError`, `DatasetVersionLockedError`
2. Create `apps/api/src/domain/inference-job-state-machine.ts` with `VALID_TRANSITIONS` map and `assertValidTransition()`
3. Create `apps/api/src/repositories/index.ts` exporting all repository interfaces
4. Create `apps/api/src/config/app-mode.ts` with `detectMode()` and adapter factory
5. Update all services to import `assertValidTransition` from domain layer
6. Add tests for state machine transitions covering all valid and invalid paths

**Files created/modified:**
- `apps/api/src/domain/errors.ts` (new)
- `apps/api/src/domain/inference-job-state-machine.ts` (new)
- `apps/api/src/repositories/index.ts` (new)
- `apps/api/src/config/app-mode.ts` (new)
- `apps/api/src/inference/inference.service.ts` (modify — use state machine)
- `apps/api/src/inference/inference.service.spec.ts` (new — state machine tests)

### 14A-02: Repository Implementations

**Objective:** Implement all repository interfaces with Prisma and in-memory concrete classes.

**Tasks:**

1. Create `apps/api/src/repositories/media.repository.ts` — interfaces + `PrismaMediaRepository` + `MemoryMediaRepository`
2. Create `apps/api/src/repositories/dataset.repository.ts` — interfaces + `PrismaDatasetRepository` + `MemoryDatasetRepository`
3. Create `apps/api/src/repositories/annotation.repository.ts` — interfaces + `PrismaAnnotationRepository` + `MemoryAnnotationRepository`
4. Create `apps/api/src/repositories/pipeline.repository.ts` — interfaces + `PrismaPipelineRepository` + `MemoryPipelineRepository`
5. Create `apps/api/src/repositories/inference.repository.ts` — interfaces + `PrismaInferenceRepository` + `MemoryInferenceRepository`
6. Create `apps/api/src/repositories/prediction.repository.ts` — interfaces + `PrismaPredictionRepository` + `MemoryPredictionRepository`
7. Create `apps/api/src/repositories/evaluation.repository.ts` — interfaces + `PrismaEvaluationRepository` + `MemoryEvaluationRepository`
8. Create `apps/api/src/repositories/storage.repository.ts` — interfaces + `MinioStorageRepository` + `LocalStorageRepository`
9. Create `apps/api/src/audit/audit-logger.ts` — interfaces + `PrismaAuditLogger` + `MemoryAuditLogger`
10. Create `apps/api/src/queues/job-queue.ts` — interfaces + `BullMqJobQueue` + `NoopJobQueue`
11. Write unit tests for each repository interface verifying both implementations

**Files created:**
- `apps/api/src/repositories/media.repository.ts`
- `apps/api/src/repositories/dataset.repository.ts`
- `apps/api/src/repositories/annotation.repository.ts`
- `apps/api/src/repositories/pipeline.repository.ts`
- `apps/api/src/repositories/inference.repository.ts`
- `apps/api/src/repositories/prediction.repository.ts`
- `apps/api/src/repositories/evaluation.repository.ts`
- `apps/api/src/repositories/storage.repository.ts`
- `apps/api/src/audit/audit-logger.ts`
- `apps/api/src/queues/job-queue.ts`
- `apps/api/src/repositories/*.spec.ts` (unit tests)

### 14A-03: Service Refactoring — Remove Environment Branching

**Objective:** Refactor all services to depend on interfaces, not concrete implementations.

**Tasks:**

1. Refactor `MediaService` — inject `MediaRepository` and `StorageRepository`, remove all `process.env.DATABASE_URL` branching
2. Refactor `DatasetsService` — inject `DatasetRepository`, remove branching
3. Refactor `AnnotationsService` — inject `AnnotationRepository`, remove branching
4. Refactor `PipelinesService` — inject `PipelineRepository`, remove branching
5. Refactor `InferenceService` — inject `InferenceRepository`, `PredictionRepository`, `JobQueue`, remove branching; extract `shouldUseBullMq()` logic to queue adapter
6. Refactor `EvaluationService` — inject `EvaluationRepository`, `PredictionRepository`, remove branching
7. Update all module providers to use adapter factory from `app-mode.ts`
8. Verify all existing tests still pass with new adapter pattern

**Files modified:**
- `apps/api/src/media/media.service.ts`
- `apps/api/src/media/media.module.ts`
- `apps/api/src/datasets/datasets.service.ts`
- `apps/api/src/datasets/datasets.module.ts`
- `apps/api/src/annotations/annotations.service.ts`
- `apps/api/src/annotations/annotations.module.ts`
- `apps/api/src/pipelines/pipelines.service.ts`
- `apps/api/src/pipelines/pipelines.module.ts`
- `apps/api/src/inference/inference.service.ts`
- `apps/api/src/inference/inference.module.ts`
- `apps/api/src/inference/evaluation.service.ts`
- `apps/api/src/inference/inference.module.ts`

### 14B-01: Zod Validation at API Boundaries

**Objective:** Validate annotation geometry and pipeline graph JSON at API boundary using Zod before persistence.

**Tasks:**

1. Ensure `BBoxGeometrySchema` from `@visionflow/contracts` is already Zod-validated (it is — shared package)
2. Create API-level validation DTOs in `apps/api/src/annotations/annotations.controller.ts` using class-validator + Zod hybrid approach
3. Ensure `PipelineDefinitionSchema` from `@visionflow/contracts` is used at API boundary for pipeline create/update
4. Add validation pipe to NestJS modules with custom validator that uses Zod schemas
5. Add explicit error messages for geometry validation failures (x/y must be >= 0, width/height must be > 0, box must be within image bounds)
6. Add integration tests verifying invalid geometries are rejected with structured errors

**Files modified:**
- `apps/api/src/annotations/annotations.controller.ts` (add Zod validation)
- `apps/api/src/pipelines/pipelines.controller.ts` (add Zod validation)
- `apps/api/src/validation/zod-validation.pipe.ts` (new — reusable Zod pipe for NestJS)
- `apps/api/src/inference/validation/inference-validation.pipe.ts` (new)

### 14B-02: Domain Invariants & Audit Completeness

**Objective:** Enforce domain invariants throughout and ensure audit logs for all important mutations.

**Tasks:**

1. Refactor `AnnotationService` to use domain-level validation — validate geometry against asset dimensions before repository call
2. Refactor `DatasetsService` to use `DatasetVersionLockedError` for lock-state violations instead of generic ConflictException
3. Add `assertDatasetVersionNotLocked()` helper in domain layer
4. Audit log for prediction persistence (new — currently missing)
5. Audit log for evaluation report creation (new — currently missing)
6. Add prediction traceability validation — ensure `PredictionRepository.create()` validates all traceability fields are populated
7. Update Prisma schema if needed for additional prediction traceability fields (check `metadataJson` covers this)
8. Add domain error tests verifying all invalid-state rejection paths

**Files modified:**
- `apps/api/src/domain/errors.ts` (add `DatasetVersionLockedError`)
- `apps/api/src/domain/inference-job-state-machine.ts` (add transition auditing)
- `apps/api/src/datasets/datasets.service.ts` (use domain errors)
- `apps/api/src/annotations/annotations.service.ts` (add geometry validation)
- `apps/api/src/inference/inference.service.ts` (add prediction audit log, evaluation audit log)
- `apps/api/src/domain/domain-errors.spec.ts` (new — domain error tests)

## Wave 1 (14A-01, 14B-01)

Tasks: Core domain layer + Zod validation at API boundaries.

Independent — no file overlap.

## Wave 2 (14A-02, 14B-02)

Tasks: Repository implementations + Domain invariants & audit completeness.

Independent — no file overlap.

## Wave 3 (14A-03)

Task: Service refactoring — biggest task, depends on Wave 1 and 2.

## Verification

1. `process.env.DATABASE_URL` does not appear in any `.service.ts` files
2. All services use constructor-injected repository interfaces
3. State machine rejects invalid transitions with `DomainError`
4. Zod validation rejects malformed annotation geometry and pipeline JSON
5. Prediction records include all traceability fields
6. Audit logs exist for: dataset lock, annotation CRUD, pipeline CRUD, inference job start/finish/fail, prediction persistence, evaluation report creation
7. Tests pass for all three waves
8. TypeScript compilation succeeds with no errors

## Risk Mitigation

- **Breaking existing tests:** Refactor in-place, keep interface signatures stable, verify tests after each service refactor
- **Circular dependencies:** Repository interfaces have no service dependencies — they only return domain types from `@visionflow/contracts`
- **Migration complexity:** No database migration needed — schema already supports all required fields via `metadataJson`
- **Performance regression:** Repository pattern adds one interface call per operation — negligible overhead
