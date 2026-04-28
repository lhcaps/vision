# State

Current phase: Phase 4, Annotation Engine.

Last updated: 2026-04-28.

## Completed

- Read `Vision Plan.docx` and derived the VisionFlow Studio vertical-slice plan.
- Installed local GSD/Codex artifacts for this repo.
- Created product and design context in `PRODUCT.md` and `DESIGN.md`.
- Built the pnpm/turbo monorepo with `apps/web`, `apps/api`, `apps/cv-worker`, `packages/contracts`, `packages/motion`, and `infra`.
- Implemented Phase 1 foundation: web workbench shell, API health/OpenAPI/demo routes, Prisma domain schema, CV mock endpoint, shared contracts, and root verification scripts.
- Implemented Phase 2 media ingestion: multipart API upload, MIME validation, SHA-256 checksum dedupe, MinIO original storage, Prisma metadata row, audit row, queued media processing job, CV thumbnail/frame contracts, and web uploader states.
- Implemented Phase 3 dataset versioning: shared contracts, Prisma/memory-backed dataset API, draft asset assignment, locked-version mutation rejection, computed split summaries, and upgraded Versions workbench UI.
- Stabilized Phase 3 dataset API runtime injection with explicit Nest `@Inject(...)` annotations after dev logs showed `DatasetsController.datasetsService` could be undefined.
- Pushed the current codebase to `https://github.com/lhcaps/Vision.git` on `main`.

## Verification Evidence

- `pnpm verify` passed: typecheck, tests, and production build.
- `python -m pytest apps/cv-worker/tests -q` passed with 4 tests.
- Phase 3 focused checks passed: contracts tests, API tests, API typecheck, and web typecheck.
- Dataset API memory fallback tests cover seeded timeline, split summary computation, duplicate assignment rejection, and locked-version rejection.
- Local API smoke on port 3101 passed for fallback dataset list, draft creation, asset assignment, lock, and post-lock HTTP 409 rejection.
- Post-hotfix port 3000 smoke passed for dataset list and version list after explicit injection fix.
- Playwright desktop/mobile smoke passed for the Versions workbench; screenshots are in `tmp/phase3-versions-desktop.png` and `tmp/phase3-versions-mobile.png`.
- Docker Compose config validated.
- Local real-ingestion smoke passed with PostgreSQL and MinIO: first image upload created asset/job/audit rows, duplicate upload deduped by checksum, and MinIO object stat succeeded.
- Browser screenshot pass covered Media tab desktop/mobile and unsupported MIME UI state.

## Active Goals

- Plan and execute Phase 4: Annotation Engine.
- Add bounding-box CRUD in image coordinates.
- Add annotation canvas, label selector, keyboard actions, and save queue.

## Known Partial Areas

- Annotation, pipeline, inference, prediction, evaluation, and audit schemas exist, but most workflows after dataset versioning are still demo/scaffold.
- Pipeline UI exists through React Flow, but persistence and API-side validation are not implemented yet.
- Job UI shows simulated progress; BullMQ worker execution and streaming progress are not implemented yet.
