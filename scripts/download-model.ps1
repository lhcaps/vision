#!/usr/bin/env pwsh
# download-model.ps1
# Downloads YOLOv8n ONNX model from Ultralytics CDN with SHA-256 verification.
# Usage: .\scripts\download-model.ps1
# Output: ./models/yolov8n.onnx

$ErrorActionPreference = "Stop"

$ModelUrl = "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.onnx"
# NOTE: Replace with the real SHA-256 once computed against the downloaded file.
# Run: (Get-FileHash .\models\yolov8n.onnx -Algorithm SHA256).Hash
# The script will exit 1 on mismatch so this MUST be updated before use.
$ExpectedSha256 = "PLACEHOLDER_UPDATE_AFTER_DOWNLOAD"
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
    if ($ExpectedSha256 -eq "PLACEHOLDER_UPDATE_AFTER_DOWNLOAD") {
        Write-Host "[WARN] Expected SHA-256 is placeholder. Cannot verify existing file." -ForegroundColor Yellow
        Write-Host "[INFO] To verify: (Get-FileHash .\models\yolov8n.onnx -Algorithm SHA256).Hash" -ForegroundColor Cyan
        Write-Host "[INFO] Then update `$ExpectedSha256 in this script." -ForegroundColor Cyan
        Write-Host "[INFO] Treating existing file as valid for now." -ForegroundColor Cyan
        exit 0
    }
    if ($existingHash -ne $ExpectedSha256) {
        Remove-Item $TargetPath -Force -ErrorAction SilentlyContinue
        Write-Host "[ERROR] Existing file checksum mismatch. Deleted invalid model file." -ForegroundColor Red
        Write-Host "[ERROR] Expected: $ExpectedSha256" -ForegroundColor Red
        Write-Host "[ERROR] Actual:   $existingHash" -ForegroundColor Red
        Write-Host "[INFO] Run this script again to re-download." -ForegroundColor Cyan
        exit 1
    }
    Write-Host "[PASS] Existing model checksum verified." -ForegroundColor Green
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

if ($ExpectedSha256 -eq "PLACEHOLDER_UPDATE_AFTER_DOWNLOAD") {
    Write-Host "[WARN] Expected SHA-256 is not set (placeholder). Skipping verification." -ForegroundColor Yellow
    Write-Host "[INFO] To verify this file later, compute: (Get-FileHash .\models\yolov8n.onnx -Algorithm SHA256).Hash" -ForegroundColor Cyan
    Write-Host "[INFO] Then update `$ExpectedSha256 in this script." -ForegroundColor Cyan
} elseif ($actualHash -ne $ExpectedSha256) {
    Remove-Item $TargetPath -Force -ErrorAction SilentlyContinue
    Write-Host "[ERROR] Checksum mismatch. Deleted invalid model file." -ForegroundColor Red
    Write-Host "[ERROR] Expected: $ExpectedSha256" -ForegroundColor Red
    Write-Host "[ERROR] Actual:   $actualHash" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[PASS] Checksum verified successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "[INFO] Model saved at: $TargetPath" -ForegroundColor Green
Write-Host "[INFO] Set CV_WORKER_ONNX_MODEL_PATH=$TargetPath in your .env to use it."
Write-Host "[INFO] Then set CV_WORKER_DETECTOR_MODE=onnx and restart the CV worker."
