@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION
color 0A
title Charlie Tool Backend Setup

:: ======================================================================
::  CHARLIE TOOL BACKEND INSTALLER  v3.0
::  Handles: Python version compat, pandas build failures,
::           SSL/proxy issues, network timeouts, conda fallback,
::           port conflicts, missing files, import verification
:: ======================================================================

set "ROOT=%~dp0"
set "SERVER=%ROOT%Server"
set "LOG=%ROOT%backend_install.log"
set "PANDAS_OK=0"
set "WARN_COUNT=0"
set "EXIT_CODE=0"

:: ---- Init log file ----
echo. > "%LOG%"
echo ================================================ >> "%LOG%"
echo  Charlie Backend Installer  [%DATE% %TIME%] >> "%LOG%"
echo ================================================ >> "%LOG%"

echo.
echo ================================================
echo   Charlie Tool Backend  -  Production Setup
echo ================================================
echo.

:: ---- Navigate to Server folder ----
IF NOT EXIST "%SERVER%" (
    echo [FAIL] Server folder not found at: %SERVER%
    echo [FAIL] Server folder not found >> "%LOG%"
    goto :ABORT
)
cd /d "%SERVER%"
echo [INFO] Working directory: %CD%
echo [INFO] Working directory: %CD% >> "%LOG%"
echo.

:: ---- Release port 8000 (two passes for stubborn processes) ----
echo [INIT] Clearing port 8000...
FOR /F "tokens=5" %%P IN ('netstat -aon 2^>nul ^| findstr /L ":8000 " ^| findstr "LISTENING"') DO (
    taskkill /F /PID %%P >nul 2>&1
)
FOR /F "tokens=5" %%P IN ('netstat -aon 2^>nul ^| findstr /L ":8000 " ^| findstr "LISTENING"') DO (
    taskkill /F /T /PID %%P >nul 2>&1
)
echo.

:: ======================================================================
::  STEP 1/6 - PYTHON DETECTION
:: ======================================================================
echo [1/6] Checking Python...
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Python not found in PATH.
    echo [FAIL] Python not found >> "%LOG%"
    echo.
    echo   Install Python 3.12 or 3.13 from:
    echo   https://www.python.org/downloads/
    echo   Check "Add python.exe to PATH" during installation.
    echo.
    goto :ABORT
)
FOR /F "tokens=*" %%V IN ('python --version 2^>^&1') DO (
    echo [OK]   %%V found
    echo [OK]   %%V >> "%LOG%"
)

:: Ideal range: 3.10-3.13. Warn outside this range but continue.
python -c "import sys; v=sys.version_info; exit(0 if v.major==3 and 10<=v.minor<=13 else 1)" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    python -c "import sys; v=sys.version_info; exit(0 if v.major==3 and v.minor>=14 else 1)" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 (
        echo [WARN] Python 3.14+ detected - pandas binary wheels may not yet be available.
        echo [WARN] Python 3.14+ detected >> "%LOG%"
        echo        Will try 5 fallback strategies. If all fail:
        echo        install Python 3.12 or 3.13 and re-run this installer.
    ) ELSE (
        echo [WARN] Python below 3.10 detected - some packages may fail to install.
        echo [WARN] Python below 3.10 >> "%LOG%"
    )
    echo.
)
echo.

:: ======================================================================
::  STEP 2/6 - UPGRADE PIP
:: ======================================================================
echo [2/6] Upgrading pip...
python -m pip install --upgrade pip --quiet --no-warn-script-location 2>>"%LOG%"
IF %ERRORLEVEL% NEQ 0 (
    echo [WARN] pip upgrade failed - continuing with installed pip version.
    echo [WARN] pip upgrade failed >> "%LOG%"
) ELSE (
    FOR /F "tokens=*" %%V IN ('python -m pip --version 2^>^&1') DO echo [OK]   %%V
)
echo.

:: ======================================================================
::  STEP 3/6 - BASE DEPENDENCIES (everything except pandas)
:: ======================================================================
echo [3/6] Installing base dependencies...

python -c "lines=[l for l in open('Requirements.txt') if not l.strip().lower().startswith('pandas')]; open('_req_base.txt','w').writelines(lines)" 2>>"%LOG%"
IF %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Could not read Requirements.txt
    echo [FAIL] Requirements.txt unreadable >> "%LOG%"
    goto :ABORT
)

:: Attempt A: binary-only (fastest, no compiler)
echo        [A] Binary-only install...
python -m pip install -r _req_base.txt --only-binary=:all: --retries 3 --timeout 90 -q 2>>"%LOG%"
set "BASE_OK=%ERRORLEVEL%"

:: Attempt B: allow source builds (some packages may compile)
IF %BASE_OK% NEQ 0 (
    echo        [B] Allowing source builds...
    python -m pip install -r _req_base.txt --retries 3 --timeout 90 -q 2>>"%LOG%"
    set "BASE_OK=!ERRORLEVEL!"
)

:: Attempt C: SSL bypass for corporate proxies
IF %BASE_OK% NEQ 0 (
    echo        [C] SSL-bypass mode...
    python -m pip install -r _req_base.txt --retries 3 --timeout 90 -q ^
        --trusted-host pypi.org --trusted-host files.pythonhosted.org ^
        --trusted-host pypi.python.org 2>>"%LOG%"
    set "BASE_OK=!ERRORLEVEL!"
)

del "_req_base.txt" >nul 2>&1

IF %BASE_OK% NEQ 0 (
    echo [FAIL] Could not install base dependencies after 3 attempts.
    echo [FAIL] Base dependency install failed >> "%LOG%"
    echo.
    echo   Check %LOG% for details.
    echo   Verify internet connectivity and try again.
    goto :ABORT
)
echo [OK]   Base dependencies installed.
echo.

:: ======================================================================
::  STEP 4/6 - PANDAS (5-LEVEL FALLBACK WATERFALL)
:: ======================================================================
echo [4/6] Installing pandas...

:: Pre-check: already installed from a previous run
python -c "import pandas" >nul 2>&1
IF %ERRORLEVEL% EQU 0 SET PANDAS_OK=1

:: Level 1: Latest pandas with any available binary wheel
IF %PANDAS_OK% EQU 0 (
    echo        [1/5] Latest pandas binary wheel...
    python -m pip install "pandas>=2.1.0" --only-binary=:all: --retries 3 --timeout 90 -q 2>>"%LOG%"
    python -c "import pandas" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 SET PANDAS_OK=1
)

:: Level 2: pandas 2.2.x (broadest cross-platform wheel coverage)
IF %PANDAS_OK% EQU 0 (
    echo        [2/5] pandas 2.2.x binary wheel...
    python -m pip install "pandas>=2.2.0,<2.3.0" --only-binary=:all: --retries 3 --timeout 90 -q 2>>"%LOG%"
    python -c "import pandas" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 SET PANDAS_OK=1
)

:: Level 3: pandas 2.1.x (wider Python version compatibility)
IF %PANDAS_OK% EQU 0 (
    echo        [3/5] pandas 2.1.x binary wheel...
    python -m pip install "pandas>=2.1.0,<2.2.0" --only-binary=:all: --retries 3 --timeout 90 -q 2>>"%LOG%"
    python -c "import pandas" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 SET PANDAS_OK=1
)

:: Level 4: SSL bypass for intercepted corporate networks
IF %PANDAS_OK% EQU 0 (
    echo        [4/5] SSL-bypass binary install...
    python -m pip install "pandas>=2.1.0" --only-binary=:all: -q ^
        --trusted-host pypi.org --trusted-host files.pythonhosted.org ^
        --trusted-host pypi.python.org 2>>"%LOG%"
    python -c "import pandas" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 (
        SET PANDAS_OK=1
        echo [INFO] SSL bypass was required >> "%LOG%"
    )
)

:: Level 5: Anaconda/Miniconda (ships pre-compiled pandas for all platforms)
IF %PANDAS_OK% EQU 0 (
    where conda >nul 2>&1
    IF !ERRORLEVEL! EQU 0 (
        echo        [5/5] conda detected - installing via conda...
        conda install pandas --yes -q 2>>"%LOG%"
        python -c "import pandas" >nul 2>&1
        IF !ERRORLEVEL! EQU 0 (
            SET PANDAS_OK=1
            echo [INFO] pandas installed via conda >> "%LOG%"
        )
    ) ELSE (
        echo        [5/5] conda not found - skipping.
    )
)

IF %PANDAS_OK% EQU 0 (
    echo.
    echo [FAIL] pandas could not be installed automatically.
    echo [FAIL] All 5 pandas strategies exhausted >> "%LOG%"
    echo.
    echo   SOLUTIONS - try in this order:
    echo.
    echo   [1] Install Python 3.12 or 3.13 (recommended):
    echo       https://www.python.org/downloads/
    echo       Uninstall Python 3.14+, or use the py launcher:
    echo         py -3.12 -m pip install pandas
    echo.
    echo   [2] Install Anaconda/Miniconda (includes pandas pre-built):
    echo       https://www.anaconda.com/download
    echo       Then re-run this installer.
    echo.
    echo   [3] Install Visual Studio Build Tools (last resort):
    echo       https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo       Select: "Desktop development with C++"
    echo       Then re-run this installer.
    echo.
    echo   Full error log: %LOG%
    goto :ABORT
)

FOR /F "tokens=*" %%V IN ('python -c "import pandas; print(pandas.__version__)" 2^>^&1') DO (
    echo [OK]   pandas %%V installed
    echo [OK]   pandas %%V >> "%LOG%"
)
echo.

:: ======================================================================
::  STEP 5/6 - IMPORT VERIFICATION
:: ======================================================================
echo [5/6] Verifying all packages...
set "WARN_COUNT=0"

for %%M in (fastapi uvicorn pydantic pandas numpy openpyxl xlsxwriter requests httpx psutil polars pyarrow duckdb dateutil dotenv multipart) do (
    python -c "import %%M" >nul 2>&1
    IF !ERRORLEVEL! EQU 0 (
        echo [OK]   %%M
    ) ELSE (
        echo [WARN] %%M  ^<-- import failed
        echo [WARN] %%M import failed >> "%LOG%"
        set /a WARN_COUNT+=1
    )
)

IF %WARN_COUNT% GTR 0 (
    echo.
    echo [WARN] %WARN_COUNT% package(s) could not be imported.
    echo        Server will start but some features may be limited.
    echo        Full details: %LOG%
) ELSE (
    echo.
    echo [OK]   All packages verified successfully.
)
echo.

:: ---- Verify Main.py exists ----
IF NOT EXIST Main.py (
    echo [FAIL] Main.py not found in: %CD%
    echo [FAIL] Main.py missing >> "%LOG%"
    goto :ABORT
)

:: ======================================================================
::  STEP 6/6 - LAUNCH SERVER
:: ======================================================================
echo [6/6] Starting FastAPI server...
echo.
echo ================================================
echo   URL:   http://127.0.0.1:8000
echo   Docs:  http://127.0.0.1:8000/docs
echo   Stop:  CTRL+C
echo ================================================
echo.
echo [INFO] Server launched at %TIME% >> "%LOG%"

python -m uvicorn Main:app --reload --port 8000 --host 127.0.0.1

set "UVICORN_EXIT=%ERRORLEVEL%"
echo.
IF %UVICORN_EXIT% NEQ 0 (
    echo [FAIL] Server exited with error code %UVICORN_EXIT%
    echo [FAIL] uvicorn exited with code %UVICORN_EXIT% >> "%LOG%"
    echo.
    echo   Possible causes:
    echo     - Import error in Main.py (see console output above)
    echo     - Port 8000 still occupied (close any app using it)
    echo     - Missing file referenced by Main.py
    echo.
    echo   Full log: %LOG%
) ELSE (
    echo [INFO] Server stopped cleanly.
    echo [INFO] Server stopped cleanly >> "%LOG%"
)
goto :END

:: ======================================================================
:ABORT
echo.
echo ================================================
echo   Setup failed. See full log:
echo   %LOG%
echo ================================================
set "EXIT_CODE=1"
echo [FAIL] Install aborted at %TIME% >> "%LOG%"

:END
echo.
echo Press any key to close...
pause >nul
exit /b %EXIT_CODE%