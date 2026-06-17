$ErrorActionPreference = "Stop"

try {
  Start-Transcript -Path "C:\LUẬT\QUANLYVKS\scripts\START_QUANLYVKS_DEV_DEBUG.log" -Append | Out-Null

  Write-Host "============================================" -ForegroundColor Cyan
  Write-Host "STARTING QUANLYVKS DEV DEBUG" -ForegroundColor Cyan
  Write-Host "============================================" -ForegroundColor Cyan

  $ProjectRoot = "C:\LUẬT\QUANLYVKS"
  $ApiPath = Join-Path $ProjectRoot "apps\api"
  $WebPath = Join-Path $ProjectRoot "apps\web"

  Write-Host ""
  Write-Host "[CHECK] Project root: $ProjectRoot"
  Write-Host "[CHECK] API path: $ApiPath"
  Write-Host "[CHECK] WEB path: $WebPath"

  if (-not (Test-Path $ProjectRoot)) {
    throw "Không tìm thấy project root: $ProjectRoot"
  }

  if (-not (Test-Path $ApiPath)) {
    throw "Không tìm thấy API path: $ApiPath"
  }

  if (-not (Test-Path $WebPath)) {
    throw "Không tìm thấy WEB path: $WebPath"
  }

  $PnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue

  if (-not $PnpmCommand) {
    throw "Không tìm thấy pnpm. Hãy mở terminal chạy: npm install -g pnpm"
  }

  Write-Host "[OK] pnpm found: $($PnpmCommand.Source)" -ForegroundColor Green

  Write-Host ""
  Write-Host "[1/3] Starting API..." -ForegroundColor Yellow

  Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "Set-Location `"$ApiPath`"; pnpm run start:dev"
  )

  Start-Sleep -Seconds 7

  Write-Host "[2/3] Starting WEB..." -ForegroundColor Yellow

  Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "Set-Location `"$WebPath`"; pnpm run dev -- -H 0.0.0.0"
  )

  Start-Sleep -Seconds 10

  Write-Host "[3/3] Opening browser..." -ForegroundColor Yellow
  Start-Process "http://localhost:3000"

  Write-Host ""
  Write-Host "============================================" -ForegroundColor Green
  Write-Host "QUANLYVKS DEV STARTED" -ForegroundColor Green
  Write-Host "API: http://localhost:3001/api/v1"
  Write-Host "WEB: http://localhost:3000"
  Write-Host "============================================" -ForegroundColor Green
  Write-Host ""
  Write-Host "Đừng đóng 2 cửa sổ API và WEB." -ForegroundColor Yellow

  Stop-Transcript | Out-Null
}
catch {
  Write-Host ""
  Write-Host "============================================" -ForegroundColor Red
  Write-Host "START FAILED" -ForegroundColor Red
  Write-Host "============================================" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ""
  Write-Host "Log file: C:\LUẬT\QUANLYVKS\scripts\START_QUANLYVKS_DEV_DEBUG.log" -ForegroundColor Yellow

  try {
    Stop-Transcript | Out-Null
  } catch {}
}

Write-Host ""
Read-Host "Nhấn Enter để đóng cửa sổ này"
