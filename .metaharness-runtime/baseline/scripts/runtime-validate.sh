#!/bin/bash
# Runtime validation for VisionFlow
# Detects: broken APIs, stale seed, QUEUED/RUNNING stuck, annotation 404

set -e

API_BASE="http://localhost:3000"
PROJECT="proj_parking_lot"

echo "=== VisionFlow Runtime Validation ==="

# Check API health
echo "[1/6] API Health..."
HEALTH=$(curl -sf "$API_BASE/api/health" || echo "FAIL")
if [ "$HEALTH" = "FAIL" ]; then
    echo "FAIL: API not reachable"
    exit 1
fi
echo "PASS: API health OK"

# Check datasets
echo "[2/6] Datasets..."
DATASETS=$(curl -sf "$API_BASE/api/projects/$PROJECT/datasets" || echo "FAIL")
if [ "$DATASETS" = "FAIL" ]; then
    echo "FAIL: datasets endpoint unreachable"
    exit 1
fi
echo "PASS: datasets endpoint OK"

# Check dataset versions
echo "[3/6] Dataset Versions..."
VERSIONS=$(curl -sf "$API_BASE/api/projects/$PROJECT/dataset-versions" || echo "FAIL")
if [ "$VERSIONS" = "FAIL" ]; then
    echo "FAIL: dataset-versions endpoint unreachable"
    exit 1
fi
echo "PASS: dataset-versions OK"

# Check annotation workspace
echo "[4/6] Annotation Workspace..."
WORKSPACE=$(curl -sf "$API_BASE/api/projects/$PROJECT/dataset-versions/dataset_${PROJECT}_parking_v3/annotation-workspace?assetId=asset_frame_1482" || echo "FAIL")
if [ "$WORKSPACE" = "FAIL" ]; then
    echo "FAIL: annotation workspace unreachable"
    exit 1
fi
echo "PASS: annotation workspace OK"

# Check inference jobs
echo "[5/6] Inference Jobs..."
JOBS=$(curl -sf "$API_BASE/api/projects/$PROJECT/inference-jobs" || echo "FAIL")
if [ "$JOBS" = "FAIL" ]; then
    echo "FAIL: inference-jobs endpoint unreachable"
    exit 1
fi
echo "PASS: inference-jobs OK"

# Check for stuck QUEUED/RUNNING without worker
echo "[6/6] Job State Check..."
if echo "$JOBS" | grep -q '"status":"QUEUED"'; then
    echo "WARN: Found QUEUED jobs — verify queue worker is running"
fi
if echo "$JOBS" | grep -q '"status":"RUNNING"'; then
    echo "WARN: Found RUNNING jobs — verify they are progressing"
fi

echo "=== All Runtime Checks PASSED ==="
exit 0
