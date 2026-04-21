@echo off
setlocal ENABLEEXTENSIONS
color 0A
title Charlie Tool Backend Setup (No venv)

echo ================================
echo   Charlie Tool Backend Setup
echo   (Global Python Mode)
echo ================================
echo.

:: Set working directory to where this .bat file lives
cd /d "%~dp0"
echo Current directory: %CD%
echo.

:: Move into Server folder
IF NOT EXIST Server (
    echo ❌ Server folder not found in %CD%
    goto END
)
cd Server
echo Server directory: %CD%
echo.

:: Kill port 8000
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') DO (
    taskkill /F /PID %%P >nul 2>&1
)

:: Check Python
echo 🐍 Checking Python...
python --version
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found. Please install Python first.
    goto END
)
echo.

:: Install dependencies globally
IF NOT EXIST requirements.txt (
    echo ❌ requirements.txt missing
    goto END
)

echo 📦 Installing dependencies...
python -m pip install -r requirements.txt --only-binary pandas
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Pinned pandas version failed. Trying latest compatible version...
    findstr /V /I "pandas" requirements.txt > requirements_no_pandas.txt
    python -m pip install -r requirements_no_pandas.txt
    python -m pip install pandas --only-binary :all:
    del requirements_no_pandas.txt
)
echo.

:: Verify pandas installed
python -c "import pandas" 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ pandas could not be installed.
    echo 💡 Try installing Python 3.12 or 3.13 instead of 3.14.
    goto END
)
echo ✅ All dependencies installed successfully.
echo.

:: Verify Main.py
IF NOT EXIST Main.py (
    echo ❌ Main.py not found in %CD%
    goto END
)

:: Run FastAPI
echo 🎉 Starting server at http://127.0.0.1:8000
echo Press CTRL+C to stop the server.
echo ============================================
python -m uvicorn Main:app --reload --port 8000
echo.
echo ⚠️ Server has stopped.

:END
echo.
echo Press any key to close...
pause >nul