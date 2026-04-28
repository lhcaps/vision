# State

Current phase: Phase 3, Dataset Versioning.

Last updated: 2026-04-28.

## Completed

- Read `Vision Plan.docx` and derived the VisionFlow Studio vertical-slice plan.
- Installed local GSD/Codex artifacts for this repo.
- Created product and design context in `PRODUCT.md` and `DESIGN.md`.
- Built the pnpm/turbo monorepo with `apps/web`, `apps/api`, `apps/cv-worker`, `packages/contracts`, `packages/motion`, and `infra`.
- Implemented Phase 1 foundation: web workbench shell, API health/OpenAPI/demo routes, Prisma domain schema, CV mock endpoint, shared contracts, and root verification scripts.
- Implemented Phase 2 media ingestion: multipart API upload, MIME validation, SHA-256 checksum dedupe, MinIO original storage, Prisma metadata row, audit row, queued media processing job, CV thumbnail/frame contracts, and web uploader states.
- Pushed the current codebase to `https://github.com/lhcaps/Vision.git` on `main`.

## Verification Evidence

- `pnpm verify` passed: typecheck, tests, and production build.
- `python -m pytest apps/cv-worker/tests -q` passed with 4 tests.
- Docker Compose config validated.
- Local real-ingestion smoke passed with PostgreSQL and MinIO: first image upload created asset/job/audit rows, duplicate upload deduped by checksum, and MinIO object stat succeeded.
- Browser screenshot pass covered Media tab desktop/mobile and unsupported MIME UI state.

## Active Goals

- Plan and execute Phase 3: Dataset Versioning.
- Keep dataset identity separate from immutable dataset versions.
- Add API contracts and UI flow for version creation, asset assignment, split summaries, and version timeline.

## Known Partial Areas

- Dataset, annotation, pipeline, inference, prediction, evaluation, and audit schemas exist, but most workflows after media ingestion are still demo/scaffold.
- Pipeline UI exists through React Flow, but persistence and API-side validation are not implemented yet.
- Job UI shows simulated progress; BullMQ worker execution and streaming progress are not implemented yet.
