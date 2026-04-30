# Phase 6 Plan, Inference Orchestrator

Status: complete
Date: 2026-04-29

## Goal

Replace preview-only inference with a real orchestrator slice: typed job creation, queued worker execution, explicit state transitions, server-sent progress, and a Jobs workbench that follows backend truth.

## Scope

- Extend shared job contracts with create requests, job summaries, worker stages, stream events, terminal-state helpers, and progress guards.
- Add a Nest inference service that validates locked dataset versions and persisted valid pipelines before job creation.
- Add BullMQ queue and worker wiring, with a memory worker fallback for local no-Redis runs and tests.
- Persist Prisma inference jobs when `DATABASE_URL` is configured; use seeded memory jobs otherwise.
- Expose job list, create, detail, and SSE progress endpoints.
- Replace client-side simulated progress with API job creation and EventSource updates in the Jobs UI.
- Preserve professional product UI quality: inspectable logs, status/source pills, responsive layout, no mobile horizontal overflow.

## Acceptance Criteria

- Inference job creation rejects missing pipelines and draft dataset versions.
- Worker transitions are explicit: `QUEUED -> RUNNING -> SUCCEEDED` or `FAILED`.
- Progress remains integer bounded from 0 to 100.
- SSE emits snapshot/progress/log/complete events.
- Jobs UI does not fake progress when the API is unavailable.
- Desktop and mobile Jobs tab complete a backend-created job without horizontal overflow.

## Verification

- `pnpm --filter @visionflow/contracts test`
- `pnpm --filter @visionflow/api test`
- `pnpm --filter @visionflow/api typecheck`
- `pnpm --filter @visionflow/web typecheck`
- `pnpm verify`
- API smoke on port 3109: create job, consume SSE, confirm `SUCCEEDED` at 100%.
- Browser smoke on API 3110 and web 5176: Jobs tab run completes on desktop and 390px mobile with no horizontal overflow.
