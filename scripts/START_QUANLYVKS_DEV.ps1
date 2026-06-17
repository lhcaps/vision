$ErrorActionPreference = "Continue"

Write-Host "============================================"
Write-Host "STARTING QUANLYVKS DEV"
Write-Host "============================================"

$ApiPath = "C:\LUẬT\QUANLYVKS\apps\api"
$WebPath = "C:\LUẬT\QUANLYVKS\apps\web"

Write-Host "[1/3] Starting API..."
Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location `"$ApiPath`"; pnpm run start:dev"
)

Start-Sleep -Seconds 6

Write-Host "[2/3] Starting WEB..."
Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location `"$WebPath`"; pnpm run dev -- -H 0.0.0.0"
)

Start-Sleep -Seconds 10

Write-Host "[3/3] Opening browser..."
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "QUANLYVKS DEV STARTED"
Write-Host "API: http://localhost:3001/api/v1"
Write-Host "WEB: http://localhost:3000"
Write-Host ""
Write-Host "IMPORTANT:"
Write-Host "- Keep API and WEB PowerShell windows open."
Write-Host "- If you close them, the system stops."
Write-Host "- You can still edit code normally."
Write-Host ""

Read-Host "Press Enter to close this launcher window"
