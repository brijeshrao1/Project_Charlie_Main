@echo off
REM ============================================================
REM  Project Charlie — Local Development Startup (Windows)
REM  Opens separate terminal windows for each service.
REM  Close all opened windows (or this one) to stop everything.
REM ============================================================

setlocal EnableDelayedExpansion
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

echo [Charlie] Checking prerequisites...

where python >nul 2>&1 || (echo [ERROR] Python not found. Install from python.org & pause & exit /b 1)
where node   >nul 2>&1 || (echo [ERROR] Node.js not found. Install from nodejs.org & pause & exit /b 1)
where npm    >nul 2>&1 || (echo [ERROR] npm not found. Install Node.js from nodejs.org & pause & exit /b 1)

REM ── Create log directory ────────────────────────────────
if not exist "%ROOT%\logs" mkdir "%ROOT%\logs"

REM ── Backend — set up venv if needed ─────────────────────
echo [Charlie] Setting up backend...
if not exist "%ROOT%\Server\.venv" (
    python -m venv "%ROOT%\Server\.venv"
)
"%ROOT%\Server\.venv\Scripts\pip" install -q --upgrade pip
"%ROOT%\Server\.venv\Scripts\pip" install -q -r "%ROOT%\Server\Requirements.txt"

REM Copy root .env to Server if present
if exist "%ROOT%\.env" copy /Y "%ROOT%\.env" "%ROOT%\Server\.env" >nul

REM Create required directories
if not exist "%ROOT%\Server\uploads" mkdir "%ROOT%\Server\uploads"
if not exist "%ROOT%\Server\validation\completed\Excel_Files" (
    mkdir "%ROOT%\Server\validation\completed\Excel_Files"
)

REM ── NLP — set up venv if needed ─────────────────────────
echo [Charlie] Setting up NLP service...
if not exist "%ROOT%\NLP\.venv" (
    python -m venv "%ROOT%\NLP\.venv"
)
"%ROOT%\NLP\.venv\Scripts\pip" install -q --upgrade pip
"%ROOT%\NLP\.venv\Scripts\pip" install -q -r "%ROOT%\NLP\requirements.txt"

if exist "%ROOT%\.env" copy /Y "%ROOT%\.env" "%ROOT%\NLP\.env" >nul

REM ── Frontend — install npm deps ──────────────────────────
echo [Charlie] Installing frontend dependencies...
pushd "%ROOT%\frontend\charlie_client"
call npm install --silent
popd

REM ── Launch services in separate windows ─────────────────
echo [Charlie] Starting all services...

start "Charlie - Backend  (:8000)" /D "%ROOT%\Server" cmd /k ^
  ""%ROOT%\Server\.venv\Scripts\python" -m uvicorn Main:app --host 127.0.0.1 --port 8000 --reload --log-level info 2>&1 | tee "%ROOT%\logs\backend.log""

start "Charlie - NLP  (:9000)" /D "%ROOT%\NLP" cmd /k ^
  ""%ROOT%\NLP\.venv\Scripts\gunicorn" --bind 127.0.0.1:9000 --workers 2 --timeout 300 app:app 2>&1 | tee "%ROOT%\logs\nlp.log""

start "Charlie - Frontend  (:3000)" /D "%ROOT%\frontend\charlie_client" cmd /k ^
  "npm start 2>&1 | tee "%ROOT%\logs\frontend.log""

echo.
echo [Charlie] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [Charlie]   Services are starting in new windows
echo [Charlie]   Frontend  ^>  http://localhost:3000
echo [Charlie]   Backend   ^>  http://localhost:8000
echo [Charlie]   API docs  ^>  http://localhost:8000/docs
echo [Charlie]   NLP       ^>  http://localhost:9000
echo [Charlie]   Logs      ^>  .\logs\
echo [Charlie] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo  Close the individual service windows to stop them.
pause
