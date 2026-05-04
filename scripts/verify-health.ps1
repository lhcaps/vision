$ErrorActionPreference = "Stop"
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "API: HTTP $($r.StatusCode)"
} catch {
    Write-Host "API: FAILED - $($_.Exception.Message)"
}
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "CV Worker: HTTP $($r.StatusCode)"
} catch {
    Write-Host "CV Worker: FAILED - $($_.Exception.Message)"
}
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
    Write-Host "Web: HTTP $($r.StatusCode)"
} catch {
    Write-Host "Web: FAILED - $($_.Exception.Message)"
}
