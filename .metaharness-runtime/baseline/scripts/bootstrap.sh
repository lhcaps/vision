#!/bin/bash
# Bootstrap for metaharness-runtime harness
set -e

echo "=== Bootstrap: metaharness-runtime ==="

cd "$(dirname "$0")/../.."

# Check pnpm available
if ! command -v pnpm &> /dev/null; then
    echo "FAIL: pnpm not found"
    exit 1
fi

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo "[1/3] Installing dependencies..."
    pnpm install || { echo "FAIL: pnpm install"; exit 1; }
else
    echo "[1/3] Dependencies already installed"
fi

# Generate Prisma
echo "[2/3] Generating Prisma client..."
pnpm db:generate 2>/dev/null || npx prisma generate || { echo "FAIL: Prisma generate"; exit 1; }

# Check Docker infra
echo "[3/3] Checking Docker infra..."
if command -v docker &> /dev/null; then
    REQUIRED_CONTAINERS=("postgres" "redis" "minio")
    for container in "${REQUIRED_CONTAINERS[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "$container"; then
            echo "  OK: $container running"
        else
            echo "  WARN: $container not running (may be external)"
        fi
    done
else
    echo "  WARN: docker not found, skipping infra check"
fi

echo "=== Bootstrap PASSED ==="
exit 0
