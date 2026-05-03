#!/bin/bash
# Validation script for Vision project harness

set -e

cd "$(dirname "$0")/../.."

echo "=== Validation: Vision Project ==="

# Check pnpm available
if ! command -v pnpm &> /dev/null; then
    echo "ERROR: pnpm not found"
    exit 1
fi

# Type check
echo "[1/3] Running typecheck..."
pnpm typecheck
if [ $? -ne 0 ]; then
    echo "FAIL: typecheck failed"
    exit 1
fi

# Build
echo "[2/3] Running build..."
pnpm build
if [ $? -ne 0 ]; then
    echo "FAIL: build failed"
    exit 1
fi

# Test
echo "[3/3] Running tests..."
pnpm test
if [ $? -ne 0 ]; then
    echo "FAIL: tests failed"
    exit 1
fi

echo "=== Validation PASSED ==="
exit 0
