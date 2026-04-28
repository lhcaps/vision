# Phase 2 Plan, Media Ingestion

## Goal

Implement the first real ingestion vertical slice: validate a media file, compute checksum, store the original object, create metadata rows, record audit, enqueue thumbnail or frame extraction, and expose the workflow in the web workbench.

## Scope

- Contracts for upload responses, media status, processing jobs, checksum summaries, and client-side validation.
- API `POST /api/projects/:projectId/media/upload` with multipart file input.
- Deterministic object key: `projects/{projectId}/originals/{sha256}.{ext}`.
- Project-scoped checksum dedupe.
- Prisma-backed repository when `DATABASE_URL` is configured.
- MinIO-backed storage with explicit readiness errors.
- Processing job row for thumbnail or frame extraction readiness.
- CV worker endpoint for thumbnail job contract.
- Web media uploader with drag/drop, progress, local MIME validation, duplicate feedback, error state, and uploaded rows.

## Non-Goals

- Real video frame extraction.
- Full BullMQ worker execution.
- Real image thumbnail rendering in object storage.
- Auth, RBAC, billing, collaboration.

## Verification

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `python -m pytest apps/cv-worker/tests -q`
- API health smoke
- Browser screenshot pass for media uploader desktop and mobile
