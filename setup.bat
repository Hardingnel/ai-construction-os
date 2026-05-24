@echo off
title AI COS - Setup
cd /d "%~dp0"

echo ============================================
echo  AI Construction OS - Setup
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check Python
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Python not found. Install from https://python.org
    pause
    exit /b 1
)
echo [OK] Python found
echo.

:: Install root deps
echo [1/4] Installing root dependencies...
call npm install
echo.

:: Install frontend deps
echo [2/4] Installing frontend dependencies...
cd frontend
call npm install --legacy-peer-deps
cd ..
echo.

:: Install backend deps
echo [3/4] Installing backend dependencies...
cd backend
call npm install
call npx prisma generate
call npx prisma db push --accept-data-loss
echo.
call npx tsx src/seed.ts
cd ..
echo.

:: Install Python deps
echo [4/4] Installing Python packages...
cd python-services
pip install fastapi uvicorn pydantic python-multipart httpx
cd ..
echo.

echo ============================================
echo  Setup complete!
echo.
echo  Run start.bat to launch all services
echo  OR run dev.bat for development mode
echo ============================================
pause
