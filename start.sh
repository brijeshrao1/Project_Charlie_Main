#!/usr/bin/env bash
# ============================================================
# Project Charlie — Local Development Startup
# Starts all three services (backend, NLP, frontend) in a
# single terminal session. Press Ctrl+C to stop everything.
# ============================================================

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Terminal colours ────────────────────────────────────────
GRN='\033[0;32m'; YLW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GRN}[Charlie]${NC} $1"; }
warn() { echo -e "${YLW}[Charlie]${NC} $1"; }
err()  { echo -e "${RED}[Charlie]${NC} $1"; }

# ── Prerequisite check ──────────────────────────────────────
check_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "Required tool not found: $1"; exit 1; }
}
check_cmd python3
check_cmd node
check_cmd npm

# ── Helper: create venv + install deps ──────────────────────
setup_venv() {
  local dir="$1" reqs="$2"
  local venv="$dir/.venv"
  if [ ! -d "$venv" ]; then
    log "Creating Python venv in $dir..."
    python3 -m venv "$venv"
  fi
  log "Installing dependencies in $dir..."
  "$venv/bin/pip" install -q --upgrade pip
  "$venv/bin/pip" install -q -r "$dir/$reqs"
}

# ── Helper: wait for a port to open ─────────────────────────
wait_for_port() {
  local name="$1" port="$2"
  local retries=30
  while ! nc -z 127.0.0.1 "$port" 2>/dev/null; do
    retries=$((retries - 1))
    [ $retries -le 0 ] && { warn "$name did not start in time on :$port"; return 1; }
    sleep 1
  done
  log "$name is up on http://localhost:$port"
}

# ── 1. Backend (FastAPI) ────────────────────────────────────
setup_venv "$ROOT/Server" "Requirements.txt"

# Copy .env to Server dir if it exists at the root
[ -f "$ROOT/.env" ] && cp "$ROOT/.env" "$ROOT/Server/.env"

log "Starting FastAPI backend on :8000 ..."
mkdir -p "$ROOT/Server/uploads" "$ROOT/Server/validation/completed/Excel_Files"
cd "$ROOT/Server"
"$ROOT/Server/.venv/bin/python" -m uvicorn Main:app \
  --host 127.0.0.1 --port 8000 --reload --log-level info \
  > "$ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
cd "$ROOT"

# ── 2. NLP service (Flask) ──────────────────────────────────
setup_venv "$ROOT/NLP" "requirements.txt"

[ -f "$ROOT/.env" ] && cp "$ROOT/.env" "$ROOT/NLP/.env"

log "Starting NLP service on :9000 ..."
cd "$ROOT/NLP"
FLASK_APP=app.py \
  "$ROOT/NLP/.venv/bin/gunicorn" \
  --bind 127.0.0.1:9000 \
  --workers 2 --timeout 300 \
  --log-file "$ROOT/logs/nlp.log" \
  --access-logfile "$ROOT/logs/nlp-access.log" \
  app:app &
NLP_PID=$!
cd "$ROOT"

# ── 3. Frontend (React dev server) ─────────────────────────
log "Installing frontend dependencies..."
cd "$ROOT/frontend/charlie_client"
npm install --silent
log "Starting React dev server on :3000 ..."
npm start > "$ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd "$ROOT"

# ── 4. Wait for services ────────────────────────────────────
mkdir -p "$ROOT/logs"
wait_for_port "Backend"  8000
wait_for_port "NLP"      9000
# React dev server takes a bit longer — just wait for the port
wait_for_port "Frontend" 3000

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "  All services are running"
log "  Frontend  → http://localhost:3000"
log "  Backend   → http://localhost:8000"
log "  API docs  → http://localhost:8000/docs"
log "  NLP       → http://localhost:9000"
log "  Logs      → ./logs/"
log "  Press Ctrl+C to stop all services"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Graceful shutdown ───────────────────────────────────────
cleanup() {
  echo ""
  log "Shutting down all services..."
  kill "$BACKEND_PID" "$NLP_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$NLP_PID" "$FRONTEND_PID" 2>/dev/null || true
  log "All services stopped."
}
trap cleanup INT TERM

wait
