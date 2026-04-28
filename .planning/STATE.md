# State

Current phase: Phase 5, Pipeline Builder.

Last updated: 2026-04-29.

## Completed

- Read `Vision Plan.docx` and derived the VisionFlow Studio vertical-slice plan.
- Installed local GSD/Codex artifacts for this repo.
- Created product and design context in `PRODUCT.md` and `DESIGN.md`.
- Built the pnpm/turbo monorepo with `apps/web`, `apps/api`, `apps/cv-worker`, `packages/contracts`, `packages/motion`, and `infra`.
- Implemented Phase 1 foundation: web workbench shell, API health/OpenAPI/demo routes, Prisma domain schema, CV mock endpoint, shared contracts, and root verification scripts.
- Implemented Phase 2 media ingestion: multipart API upload, MIME validation, SHA-256 checksum dedupe, MinIO original storage, Prisma metadata row, audit row, queued media processing job, CV thumbnail/frame contracts, and web uploader states.
- Implemented Phase 3 dataset versioning: shared contracts, Prisma/memory-backed dataset API, draft asset assignment, locked-version mutation rejection, computed split summaries, and upgraded Versions workbench UI.
- Implemented Phase 4 annotation engine: shared annotation contracts, API workspace/CRUD endpoints, Prisma and memory fallback service paths, image-coordinate BBox clamping, mutation audit logs, and annotation workbench UI with label selector, keyboard actions, and save queue.
- Completed a cross-screen UI polish audit after Phase 4, covering Overview, Media, Versions, Annotate, Pipeline, and Jobs across desktop, tablet, and mobile.
- Refined the workbench shell and detail components: calmer navigation rail, custom threshold slider, responsive media asset table, polished dataset version controls, custom asset selection controls, and mobile-friendly pipeline layout.
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
- Phase 4 focused checks passed: contracts tests, API tests, API typecheck, web typecheck, and web production build.
- Root `pnpm verify` passed after Phase 4: typecheck, tests, and production build.
- Playwright annotation smoke passed on port 5174: desktop created a new BBox from 3 to 4 rendered boxes, save queue accepted it, and mobile had no horizontal overflow. Screenshots are in `tmp/phase4-annotation-desktop.png` and `tmp/phase4-annotation-mobile.png`.
- UI audit screenshot sweep passed on port 5174 for Overview, Media, Versions, Annotate, Pipeline, and Jobs at 1920px, 900px, and 390px widths. No page-level horizontal overflow remained.
- Post-audit targeted screenshots passed for responsive Media and Pipeline mobile polish: `tmp/ui-audit-polished-mobile-media.png` and `tmp/ui-audit-polished-mobile-pipeline-final.png`.
- Docker Compose config validated.
- Local real-ingestion smoke passed with PostgreSQL and MinIO: first image upload created asset/job/audit rows, duplicate upload deduped by checksum, and MinIO object stat succeeded.
- Browser screenshot pass covered Media tab desktop/mobile and unsupported MIME UI state.

## Active Goals

- Plan and execute Phase 5: Pipeline Builder.
- Persist pipeline definitions through the API.
- Add API-side graph validation and inspector feedback.

## Known Partial Areas

- Pipeline UI exists through React Flow, but persistence and API-side validation are not implemented yet.
- Job UI shows simulated progress; BullMQ worker execution and streaming progress are not implemented yet.
