# Phase 3 Summary, Dataset Versioning

Status: Done

## Outcome

Implemented the dataset versioning vertical slice: datasets now act as mutable identities, draft dataset versions accept asset assignment, locked versions reject mutation, split summaries are computed from version asset rows, and the Versions tab exposes the workflow as a dense technical workbench.

## Delivered

- Shared dataset contracts in `@visionflow/contracts` for dataset summaries, version summaries, split summaries, create requests, asset assignment requests, lock responses, and immutable draft guards.
- Nest `DatasetsModule` with:
  - `POST /api/projects/:projectId/datasets`
  - `GET /api/projects/:projectId/datasets`
  - `POST /api/projects/:projectId/datasets/:datasetId/versions`
  - `GET /api/projects/:projectId/datasets/:datasetId/versions`
  - `POST /api/projects/:projectId/dataset-versions/:versionId/assets`
  - `POST /api/projects/:projectId/dataset-versions/:versionId/lock`
- Prisma-backed service path with project ownership checks, asset ownership checks, duplicate assignment rejection, locked-version rejection, computed split summaries, and audit logs.
- In-memory demo fallback when `DATABASE_URL` is absent, including seeded locked versions and a draft version.
- API tests for seeded fallback, split summary computation, duplicate assignment rejection, and locked-version rejection.
- Versions workbench UI with API/fallback sync state, version timeline, split bars, draft creation, asset selection, split assignment, lock action, loading/error states, and reduced-motion-safe feedback.
- CV worker pytest import harness fix so root-level `python -m pytest apps/cv-worker/tests -q` works consistently.
- Architecture and demo docs updated for dataset versioning.

## Verification

- `pnpm --filter @visionflow/contracts test` passed.
- `pnpm --filter @visionflow/api test` passed.
- `pnpm --filter @visionflow/api typecheck` passed.
- `pnpm --filter @visionflow/web typecheck` passed.
- `pnpm verify` passed: typecheck, tests, and production build.
- `python -m pytest apps/cv-worker/tests -q` passed with 4 tests.
- Local API smoke on port 3101 passed: dataset fallback listed, draft `v5` created, TRAIN assignment counted as 1, lock returned `LOCKED`, and assigning after lock returned HTTP 409.
- Playwright UI smoke passed on desktop and mobile for the Versions workbench, with screenshots in `tmp/phase3-versions-desktop.png` and `tmp/phase3-versions-mobile.png`.

## Deviations from Plan

- `gsd-sdk` global is currently broken on this machine: it points to missing module `@gsd-build/sdk/dist/cli.js`. The phase was planned and executed inline using the local GSD workflow files and skill adapter.
- The pytest command in the plan initially failed because `apps/cv-worker/src` was not on `sys.path` when pytest ran from repo root. Added `apps/cv-worker/tests/conftest.py` so the documented root-level command passes.
- No git commit was created during this Codex turn; changes remain in the working tree for review.

## Next Phase Readiness

Phase 4, Annotation Engine, can now consume locked dataset versions as the stable unit for bounding-box annotation sets.
