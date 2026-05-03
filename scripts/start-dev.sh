#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}▶${NC} $1"; }
log_warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_ok()    { echo -e "${GREEN}✓${NC} $1"; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " VisionFlow Studio — Full Stack Boot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 0: Validate prerequisites
echo ""
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker Desktop."
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is not installed. Run: npm install -g pnpm"
    exit 1
fi

log_ok "Prerequisites OK"

# Step 1: Start infrastructure
echo ""
log_info "Starting infrastructure (Docker)..."
docker compose -f "$ROOT_DIR/infra/docker-compose.yml" up -d

# Step 2: Wait for services
echo ""
log_info "Waiting for services..."

wait_for_service() {
    local name=$1
    local cmd=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if eval "$cmd" &> /dev/null 2>&1; then
            log_ok "$name is ready"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    log_error "$name failed to start after ${max_attempts}s"
    return 1
}

wait_for_service "PostgreSQL" "docker exec visionflow-postgres pg_isready -U visionflow"
wait_for_service "Redis" "docker exec visionflow-redis redis-cli ping"
wait_for_service "MinIO" "curl -sf http://localhost:9000/minio/health/live"

# Step 3: Generate Prisma client
echo ""
log_info "Generating Prisma client..."
cd "$ROOT_DIR"
if ! pnpm db:generate; then
    log_error "Prisma client generation failed"
    exit 1
fi

# Step 3b: Apply Prisma schema
echo ""
log_info "Applying Prisma schema..."
if ! pnpm db:push; then
    log_error "Prisma db push failed"
    exit 1
fi

# Step 3c: Seed database with demo project
echo ""
log_info "Seeding database..."
if ! pnpm seed:db; then
    log_warn "Database seed failed — Run button may be disabled"
else
    log_ok "Database seeded"
fi

wait_for_http() {
    local name=$1
    local url=$2
    local max_attempts=90
    local attempt=1

    echo "  Waiting for $name at $url..."
    while [ $attempt -le $max_attempts ]; do
        if curl -sf --max-time 2 "$url" &>/dev/null; then
            echo -e "      \033[0;32m[OK]\033[0m $name ready (${attempt}s)"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    log_error "$name failed to become ready at $url after ${max_attempts}s"
    return 1
}

# Step 5: Start all apps
echo ""
log_info "Starting all apps..."

# Start web + api and CV worker in background; capture PIDs
cd "$ROOT_DIR"
pnpm dev &
API_PID=$!
echo "  Web/API PID: $API_PID"

cd "$ROOT_DIR/apps/cv-worker/src" && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
CV_PID=$!
echo "  CV Worker PID: $CV_PID"

cd "$ROOT_DIR"

# Step 6: Wait for all services to be reachable
echo ""

if ! wait_for_http "API" "http://localhost:3000/api/health"; then
    log_error "API failed to boot. Check the pnpm dev output for NestJS errors."
    log_error "Common causes: missing DATABASE_URL in .env, Prisma client out of sync, PostgreSQL not ready."
    kill $API_PID $CV_PID 2>/dev/null
    wait
    exit 1
fi

if ! wait_for_http "CV Worker" "http://localhost:8000/health"; then
    log_error "CV Worker failed to boot. Check the uvicorn output."
    kill $API_PID $CV_PID 2>/dev/null
    wait
    exit 1
fi

if ! wait_for_http "Web" "http://localhost:5173"; then
    log_error "Web dev server failed to boot. Check the Vite output."
    kill $API_PID $CV_PID 2>/dev/null
    wait
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " VisionFlow Studio is running!"
echo "  API:     http://localhost:3000"
echo "  Web:     http://localhost:5173"
echo "  Swagger: http://localhost:3000/api/docs"
echo "  CV Worker: http://localhost:8000"
echo "  MinIO:   http://localhost:9000 (console: http://localhost:9001)"
echo ""
echo "  Stop all: pnpm kill"
echo "  Logs: docker compose -f infra/docker-compose.yml logs -f"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for all background processes (keeps script alive so trap fires on Ctrl+C)
wait
