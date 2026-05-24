@echo off
title AI COS - Dev Mode
cd /d "%~dp0"

echo Starting AI Construction OS (Development Mode)
echo.
echo  Frontend:  http://localhost:5173
echo  Backend:   http://localhost:3001/api
echo  Python AI: http://localhost:8000
echo.

:: Backend
start "AI-COS-Backend" cmd /c "cd /d "%~dp0backend" && npx tsx src/index.ts"
timeout /t 2 /nobreak >nul

:: Python AI is auto-started by the backend service manager (pythonServiceManager.ts)
:: To run Python standalone: cd python-services && python service.py

:: Frontend (Vite only, no Electron for faster dev)
cd /d "%~dp0frontend"
call npx vite --host

:: If user closes Vite, also kill background processes
echo.
echo Stopping services...
taskkill /fi "WINDOWTITLE eq AI-COS-Backend*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq AI-COS-Python*" /f >nul 2>&1
echo Done.
