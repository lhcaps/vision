#!/usr/bin/env bash
# download-model.sh
# Downloads YOLOv8n ONNX model from Ultralytics CDN with SHA-256 verification.
# Usage: ./scripts/download-model.sh
# Output: ./models/yolov8n.onnx

set -euo pipefail

MODEL_URL="https://huggingface.co/Kalray/yolov8/resolve/main/yolov8n.onnx"
# SHA-256 of the downloaded file, computed against the official YOLOv8n ONNX export.
# Run: sha256sum ./models/yolov8n.onnx
# Verify with: ./scripts/download-model.sh
EXPECTED_SHA256="65158dad735be799c2466fa15e260c09558080bd530b42a8d0c3d1b419afd8b5"
MODEL_DIR="models"
MODEL_FILE="yolov8n.onnx"
TARGET_PATH="${MODEL_DIR}/${MODEL_FILE}"

get_checksum() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | cut -d' ' -f1
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | cut -d' ' -f1
    elif command -v openssl >/dev/null 2>&1; then
        openssl dgst -sha256 "$1" | sed 's/^.* //'
    else
        echo "ERROR: No SHA-256 tool found. Install coreutils or openssl." >&2
        exit 1
    fi
}

if [ -f "$TARGET_PATH" ]; then
    echo "[INFO] Model already exists at: $TARGET_PATH"
    EXISTING_SHA=$(get_checksum "$TARGET_PATH")
    echo "[INFO] Existing checksum: $EXISTING_SHA"
    if [ "$EXPECTED_SHA256" = "PLACEHOLDER_UPDATE_AFTER_DOWNLOAD" ]; then
        echo "[WARN] Expected SHA-256 is placeholder. Cannot verify existing file." >&2
        echo "[INFO] To verify: sha256sum $TARGET_PATH" >&2
        echo "[INFO] Then update EXPECTED_SHA256 in this script." >&2
        echo "[INFO] Treating existing file as valid for now."
        exit 0
    fi
    if [ "$EXISTING_SHA" != "$EXPECTED_SHA256" ]; then
        rm -f "$TARGET_PATH"
        echo "[ERROR] Existing file checksum mismatch. Deleted invalid model file." >&2
        echo "[ERROR] Expected: $EXPECTED_SHA256" >&2
        echo "[ERROR] Actual:   $EXISTING_SHA" >&2
        echo "[INFO] Run this script again to re-download."
        exit 1
    fi
    echo "[PASS] Existing model checksum verified."
    echo "[INFO] To re-download, delete the file first."
    exit 0
fi

mkdir -p "$MODEL_DIR"

echo "[INFO] Downloading YOLOv8n ONNX model..."
echo "[INFO] Source: $MODEL_URL"

if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$TARGET_PATH" "$MODEL_URL"
elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$TARGET_PATH" "$MODEL_URL"
else
    echo "[ERROR] Neither curl nor wget found. Cannot download model." >&2
    exit 1
fi

echo "[INFO] Download complete. Verifying SHA-256 checksum..."
ACTUAL_SHA256=$(get_checksum "$TARGET_PATH")

if [ "$EXPECTED_SHA256" = "PLACEHOLDER_UPDATE_AFTER_DOWNLOAD" ]; then
    echo "[WARN] Expected SHA-256 is placeholder. Skipping verification." >&2
    echo "[INFO] To verify this file later, compute: sha256sum $TARGET_PATH" >&2
    echo "[INFO] Then update EXPECTED_SHA256 in this script." >&2
elif [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
    rm -f "$TARGET_PATH"
    echo "[ERROR] Checksum mismatch. Deleted invalid model file." >&2
    echo "[ERROR] Expected: $EXPECTED_SHA256" >&2
    echo "[ERROR] Actual:   $ACTUAL_SHA256" >&2
    exit 1
else
    echo "[PASS] Checksum verified successfully!"
fi

echo ""
echo "[INFO] Model saved at: $TARGET_PATH"
echo "[INFO] Set CV_WORKER_ONNX_MODEL_PATH=$TARGET_PATH in your .env to use it."
echo "[INFO] Then set CV_WORKER_DETECTOR_MODE=onnx and restart the CV worker."
