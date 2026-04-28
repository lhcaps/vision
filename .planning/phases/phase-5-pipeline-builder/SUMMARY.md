---
phase: 5
plan: Pipeline Builder
status: complete
completed: 2026-04-29
key-files:
  created:
    - apps/api/src/pipelines/pipelines.controller.ts
    - apps/api/src/pipelines/pipelines.module.ts
    - apps/api/src/pipelines/pipelines.service.ts
    - apps/api/src/pipelines/pipelines.service.test.ts
    - apps/web/src/lib/pipelines.ts
  modified:
    - packages/contracts/src/pipeline.ts
    - packages/contracts/src/__tests__/pipeline.test.ts
    - apps/api/src/app.module.ts
    - apps/api/src/main.ts
    - apps/web/src/App.tsx
    - apps/web/src/index.css
---

# Phase 5 Summary, Pipeline Builder

## What Changed

Phase 5 completed the pipeline builder vertical slice. Pipeline definitions now have typed create, update, validate, list, and summary contracts. Backend validation returns structured issue metadata plus graph summary fields while preserving the previous `errors[]` compatibility shape.

The API gained a dedicated pipelines module backed by the existing Prisma `Pipeline` model. It lists persisted pipelines, validates graph drafts without saving, creates valid definitions, updates existing definitions, and rejects invalid graphs before persistence. The in-memory path mirrors the workflow for no-database development.

The web Pipeline tab now syncs with the API, falls back cleanly to the demo graph, validates through the backend when available, saves persisted definitions, renders React Flow nodes from the active definition, highlights node and edge blockers, and exposes a focused node inspector for resize width, detector threshold/model binding, and NMS IoU.

## Verification

- `pnpm --filter @visionflow/contracts test` passed.
- `pnpm --filter @visionflow/contracts build` passed.
- `pnpm --filter @visionflow/api test` passed.
- `pnpm --filter @visionflow/api typecheck` passed.
- `pnpm --filter @visionflow/web typecheck` passed.
- `pnpm verify` passed.
- Browser smoke passed on `http://127.0.0.1:5175` with API on port `3105`; screenshots saved to `tmp/phase5-pipeline-desktop.png` and `tmp/phase5-pipeline-mobile.png`.

## Deviations

- `gsd-sdk` is unavailable in this environment because the global `@gsd-build/sdk` CLI target is missing, so the phase was executed inline while preserving the GSD artifacts manually.

## Self-Check

PASSED. Phase 5 now has real API persistence, backend graph validation, web inspector feedback, focused tests, and traceability artifacts.
