# VisionFlow Browser Smoke Test
# Uses browser-use to verify UI health without manual inspection

param(
    [string]$Url = "http://localhost:5173",
    [string]$OutDir = ".artifacts\browser",
    [int]$Timeout = 30
)

$ErrorActionPreference = "Continue"
$failCount = 0
$passCount = 0

function Test-BrowserState {
    param([string]$TestName, [string]$Check, [bool]$Expected)

    Write-Host "  Checking: $TestName" -NoNewline
    # This is a placeholder — actual browser state checking done via browser-use CLI
    Write-Host "  [INFO] $Check" -ForegroundColor Gray
    return $true
}

Write-Host ""
Write-Host "  VisionFlow Browser Smoke Test" -ForegroundColor Cyan
Write-Host "  =============================" -ForegroundColor Cyan
Write-Host ""

# Ensure output directory
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

Write-Host "[1] Starting browser-use smoke..." -ForegroundColor Yellow

# --- Home page ---
Write-Host "  Opening $Url..." -ForegroundColor Gray
browser-use open $Url 2>&1 | Out-Null
Start-Sleep -Seconds 3

browser-use screenshot "$OutDir\home.png" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [PASS] Home page screenshot saved" -ForegroundColor Green
    $passCount++
} else {
    Write-Host "  [FAIL] Could not capture home screenshot" -ForegroundColor Red
    $failCount++
}

# --- State check ---
$stateOutput = browser-use state 2>&1
if ($LASTEXITCODE -eq 0 -and $stateOutput) {
    Write-Host "  [PASS] Browser state retrieved" -ForegroundColor Green
    $passCount++

    # Check for common error indicators
    $stateText = $stateOutput -join " "
    $errorIndicators = @("API disconnected", "QUEUED", "RUNNING", "404", "not found", "disconnected")
    $foundErrors = @()
    foreach ($err in $errorIndicators) {
        if ($stateText -match $err) {
            $foundErrors += $err
        }
    }

    if ($foundErrors.Count -gt 0) {
        Write-Host "  [WARN] Found indicators: $($foundErrors -join ', ')" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [FAIL] Could not retrieve browser state" -ForegroundColor Red
    $failCount++
}

browser-use close 2>&1 | Out-Null

# --- Summary ---
Write-Host ""
Write-Host "  =============================" -ForegroundColor Cyan
Write-Host "  PASS: $passCount   FAIL: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "  Screenshots saved to: $OutDir" -ForegroundColor Gray
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "  Browser smoke PASSED." -ForegroundColor Green
} else {
    Write-Host "  Browser smoke had issues. Check screenshots in $OutDir" -ForegroundColor Yellow
}

exit $failCount
