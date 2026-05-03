#!/bin/bash
# Bootstrap script for Vision project harness

set -e

cd "$(dirname "$0")/../.."

echo "=== Bootstrap: Vision Project ==="

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo "[1/2] Installing dependencies..."
    pnpm install
    if [ $? -ne 0 ]; then
        echo "FAIL: pnpm install failed"
        exit 1
    fi
else
    echo "[1/2] Dependencies already installed, skipping..."
fi

# Generate Prisma client
echo "[2/2] Generating Prisma client..."
pnpm db:generate 2>/dev/null || npx prisma generate
if [ $? -ne 0 ]; then
    echo "FAIL: Prisma generate failed"
    exit 1
fi

echo "=== Bootstrap PASSED ==="
exit 0
