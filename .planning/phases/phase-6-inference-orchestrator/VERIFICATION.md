# Phase 6 Verification, Inference Orchestrator

Status: passed
Date: 2026-04-29

## Goal Check

Phase 6 required a BullMQ-oriented inference queue, explicit worker state machine, and SSE or WebSocket progress. The implemented slice now creates backend inference jobs from locked dataset versions and persisted valid pipelines, executes them through the queue worker path or memory fallback, and streams progress to the Jobs UI through SSE.

## Must-Haves

- BullMQ queue: passed. `bullmq` is installed in `@visionflow/api`, and `InferenceService` creates a `Queue` plus `Worker` when Redis queue mode is configured.
- Worker state machine: passed. Shared contracts guard transitions and progress bounds; API tests cover queued-to-completed execution plus invalid draft dataset rejection.
- SSE progress: passed. `GET /api/projects/:projectId/inference-jobs/:jobId/events` streams snapshot, log, progress, and complete/error events.
- Backend truth in UI: passed. Jobs UI now creates API jobs and subscribes through `EventSource`; the previous client timer was removed.
- Terminal history handling: passed after final review. The client keeps the EventSource open for terminal snapshots and only closes on explicit `complete` or `error` events, so fast-completing jobs still show worker history.
- Responsive polish: passed. Browser smoke verified desktop and 390px mobile Jobs flows without page-level horizontal overflow.

## Automated Checks

- `pnpm --filter @visionflow/contracts test`: passed.
- `pnpm --filter @visionflow/api test`: passed.
- `pnpm --filter @visionflow/api typecheck`: passed.
- `pnpm --filter @visionflow/web typecheck`: passed.
- `pnpm verify`: passed.

## Runtime Smokes

- API smoke on port 3109:
  - `GET /api/health` became ready.
  - `GET /api/projects/proj_parking_lot/inference-jobs` returned the seeded job.
  - `POST /api/projects/proj_parking_lot/inference-jobs` created a new job for `dataset_proj_parking_lot_parking_v3` and `pipeline_proj_parking_lot_parking_detector`.
  - SSE events included completion.
  - Final job was `SUCCEEDED` at `100`.
- Browser smoke:
  - API on 3110, web on 5176.
  - Desktop and 390px mobile Jobs tab runs reached `SUCCEEDED`.
  - Horizontal overflow check returned false.
  - Screenshots: `tmp/phase6-jobs-desktop.png`, `tmp/phase6-jobs-mobile.png`.
- Final review smoke on 2026-05-01:
  - API on 3109, web on 5176.
  - SSE event types included `snapshot`, `log`, `progress`, and `complete`.
  - Desktop and 390px mobile Jobs tab runs reached `SUCCEEDED` and displayed `Inference job completed successfully.`
  - Horizontal overflow check returned false for both viewports.
  - Screenshots: `tmp/phase6-jobs-desktop-final.png`, `tmp/phase6-jobs-mobile-final.png`.
  - `pnpm verify` passed.

## Residual Risk

- The BullMQ path is implemented but the live smoke used memory mode because Redis was not required for the local no-DB verification path.
- Prediction row persistence is intentionally deferred to the prediction overlay and evaluation phases.
