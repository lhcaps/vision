# VisionFlow Runtime Verification Script
# Run after any code change to verify the system is healthy

param(
    [switch]$SkipBuild,
    [switch]$SkipSeed,
    [switch]$SkipBrowser,
    [string]$Project = "proj_parking_lot"
)

$ErrorActionPreference = "Continue"
$failCount = 0
$passCount = 0
$BASE = "http://localhost:3000"

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedPattern = $null,
        [string]$MustNotContain = $null,
        [int]$ExpectedStatus = 200
    )

    Write-Host "  Checking: $Name" -NoNewline
    try {
        $resp = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -UseBasicParsing
        $body = $resp.Content

        if ($resp.StatusCode -ne $ExpectedStatus) {
            Write-Host "  [FAIL] HTTP $($resp.StatusCode) (expected $ExpectedStatus)" -ForegroundColor Red
            $script:failCount++
            return $false
        }

        if ($ExpectedPattern -and $body -notmatch $ExpectedPattern) {
            Write-Host "  [FAIL] Response missing: $ExpectedPattern" -ForegroundColor Red
            $script:failCount++
            return $false
        }

        if ($MustNotContain) {
            foreach ($pattern in $MustNotContain -split ",") {
                if ($body -match $pattern.Trim()) {
                    Write-Host "  [FAIL] Response contains forbidden: $pattern" -ForegroundColor Red
                    $script:failCount++
                    return $false
                }
            }
        }

        Write-Host "  [PASS]" -ForegroundColor Green
        $script:passCount++
        return $true
    } catch {
        Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
        $script:failCount++
        return $false
    }
}

Write-Host ""
Write-Host "  VisionFlow Runtime Verification" -ForegroundColor Cyan
Write-Host "  =================================" -ForegroundColor Cyan
Write-Host ""

# --- TypeScript checks ---
Write-Host "[1] TypeScript / Build Checks" -ForegroundColor Yellow
if (-not $SkipBuild) {
    Write-Host "  Running pnpm typecheck..." -ForegroundColor Gray
    $tc = pnpm typecheck 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] pnpm typecheck" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "  [FAIL] pnpm typecheck failed" -ForegroundColor Red
        $failCount++
    }

    Write-Host "  Running pnpm build..." -ForegroundColor Gray
    $build = pnpm build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] pnpm build" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "  [FAIL] pnpm build failed" -ForegroundColor Red
        $failCount++
    }
} else {
    Write-Host "  [SKIP] Build checks (--SkipBuild)" -ForegroundColor Gray
}

# --- Database seed ---
Write-Host ""
Write-Host "[2] Database Seed" -ForegroundColor Yellow
if (-not $SkipSeed) {
    Write-Host "  Running pnpm seed:db -- --reset..." -ForegroundColor Gray
    $seed = pnpm seed:db -- --reset 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] seed-db reset" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "  [WARN] seed-db failed (may not be configured)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [SKIP] Seed (--SkipSeed)" -ForegroundColor Gray
}

# --- API endpoints ---
Write-Host ""
Write-Host "[3] API Endpoint Checks" -ForegroundColor Yellow

$mustNotContain = "QUEUED,RUNNING,Dataset version not found,Annotation workspace 404,API is not connected,Progress stream disconnected,PrismaClientKnownRequestError"

$DatasetId = "ds_proj_parking_lot"
Test-Endpoint -Name "API Health" -Url "$BASE/api/health" -ExpectedPattern '"status"'
Test-Endpoint -Name "Datasets" -Url "$BASE/api/projects/$Project/datasets"
Test-Endpoint -Name "Dataset Versions" -Url "$BASE/api/projects/$Project/datasets/$DatasetId/versions"

Write-Host "  Checking: Inference Jobs (polling for terminal state)..." -NoNewline
$jobPollingPass = $false
$latestStatus = $null
try {
    $maxAttempts = 20
    for ($i = 0; $i -lt $maxAttempts; $i++) {
        $resp = Invoke-WebRequest -Uri "$BASE/api/projects/$Project/inference-jobs" -TimeoutSec 10 -UseBasicParsing
        $body = $resp.Content | ConvertFrom-Json -AsHashtable
        $latestJob = $body.jobs[0]
        $latestStatus = $latestJob.status

        if ($latestStatus -eq "SUCCEEDED" -or $latestStatus -eq "FAILED" -or $latestStatus -eq "CANCELLED") {
            $jobPollingPass = $true
            break
        }

        Start-Sleep -Seconds 1
    }

    if ($jobPollingPass) {
        Write-Host "  [PASS] Latest job reached terminal state: $latestStatus" -ForegroundColor Green
        $passCount++

        $jobsJson = $body | ConvertTo-Json -Depth 10 -Compress
        foreach ($pattern in $mustNotContain -split ",") {
            if ($jobsJson -match [regex]::Escape($pattern.Trim())) {
                Write-Host "  [FAIL] Inference jobs response contains forbidden: $pattern" -ForegroundColor Red
                $script:failCount++
            }
        }
    } else {
        Write-Host "  [FAIL] Latest job did not reach terminal state after $maxAttempts attempts. Status: $latestStatus" -ForegroundColor Red
        $failCount++
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $script:failCount++
}
Test-Endpoint -Name "Annotation Workspace" -Url "$BASE/api/projects/$Project/dataset-versions/dataset_${Project}_parking_v3/annotation-workspace?assetId=asset_frame_1482"

# --- Summary ---
Write-Host ""
Write-Host "  =================================" -ForegroundColor Cyan
Write-Host "  PASS: $passCount   FAIL: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "  All runtime checks passed." -ForegroundColor Green
    exit 0
} else {
    Write-Host "  Runtime verification FAILED. Fix issues before claiming success." -ForegroundColor Red
    exit 1
}
