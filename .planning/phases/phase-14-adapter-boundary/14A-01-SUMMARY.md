---
plan: 14A-01
phase: 14
status: complete
---

## Summary

Created the core domain layer for VisionFlow Studio as the foundation for Phase 14's goal of removing environment branching from business services. The domain layer establishes:

- **Domain errors** with structured context for debugging and `instanceof` checking
- **Inference job state machine** enforcing valid job lifecycle transitions
- **Repository interfaces** defining contracts between domain and data access layers
- **App mode configuration** for explicit production/demo selection at bootstrap

## Key Files Created

### Domain Layer (`apps/api/src/domain/`)

- `errors.ts` — Base `DomainError` class with `code` and `context` properties
  - `InferenceJobTransitionError` — thrown for invalid job state transitions
  - `ProgressRewindError` — thrown for invalid progress rewinds
  - `AnnotationGeometryError` — thrown for invalid annotation geometry
  - `PipelineValidationError` — thrown for invalid pipeline graphs
  - `DatasetVersionLockedError` — thrown when mutating locked dataset versions
- `inference-job-state-machine.ts` — State machine with:
  - `VALID_INFERENCE_TRANSITIONS` map
  - `assertValidInferenceTransition()` — validates state transitions
  - `assertValidProgress()` — validates progress monotonicity
  - Helper functions: `isValidInferenceTransition()`, `getValidNextStates()`, `isTerminalInferenceStatus()`
- `index.ts` — Barrel export for domain layer

### Repository Interfaces (`apps/api/src/repositories/`)

- `index.ts` — Repository interface definitions:
  - `MediaRepository` — media upload, listing, and retrieval
  - `StorageRepository` — object storage operations
  - `DatasetRepository` — dataset and version CRUD operations
  - `AnnotationRepository` — annotation workspace and CRUD
  - `PipelineRepository` — pipeline management
  - `InferenceRepository` — inference job management
  - `PredictionRepository` — prediction retrieval
  - `EvaluationRepository` — evaluation report management
  - `JobQueue` — job queue abstraction
  - `AuditLogger` — audit event logging

### Configuration (`apps/api/src/config/`)

- `app-mode.ts` — App mode detection:
  - `AppMode` type (`'production' | 'demo'`)
  - `detectMode()` — environment-based mode detection
  - `isProductionMode()` / `isDemoMode()` — helper predicates
- `index.ts` — Barrel export for config

### Tests (`apps/api/src/domain/`)

- `inference-job-state-machine.spec.ts` — Comprehensive test coverage

### Refactored

- `inference/inference.service.ts` — Now uses domain state machine instead of contracts helpers

## Key Decisions

1. **Domain errors use structured context** — Every error carries a `context` object with relevant metadata for debugging, making it easy to trace error origins.

2. **Separate error types for transitions and progress** — `InferenceJobTransitionError` for state transitions, `ProgressRewindError` for progress issues. Both extend `DomainError` for easy `instanceof` checking.

3. **Repository interfaces are typed with contracts types** — Interfaces use types from `@visionflow/contracts` to ensure compatibility with existing implementations.

4. **App mode detection is explicit** — Mode is detected from `APP_MODE` env var first, then `DATABASE_URL`, providing clear override capability.

5. **State machine transitions exclude FAILED from QUEUED** — Based on existing implementation, QUEUED can only transition to RUNNING or CANCELLED (not FAILED directly).

6. **Progress validation allows equal values** — Progress rewinds only throw when `next < current` (strict decrease), not when equal.

## Verification

- [x] Domain errors created with proper inheritance and context
- [x] State machine implemented with valid transitions and progress validation
- [x] Repository interfaces defined with all service methods
- [x] App mode detection working with environment variable priority
- [x] State machine tests pass (all transitions and edge cases covered)
- [x] InferenceService refactored to use domain layer

## Commits

```
03c363c feat(domain): add domain error classes
2ec1d0a feat(domain): add inference job state machine
707d284 feat(repositories): add repository interface definitions
fb904aa feat(config): add app mode detection
95e3354 refactor(inference): use domain state machine
ab51154 test(domain): add state machine unit tests
77bfc03 test(domain): fix state machine tests to match implementation
cfe9090 docs(phase-14): add 14A-01-SUMMARY.md
```
