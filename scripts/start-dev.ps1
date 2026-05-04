# VisionFlow Studio -- Full Stack Boot (Windows)
$ErrorActionPreference = "Stop"

$ROOT = Split-Path -Parent $PSScriptRoot

function Log-Info($msg) { Write-Host "==> $msg" }
function Log-Warn($msg)  { Write-Host "WARNING: $msg" -ForegroundColor Yellow }
function Log-Error($msg){ Write-Host "ERROR: $msg" -ForegroundColor Red }
function Log-Ok($msg)    { Write-Host "[OK] $msg" -ForegroundColor Green }

Write-Host ""
Write-Host "===================================================="
Write-Host " VisionFlow Studio -- Full Stack Boot"
Write-Host "===================================================="
Write-Host ""

# Step 0: Kill anything holding dev ports
Log-Info "Stopping stale dev servers..."
foreach ($port in @(3000, 5173, 8000)) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            if ($p -gt 0) {
                $name = (Get-Process -Id $p -ErrorAction SilentlyContinue).ProcessName
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                Write-Host "    Killed $name (PID $p) on port $port"
            }
        }
    }
}
Start-Sleep -Seconds 2

# Step 1: Check Docker
Log-Info "Checking Docker..."
$null = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Log-Error "Docker is not running. Start Docker Desktop first."
    exit 1
}
Log-Ok "Docker running"

# Step 2: Check pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Log-Error "pnpm is not installed."
    exit 1
}
Log-Ok "pnpm available"

# Step 3: Start infra
Write-Host ""
Log-Info "Starting Docker infra..."
docker compose -f "$ROOT/infra/docker-compose.yml" up -d

# Step 4: Wait for services
Write-Host ""
Log-Info "Waiting for services..."

$maxWait = 30
function Wait-For($svc, $check) {
    for ($i = 0; $i -lt $maxWait; $i++) {
        $null = Invoke-Expression $check 2>$null
        if ($LASTEXITCODE -eq 0) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

if (-not (Wait-For "PostgreSQL" "docker exec visionflow-postgres pg_isready -U visionflow")) {
    Log-Error "PostgreSQL failed to start."
    exit 1
}
Log-Ok "PostgreSQL ready"

if (-not (Wait-For "Redis" "docker exec visionflow-redis redis-cli ping")) {
    Log-Error "Redis failed to start."
    exit 1
}
Log-Ok "Redis ready"

# MinIO health via container curl (avoids Windows Invoke-WebRequest issues)
if (-not (Wait-For "MinIO" "docker exec visionflow-minio curl -sf http://localhost:9000/minio/health/live")) {
    Log-Error "MinIO failed to start."
    exit 1
}
Log-Ok "MinIO ready"

# Step 5: Prisma — use cmd /c to bypass pnpm.ps1 corepack shim incompatibility with PowerShell
Write-Host ""
Log-Info "Generating Prisma client..."
Set-Location $ROOT
$dbGenOutput = cmd /c "pnpm db:generate 2>&1"
if ($LASTEXITCODE -ne 0) {
    Log-Error "Prisma generate failed."
    Write-Host $dbGenOutput
    exit 1
}
Log-Ok "Prisma client generated"

Log-Info "Pushing schema..."
$dbPushOutput = cmd /c "pnpm db:push 2>&1"
if ($LASTEXITCODE -ne 0) {
    Log-Error "Prisma db push failed."
    Write-Host $dbPushOutput
    exit 1
}
Log-Ok "Schema in sync"

# Step 6: Seed
Write-Host ""
Log-Info "Seeding database..."
$seedOutput = cmd /c "pnpm seed:db 2>&1"
if ($LASTEXITCODE -eq 0) { Log-Ok "Database seeded" }
else { Log-Warn "Seed failed -- Run button may be disabled"; Write-Host $seedOutput }

# Step 7: Start dev servers
Write-Host ""
Log-Info "Starting dev servers..."
Write-Host ""

$devProc = Start-Process powershell -PassThru -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT'; pnpm dev"
$cvProc = Start-Process powershell -PassThru -ArgumentList "-NoExit", "-Command", "Set-Location '$ROOT/apps/cv-worker/src'; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
Write-Host "  Dev server (API+Web) PID: $($devProc.Id)" -ForegroundColor Yellow
Write-Host "  CV Worker PID: $($cvProc.Id)" -ForegroundColor Yellow
Write-Host ""

function Wait-Http($name, $url, $maxWaitSeconds = 90) {
    Write-Host ("  Waiting for {0} at {1}..." -f $name, $url)
    for ($i = 0; $i -lt $maxWaitSeconds; $i++) {
        # Use Start-Job to ensure the request has its own timeout context,
        # avoiding Invoke-WebRequest -TimeoutSec hanging in some environments.
        $job = Start-Job -ScriptBlock {
            param($u)
            try {
                $res = Invoke-WebRequest -Uri $u -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
                return $res.StatusCode
            } catch {
                return $null
            }
        } -ArgumentList $url
        $result = Wait-Job $job -Timeout 6 | Out-Null
        try {
            $statusCode = Receive-Job $job -ErrorAction SilentlyContinue
        } catch {
            $statusCode = $null
        }
        Remove-Job $job -Force -ErrorAction SilentlyContinue

        if ($null -ne $statusCode -and $statusCode -ge 200 -and $statusCode -lt 500) {
            Write-Host ("      [OK] {0} ready ({1}s)" -f $name, $i) -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

# API readiness check
if (-not (Wait-Http "API" "http://localhost:3000/api/health" 90)) {
    Write-Host ""
    Log-Error "API failed to become ready. Check the pnpm dev window for NestJS errors."
    Write-Host "  Common causes:"
    Write-Host "    - Missing DATABASE_URL or other env vars in .env"
    Write-Host "    - PostgreSQL not ready (check docker logs)"
    Write-Host "    - Prisma client out of sync (run pnpm db:generate)"
    Write-Host ""
    Write-Host "  Dev server PID: $($devProc.Id)" -ForegroundColor Yellow
    Write-Host "  CV Worker PID: $($cvProc.Id)" -ForegroundColor Yellow
    exit 1
}

# CV Worker readiness check (120s: uvicorn needs time to start + optionally load ONNX model)
if (-not (Wait-Http "CV Worker" "http://localhost:8000/health" 120)) {
    Write-Host ""
    Log-Error "CV Worker failed to become ready after 120s."
    Write-Host ""
    Write-Host "  To start CV Worker manually, run:" -ForegroundColor Yellow
    Write-Host "    cd apps/cv-worker/src" -ForegroundColor Cyan
    Write-Host "    python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Dev server PID: $($devProc.Id)" -ForegroundColor Yellow
    Write-Host "  CV Worker PID: $($cvProc.Id)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  The CV Worker is optional. Dev server (API+Web) is already running." -ForegroundColor Yellow
    Write-Host "  You can open http://localhost:5173 and use Mock detector mode." -ForegroundColor Yellow
    Write-Host ""
    # Don't exit — let user decide if they want mock mode to proceed
    # Write-Host "  (Optional) Press Ctrl+C to stop, or let mock-mode continue..."
    # For now, just warn and continue since API/Web are already up
    Log-Warn "Continuing without CV Worker. Run button will use mock detector."
    Write-Host ""
}

# Web readiness check (Vite dev server)
if (-not (Wait-Http "Web" "http://localhost:5173" 60)) {
    Write-Host ""
    Log-Error "Web dev server failed to become ready. Check the Vite window."
    exit 1
}

Write-Host ""
Write-Host "===================================================="
Write-Host " VisionFlow Studio is running!"
Write-Host "  API:     http://localhost:3000"
Write-Host "  Web:     http://localhost:5173"
Write-Host "  Swagger: http://localhost:3000/api/docs"
Write-Host "  CV Worker: http://localhost:8000"
Write-Host "  MinIO:   http://localhost:9000  (console: http://localhost:9001)"
Write-Host ""
Write-Host "  Stop: docker compose -f infra/docker-compose.yml down"
Write-Host "===================================================="
Write-Host ""
