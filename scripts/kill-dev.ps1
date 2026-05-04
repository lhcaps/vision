# Kill stale VisionFlow processes
$ErrorActionPreference = "SilentlyContinue"
foreach ($port in @(3000, 5173, 8000)) {
    $conn = Get-NetTCPConnection -LocalPort $port
    if ($conn) {
        $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            if ($p -gt 0) {
                $name = (Get-Process -Id $p).ProcessName
                Stop-Process -Id $p -Force
                Write-Host "Killed $name (PID $p) on port $port"
            }
        }
    } else {
        Write-Host "Port $port is free"
    }
}
