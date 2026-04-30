$ErrorActionPreference = "Stop"

$API_PORT = 3000

$conn = Get-NetTCPConnection -LocalPort $API_PORT -ErrorAction SilentlyContinue
if ($conn) {
    $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "[ps1.run] Killing PID $p ($($proc.ProcessName)) on port $API_PORT" -ForegroundColor Red
            Stop-Process -Id $p -Force
        }
    }
    Start-Sleep -Milliseconds 300
}

Write-Host "[ps1.run] Starting NestJS API on port $API_PORT..." -ForegroundColor Green
pnpm dev
