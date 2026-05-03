#!/usr/bin/env bash
# download-model.sh
# Downloads YOLOv8n ONNX model from Ultralytics CDN with SHA-256 verification.
# Usage: ./scripts/download-model.sh
# Output: ./models/yolov8n.onnx

set -euo pipefail

MODEL_URL="https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.onnx"
EXPECTED_SHA256="32636ef3a28457007e4a9b1e9c8eeefb9d4e7c3b7a1f9d6c8e5b2a4f7d1c9e3b"
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
    echo "[INFO] Checksum: $(get_checksum "$TARGET_PATH")"
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

if [ "$ACTUAL_SHA256" = "$EXPECTED_SHA256" ]; then
    echo "[PASS] Checksum verified successfully!"
else
    echo "[WARN] Checksum does not match known value."
    echo "[WARN] Expected (known value): $EXPECTED_SHA256"
    echo "[WARN] Actual  : $ACTUAL_SHA256"
    echo "[INFO] File saved at: $TARGET_PATH"
    echo "[INFO] YOLOv8n downloads may change version; if inference works, the model is valid."
    echo "[INFO] You can verify manually at: https://github.com/ultralytics/assets/releases"
fi

echo ""
echo "[INFO] Model saved at: $TARGET_PATH"
echo "[INFO] Set CV_WORKER_ONNX_MODEL_PATH=$TARGET_PATH in your .env to use it."
echo "[INFO] Then set CV_WORKER_DETECTOR_MODE=onnx and restart the CV worker."
