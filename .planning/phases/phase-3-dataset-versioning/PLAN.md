---
phase: phase-3-dataset-versioning
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/contracts/src/datasets.ts
  - packages/contracts/src/index.ts
  - packages/contracts/src/__tests__/datasets.test.ts
  - apps/api/src/datasets/datasets.controller.ts
  - apps/api/src/datasets/datasets.module.ts
  - apps/api/src/datasets/datasets.service.ts
  - apps/api/src/datasets/datasets.service.test.ts
  - apps/api/src/app.module.ts
  - apps/api/src/main.ts
  - apps/web/src/App.tsx
  - apps/web/src/lib/datasets.ts
  - docs/architecture/overview.md
  - docs/demo-script.md
autonomous: true
requirements:
  - REQ-DATASET-VERSIONING
user_setup: []
must_haves:
  truths:
    - 'A dataset is mutable identity while dataset versions are immutable snapshots.'
    - 'Draft dataset versions accept asset assignment with TRAIN, VALID, TEST, or UNASSIGNED splits.'
    - 'Locked dataset versions reject further asset assignment.'
    - 'The same asset cannot be assigned twice to the same dataset version.'
    - 'Split summaries are computed from version asset rows, not hardcoded UI constants.'
    - 'When DATABASE_URL is absent, the API still exposes a useful demo dataset versioning fallback.'
  artifacts:
    - path: 'packages/contracts/src/datasets.ts'
      provides: 'Shared dataset DTO schemas, split summaries, and immutable rule helpers'
      min_lines: 80
      contains: 'DatasetVersionSummarySchema'
    - path: 'apps/api/src/datasets/datasets.service.ts'
      provides: 'Prisma-backed and memory-backed dataset versioning workflow'
      min_lines: 160
      contains: 'assignAssets'
    - path: 'apps/web/src/App.tsx'
      provides: 'Version timeline UI with draft, split summary, assignment, and lock actions'
      min_lines: 1000
      contains: 'DatasetPanel'
  key_links:
    - from: 'apps/api/src/datasets/datasets.controller.ts'
      to: 'packages/contracts/src/datasets.ts'
      via: 'Zod request and response schemas'
      pattern: 'DatasetVersionSummarySchema'
    - from: 'apps/web/src/lib/datasets.ts'
      to: '/api/projects/:projectId/datasets'
      via: 'fetch client'
      pattern: 'dataset-versions'
---

# Phase 3 Plan, Dataset Versioning

<objective>
Implement a real dataset versioning vertical slice for VisionFlow Studio.

Purpose: Media ingestion now creates real MediaAsset rows. The next product engine step is to group those assets into draft dataset versions, lock immutable snapshots, compute split summaries, and expose the timeline in the workbench.

Output: Shared contracts, API endpoints, API tests, web client helpers, a dense dataset timeline UI, docs, and GSD summary.
</objective>

<execution_context>
@D:/Study/Project/Vision/.codex/get-shit-done/workflows/execute-plan.md
@D:/Study/Project/Vision/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/phase-3-dataset-versioning/CONTEXT.md
@PRODUCT.md
@DESIGN.md
@docs/architecture/overview.md
@docs/decisions/0001-vertical-slice.md
@infra/prisma/schema.prisma
@packages/contracts/src/media.ts
@packages/contracts/src/project-snapshot.ts
@apps/api/src/media/media.service.ts
@apps/api/src/media/media.controller.ts
@apps/api/src/projects/demo-snapshot.ts
@apps/web/src/App.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add shared dataset versioning contracts</name>
  <files>packages/contracts/src/datasets.ts, packages/contracts/src/index.ts, packages/contracts/src/__tests__/datasets.test.ts</files>
  <read_first>packages/contracts/src/media.ts, packages/contracts/src/index.ts, packages/contracts/src/__tests__/media.test.ts</read_first>
  <action>Create dataset DTO schemas for datasets, version summaries, split summaries, create requests, asset assignment requests, and lock responses. Reuse DatasetSplitSchema from media contracts. Add helper functions that create an empty split summary, accumulate split counts from stored rows, and assert a version is still draft before mutation. Export the new module from packages/contracts/src/index.ts.</action>
  <verify>pnpm --filter @visionflow/contracts test -- --runInBand is attempted, then use pnpm --filter @visionflow/contracts test if the runner does not support the flag.</verify>
  <acceptance_criteria>
    - packages/contracts/src/datasets.ts contains "DatasetVersionSummarySchema"
    - packages/contracts/src/datasets.ts contains "assertDraftDatasetVersion"
    - packages/contracts/src/__tests__/datasets.test.ts contains "computes split summaries"
    - packages/contracts/src/index.ts exports "./datasets"
  </acceptance_criteria>
  <done>Contracts compile and dataset contract tests cover split summary and immutable draft guard behavior.</done>
</task>

<task type="auto">
  <name>Task 2: Implement dataset versioning API</name>
  <files>apps/api/src/datasets/datasets.controller.ts, apps/api/src/datasets/datasets.module.ts, apps/api/src/datasets/datasets.service.ts, apps/api/src/datasets/datasets.service.test.ts, apps/api/src/app.module.ts, apps/api/src/main.ts</files>
  <read_first>apps/api/src/media/media.service.ts, apps/api/src/media/media.controller.ts, apps/api/src/projects/demo-snapshot.ts, apps/api/src/app.module.ts, apps/api/src/main.ts, infra/prisma/schema.prisma</read_first>
  <action>Add a DatasetsModule with endpoints for creating/listing datasets, creating/listing versions, assigning assets to a draft version, and locking a version. Use Prisma when DATABASE_URL is set and an in-memory seeded fallback when it is absent. In Prisma mode, verify the dataset belongs to the project, verify assigned assets belong to the same project, reject locked versions, reject duplicate assignment, compute split summaries from DatasetVersionAsset rows, and create audit logs for mutations. Add focused service tests for the memory fallback path, duplicate assignment, and locked-version rejection. Register the module and Swagger tag.</action>
  <verify>pnpm --filter @visionflow/api test</verify>
  <acceptance_criteria>
    - apps/api/src/datasets/datasets.controller.ts contains "dataset-versions"
    - apps/api/src/datasets/datasets.service.ts contains "Version is locked"
    - apps/api/src/datasets/datasets.service.ts contains "DATASET_VERSION_LOCKED"
    - apps/api/src/datasets/datasets.service.test.ts contains "rejects assigning assets to a locked version"
    - apps/api/src/app.module.ts imports DatasetsModule
  </acceptance_criteria>
  <done>API endpoints are typed, tested, and wired into the Nest app.</done>
</task>

<task type="auto">
  <name>Task 3: Upgrade the dataset timeline UI</name>
  <files>apps/web/src/App.tsx, apps/web/src/lib/datasets.ts</files>
  <read_first>apps/web/src/App.tsx, apps/web/src/lib/media-upload.ts, DESIGN.md, PRODUCT.md</read_first>
  <action>Add dataset API client helpers, then replace the static DatasetPanel with a stateful version workbench. The UI should fetch or fall back to seeded dataset versions, show a version timeline, draft/locked state, split summary bars, selectable staged assets, split assignment controls, a create draft action, a lock action, loading/error states, focus-visible controls, and reduced-motion-safe state transitions. Keep the product UI dense and technical; no landing-page hero treatment.</action>
  <verify>pnpm --filter @visionflow/web typecheck</verify>
  <acceptance_criteria>
    - apps/web/src/lib/datasets.ts contains "lockDatasetVersion"
    - apps/web/src/App.tsx contains "Assign to draft"
    - apps/web/src/App.tsx contains "Lock version"
    - apps/web/src/App.tsx contains "splitSummary"
    - apps/web/src/App.tsx does not contain "Version diff"
  </acceptance_criteria>
  <done>Dataset tab demonstrates real Phase 3 behavior and remains aligned with the existing workbench design language.</done>
</task>

<task type="auto">
  <name>Task 4: Update docs and phase summary</name>
  <files>docs/architecture/overview.md, docs/demo-script.md, .planning/phases/phase-3-dataset-versioning/SUMMARY.md, .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md</files>
  <read_first>docs/architecture/overview.md, docs/demo-script.md, .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md</read_first>
  <action>Document the dataset versioning path and demo steps. Create the Phase 3 SUMMARY.md with delivered work, verification evidence, deviations, and next-phase readiness. Update STATE.md and ROADMAP.md to mark Phase 3 done and Phase 4 next. Requirements should no longer list dataset versioning as deferred.</action>
  <verify>Test, typecheck, and build verification commands complete successfully, or any failure is recorded with exact cause and follow-up.</verify>
  <acceptance_criteria>
    - docs/architecture/overview.md contains "Dataset Versioning Path"
    - docs/demo-script.md contains "Create or select a draft dataset version"
    - .planning/phases/phase-3-dataset-versioning/SUMMARY.md contains "Status: Done"
    - .planning/ROADMAP.md contains "Phase 3, Dataset Versioning - Done"
    - .planning/STATE.md contains "Phase 3 dataset versioning"
  </acceptance_criteria>
  <done>Planning artifacts reflect the completed Phase 3 scope and next phase is clear.</done>
</task>

</tasks>

<verification>
- [ ] pnpm --filter @visionflow/contracts test
- [ ] pnpm --filter @visionflow/api test
- [ ] pnpm --filter @visionflow/web typecheck
- [ ] pnpm verify
- [ ] python -m pytest apps/cv-worker/tests -q
</verification>

<success_criteria>

- Dataset contracts are exported and tested.
- API supports dataset identity, draft versions, split assignment, locked immutability, duplicate rejection, and computed split summaries.
- Demo fallback remains useful when DATABASE_URL is absent.
- Dataset tab exposes create draft, assign assets, split summary, and lock flow with professional product UI polish.
- Phase 3 docs and planning artifacts are updated.
  </success_criteria>

<output>
After completion, create `.planning/phases/phase-3-dataset-versioning/SUMMARY.md`.
</output>
