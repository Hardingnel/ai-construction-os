@echo off
title AI COS - Hybrid Mode
cd /d "%~dp0"

echo ============================================
echo  AI Construction Operating System
echo  HYBRID MODE - Web + Desktop + Backend + AI
echo ============================================
echo.
echo   Web App:    http://localhost:3000
echo   Desktop:    http://localhost:5173
echo   Backend:    http://localhost:3001/api
echo   Python AI:  http://localhost:8000
echo.

:: Check Node
where node >nul 2>&1 || ( echo [FAIL] Node.js required && pause && exit /b 1 )

:: Check Python
where python >nul 2>&1 || ( echo [FAIL] Python required && pause && exit /b 1 )

:: Start all services
start "AI-COS-Backend" cmd /c "cd /d "%~dp0backend" && npx tsx src/index.ts"
timeout /t 2 /nobreak >nul

:: Python AI (also auto-managed by backend; started here for standalone use)
start "AI-COS-Python" cmd /c "cd /d "%~dp0python-services" && python service.py"
timeout /t 2 /nobreak >nul

start "AI-COS-Web" cmd /c "cd /d "%~dp0web" && npm run dev"
timeout /t 3 /nobreak >nul

start "AI-COS-Desktop" cmd /c "cd /d "%~dp0frontend" && npx vite --host"
timeout /t 1 /nobreak >nul

echo.
echo  All services started. Open the URLs above in your browser.
echo  Close this window to stop all services.
echo.
pause

:: Cleanup on exit
taskkill /fi "WINDOWTITLE eq AI-COS-Backend*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq AI-COS-Python*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq AI-COS-Web*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq AI-COS-Desktop*" /f >nul 2>&1
echo Services stopped.
