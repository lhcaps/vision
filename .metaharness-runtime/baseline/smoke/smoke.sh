#!/bin/bash
# Smoke test for metaharness-runtime
set -e

echo "=== Smoke: metaharness-runtime ==="

cd "$(dirname "$0")/../.."

# Check all required commands exist
COMMANDS=("pnpm" "curl" "node" "npm")
for cmd in "${COMMANDS[@]}"; do
    if command -v "$cmd" &> /dev/null; then
        echo "  OK: $cmd"
    else
        echo "  FAIL: $cmd not found"
        exit 1
    fi
done

# Check baseline scripts exist
if [ ! -f "baseline/scripts/runtime-validate.sh" ]; then
    echo "FAIL: baseline/scripts/runtime-validate.sh not found"
    exit 1
fi
echo "OK: runtime-validate.sh exists"

# Check tasks.json exists
if [ ! -f "tasks.json" ]; then
    echo "FAIL: tasks.json not found"
    exit 1
fi
echo "OK: tasks.json exists"

# Check metaharness.json valid
if [ ! -f "metaharness.json" ]; then
    echo "FAIL: metaharness.json not found"
    exit 1
fi
echo "OK: metaharness.json exists"

echo "=== Smoke PASSED ==="
exit 0
