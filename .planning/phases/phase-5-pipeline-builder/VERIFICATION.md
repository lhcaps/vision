---
phase: 5
status: passed
verified: 2026-04-29
---

# Phase 5 Verification, Pipeline Builder

## Result

Passed. Phase 5 achieves the roadmap goal: the Pipeline Builder now has React Flow UI, API-backed pipeline schema persistence, backend graph validation, and inspector feedback.

## Must-Haves Checked

- Shared pipeline contracts expose create, update, validate, list, summary, structured issue, and validation summary schemas.
- Backend validation checks schema shape, duplicate ids, input/output count, edge references, node connectivity, input reachability, output reachability, cycles, and detector model binding.
- API routes exist for list, validate, create, and update under `/api/projects/:projectId/pipelines`.
- API persistence uses the existing Prisma `Pipeline` model when `DATABASE_URL` is present and memory fallback when it is not.
- Invalid graphs are rejected before persistence.
- Web Pipeline tab loads API-backed definitions, validates through the backend when available, saves graph definitions, renders nodes from the active definition, and highlights validation issues.
- Pipeline inspector exposes selected-node controls for resize width, detector confidence/model binding, and NMS IoU.
- Desktop and mobile Pipeline tab smoke tests passed without page-level horizontal overflow.

## Automated Checks

- `pnpm --filter @visionflow/contracts test` passed.
- `pnpm --filter @visionflow/contracts build` passed.
- `pnpm --filter @visionflow/api test` passed.
- `pnpm --filter @visionflow/api typecheck` passed.
- `pnpm --filter @visionflow/web typecheck` passed.
- `pnpm verify` passed after the final UI polish.

## Runtime Smoke

- API dev server on port `3105` exposed the new pipeline routes.
- `GET /api/projects/proj_parking_lot/pipelines` returned the seeded pipeline with `validation.ok: true`.
- `POST /api/projects/proj_parking_lot/pipelines/validate` returned a structured `detector_missing_model` blocker for an unbound detector model.
- `POST /api/projects/proj_parking_lot/pipelines` created a valid memory-backed pipeline.
- Browser smoke on `http://127.0.0.1:5175` validated the graph, cleared the detector model to surface the backend blocker, rebound the model, saved the pipeline, and captured desktop/mobile screenshots:
  - `tmp/phase5-pipeline-desktop.png`
  - `tmp/phase5-pipeline-mobile.png`

## Residual Risk

- Prisma persistence was typechecked and implemented against the existing `Pipeline` model, but no live PostgreSQL migration/smoke was run in this pass.
- The API dev server smoke used memory fallback because no `DATABASE_URL` was set.
