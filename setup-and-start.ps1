# RMSM Startup Script
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  RMSM - Candidate Registration System" -ForegroundColor Yellow
Write-Host "  Rashtriya Modi Seva Mission" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "[1/3] Installing server dependencies..." -ForegroundColor Cyan
Set-Location "$root\server"
npm install
Write-Host "Server dependencies installed." -ForegroundColor Green

Write-Host ""
Write-Host "[2/3] Installing client dependencies..." -ForegroundColor Cyan
Set-Location "$root\client"
npm install
Write-Host "Client dependencies installed." -ForegroundColor Green

Write-Host ""
Write-Host "[3/3] Starting servers..." -ForegroundColor Cyan

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\server'; node index.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\client'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  RMSM is starting up!" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Login:    admin / rmsm@2024" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
