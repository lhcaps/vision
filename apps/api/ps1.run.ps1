$ErrorActionPreference = "Stop"

[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()
chcp 65001 | Out-Null

$API_PORT = 3000

$connections = Get-NetTCPConnection `
  -LocalPort $API_PORT `
  -State Listen `
  -ErrorAction SilentlyContinue |
  Where-Object { $_.OwningProcess -gt 0 }

if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($p in $pids) {
        if ($p -eq $PID) {
            Write-Host "[ps1.run] Skipping current PowerShell PID $p" -ForegroundColor Yellow
            continue
        }

        $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "[ps1.run] Killing PID $p ($($proc.ProcessName)) on port $API_PORT" -ForegroundColor Red
            Stop-Process -Id $p -Force
        }
    }

    Start-Sleep -Milliseconds 500
}

Write-Host "[ps1.run] Starting NestJS API on port $API_PORT..." -ForegroundColor Green
pnpm dev
