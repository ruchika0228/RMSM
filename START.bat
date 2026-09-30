@echo off
title RMSM - Rashtriya Modi Seva Mission
color 0E
echo.
echo ============================================
echo   RMSM - Candidate Registration System
echo   Rashtriya Modi Seva Mission
echo   Sewa  Samarpan  Sanskar
echo ============================================
echo.

cd /d "%~dp0"

REM -- Start Backend --
echo [1/2] Starting Backend Server on Port 5000...
start "RMSM Backend" cmd /k "cd /d %~dp0server && node index.js"

echo Waiting for backend to initialize...
timeout /t 4 /nobreak >nul

REM -- Start Frontend --
echo [2/2] Starting React Frontend on Port 3000...
start "RMSM Frontend" cmd /k "cd /d %~dp0client && set CI=false && npm start"

echo.
echo ============================================
echo   RMSM Application Starting...
echo.
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:3000
echo   API Docs : http://localhost:5000/api/health
echo.
echo   Admin Login:
echo   Username : admin
echo   Password : rmsm@2024
echo ============================================
echo.
echo Waiting for frontend to compile (30-60 sec)...
timeout /t 30 /nobreak >nul
start http://localhost:3000
echo Browser opened. Enjoy RMSM!
pause
