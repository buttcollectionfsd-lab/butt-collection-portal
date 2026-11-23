@echo off
title Butt Collection Merchandiser Portal
echo =========================================================
echo    STARTING BUTT COLLECTION MERCHANDISER PORTAL
echo =========================================================
echo.
echo 1. Launching Express Backend Server (Port 5000)...
start "Butt Collection Backend" cmd /k "cd /d %~dp0server && node server.js"

echo 2. Launching React Frontend (Port 3000)...
start "Butt Collection Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Waiting 4 seconds for servers to start...
timeout /t 4 /nobreak >nul

echo 3. Opening Portal in your default browser...
start http://localhost:3000

echo =========================================================
echo Portal is running!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo =========================================================
pause
