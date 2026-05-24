@echo off
title AI Construction Operating System
cd /d "%~dp0"

echo ============================================
echo  AI Construction Operating System
echo  Starting all services...
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

:: Check Python
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.12+ from https://python.org
    pause
    exit /b 1
)

echo [1/4] Checking dependencies...
if not exist "frontend\node_modules" (
    echo  Installing frontend dependencies...
    cd frontend
    call npm install --legacy-peer-deps
    cd ..
)
if not exist "backend\node_modules" (
    echo  Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)
echo  Dependencies OK
echo.

echo [2/4] Setting up database...
cd backend
npx prisma generate >nul 2>&1
npx prisma db push --accept-data-loss >nul 2>&1
if not exist "prisma\dev.db" (
    echo  Running database seed...
    npx tsx src/seed.ts >nul 2>&1
)
cd ..
echo  Database ready
echo.

echo [3/4] Checking Python packages...
python -c "import fastapi" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  Installing Python packages...
    pip install fastapi uvicorn pydantic python-multipart httpx
)
echo  Python packages OK
echo.

echo [4/4] Starting services...
echo.
echo  Frontend:  http://localhost:5173
echo  Backend:   http://localhost:3001
echo  Python AI: http://localhost:8000
echo.
echo  Close this window to stop all services.
echo ============================================
echo.

:: Start Backend
start "AI-COS Backend" cmd /c "cd /d "%~dp0backend" && npx tsx src/index.ts"

:: Start Python AI Services
start "AI-COS Python" cmd /c "cd /d "%~dp0python-services" && python run.py"

:: Start Frontend (Electron + Vite)
cd frontend
call npx vite --host
