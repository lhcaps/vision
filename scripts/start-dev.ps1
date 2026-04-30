# VisionFlow Studio — Full Stack Boot (Windows)
$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host " VisionFlow Studio — Full Stack Boot"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Start infrastructure
Write-Host ""
Write-Host "▶ Starting infrastructure (Docker)..."
docker compose -f "$ROOT/infra/docker-compose.yml" up -d

# Wait for postgres
Write-Host "▶ Waiting for PostgreSQL..."
$attempts = 0
while ($attempts -lt 30) {
    $attempts++
    try {
        docker exec vision-postgres-1 pg_isready -U postgres | Out-Null
        Write-Host "✓ PostgreSQL is ready"
        break
    } catch {
        Start-Sleep -Seconds 1
    }
    if ($attempts -eq 30) {
        Write-Host "✗ PostgreSQL failed to start"
        exit 1
    }
}

# Step 2: Generate Prisma client
Write-Host ""
Write-Host "▶ Generating Prisma client..."
Push-Location $ROOT
pnpm db:generate
Pop-Location

# Step 3: Start apps
Write-Host ""
Write-Host "▶ Starting all apps..."
Write-Host "  Web:     http://localhost:5173"
Write-Host "  API:     http://localhost:3000"
Write-Host "  Swagger: http://localhost:3000/api/docs"
Write-Host ""

# Start web + api in background
Start-Process powershell -ArgumentList "-NoExit", "cd $ROOT; pnpm dev"

# Start CV worker in background
Start-Process powershell -ArgumentList "-NoExit", "cd $ROOT; python -m uvicorn apps.cv-worker.src.main:app --reload --port 8001 --host 127.0.0.1"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host " VisionFlow Studio is running!"
Write-Host "  Stop: docker compose -f infra/docker-compose.yml down"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
