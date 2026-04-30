#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " VisionFlow Studio — Full Stack Boot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Start infrastructure
echo ""
echo "▶ Starting infrastructure (Docker)..."
docker compose -f "$ROOT_DIR/infra/docker-compose.yml" up -d

# Wait for postgres to be ready
echo "▶ Waiting for PostgreSQL..."
for i in {1..30}; do
  if docker exec vision-postgres-1 pg_isready -U postgres >/dev/null 2>&1; then
    echo "✓ PostgreSQL is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ PostgreSQL failed to start"
    exit 1
  fi
  sleep 1
done

# Step 2: Generate Prisma client
echo ""
echo "▶ Generating Prisma client..."
cd "$ROOT_DIR"
pnpm db:generate

# Step 3: Seed demo data (optional)
echo ""
echo "▶ Validating demo data..."
pnpm seed 2>/dev/null || echo "(No seed script — using in-memory fallback)"

# Step 4: Start all apps
echo ""
echo "▶ Starting all apps..."
echo "  Web:     http://localhost:5173"
echo "  API:     http://localhost:3000"
echo "  Swagger: http://localhost:3000/api/docs"
echo ""

# Start web + api in background
pnpm dev &
API_PID=$!

# Start CV worker in background
cd "$ROOT_DIR"
python -m uvicorn apps.cv-worker.src.main:app --reload --port 8001 --host 127.0.0.1 &
CV_PID=$!

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " VisionFlow Studio is running!"
echo "  Stop all: pnpm kill"
echo "  Logs: docker compose -f infra/docker-compose.yml logs -f"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for background processes
wait
