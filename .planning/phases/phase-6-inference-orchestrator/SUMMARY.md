# Phase 6 Summary, Inference Orchestrator

Status: passed
Date: 2026-04-29

## What Changed

- Added typed inference contracts for job creation, summaries, worker stages, progress events, and terminal-state helpers.
- Added `InferenceService` with project-scoped dataset/pipeline validation, Prisma persistence, memory fallback, BullMQ queue wiring, in-process worker execution, and SSE event history.
- Expanded inference API routes:
  - `GET /api/projects/:projectId/inference-jobs`
  - `POST /api/projects/:projectId/inference-jobs`
  - `GET /api/projects/:projectId/inference-jobs/:jobId`
  - `GET /api/projects/:projectId/inference-jobs/:jobId/events`
- Reworked the Jobs UI to resolve a locked dataset version plus valid persisted pipeline, create a backend job, subscribe to EventSource progress, show worker logs, and avoid fake client-side progress.
- Added responsive hardening for shrinkable panels and mobile nav containment.
- Added BullMQ configuration hints in `.env.example`.
- During final review, hardened the Jobs SSE client so a terminal snapshot no longer closes the stream before queued history and `complete` events are delivered.

## Key Files

- `.env.example`
- `packages/contracts/src/jobs.ts`
- `packages/contracts/src/__tests__/jobs.test.ts`
- `apps/api/src/inference/inference.service.ts`
- `apps/api/src/inference/inference.controller.ts`
- `apps/api/src/inference/inference.module.ts`
- `apps/api/src/inference/inference.service.test.ts`
- `apps/web/src/lib/inference.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/index.css`
- `apps/api/src/datasets/datasets.module.ts`
- `apps/api/src/pipelines/pipelines.module.ts`
- `.planning/phases/phase-6-inference-orchestrator/REVIEW.md`

## Verification Evidence

- `pnpm --filter @visionflow/contracts test` passed, 25 tests.
- `pnpm --filter @visionflow/api test` passed, 20 tests.
- `pnpm --filter @visionflow/api typecheck` passed.
- `pnpm --filter @visionflow/web typecheck` passed.
- `pnpm verify` passed after implementation and again after responsive fixes.
- API smoke passed on port 3109:
  - seeded job listed,
  - new job created,
  - SSE stream emitted completion,
  - final job status was `SUCCEEDED` with progress `100`.
- Browser smoke passed on API 3110 and web 5176:
  - Jobs run completed on desktop and 390px mobile,
  - no horizontal overflow,
  - screenshots saved to `tmp/phase6-jobs-desktop.png` and `tmp/phase6-jobs-mobile.png`.
- Final review rerun passed after the SSE terminal-snapshot fix:
  - API smoke on port 3109 created a job, consumed SSE, and confirmed `SUCCEEDED` at `100`.
  - Playwright browser smoke on web 5176 verified desktop and 390px mobile Jobs runs, completion logs, and no horizontal overflow.
  - Final screenshots: `tmp/phase6-jobs-desktop-final.png`, `tmp/phase6-jobs-mobile-final.png`.
  - Final `pnpm verify` passed.

## Notes

- BullMQ is active when Redis configuration is provided through `INFERENCE_QUEUE_MODE=bullmq`, `REDIS_URL`, or `REDIS_HOST`.
- Memory worker fallback remains intentional for local demos, unit tests, and no-Redis development.
- Prediction persistence remains a later phase; Phase 6 stages the orchestration contract and job progress truth source.
