# VisionFlow Studio — Full Stack Boot (Windows)
$ErrorActionPreference = "Stop"

$ROOT = Split-Path -Parent $PSScriptRoot

function Log-Info($msg) { Write-Host "▶ $msg" }
function Log-Warn($msg)  { Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Log-Error($msg){ Write-Host "✗ $msg" -ForegroundColor Red }
function Log-Ok($msg)    { Write-Host "✓ $msg" -ForegroundColor Green }

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host " VisionFlow Studio — Full Stack Boot"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 0: Validate prerequisites
Write-Host ""
Log-Info "Checking prerequisites..."

$dockerCheck = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Log-Error "Docker is not running. Please start Docker Desktop."
    exit 1
}
Log-Ok "Docker is running"

$pnpmCheck = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmCheck) {
    Log-Error "pnpm is not installed. Run: npm install -g pnpm"
    exit 1
}
Log-Ok "pnpm is available"

# Step 1: Start infrastructure
Write-Host ""
Log-Info "Starting infrastructure (Docker)..."
docker compose -f "$ROOT/infra/docker-compose.yml" up -d

# Step 2: Wait for services
Write-Host ""
Log-Info "Waiting for services..."

function Wait-ForService($name, $checkCmd, $maxAttempts = 30) {
    for ($i = 1; $i -le $maxAttempts; $i++) {
        $result = Invoke-Expression $checkCmd 2>$null
        if ($LASTEXITCODE -eq 0) {
            Log-Ok "$name is ready"
            return $true
        }
        Start-Sleep -Seconds 1
    }
    Log-Error "$name failed to start after ${maxAttempts}s"
    return $false
}

$pgReady = Wait-ForService "PostgreSQL" "docker exec visionflow-postgres pg_isready -U visionflow"
if (-not $pgReady) { exit 1 }

$redisReady = Wait-ForService "Redis" "docker exec visionflow-redis redis-cli ping"
if (-not $redisReady) { exit 1 }

$minioReady = Wait-ForService "MinIO" "try { Invoke-WebRequest -Uri 'http://localhost:9000/minio/health/live' -Method Head -TimeoutSec 2 } catch { `$false }"
if (-not $minioReady) { exit 1 }

# Step 3: Generate Prisma client
Write-Host ""
Log-Info "Generating Prisma client..."
Push-Location $ROOT
try {
    pnpm db:generate
    if ($LASTEXITCODE -ne 0) {
        Log-Error "Prisma client generation failed"
        exit 1
    }
} finally {
    Pop-Location
}

# Step 3b: Apply Prisma schema
Write-Host ""
Log-Info "Applying Prisma schema..."
Push-Location $ROOT
try {
    pnpm db:push
    if ($LASTEXITCODE -ne 0) {
        Log-Error "Prisma db push failed"
        exit 1
    }
} finally {
    Pop-Location
}

# Step 3c: Seed database with demo project
Write-Host ""
Log-Info "Seeding database..."
Push-Location $ROOT
try {
    pnpm seed:db
    if ($LASTEXITCODE -ne 0) {
        Log-Warn "Database seed failed — Run button may be disabled"
    } else {
        Log-Ok "Database seeded"
    }
} catch {
    Log-Warn "Database seed skipped"
} finally {
    Pop-Location
}

# Step 4: Validate demo data (legacy, non-API mode)
Write-Host ""
Log-Info "Validating demo data..."
Push-Location $ROOT
try {
    pnpm seed 2>$null
    if ($LASTEXITCODE -ne 0) {
        Log-Warn "Demo data validation skipped"
    }
} catch {
    Log-Warn "Demo data validation skipped"
} finally {
    Pop-Location
}

# Step 5: Start all apps
Write-Host ""
Log-Info "Starting all apps..."
Write-Host ""
Write-Host "  Web:     http://localhost:5173"
Write-Host "  API:     http://localhost:3000"
Write-Host "  Swagger: http://localhost:3000/api/docs"
Write-Host "  MinIO:   http://localhost:9000 (console: http://localhost:9001)"
Write-Host ""

# Start API + web in background
Start-Process powershell -ArgumentList "-NoExit", "cd '$ROOT'; pnpm dev"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host " VisionFlow Studio is running!"
Write-Host "  Stop: docker compose -f infra/docker-compose.yml down"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
