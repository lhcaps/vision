---
phase: 5
name: Pipeline Builder
status: complete
created: 2026-04-29
updated: 2026-04-29
requirements:
  - pipeline-persistence
  - pipeline-api-validation
  - pipeline-inspector-feedback
---

# Phase 5 Plan, Pipeline Builder

<objective>
Complete the Pipeline Builder vertical slice by moving the existing seeded React Flow graph into a typed, persisted, backend-validated workflow with useful graph inspector feedback.
</objective>

<tasks>

## 1. Shared Pipeline Contracts

- Expand pipeline validation output from a flat `errors[]` list into structured issue metadata, warnings, and graph summary fields.
- Keep `errors[]` for existing compatibility.
- Add create, update, validate, list, and summary schemas for pipeline API responses.
- Cover detector model binding, graph cycles, duplicate ids, reachability, node connectivity, and input/output count.

## 2. API Persistence And Validation

- Add `PipelinesModule`, controller, service, and memory fallback.
- Expose:
  - `GET /api/projects/:projectId/pipelines`
  - `POST /api/projects/:projectId/pipelines/validate`
  - `POST /api/projects/:projectId/pipelines`
  - `PATCH /api/projects/:projectId/pipelines/:pipelineId`
- Persist valid definitions to the existing Prisma `Pipeline` model.
- Write audit logs on create and update when the database path is active.
- Reject invalid graphs before persistence.

## 3. Workbench UI Upgrade

- Add a web pipeline API client.
- Load persisted pipelines when API is available, with local fallback if not.
- Add backend validate and save actions.
- Render graph nodes from the active definition instead of hard-coded React Flow nodes.
- Add selected-node inspector controls for resize width, detector confidence/model binding, and NMS IoU.
- Surface validation blockers with node and edge highlighting.
- Keep motion purposeful, fast, and reduced-motion safe.

## 4. Verification

- Add focused contract tests for structured validation.
- Add focused API tests for memory fallback, create, update, invalid graph rejection, and project-scoped update rejection.
- Run targeted typecheck/tests and the root verification gate.
- Review diff for accidental unrelated changes before commit and push.

</tasks>

<success_criteria>

- Pipeline definitions can be created and updated through the API.
- Invalid graphs are rejected by backend validation before persistence.
- The web Pipeline tab can validate and save a graph, and it shows actionable inspector feedback.
- Existing dataset, annotation, media, and build checks continue to pass.
- Phase tracking files reflect Phase 5 completion.

</success_criteria>
