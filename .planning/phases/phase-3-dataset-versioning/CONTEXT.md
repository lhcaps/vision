# Phase 3 Context, Dataset Versioning

Status: Ready to plan

## Goal

Implement real dataset versioning so media assets can be grouped into immutable dataset versions with split summaries and a timeline UI.

## Why This Phase Is Next

Phase 2 can now create real `MediaAsset` rows. The next product step from the V1 slice is to turn uploaded assets into dataset versions before annotation, pipeline execution, prediction, and evaluation.

## Existing Code To Reuse

- Prisma models already exist for `Dataset`, `DatasetVersion`, and `DatasetVersionAsset` in `infra/prisma/schema.prisma`.
- Shared project snapshot contracts already represent dataset and media state.
- The web workbench already has a seeded `DatasetPanel` that can become the real UI.
- The API already has module/controller/service patterns in `apps/api/src/projects`, `apps/api/src/media`, and `apps/api/src/inference`.

## Required Behavior

- A dataset is mutable identity; a dataset version is an immutable snapshot.
- Add assets to a draft version before it is locked.
- Once locked, a dataset version cannot be modified in place.
- Dataset version assets store split: `TRAIN`, `VALID`, `TEST`, or `UNASSIGNED`.
- Split summaries and asset counts must be computed from stored rows, not hardcoded UI state.
- API responses should use shared contracts where practical.

## Candidate API

- `POST /api/projects/:projectId/datasets`
- `GET /api/projects/:projectId/datasets`
- `POST /api/projects/:projectId/datasets/:datasetId/versions`
- `GET /api/projects/:projectId/datasets/:datasetId/versions`
- `POST /api/projects/:projectId/dataset-versions/:versionId/assets`
- `POST /api/projects/:projectId/dataset-versions/:versionId/lock`

## Quality Gates

- Locked versions reject asset assignment.
- Assets cannot be assigned twice to the same version.
- Split summaries match database rows.
- Demo fallback remains useful when `DATABASE_URL` is absent.
- Typecheck, tests, build, and focused API smoke pass.
