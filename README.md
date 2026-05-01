# VisionFlow Studio

[![CI](https://github.com/lhcaps/Vision/actions/workflows/ci.yml/badge.svg)](https://github.com/lhcaps/Vision/actions/workflows/ci.yml)

A fullstack computer vision platform for dataset versioning, annotation, visual pipeline construction, async inference orchestration, and model evaluation.

## Features

- **Media Ingestion** — Upload media with SHA-256 dedupe and MinIO storage
- **Dataset Versioning** — Immutable version snapshots with train/valid/test split summaries
- **Annotation Engine** — Bounding box annotations in image coordinates with live preview
- **Pipeline Builder** — React Flow pipeline graph with typed node/edge validation
- **Inference Orchestration** — BullMQ job queue with SSE progress streaming
- **CV Worker** — Mock detector with ONNX runtime support (stub)
- **Prediction Overlay** — Side-by-side GT vs. prediction bounding box comparison
- **Evaluation** — IoU-based precision, recall, F1 metrics per class
- **Timeline Replay** — Frame-by-frame BBox morph animation with playback controls
- **Dataset Diff** — Visual added/removed/changed annotation comparison

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/lhcaps/Vision.git
cd Vision
pnpm install

# 2. Copy environment
cp .env.example .env

# 3. Start infrastructure
docker compose -f infra/docker-compose.yml up -d

# 4. Generate Prisma client
pnpm db:generate

# 5. Start all apps (Unix/macOS)
pnpm dev:full

# Or on Windows:
pnpm dev:full:win

# Or start individually:
pnpm dev:web    # Web: http://localhost:5173
pnpm dev:api    # API:  http://localhost:3000
python -m uvicorn apps.cv-worker.src.main:app --reload --port 8000 --host 127.0.0.1
```

## Demo

> Record a demo GIF using the instructions in [docs/demo/README-DEMO.md](docs/demo/README-DEMO.md).

![VisionFlow Studio Demo](docs/demo/demo.gif)

The demo covers the full vertical slice: upload media → create dataset → annotate → build pipeline → run job → view predictions and evaluation.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                             VisionFlow Studio                                 │
├──────────────────────────────────────────────────────────────────────────────┤

  Browser (React)
       │
       │ HTTP / WebSocket
       ▼
  ┌─────────────┐           ┌──────────────────────────────────────────────────┐
  │   Web App   │◄──────────►│                   NestJS API                     │
  │  (Vite/5173)│   REST     │  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │
  │             │            │  │  Media  │  │ Dataset  │  │    Job        │  │
  │  • Media   │            │  │ Module  │  │  Module  │  │   Module      │  │
  │  • Annotate│            │  └────┬────┘  └────┬─────┘  └───────┬───────┘  │
  │  • Pipeline│            │       │            │                │          │
  │  • Jobs    │            │  ┌────▼────────────▼────────────────▼────────┐ │
  │  • Timeline│            │  │              Repository Layer              │ │
  │             │            │  │   Prisma (production)   Memory (demo)     │ │
  └─────────────┘            │  └─────────────────────┬────────────────────┘ │
                             │                        │                        │
                             │  ┌─────────────────────┴────────────────────┐ │
                             │  │          BullMQ / Redis (job queue)     │ │
                             │  │          MinIO (object storage)         │ │
                             │  └───────────────────────────────────────────┘ │
                             └──────────────────────────────────────────────────┘
                                          │
                           ┌──────────────▼──────────────────────────────────┐
                           │              FastAPI CV Worker                   │
                           │  ┌─────────────────┐  ┌─────────────────────┐  │
                           │  │  Thumbnail Gen  │  │  Frame Extraction   │  │
                           │  │    (Pillow)     │  │      (OpenCV)       │  │
                           │  └─────────────────┘  └─────────────────────┘  │
                           │  ┌────────────────────────────────────────────┐ │
                           │  │      ONNX Runtime (detector)               │ │
                           │  │      NMS + confidence threshold            │ │
                           │  │      Evaluation (IoU-based matching)       │ │
                           │  └────────────────────────────────────────────┘ │
                           └──────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────────────┐
  │                           Infrastructure                                   │
  │  ┌────────────┐   ┌────────────┐   ┌────────────────────────────────┐  │
  │  │ PostgreSQL │   │   Redis   │   │            MinIO                │  │
  │  │  (state)  │   │  (queue)  │   │  (originals / derivatives /       │  │
  │  │  :5432    │   │  :6379   │   │   predictions / artifacts) :9000  │  │
  │  └────────────┘   └────────────┘   └────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────────────────┘
```

**Data flow:** Browser → NestJS API (metadata + job dispatch) → Redis (job queue) → FastAPI CV Worker (processing) → MinIO (artifacts) → PostgreSQL (predictions + evaluation reports)

## Implementation Status

### Implemented (v1.0 — Phases 0–10)

| Feature                 | Status  | Notes                                                          |
| ----------------------- | ------- | -------------------------------------------------------------- |
| Monorepo structure      | ✅ Done | pnpm workspaces + Turborepo, 6 packages                        |
| Web workbench shell     | ✅ Done | React 19, 8 nav sections, responsive (1920/900/390px)          |
| Media ingestion         | ✅ Done | MinIO storage, SHA-256 dedupe, MIME validation, thumbnail jobs |
| Dataset versioning      | ✅ Done | Immutable versions, train/valid/test splits, lock enforcement  |
| Bounding-box annotation | ✅ Done | Image-coordinate BBox, keyboard actions, save queue            |
| Pipeline builder        | ✅ Done | React Flow, typed node/edge validation, persistence            |
| Job orchestration       | ✅ Done | BullMQ queue, SSE progress streaming, state transitions        |
| CV worker scaffold      | ✅ Done | Mock detector, ONNX capability guard, evaluation endpoint      |
| Prediction overlay      | ✅ Done | GT vs prediction toggle, color-coded bounding boxes            |
| Evaluation metrics      | ✅ Done | IoU-based precision, recall, F1, per-class breakdown           |
| Timeline replay         | ✅ Done | BBox morph animation, dataset diff, pipeline execution flow    |
| CI/CD                   | ✅ Done | GitHub Actions, Vitest, Playwright E2E                         |
| Linting & formatting    | ✅ Done | ESLint 9 flat config, Prettier + Tailwind plugin               |
| One-command boot        | ✅ Done | Unix shell + Windows PowerShell scripts                        |

### In Progress (v1.1 — Production Hardening)

| Feature                    | Status     | Target Phase        |
| -------------------------- | ---------- | ------------------- |
| Professional README        | ✅ Done    | Phase 11 (complete) |
| CI completeness            | ✅ Done    | Phase 12A           |
| Local stack & seed         | ✅ Done    | Phase 12B           |
| Security hardening         | 🔄 Planned | Phase 13            |
| Adapter boundary cleanup   | 🔄 Planned | Phase 14A           |
| Domain invariants          | 🔄 Planned | Phase 14B           |
| Observability & health     | 🔄 Planned | Phase 15            |
| Frontend feature split     | 🔄 Planned | Phase 16A           |
| Real media processing      | 🔄 Planned | Phase 17            |
| Dataset lock & COCO export | 🔄 Planned | Phase 18            |
| Real ONNX inference        | 🔄 Planned | Phase 19            |
| Evaluation E2E             | 🔄 Planned | Phase 20            |
| Frontend split completion  | 🔄 Planned | Phase 21            |
| Production test suite      | 🔄 Planned | Phase 22A/B         |
| Full E2E & demo video      | 🔄 Planned | Phase 23            |

### Out of Scope

| Feature                  | Reason                |
| ------------------------ | --------------------- |
| Authentication / RBAC    | Single-user workbench |
| Segmentation masks       | v1.x out of scope     |
| Model training           | v1.x out of scope     |
| Multi-user collaboration | v1.x out of scope     |
| Cloud deployment         | v1.x out of scope     |

## Tech Stack

| Layer     | Technology                                                                   |
| --------- | ---------------------------------------------------------------------------- |
| Web       | React 19, Vite, Tailwind, Framer Motion, Zustand, React Flow, Phosphor Icons |
| API       | NestJS, Prisma, BullMQ, MinIO, Zod                                           |
| CV Worker | FastAPI, Pydantic, ONNX Runtime (stub)                                       |
| Storage   | PostgreSQL, Redis, MinIO                                                     |
| Types     | TypeScript, Zod                                                              |
| Tests     | Vitest, Playwright                                                           |

## Database Migrations

VisionFlow uses Prisma for database management.

```bash
# Generate Prisma client from schema (run after pulling changes)
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Sync schema without migration history (faster for local dev)
pnpm db:push

# Open Prisma Studio to browse and edit data
pnpm db:studio
```

**In CI:** The GitHub Actions pipeline runs `pnpm db:generate` to validate the schema compiles correctly. Migration application happens at deployment time.

**Fresh start:** `docker compose up -d` → `pnpm db:generate` → `pnpm db:push`

## Development

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `pnpm dev:full`     | Start Docker + all apps (Unix)             |
| `pnpm dev:full:win` | Start Docker + all apps (Windows)          |
| `pnpm dev:web`      | Web only (http://localhost:5173)           |
| `pnpm dev:api`      | API only (http://localhost:3000)           |
| `pnpm build`        | Build all packages                         |
| `pnpm typecheck`    | Type-check all packages                    |
| `pnpm test`         | Run all tests                              |
| `pnpm verify`       | Type-check + test + build                  |
| `pnpm lint`         | Lint all files                             |
| `pnpm format`       | Format all files with Prettier             |
| `pnpm db:generate`  | Regenerate Prisma client                   |
| `pnpm seed`         | Validate demo data and print summary       |
| `pnpm seed --api`   | Create demo data via API (requires Docker) |
| `pnpm kill`         | Stop Docker containers                     |

## Health Checks

```bash
# API health (liveness)
curl http://localhost:3000/api/health/live

# API health (deep — checks all dependencies)
curl http://localhost:3000/api/health/deep
```

## Security

VisionFlow Studio implements the following security controls for API endpoints and media uploads.

### Input Validation

All API requests pass through a global NestJS `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`. Unknown fields in request payloads are rejected with HTTP 400.

### CORS Policy

CORS is configured via the `WEB_ORIGIN` environment variable. If not set, cross-origin requests are blocked. When set, only the specified origins are allowed:

```bash
# Single origin
WEB_ORIGIN=http://localhost:5173

# Multiple origins (comma-separated)
WEB_ORIGIN=http://localhost:5173,https://my-domain.com
```

### File Upload Restrictions

| Limit | Value |
| -------|-------|
| Maximum file size | 250 MB |
| Accepted types | JPEG, PNG, WebP, MP4, MOV |
| Validation | MIME type + magic byte verification |
| Corruption check | Image/video decode validation |

Uploads exceeding the size limit return **HTTP 413 Payload Too Large**. Files whose magic bytes do not match the declared MIME type, or that fail decode validation, return **HTTP 400 Bad Request**.

### Asset Access

Assets are never served via direct MinIO URLs. Access is controlled through one of two mechanisms:

1. **Signed URLs** — When `SIGNED_URL_EXPIRY_SECONDS` is set, the API generates a time-limited MinIO presigned URL and redirects the client. The URL expires after the configured duration (default: 3600 seconds).

2. **API Proxy** — When `SIGNED_URL_EXPIRY_SECONDS` is not set, assets are streamed through the API as a controlled proxy. The API never exposes the MinIO endpoint to the client.

### Error Responses

All API error responses are structured consistently:

```json
{
  "statusCode": 400,
  "message": "Human-readable error description",
  "error": "Bad Request",
  "timestamp": "2026-05-01T10:00:00.000Z"
}
```

Internal details such as file paths, stack traces, SQL errors, and environment variables are never included in error responses.

### Security Notes

- **Authentication** — Not implemented in v1.x. This is a single-user local workbench.
- **Rate limiting** — Planned for a future phase.
- **CSRF protection** — Not applicable (no session-based auth).
- **Public exposure** — This platform is designed for local/private use. Do not expose the API publicly without adding authentication and rate limiting.

For vulnerability reports, open a GitHub issue.

## Testing

```bash
# Run all unit and integration tests
pnpm test

# Run with visual test runner
pnpm test:ui

# Run with coverage report
pnpm test:coverage

# Run end-to-end tests (requires playwright install)
pnpm test:e2e

# Run a single package's tests
pnpm --filter @visionflow/api test
pnpm --filter @visionflow/web test
pnpm --filter @visionflow/contracts test
pnpm --filter @visionflow/motion test
```

**Python tests (CV worker):**

```bash
cd apps/cv-worker
python -m pytest tests/ -v
```

**Current test coverage:**

- API: domain logic tests (Prisma + memory fallback paths)
- Web: API client tests, metric tone logic, diff engine
- Contracts: Zod schema validation tests
- Motion: Token and animation class tests
- CV Worker: pytest unit tests

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://...@localhost:5432/...` | PostgreSQL connection string |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `MINIO_ENDPOINT` | `localhost` | MinIO endpoint |
| `MINIO_PORT` | `9000` | MinIO port |
| `MINIO_ACCESS_KEY` | `visionflow` | MinIO access key |
| `MINIO_SECRET_KEY` | `visionflow-secret` | MinIO secret key |
| `MINIO_BUCKET` | `visionflow-artifacts` | MinIO bucket name |
| `API_PORT` | `3000` | API server port |
| `CV_WORKER_URL` | `http://localhost:8000` | CV Worker URL |
| `CV_WORKER_DETECTOR_MODE` | `mock` | Detector mode (`mock` or `onnx`) |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Web → API base URL |
| `WEB_ORIGIN` | `http://localhost:5173` | Allowed CORS origins (comma-separated) |
| `SIGNED_URL_EXPIRY_SECONDS` | `3600` | Signed URL expiry (0 = use API proxy) |

## Project Structure

```
Vision/
├── apps/
│   ├── api/          NestJS REST API + Swagger at /api/docs
│   ├── cv-worker/    FastAPI CV inference worker
│   └── web/          React 19 frontend
├── packages/
│   ├── contracts/    Zod schemas + TypeScript types
│   └── motion/       Framer Motion tokens + CSS classes
├── infra/
│   ├── docker-compose.yml   Docker infra config
│   └── prisma/      Prisma schema + migrations
├── scripts/
│   ├── start-dev.sh Unix/macOS full-stack boot
│   ├── start-dev.ps1 Windows full-stack boot
│   └── seed-demo.ts  Demo data validator
└── .github/
    └── workflows/    CI + E2E GitHub Actions
```

## Known Limitations

This is a prototype under active development (v1.1). The following limitations exist:

### Infrastructure

- **Redis required for live queue** — BullMQ needs Redis. In-memory fallback is used in demo mode.
- **PostgreSQL required for production** — Prisma path needs PostgreSQL. In-memory fallback is available for demo mode.
- **MinIO required for storage** — Media storage uses MinIO. Local filesystem fallback is available for demo mode.
- **Docker required** — Full stack needs Docker for infrastructure services.

### CV Worker

- **Real thumbnail/frame extraction** — Being implemented in Phase 17. Currently stubbed.
- **Real ONNX inference** — Being implemented in Phase 19. Mock detector runs by default.
- **Real evaluation persistence** — Being implemented in Phase 20.

### Data & Reproducibility

- **COCO export** — Being implemented in Phase 18.
- **Immutable version lock hardening** — Being implemented in Phase 18.
- **Evaluation reproducibility** — Requires locked versions + model artifacts (Phases 18–20).

### Frontend

- **App.tsx is monolithic** — Being split into feature modules in Phase 16A.
- **No authentication** — Single-user workbench. Auth/RBAC is out of scope for v1.
- **No real-time collaboration** — Annotations are single-user.

### Security

- **No upload hardening beyond MIME validation** — Security hardening (Phase 13) adds ValidationPipe, CORS allowlist, magic byte validation, corrupted media detection, signed URL proxy, and structured error responses.

### Browser Support

- Tested on Chrome, Firefox, Safari (latest)
- Reduced-motion users receive static fallbacks for animations
- Responsive tested at 1920px, 900px, and 390px widths

For the full roadmap, see [.planning/ROADMAP.md](.planning/ROADMAP.md).

## Contributing

1. Fork and clone the repository
2. Run `pnpm install` to set up all workspaces
3. Copy `.env.example` to `.env` and configure
4. Start infrastructure: `docker compose -f infra/docker-compose.yml up -d`
5. Generate Prisma client: `pnpm db:generate`
6. Sync schema: `pnpm db:push`
7. Run `pnpm verify` to check typecheck + test + build pass
8. Submit a pull request with your changes

## License

MIT
