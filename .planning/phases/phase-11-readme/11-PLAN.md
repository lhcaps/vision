---
name: 'Phase 11: README & Portfolio First Impression'
phase: 11
phase_slug: readme
padded_phase: '11'
status: planned
date: 2026-05-01
goal: 'Eliminate the portfolio killer — a repository with no professional README. Deliver a polished entry point that communicates vision, architecture, setup, and capabilities at a glance.'
requirements_addressed: ['PORT-01', 'PORT-02', 'PORT-03', 'PORT-04', 'PORT-05', 'PORT-06']
---

# Phase 11 Plan — README & Portfolio First Impression

Status: planned
Date: 2026-05-01

## Goal

Deliver a portfolio-grade README that makes a professional first impression. The current README has correct structure but lacks the polish that signals engineering maturity: no demo assets, no visual architecture diagram, no implemented-vs-planned distinction, wrong API port number (3000 vs 3100), and no known limitations section. This plan upgrades the README to professional standard.

## Design Register

Portfolio README. This is the first thing a recruiter or hiring manager sees. It must answer: What is it? What does it look like? How does it work? How do I run it? What's real vs planned? What are the limits? The architecture diagram should show the full data flow so reviewers understand the system design immediately. Demo assets (GIF or screenshot) make the product tangible. Known limitations demonstrate honesty about the prototype state.

## Wave 1 — README Content Upgrade

### Plan 11-01: Professional README with Demo Assets and Architecture Diagram

**Objective:** Transform the existing README into a portfolio-grade document.

#### 11-01 Task 1: Fix API Port and Verify Current State

<read_first>

- README.md (current content)
- .env.example (correct port numbers)
- apps/api/src/main.ts (verify API port)
- apps/web/vite.config.ts (verify web port)
- infra/docker-compose.yml (verify service ports)

</read_first>

<action>

Fix the API port in README.md. The README currently says `pnpm dev:api` starts on port 3000, but the actual port is 3100. Update all occurrences:

In the Quick Start section:

- `pnpm dev:api    # API:  http://localhost:3000` → `pnpm dev:api    # API:  http://localhost:3100`

In the Development Commands table:

- `pnpm dev:api | API only (http://localhost:3000)` → `pnpm dev:api | API only (http://localhost:3100)`

In the Environment Variables table:

- `API_PORT | 3000` → `API_PORT | 3100`

In the full-command example:

- `python -m uvicorn apps.cv-worker.src.main:app --reload --port 8001` (already correct, keep as-is)

</action>

<acceptance_criteria>

- README.md contains port 3100 for the API in all locations
- README.md contains port 5173 for the web app in all locations
- README.md contains port 8001 for the CV worker in all locations

</acceptance_criteria>

#### 11-01 Task 2: Add Demo GIF/Screenshot Section

<read_first>

- docs/demo-script.md (what the demo flow looks like)
- tmp/ directory (check for existing screenshots from Phase 3-10)
- docs/architecture/overview.md (data flow description)

</read_first>

<action>

Create a demo assets directory and capture or describe the demo flow. Since capturing a live GIF may not be possible in planning, add a placeholder section that documents how to record it, with a clear instruction block:

Create `docs/demo/README-DEMO.md` documenting the demo recording process:

```
## How to Record the Demo GIF

1. Open the app at http://localhost:5173
2. Use ScreenToGif (Windows) or LICEcap (cross-platform)
3. Record the full flow:
   - Overview → Media tab → upload image
   - Versions tab → create dataset → add image
   - Annotate tab → draw bounding box
   - Pipeline tab → build pipeline
   - Jobs tab → create and run job
   - View prediction overlay and evaluation metrics
4. Export as GIF, optimize at ezgif.com (max 5MB)
5. Place as docs/demo/demo.gif or docs/demo/demo.webm
6. Reference in README

## Demo Flow Script (for recording)

1. Overview: show the workbench shell, all 8 sections in the nav rail
2. Media: upload a sample image, show progress bar and success state
3. Versions: create a new dataset, add the uploaded image to a version
4. Annotate: draw 2-3 bounding boxes on the image, show label selector
5. Lock version: click lock, show 409 rejection on subsequent edit attempt
6. Pipeline: add a detector node, configure model, show validation passing
7. Jobs: create a job, show SSE progress streaming
8. Overlay: show GT boxes vs prediction boxes with toggle
9. Metrics: show the evaluation report with precision/recall/F1

Recording target: 30-45 seconds, 720p, loop-free, clean audio-free
```

Then add the following section to README.md after the Quick Start section. Use a placeholder image path that the developer can replace:

```markdown
## Demo

[Record a demo GIF using the script in docs/demo/README-DEMO.md]

![VisionFlow Studio Demo](docs/demo/demo.gif)

The demo covers the full vertical slice: upload media → create dataset → annotate → build pipeline → run job → view predictions and evaluation.
```

</action>

<acceptance_criteria>

- `docs/demo/README-DEMO.md` exists with recording instructions
- README.md has a ## Demo section with placeholder image reference
- Demo section clearly describes what the GIF should show (full vertical slice)

</acceptance_criteria>

#### 11-01 Task 3: Add Visual Architecture Diagram

<read_first>

- docs/architecture/overview.md (existing text architecture)
- .planning/ROADMAP.md (full architecture target)

</read_first>

<action>

Add a visual ASCII/text architecture diagram to README.md after the ## Demo section. This should be a clear system diagram showing all components and data flow:

```markdown
## Architecture
```

┌─────────────────────────────────────────────────────────────────────────────┐
│ VisionFlow Studio │
├─────────────────────────────────────────────────────────────────────────────┤

Browser (React)
│
│ HTTP/WebSocket
▼
┌─────────────┐ REST ┌─────────────────────────────────────────┐
│ Web App │◄────────────►│ NestJS API │
│ (Vite/5173)│ │ ┌─────────┐ ┌──────────┐ ┌───────┐ │
│ │ │ │ Media │ │ Dataset │ │Job │ │
│ - Media │ │ │ Module │ │ Module │ │Module │ │
│ - Annotate │ │ └────┬────┘ └────┬─────┘ └───┬───┘ │
│ - Pipeline │ │ │ │ │ │
│ - Jobs │ │ ┌────▼────────────▼────────────▼───┐ │
│ - Timeline │ │ │ Repository Layer │ │
│ │ │ │ ┌────────────┐ ┌────────────┐ │ │
└─────────────┘ │ │ │ Prisma │ │ Memory │ │ │
│ │ │ (real DB) │ │ (demo) │ │ │
│ │ └────────────┘ └────────────┘ │ │
│ └──────────────────────────────┬──┘ │
│ │ │
│ ┌──────────────┐ ┌──────────▼──┐ │
│ │ BullMQ/Redis │ │ MinIO │ │
│ │ (job queue) │ │ (objects) │ │
│ └───────┬──────┘ └─────────────┘ │
│ │ │
└──────────┼────────────────────────────┘
│
┌──────────▼──────────────────────────┐
│ FastAPI CV Worker │
│ ┌────────────┐ ┌───────────────┐ │
│ │ Thumbnail │ │ Frame Extract │ │
│ │ (Pillow) │ │ (OpenCV) │ │
│ └────────────┘ └───────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ ONNX Runtime (detector) │ │
│ │ NMS + confidence threshold │ │
│ └────────────────────────────────┘ │
└───────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│ Infrastructure │
│ ┌──────────┐ ┌──────────┐ ┌───────────────────┐ │
│ │PostgreSQL│ │ Redis │ │ MinIO │ │
│ │ (state) │ │ (queue) │ │ (originals/ │ │
│ │ │ │ │ │ derivatives/ │ │
│ │ │ │ │ │ predictions) │ │
│ └──────────┘ └──────────┘ └───────────────────┘ │
└───────────────────────────────────────────────────────┘

```

**Data flow:** Web → API (metadata + job dispatch) → Redis (job queue) → CV Worker (processing) → MinIO (artifacts) → PostgreSQL (predictions + evaluation)
```

</action>

<acceptance_criteria>

- README.md has an ASCII architecture diagram showing all 6 components
- Diagram shows Web App, NestJS API, PostgreSQL, Redis, MinIO, CV Worker
- Diagram shows data flow direction with arrows
- Diagram distinguishes between in-progress (P1-P2) and planned components

</acceptance_criteria>

#### 11-01 Task 4: Add Implemented vs Planned Features Table

<read_first>

- README.md (current features list)
- .planning/ROADMAP.md (phases 11-20 planned features)

</read_first>

<action>

Add a features comparison table to README.md that clearly separates what exists vs what's coming. Insert after the Features section:

```markdown
## Implementation Status

### Implemented (v1.0 — Phases 0–10)

| Feature                 | Status  | Notes                                           |
| ----------------------- | ------- | ----------------------------------------------- |
| Monorepo structure      | ✅ Done | pnpm + turbo, 6 packages                        |
| Web workbench shell     | ✅ Done | React 19, 8 sections, responsive                |
| Media upload            | ✅ Done | MinIO, SHA-256 dedupe, MIME validation          |
| Dataset versioning      | ✅ Done | Immutable versions, split summaries, lock       |
| BBox annotation         | ✅ Done | Image coordinates, keyboard actions, save queue |
| Pipeline builder        | ✅ Done | React Flow, typed validation, persistence       |
| Job orchestration       | ✅ Done | BullMQ, SSE progress, state machine             |
| CV worker               | ✅ Done | Mock detector, ONNX capability guard            |
| Prediction overlay      | ✅ Done | GT vs pred toggle, color-coded                  |
| Evaluation metrics      | ✅ Done | IoU, precision, recall, F1, per-class           |
| Timeline replay         | ✅ Done | BBox morphs, playback controls                  |
| Dataset diff            | ✅ Done | Added/removed/changed comparison                |
| Pipeline execution flow | ✅ Done | Animated node graph                             |
| CI/CD                   | ✅ Done | GitHub Actions, Vitest, Playwright              |
| Linting & formatting    | ✅ Done | ESLint, Prettier                                |
| One-command boot        | ✅ Done | Unix + PowerShell scripts                       |

### In Progress (v1.1 — Phases 11–20)

| Feature                    | Status | Target Phase |
| -------------------------- | ------ | ------------ |
| Professional README        | 🔄     | Phase 11     |
| Real media processing      | 🔄     | Phase 15     |
| Real ONNX inference        | 🔄     | Phase 16     |
| Feature-split frontend     | 🔄     | Phase 17     |
| Immutable lock enforcement | 🔄     | Phase 18     |
| COCO export                | 🔄     | Phase 20     |
| E2E test suite             | 🔄     | Phase 20     |

### Not Yet Started

| Feature                 | Planned For |
| ----------------------- | ----------- |
| Real-time collaboration | Future      |
| Segmentation masks      | Future      |
| Model training          | Future      |
| Enterprise RBAC         | Future      |
| Billing                 | Future      |
```

</action>

<acceptance_criteria>

- README.md has a table clearly distinguishing implemented vs in-progress vs not-started
- Table shows v1.0 achievements prominently
- Table shows v1.1 roadmap items with target phases
- Table excludes items that will never be built (billing, RBAC, segmentation)

</acceptance_criteria>

#### 11-01 Task 5: Add Known Limitations Section

<read_first>

- .planning/STATE.md (known partial areas)
- .planning/MILESTONES.md (v1.0 known gaps)

</read_first>

<action>

Add a `## Known Limitations` section to README.md at the end (before ## Contributing):

```markdown
## Known Limitations

This is a prototype under active development (v1.1). The following limitations exist:

### Infrastructure

- **BullMQ requires Redis** — Live queue processing needs a Redis instance. Local development uses an in-memory fallback.
- **PostgreSQL required for production** — The production data path requires PostgreSQL + Prisma. In-memory fallback is available for demo mode.
- **MinIO required for storage** — Media storage uses MinIO. Local filesystem fallback is available for demo mode.
- **Docker required** — The full stack requires Docker to run infrastructure services.

### CV Worker

- **ONNX model not included** — The detector runs in mock mode by default. Real ONNX inference requires supplying a model artifact.
- **Real thumbnail/frame extraction** — Being implemented in Phase 15. Currently stubbed.

### Data & Reproducibility

- **COCO export** — Being implemented in Phase 20.
- **Immutable dataset version lock** — Being hardened in Phase 18.
- **Evaluation reproducibility** — Requires locked versions + model artifacts (Phase 18-19).

### Frontend

- **App.tsx is monolithic** — Being split into feature modules in Phase 17.
- **No authentication** — This is a single-user workbench. Multi-user auth is out of scope for v1.
- **No real-time collaboration** — Annotations are single-user. Future versions may add multiplayer.

### Browser Support

- Tested on Chrome, Firefox, Safari (latest)
- Reduced-motion users get static fallbacks for animations
- Responsive design tested at 1920px, 900px, and 390px widths

For the full roadmap, see [.planning/ROADMAP.md](.planning/ROADMAP.md).
```

</action>

<acceptance_criteria>

- README.md has a ## Known Limitations section before ## Contributing
- Section is honest about prototype state without being discouraging
- Section links to the full roadmap
- Section covers infrastructure, CV worker, data, frontend, and browser support

</acceptance_criteria>

#### 11-01 Task 6: Add Migration Section

<read_first>

- apps/api/src/main.ts (check if migrations are handled via db:push or db:migrate)
- infra/docker-compose.yml (check current setup)

</read_first>

<action>

Add a ## Database Migrations section to README.md after the ## Quick Start section:

````markdown
## Database Migrations

VisionFlow uses Prisma for database management.

```bash
# Generate Prisma client from schema (after pulling changes)
pnpm db:generate

# Apply migrations to database (after db:generate)
pnpm db:migrate

# Or use db:push to sync schema without migration history (faster for dev)
pnpm db:push

# Open Prisma Studio to browse data
pnpm db:studio
```
````

**In CI:** The GitHub Actions pipeline runs `pnpm db:generate` to validate the schema compiles correctly. Migration application happens at deployment time.

**Note:** When starting fresh, `docker compose up -d` initializes the PostgreSQL database. After `pnpm db:generate` completes, `pnpm db:push` syncs the schema.

````

</action>

<acceptance_criteria>

- README.md has a ## Database Migrations section
- Section covers db:generate, db:migrate, db:push, and db:studio
- Section explains the CI workflow for schema validation
- Section notes the fresh-start flow (docker → db:generate → db:push)

</acceptance_criteria>

#### 11-01 Task 7: Add Tests Section

<read_first>

- package.json (verify test commands)
- vitest.workspace.ts (if exists)

</read_first>

<action>

Add a ## Testing section to README.md after the ## Development section:

```markdown
## Testing

```bash
# Run all unit and integration tests
pnpm test

# Run with UI (visual test runner)
pnpm test:ui

# Run with coverage report
pnpm test:coverage

# Run end-to-end tests (requires playwright install)
pnpm test:e2e

# Run a single package's tests
pnpm --filter @visionflow/api test
pnpm --filter @visionflow/web test
pnpm --filter @visionflow/contracts test
````

**Python tests (CV worker):**

```bash
cd apps/cv-worker
python -m pytest tests/ -v
```

**Current test coverage:**

- API: 23 tests (domain logic, Prisma + memory fallback paths)
- Web: API client tests, metric tone logic, diff engine
- Contracts: Schema validation tests (Zod)
- Motion: Token and animation class tests
- CV Worker: 4 pytest tests

**E2E tests** (Phase 20): Playwright specs for navigation, pipeline, and annotation flows.

````

</action>

<acceptance_criteria>

- README.md has a ## Testing section
- Section covers pnpm test, test:ui, test:coverage, test:e2e
- Section covers Python pytest for CV worker
- Section lists current test counts by package

</acceptance_criteria>

### Plan 11-01 Verification

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
````

Read README.md and verify:

- Port 3100 for API, 5173 for web, 8001 for CV worker
- ## Demo section with GIF placeholder
- ASCII architecture diagram with all 6 components
- ## Implementation Status table (implemented / in-progress / not-started)
- ## Known Limitations section (honest, not discouraging)
- ## Database Migrations section
- ## Testing section with test counts

---

## Key Files Modified

**Modified:**

- `README.md` — Full content upgrade: port fix, demo section, architecture diagram, implementation status table, known limitations, database migrations, testing

**Created:**

- `docs/demo/README-DEMO.md` — Demo recording script and instructions

## Key Decisions

1. **ASCII diagram over Mermaid/SVG** — ASCII diagrams render correctly in GitHub's README preview, terminals, and IDEs. Mermaid requires JavaScript rendering which GitHub doesn't support natively.
2. **Placeholder GIF, not skip** — Add the section with instructions rather than leaving it empty. Developer can record the GIF and drop it in.
3. **Honest limitations** — Known Limitations section should be specific and honest, not generic. Lists exactly what's missing and why.
4. **Implementation status table** — Recruiters and hiring managers want to know what's real vs scaffolded. The table makes this immediately clear.
5. **Port 3100 correction** — The README previously said port 3000 for the API, which is wrong. This is a factual fix, not just a polish item.

## Must-Haves (Verification Evidence)

- README.md renders correctly on GitHub (check all markdown syntax)
- Port 3100 appears for API in all locations
- ASCII architecture diagram has all 6 components with data flow arrows
- Implementation status table has 15+ implemented items from v1.0
- Known limitations section lists at least 8 specific limitations
- Database migrations section covers all 4 commands (generate, migrate, push, studio)
- Testing section covers all test commands with package-level breakdown
- `pnpm lint` passes on README.md content
- `pnpm format:check` passes on README.md content
- `pnpm typecheck` passes (no breaking changes)
- `pnpm build` passes (no breaking changes)
