---
phase: 4
plan: 1
type: implementation
wave: 1
depends_on: [phase-3-dataset-versioning]
files_modified:
  - packages/contracts/src/annotations.ts
  - packages/contracts/src/index.ts
  - packages/contracts/src/__tests__/annotations.test.ts
  - apps/api/src/annotations/annotations.module.ts
  - apps/api/src/annotations/annotations.controller.ts
  - apps/api/src/annotations/annotations.service.ts
  - apps/api/src/annotations/annotations.service.test.ts
  - apps/api/src/app.module.ts
  - apps/api/src/main.ts
  - apps/web/src/lib/annotations.ts
  - apps/web/src/features/annotations/AnnotationEngine.tsx
  - apps/web/src/App.tsx
  - apps/web/src/index.css
  - docs/architecture/overview.md
  - docs/demo-script.md
requirements:
  - "Web UI with visible states for media, dataset versioning, annotation, pipeline execution, jobs, and evaluation."
  - "Prisma schema covering project, media assets, dataset versions, annotation sets, annotations, model artifacts, pipelines, inference jobs, predictions, evaluation reports, and audit logs."
  - "Shared contracts for bounding boxes, pipeline validation, inference job states, and media ingestion responses."
---

# Phase 4 Plan: Annotation Engine

<objective>
Implement a real bounding-box annotation vertical slice: typed annotation contracts, Nest API CRUD with Prisma and memory fallback, and a polished annotation workbench that stores boxes in image coordinates with label selection, keyboard actions, and an inspectable save queue.
</objective>

<tasks>
<task id="1" type="auto">
<name>Shared annotation contracts</name>
<read_first>
packages/contracts/src/geometry.ts
packages/contracts/src/project-snapshot.ts
packages/contracts/src/index.ts
</read_first>
<action>
Add annotation label, set, annotation summary, workspace, create/update request, and save-queue operation schemas. Export them from the contracts package and test that BBox geometry remains image-coordinate native.
</action>
<acceptance_criteria>
pnpm --filter @visionflow/contracts test -- --runInBand
</acceptance_criteria>
</task>

<task id="2" type="auto">
<name>Annotation API CRUD</name>
<read_first>
apps/api/src/datasets/datasets.service.ts
apps/api/src/datasets/datasets.controller.ts
infra/prisma/schema.prisma
</read_first>
<action>
Add an annotations module with workspace loading, default labels, default annotation set creation, create/update/delete endpoints, mutation audit logs, real Prisma path, and no-DATABASE_URL memory fallback for demo smokeability.
</action>
<acceptance_criteria>
pnpm --filter @visionflow/api test -- --runInBand
pnpm --filter @visionflow/api typecheck
</acceptance_criteria>
</task>

<task id="3" type="auto">
<name>Annotation workbench UI</name>
<read_first>
apps/web/src/App.tsx
apps/web/src/index.css
apps/web/src/lib/datasets.ts
PRODUCT.md
DESIGN.md
</read_first>
<action>
Replace the annotation scaffold with a professional image-coordinate canvas, label selector, keyboard shortcuts, queued create/update/delete operations, API sync with local fallback, and purposeful Motion-powered bbox state changes that respect reduced motion.
</action>
<acceptance_criteria>
pnpm --filter @visionflow/web typecheck
pnpm --filter @visionflow/web build
</acceptance_criteria>
</task>
</tasks>

<verification>
Run root `pnpm verify` and focused package checks. If browser tooling is available, smoke the annotation tab after the dev server starts.
</verification>

<success_criteria>

- Bounding boxes can be created, selected, nudged, relabeled, resized through geometry edits, queued, saved, updated, and deleted.
- API CRUD validates project/dataset/asset/label ownership and stores BBox geometry in image coordinates.
- UI communicates API, local fallback, queued, saving, saved, and failed states without decorative motion.
- Phase 4 summary and roadmap/state docs reflect completion evidence.
  </success_criteria>
