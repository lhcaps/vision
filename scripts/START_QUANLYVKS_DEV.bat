@echo off
title START QUANLYVKS DEV

echo ============================================
echo STARTING QUANLYVKS DEV
echo ============================================
echo.

echo [1/3] Starting API...
cd /d C:\LU?T\QUANLYVKS\apps\api
start "QUANLYVKS API - DO NOT CLOSE" cmd /k "pnpm run start:dev"

echo Waiting API...
timeout /t 6 /nobreak > nul

echo [2/3] Starting WEB...
cd /d C:\LU?T\QUANLYVKS\apps\web
start "QUANLYVKS WEB - DO NOT CLOSE" cmd /k "pnpm run dev -- -H 0.0.0.0"

echo Waiting WEB...
timeout /t 10 /nobreak > nul

echo [3/3] Opening browser...
start http://localhost:3000

echo.
echo ============================================
echo QUANLYVKS DEV STARTED
echo API: http://localhost:3001/api/v1
echo WEB: http://localhost:3000
echo.
echo IMPORTANT:
echo - Keep the API and WEB terminal windows open.
echo - If you close them, the system stops.
echo - You can still edit code normally.
echo - After changing code, restart this shortcut if needed.
echo ============================================
echo.
pause
