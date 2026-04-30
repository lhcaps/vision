# VisionFlow Studio

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
python -m uvicorn apps.cv-worker.src.main:app --reload --port 8001 --host 127.0.0.1
```

## Tech Stack

| Layer       | Technology                                                                      |
|-------------|---------------------------------------------------------------------------------|
| Web         | React 19, Vite, Tailwind, Framer Motion, Zustand, React Flow, Phosphor Icons   |
| API         | NestJS, Prisma, BullMQ, MinIO, Zod                                             |
| CV Worker   | FastAPI, Pydantic, ONNX Runtime (stub)                                         |
| Storage     | PostgreSQL, Redis, MinIO                                                        |
| Types       | TypeScript, Zod                                                                 |
| Tests       | Vitest, Playwright                                                              |

## Development

| Command             | Description                                  |
|---------------------|----------------------------------------------|
| `pnpm dev:full`     | Start Docker + all apps (Unix)              |
| `pnpm dev:full:win` | Start Docker + all apps (Windows)           |
| `pnpm dev:web`      | Web only (http://localhost:5173)            |
| `pnpm dev:api`      | API only (http://localhost:3000)             |
| `pnpm build`        | Build all packages                          |
| `pnpm typecheck`    | Type-check all packages                     |
| `pnpm test`         | Run all tests                               |
| `pnpm verify`       | Type-check + test + build                  |
| `pnpm lint`         | Lint all files                             |
| `pnpm format`       | Format all files with Prettier              |
| `pnpm db:generate`  | Regenerate Prisma client                    |
| `pnpm seed`         | Validate demo data and print summary        |
| `pnpm kill`         | Stop Docker containers                      |

## Environment Variables

| Variable                  | Default                              | Description                       |
|---------------------------|--------------------------------------|-----------------------------------|
| `DATABASE_URL`            | `postgresql://...@localhost:5432/...` | PostgreSQL connection string      |
| `REDIS_HOST`              | `localhost`                           | Redis host                        |
| `REDIS_PORT`              | `6379`                               | Redis port                        |
| `MINIO_ENDPOINT`          | `localhost`                           | MinIO endpoint                    |
| `MINIO_PORT`              | `9000`                               | MinIO port                        |
| `MINIO_ACCESS_KEY`        | `visionflow`                          | MinIO access key                  |
| `MINIO_SECRET_KEY`        | `visionflow-secret`                   | MinIO secret key                  |
| `MINIO_BUCKET`            | `visionflow-artifacts`                | MinIO bucket name                 |
| `API_PORT`                | `3000`                               | API server port                   |
| `CV_WORKER_URL`           | `http://localhost:8000`              | CV Worker URL                     |
| `CV_WORKER_DETECTOR_MODE`| `mock`                               | Detector mode (`mock` or `onnx`)  |
| `VITE_API_BASE_URL`       | `http://localhost:3000`              | Web → API base URL               |

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

## Contributing

1. Fork and clone the repository
2. Run `pnpm install` to set up all workspaces
3. Copy `.env.example` to `.env` and configure
4. Start infrastructure with `docker compose -f infra/docker-compose.yml up -d`
5. Run `pnpm verify` to check typecheck + test + build pass
6. Submit a pull request with your changes

## License

MIT
