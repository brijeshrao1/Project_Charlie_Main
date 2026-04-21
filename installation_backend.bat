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
    echo 📦 Installing dependencies...
    python -m pip install -r requirements.txt --only-binary pandas 2>nul
    IF %ERRORLEVEL% NEQ 0 (
        echo ⚠️ Pinned pandas version failed (no wheel for this Python).
        echo 📦 Retrying with latest compatible pandas wheel...
        python -m pip install -r requirements.txt --ignore-installed pandas --only-binary pandas 2>nul
        IF %ERRORLEVEL% NEQ 0 (
            echo 📦 Installing other deps first, then pandas separately...
            findstr /V /I "pandas" requirements.txt > requirements_no_pandas.txt
            python -m pip install -r requirements_no_pandas.txt
            python -m pip install pandas --only-binary :all:
            del requirements_no_pandas.txt
            IF %ERRORLEVEL% NEQ 0 (
                echo ❌ pandas could not be installed.
                echo 💡 Try using Python 3.12 or 3.13 which have pre-built pandas wheels.
                pause
                exit /b
            )
        )
    )
) ELSE (
    echo ❌ requirements.txt missing
    pause
    exit /b
)

:: Verify pandas installed
python -c "import pandas" 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ pandas is still not available. Please install Python 3.12 or 3.13.
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
start "Charlie Tool Backend" /b cmd /k ^
"python -m uvicorn Main:app --reload --port 8000"

echo 🎉 Server running at http://127.0.0.1:8000
popd
exit /b