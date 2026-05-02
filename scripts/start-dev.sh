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

# Step 5: Validate demo data
echo ""
log_info "Validating demo data..."
if ! pnpm seed 2>/dev/null; then
    log_warn "Demo data validation skipped (Docker required for full validation)"
fi

# Step 6: Start all apps
echo ""
log_info "Starting all apps..."
echo ""
echo "  Web:     http://localhost:5173"
echo "  API:     http://localhost:3000"
echo "  Swagger: http://localhost:3000/api/docs"
echo "  MinIO:   http://localhost:9000 (console: http://localhost:9001)"
echo ""

# Set trap for cleanup
trap 'echo ""; log_info "Shutting down... Run `pnpm kill` to stop Docker containers"; kill 0 2>/dev/null; wait' EXIT

# Start web + api in background
pnpm dev &
WEB_PID=$!

# Start CV worker in background
cd "$ROOT_DIR"
python -m uvicorn apps.cv-worker.src.main:app --reload --port 8000 --host 127.0.0.1 &
CV_PID=$!

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " VisionFlow Studio is running!"
echo "  Stop all: pnpm kill"
echo "  Logs: docker compose -f infra/docker-compose.yml logs -f"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for all background processes
wait $WEB_PID $CV_PID
