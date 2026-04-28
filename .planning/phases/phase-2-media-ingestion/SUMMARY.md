# Phase 2 Summary, Media Ingestion

Status: Done

## Outcome

Implemented the first real ingestion path: upload a media file, validate it, hash it, store the original object, create metadata, record audit, queue processing, and show the workflow in the workbench.

## Delivered

- Shared media contracts for upload responses, accepted MIME types, media summaries, and processing job summaries.
- API `POST /api/projects/:projectId/media/upload` with multipart `file` input.
- MIME validation before storage work.
- SHA-256 checksum calculation and deterministic object key generation.
- Project-scoped checksum dedupe.
- MinIO-backed original object storage with explicit readiness errors.
- Prisma-backed `MediaAsset`, `MediaProcessingJob`, and `AuditLog` writes when `DATABASE_URL` is configured.
- In-memory fallback for media list/upload when no database is configured.
- CV worker contracts for `POST /cv/create-thumbnail` and `POST /cv/extract-frames`.
- Web Media tab uploader with drag/drop, local MIME validation, client checksum, duplicate state, progress/error rows, and seeded media rows.
- Vite manual chunk split for React Flow, Motion, and icons to remove the prior large chunk warning.

## Verification

- `pnpm verify` passed: typecheck, tests, and production build.
- `python -m pytest apps/cv-worker/tests -q` passed with 4 tests.
- API smoke passed: health, media list, unsupported MIME returns 400.
- Real-ingestion smoke passed with PostgreSQL and MinIO: first image upload returned 201 and created asset/job/audit rows; second upload returned 201 with `deduplicated: true`; MinIO object stat succeeded.
- Browser screenshot pass covered desktop/mobile Media tab and unsupported MIME UI state.

## Non-Goals Remaining

- Real thumbnail rendering into object storage.
- Real video frame extraction.
- BullMQ execution of media processing jobs.
- Auth/RBAC.
