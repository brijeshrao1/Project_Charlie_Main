@echo off
setlocal ENABLEEXTENSIONS
color 0A
title Charlie Tool Backend Setup (No venv)

echo ================================
echo   Charlie Tool Backend Setup
echo   (Global Python Mode)
echo ================================

pushd Server

:: Kill port 8000
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') DO (
    taskkill /F /PID %%P >nul 2>&1
)

:: Check Python
python --version || (
    echo ❌ Python not found
    pause
    exit /b
)

:: Install dependencies globally
IF EXIST requirements.txt (
    python -m pip install -r requirements.txt
) ELSE (
    echo ❌ requirements.txt missing
    pause
    exit /b
)

:: Verify Main.py
IF NOT EXIST Main.py (
    echo ❌ Main.py not found
    pause
    exit /b
)

:: Run FastAPI
start "Charlie Tool Backend" /b cmd /k ^
"python -m uvicorn Main:app --reload --port 8000"

echo 🎉 Server running at http://127.0.0.1:8000
popd
exit /b
