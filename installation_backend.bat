@echo off
setlocal ENABLEEXTENSIONS
color 0A
title Charlie Tool Backend Setup

echo ================================
echo    Charlie Tool Backend Setup
echo ================================

REM ✅ Move into Server directory
pushd Server

:: Step 0: Kill process on port 8000
echo.
echo [0] Checking and killing process on port 8000 if exists...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') DO (
    echo ⚠️ Killing PID %%P...
    taskkill /F /PID %%P >nul 2>&1
)

:: Step 1: Cleanup previous venv & __pycache__
echo.
echo [1] Cleaning up previous virtual environment and __pycache__ folders...

IF EXIST "venv" (
    echo 🧹 Removing existing venv...
    rmdir /S /Q venv
) ELSE (
    echo ✅ No existing venv found.
)

echo 🔍 Scanning for __pycache__ folders...
FOR /D /R %%d IN (__pycache__) DO (
    echo 🧹 Removing %%d...
    rmdir /S /Q "%%d"
)

:: Step 2: Enforce Python 3.11.x
echo.
echo [2] Enforcing Python 3.11.x...

set PY_OK=0

python --version >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    FOR /F "tokens=2 delims= " %%V IN ('python --version') DO SET PYVER=%%V
    echo Detected Python %PYVER%
    echo %PYVER% | findstr /R "^3\.11\." >nul
    IF %ERRORLEVEL% EQU 0 (
        set PY_OK=1
        echo ✅ Correct Python version detected.
    )
)

IF %PY_OK% EQU 1 GOTO PYTHON_OK

echo ⚠️ Incorrect or missing Python version. Forcing reinstall of Python 3.11.5...

:: --- Attempt silent uninstall of existing Python installations ---
echo 🧹 Attempting to uninstall existing Python installations...

for /f "tokens=*" %%i in ('wmic product where "name like '%%Python%%'" get IdentifyingNumber ^| find "{"') do (
    echo 🔥 Uninstalling Python %%i ...
    msiexec /x %%i /quiet /norestart
)

:: --- Remove Windows Store Python aliases ---
echo 🧹 Disabling Windows Store Python aliases...
powershell -Command ^
"Get-AppxPackage *Python* | Remove-AppxPackage -AllUsers" >nul 2>&1

:: --- Install Python 3.11.5 ---
echo 📥 Downloading Python 3.11.5 installer...
powershell -Command ^
"Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe' -OutFile 'python-3.11.5.exe'"

echo 🔧 Installing Python 3.11.5 silently...
start /wait python-3.11.5.exe ^
/quiet ^
InstallAllUsers=1 ^
PrependPath=1 ^
Include_test=0 ^
SimpleInstall=1

del python-3.11.5.exe

:: --- Re-check Python ---
echo 🔁 Verifying Python installation...
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Python installation failed.
    pause
    popd
    exit /b
)

FOR /F "tokens=2 delims= " %%V IN ('python --version') DO SET PYVER=%%V
echo Installed Python %PYVER%

echo %PYVER% | findstr /R "^3\.11\." >nul
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Python version mismatch after install. Found %PYVER%
    pause
    popd
    exit /b
)

echo ✅ Python 3.11.x enforced successfully.

:PYTHON_OK


:: Enforce Python 3.11.x
echo.
echo [2.1] Verifying Python version...
FOR /F "tokens=2 delims= " %%V IN ('python --version') DO SET PYVER=%%V
echo Detected Python %PYVER%

echo %PYVER% | findstr /R "^3\.11\." >nul
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Python 3.11.x is required. Found %PYVER%
    echo Please install Python 3.11 and re-run this script.
    pause
    popd
    exit /b
)


:: Step 3: Create virtual environment
echo.
echo [3] Creating new virtual environment...
python -m venv venv
IF NOT EXIST "venv" (
    echo ❌ Failed to create virtual environment.
    pause
    popd
    exit /b
)

:: Step 4: Activate virtual environment
echo.
echo [4] Activating virtual environment...
call venv\Scripts\activate.bat
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to activate virtual environment.
    pause
    popd
    exit /b
)

:: Upgrade pip inside venv
echo.
echo [4.1] Upgrading pip...
venv\Scripts\python.exe -m pip install --upgrade pip

:: Step 5: Install dependencies (clean + deterministic)
echo.
echo [5] Installing dependencies...

IF EXIST requirements.txt (
    echo ✅ Found requirements.txt
) ELSE IF EXIST Requirements.txt (
    ren Requirements.txt requirements.txt
    echo ✅ Renamed Requirements.txt → requirements.txt
) ELSE (
    echo ❌ No requirements.txt found.
    pause
    popd
    exit /b
)

echo 🧹 Removing cached wheels...
venv\Scripts\python.exe -m pip cache purge >nul 2>&1

echo 📦 Installing pinned dependencies...
venv\Scripts\python.exe -m pip install --no-cache-dir -r requirements.txt
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Dependency installation failed.
    pause
    popd
    exit /b
)

:: Step 5.1: Verify critical package versions
echo.
echo [5.1] Verifying environment versions...

venv\Scripts\python.exe - <<EOF
import sys, pandas, numpy, openpyxl
print("Python:", sys.version)
print("pandas:", pandas.__version__)
print("numpy:", numpy.__version__)
print("openpyxl:", openpyxl.__version__)

assert pandas.__version__ == "2.1.4", "❌ pandas version mismatch"
assert openpyxl.__version__ == "3.1.2", "❌ openpyxl version mismatch"
EOF

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Environment verification failed.
    pause
    popd
    exit /b
)

echo ✅ Environment verified successfully.

:: Step 6: Verify Main.py exists
echo.
echo [6] Checking Main.py...
IF NOT EXIST Main.py (
    echo ❌ Main.py not found in Server directory!
    pause
    popd
    exit /b
)

:: Step 7: Run server
echo.
echo [7] Starting FastAPI server with Uvicorn...
venv\Scripts\python.exe -m pip show uvicorn >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Uvicorn not installed, installing now...
    venv\Scripts\python.exe -m pip install uvicorn
)

start "Charlie Tool Backend" /b cmd /k "venv\Scripts\python.exe -m uvicorn Main:app --reload --port 8000"

echo.
echo 🎉 Server launch initiated. You can now access it at http://127.0.0.1:8000
echo Keep this window open to keep the server running.


:: Step 8: Cleanup port 8000 before exit (optional)
echo.
echo [8] Checking again for cleanup on port 8000...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') DO (
    echo Terminating PID %%P...
    taskkill /F /PID %%P >nul 2>&1
)

popd
exit /b
