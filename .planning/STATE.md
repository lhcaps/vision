# State

Current phase: Phase 8, Prediction Overlay And Evaluation.

Last updated: 2026-05-01.

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
- Implemented Phase 5 pipeline builder: typed pipeline contracts, structured graph validation, API persistence through Prisma/memory paths, mutation audit logging, API sync/save/validate web client, and a polished React Flow inspector with node parameter controls and validation highlighting.
- Implemented Phase 6 inference orchestrator: typed job creation and stream contracts, locked dataset and valid pipeline validation, BullMQ queue wiring with memory fallback, explicit async worker transitions, SSE job progress, API job list/detail/create routes, and a Jobs workbench that follows backend truth.
- Completed final Phase 6 review and fixed terminal snapshot stream handling so fast-completing jobs still replay worker history and completion logs in the browser.
- Implemented Phase 7 CV worker integration: shared CV worker contracts, FastAPI capability metadata, deterministic thresholded mock detections, explicit ONNX unavailable/runtime/model failures without silent fallback, IoU evaluation metrics, API dispatch from inference jobs to the worker, prediction persistence on the Prisma path, and Jobs logs with worker mode/count evidence.
- Implemented Phase 8 prediction overlay and evaluation: evaluation contracts, evaluation service with Prisma and memory fallback paths, CvWorkerClient.evaluate() method, API routes for GET/PRED evaluation and job predictions, PredictionOverlayCanvas component with GT/prediction toggle layers, EvaluationMetricsPanel with color-coded metric blocks and per-class breakdown, upgraded JobsPanel with real overlay and metrics integration, and full App.tsx state wiring.

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
- Phase 5 focused checks passed: contracts tests/build, API tests/typecheck, web typecheck, root `pnpm verify`, API pipeline endpoint smoke on port 3105, and Playwright Pipeline tab smoke on port 5175.
- Playwright annotation smoke passed on port 5174: desktop created a new BBox from 3 to 4 rendered boxes, save queue accepted it, and mobile had no horizontal overflow. Screenshots are in `tmp/phase4-annotation-desktop.png` and `tmp/phase4-annotation-mobile.png`.
- Playwright pipeline smoke passed on port 5175: backend validation passed, detector model clearing surfaced a backend blocker, model rebinding saved the pipeline, and desktop/mobile had no horizontal overflow. Screenshots are in `tmp/phase5-pipeline-desktop.png` and `tmp/phase5-pipeline-mobile.png`.
- UI audit screenshot sweep passed on port 5174 for Overview, Media, Versions, Annotate, Pipeline, and Jobs at 1920px, 900px, and 390px widths. No page-level horizontal overflow remained.
- Post-audit targeted screenshots passed for responsive Media and Pipeline mobile polish: `tmp/ui-audit-polished-mobile-media.png` and `tmp/ui-audit-polished-mobile-pipeline-final.png`.
- Docker Compose config validated.
- Local real-ingestion smoke passed with PostgreSQL and MinIO: first image upload created asset/job/audit rows, duplicate upload deduped by checksum, and MinIO object stat succeeded.
- Browser screenshot pass covered Media tab desktop/mobile and unsupported MIME UI state.
- Phase 6 focused checks passed: contracts tests, API tests, API typecheck, web typecheck, API SSE smoke, Playwright Jobs desktop/mobile smoke, and root `pnpm verify`.
- Phase 7 focused checks passed: contracts tests, CV worker pytest suite, API tests, API typecheck, web typecheck, API + CV worker SSE smoke, Playwright Jobs desktop/mobile smoke, and root `pnpm verify`.
- Phase 8 focused checks passed: 28 contracts tests, 23 API tests, all 4 package typechecks, root `pnpm verify` with production build.

## Active Goals

- Plan Phase 9: Timeline Replay and Motion Polish.

## Known Partial Areas

- BullMQ live smoke still needs a Redis-backed environment; local verification used the intentional memory worker fallback.
- ONNX inference execution remains gated until a model artifact and postprocess configuration are supplied; Phase 7 intentionally fails loudly instead of falling back to mock.
