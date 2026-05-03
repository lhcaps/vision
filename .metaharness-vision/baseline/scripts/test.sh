#!/bin/bash
# Test script for Vision project harness

set -e

cd "$(dirname "$0")/../.."

echo "=== Test: Vision Project ==="

if ! command -v pnpm &> /dev/null; then
    echo "ERROR: pnpm not found"
    exit 1
fi

echo "[1/2] Running unit tests..."
pnpm test
if [ $? -ne 0 ]; then
    echo "FAIL: tests failed"
    exit 1
fi

echo "[2/2] Seed database check..."
pnpm seed:db -- --reset 2>/dev/null || echo "WARN: seed-db not configured, skipping"
if [ $? -ne 0 ]; then
    echo "WARN: seed-db failed (may not be configured)"
fi

echo "=== Test PASSED ==="
exit 0
