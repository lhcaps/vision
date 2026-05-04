$ErrorActionPreference = "Stop"
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/health/runtime/status" -TimeoutSec 10 -UseBasicParsing
    Write-Host "Status: HTTP $($r.StatusCode)"
    Write-Host "Body: $($r.Content)"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
}
