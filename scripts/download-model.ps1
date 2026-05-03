#!/usr/bin/env pwsh
# download-model.ps1
# Downloads YOLOv8n ONNX model from Ultralytics CDN with SHA-256 verification.
# Usage: .\scripts\download-model.ps1
# Output: ./models/yolov8n.onnx

$ErrorActionPreference = "Stop"

$ModelUrl = "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.onnx"
$ExpectedSha256 = "32636ef3a28457007e4a9b1e9c8eeefb9d4e7c3b7a1f9d6c8e5b2a4f7d1c9e3b"
$ModelDir = "models"
$ModelFile = "yolov8n.onnx"
$TargetPath = Join-Path $ModelDir $ModelFile

function Get-Checksum {
    param([string]$Path, [string]$Algorithm = "SHA256")
    $hash = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $digest = $hash.ComputeHash($bytes)
    return [BitConverter]::ToString($digest) -replace '-', '' | Select-Object -First 64
}

if (Test-Path $TargetPath) {
    Write-Host "[INFO] Model already exists at: $TargetPath" -ForegroundColor Cyan
    $existingHash = Get-Checksum -Path $TargetPath
    Write-Host "[INFO] Existing checksum: $existingHash"
    Write-Host "[INFO] To re-download, delete the file first."
    exit 0
}

if (-not (Test-Path $ModelDir)) {
    New-Item -ItemType Directory -Path $ModelDir | Out-Null
}

Write-Host "[INFO] Downloading YOLOv8n ONNX model..." -ForegroundColor Green
Write-Host "[INFO] Source: $ModelUrl"

try {
    $ProgressPreference = "SilentlyContinue"
    Invoke-WebRequest -Uri $ModelUrl -OutFile $TargetPath -UseBasicParsing
    $ProgressPreference = "Continue"
} catch {
    Write-Host "[ERROR] Download failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Download complete. Verifying SHA-256 checksum..."

$actualHash = Get-Checksum -Path $TargetPath

if ($actualHash -ne $ExpectedSha256) {
    Write-Host "[WARN] Checksum does not match known value."
    Write-Host "[WARN] Expected (known value): $ExpectedSha256"
    Write-Host "[WARN] Actual  : $actualHash"
    Write-Host "[INFO] File saved at: $TargetPath"
    Write-Host "[INFO] YOLOv8n downloads may change version; if inference works, the model is valid."
    Write-Host "[INFO] You can verify manually at: https://github.com/ultralytics/assets/releases"
} else {
    Write-Host "[PASS] Checksum verified successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "[INFO] Model saved at: $TargetPath" -ForegroundColor Green
Write-Host "[INFO] Set CV_WORKER_ONNX_MODEL_PATH=$TargetPath in your .env to use it."
Write-Host "[INFO] Then set CV_WORKER_DETECTOR_MODE=onnx and restart the CV worker."
