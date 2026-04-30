---
phase: 4
plan: 1
subsystem: annotation-engine
tags: [contracts, api, prisma, react, motion, save-queue]
requires: [phase-3-dataset-versioning]
provides: [annotation-crud, annotation-workspace, bbox-save-queue]
affects: [contracts, api, web, docs]
tech-stack:
  added: []
  patterns:
    - Zod annotation DTOs shared across API and web
    - Nest module with Prisma path and memory fallback
    - Motion-powered React workbench with reduced-motion support
key-files:
  created:
    - packages/contracts/src/annotations.ts
    - packages/contracts/src/__tests__/annotations.test.ts
    - apps/api/src/annotations/annotations.module.ts
    - apps/api/src/annotations/annotations.controller.ts
    - apps/api/src/annotations/annotations.service.ts
    - apps/api/src/annotations/annotations.service.test.ts
    - apps/web/src/lib/annotations.ts
    - apps/web/src/features/annotations/AnnotationEngine.tsx
  modified:
    - packages/contracts/src/index.ts
    - apps/api/src/app.module.ts
    - apps/api/src/main.ts
    - apps/web/src/App.tsx
    - apps/web/src/index.css
    - docs/architecture/overview.md
    - docs/demo-script.md
key-decisions:
  - The annotation API exposes a workspace endpoint so the UI can load the default annotation set, labels, asset metadata, and current boxes in one round trip.
  - API mutations use project-scoped ownership checks and audit rows on the Prisma path while preserving a no-DATABASE_URL memory fallback for local demoability.
  - The UI keeps save operations inspectable through a queue rather than hiding local edits behind optimistic success.
  - Post-phase UI polish standardized active states, table controls, threshold sliders, and responsive canvas behavior so the workbench feels like a coherent product UI.
requirements-completed:
  - 'Web UI with visible states for media, dataset versioning, annotation, pipeline execution, jobs, and evaluation.'
  - 'Prisma schema covering project, media assets, dataset versions, annotation sets, annotations, model artifacts, pipelines, inference jobs, predictions, evaluation reports, and audit logs.'
  - 'Shared contracts for bounding boxes, pipeline validation, inference job states, and media ingestion responses.'
duration: '1 session'
completed: '2026-04-28'
---

# Phase 4 Plan 1: Annotation Engine Summary

Implemented a real BBox annotation vertical slice for VisionFlow Studio.

## What Changed

- Added shared annotation contracts for labels, annotation sets, workspace payloads, create/update/delete requests, and save queue items.
- Added a Nest `AnnotationsModule` with:
  - `GET /api/projects/:projectId/dataset-versions/:versionId/annotation-workspace`
  - `POST /api/projects/:projectId/annotation-sets/:annotationSetId/annotations`
  - `PATCH /api/projects/:projectId/annotations/:annotationId`
  - `DELETE /api/projects/:projectId/annotations/:annotationId`
- Implemented project-scoped validation for annotation sets, media assets, and BBox labels.
- Stored BBox geometry in image coordinates and clamps boxes to image bounds before persistence.
- Wrote Prisma audit rows for create/update/delete annotation mutations.
- Preserved memory fallback for local demo runs without `DATABASE_URL`.
- Replaced the web annotation scaffold with an annotation engine workbench:
  - Image-coordinate canvas
  - Draw/select tools
  - Label selector
  - Asset selector
  - Geometry editor
  - Keyboard actions for mode, label selection, nudge, delete, and save
  - Inspectable save queue with queued/saving/saved/failed states
  - Reduced-motion friendly state transitions
- Completed a product UI polish pass across the workbench:
  - Quiet navigation rail active states
  - Custom threshold slider
  - Polished dataset version timeline and builder controls
  - Custom asset selection controls instead of native white checkboxes
  - Responsive media asset table with no page-level mobile overflow
  - Mobile pipeline graph layout that keeps all nodes legible

## Verification

- `pnpm --filter @visionflow/contracts test` passed: 6 test files, 19 tests.
- `pnpm --filter @visionflow/api test` passed: 3 test files, 11 tests.
- `pnpm --filter @visionflow/api typecheck` passed.
- `pnpm --filter @visionflow/web typecheck` passed.
- `pnpm --filter @visionflow/web build` passed.
- `pnpm verify` passed: root typecheck, tests, and production build.
- Playwright smoke passed on `http://127.0.0.1:5174/`:
  - Desktop annotation tab rendered.
  - Canvas interaction created a new BBox, increasing rendered boxes from 3 to 4.
  - Save queue accepted the created box.
  - Mobile annotation tab had no horizontal overflow (`scrollWidth` = `innerWidth` = 390).
  - Screenshots: `tmp/phase4-annotation-desktop.png`, `tmp/phase4-annotation-mobile.png`.
- Cross-screen UI audit passed on `http://127.0.0.1:5174/` for Overview, Media, Versions, Annotate, Pipeline, and Jobs at desktop, tablet, and mobile widths.
- Post-audit targeted screenshots passed:
  - `tmp/ui-audit-polished-mobile-media.png`
  - `tmp/ui-audit-polished-mobile-pipeline-final.png`
  - `tmp/version-builder-detail-polish-final-wide.png`
  - `tmp/version-builder-detail-polish-final-mobile.png`

## Deviations from Plan

- GSD SDK was unavailable because the global `@gsd-build/sdk` CLI module could not be resolved. The phase was executed inline using the GSD fallback flow.
- The first Playwright draw smoke started inside an existing BBox and correctly did not create a new box. The smoke was adjusted to draw on empty canvas space.

## Self-Check: PASSED

Phase 4 delivers the requested annotation CRUD, canvas, label selector, keyboard actions, save queue, professional UI polish, and verification evidence.
