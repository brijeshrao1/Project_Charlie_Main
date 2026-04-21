@echo off
setlocal ENABLEEXTENSIONS
color 0A
title Charlie Tool Backend Setup (No venv)

echo ================================
echo   Charlie Tool Backend Setup
echo   (Global Python Mode)
echo ================================

pushd Server
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Could not find Server folder
    pause
    exit /b
)

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
    echo 📦 Installing dependencies...
    python -m pip install -r requirements.txt --only-binary pandas 2>nul
    IF %ERRORLEVEL% NEQ 0 (
        echo ⚠️ Pinned pandas version failed (no wheel for this Python).
        echo 📦 Retrying with latest compatible pandas wheel...
        findstr /V /I "pandas" requirements.txt > requirements_no_pandas.txt
        python -m pip install -r requirements_no_pandas.txt
        python -m pip install pandas --only-binary :all:
        del requirements_no_pandas.txt
    )
) ELSE (
    echo ❌ requirements.txt missing
    pause
    exit /b
)

:: Verify pandas installed
python -c "import pandas" 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ pandas is still not available.
    echo 💡 Try using Python 3.12 or 3.13 which have pre-built pandas wheels.
    pause
    exit /b
)
echo ✅ All dependencies installed successfully.

:: Verify Main.py
IF NOT EXIST Main.py (
    echo ❌ Main.py not found
    pause
    exit /b
)

:: Run FastAPI
echo 🎉 Starting server at http://127.0.0.1:8000
echo Press CTRL+C to stop the server.
echo ============================================
python -m uvicorn Main:app --reload --port 8000

:: If server exits or crashes, keep window open
echo.
echo ⚠️ Server has stopped.
pause
popd
exit /b