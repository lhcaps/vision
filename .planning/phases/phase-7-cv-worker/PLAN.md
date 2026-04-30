# Phase 7 Plan, CV Worker

Status: passed
Date: 2026-05-01

## Goal

Turn the CV worker from a standalone mock endpoint into a typed worker slice used by inference orchestration: stable detector responses, explicit ONNX capability handling, evaluation metrics, worker-visible logs, and verification across Python, API, and web surfaces.

## Scope

- Add shared CV worker contracts for run-pipeline requests, detector responses, predictions, and evaluation metrics.
- Harden the FastAPI worker with deterministic mock detector output, capability metadata, explicit ONNX mode failure when runtime/model support is unavailable, and `/cv/evaluate-detections`.
- Connect the Nest inference worker path to the CV worker client, loading locked dataset asset IDs and media dimensions before dispatch.
- Persist prediction rows when the Prisma path is active and keep memory fallback deterministic for local no-worker tests.
- Surface worker runtime, prediction count, and evaluation readiness through existing Jobs logs without decorative UI churn.
- Preserve product UI quality: dense technical feedback, accessible states, reduced-motion respect, and no mobile horizontal overflow.

## Acceptance Criteria

- CV worker mock detections are deterministic and image-coordinate bounded.
- ONNX mode never silently falls back to mock; it returns an actionable unavailable/runtime/model error.
- Evaluation computes IoU-based precision, recall, F1, false positives, and false negatives.
- API inference jobs call the CV worker client with locked dataset assets and persisted pipeline definition.
- API worker logs include CV worker mode and prediction count.
- Root checks plus Python worker tests pass.

## Verification

- `pnpm --filter @visionflow/contracts test`
- `pnpm --filter @visionflow/api test`
- `pnpm --filter @visionflow/api typecheck`
- `pnpm --filter @visionflow/web typecheck`
- `python -m pytest apps/cv-worker/tests -q`
- `pnpm verify`
- Runtime smoke: API + CV worker create an inference job, SSE includes CV worker completion, final job reaches `SUCCEEDED` at `100`.
- Browser smoke: Jobs tab completes on desktop and 390px mobile without horizontal overflow.
