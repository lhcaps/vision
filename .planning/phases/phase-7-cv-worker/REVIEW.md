---
status: clean
phase: 7
phase_name: CV Worker
depth: deep
files_reviewed: 15
findings:
  critical: 0
  warning: 0
  info: 0
  fixed_during_review: 1
---

# Phase 7 Code Review

## Scope

Reviewed the Phase 7 CV worker changes across shared contracts, FastAPI worker endpoints, Nest worker client, inference orchestration, dataset/media module wiring, prediction persistence, tests, environment defaults, and planning artifacts.

## Open Findings

None.

## Fixed During Review

- The deterministic mock detector used minimum box dimensions that could exceed very small image dimensions. The FastAPI worker and API fallback now clamp mock boxes to asset bounds, and regression tests cover tiny-image geometry on both runtimes.

## Review Notes

- ONNX mode is intentionally fail-fast rather than partially stubbed. That keeps production behavior honest until a real model artifact and postprocess strategy are available.
- The memory fallback remains deterministic for local demos and tests, while the configured `CV_WORKER_URL` path exercises the external worker over HTTP.
- Prediction persistence is scoped to the Prisma-backed path. The memory path returns prediction counts for local observability without pretending to be durable storage.

## Verification

- `pnpm --filter @visionflow/contracts test`: passed, 28 tests.
- `python -m pytest apps/cv-worker/tests -q`: passed, 8 tests.
- `pnpm --filter @visionflow/api test`: passed, 23 tests.
- `pnpm --filter @visionflow/api typecheck`: passed.
- `pnpm --filter @visionflow/web typecheck`: passed.
- API + CV worker SSE smoke: passed, job `inference_job_proj_parking_lot_1777571638682_1` reached `SUCCEEDED` at `100` and surfaced CV worker prediction-count logs.
- Playwright Jobs smoke: passed for desktop and 390px mobile with no horizontal overflow, screenshots at `tmp/phase7-jobs-desktop-final.png` and `tmp/phase7-jobs-mobile-final.png`.
- `pnpm verify`: passed.
