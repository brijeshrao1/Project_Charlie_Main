"""
Project Charlie — Desktop Launcher
===================================
Compiles to a single .exe (Windows) or .app (macOS) via PyInstaller.
Double-click to start all services and manage them from the system tray.
"""

from __future__ import annotations

import os
import platform
import shutil
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

try:
    import pystray
    from PIL import Image, ImageDraw
    _HAS_TRAY = True
except ImportError:
    _HAS_TRAY = False

# ── Platform flags ────────────────────────────────────────────────────────────
IS_WINDOWS = platform.system() == "Windows"
IS_MAC     = platform.system() == "Darwin"
IS_FROZEN  = getattr(sys, "frozen", False)

# Windows-only flag; falls back to 0 (no-op) on other platforms
_NO_CONSOLE = getattr(subprocess, "CREATE_NO_WINDOW", 0)

# ── Project root ──────────────────────────────────────────────────────────────
# When frozen the .exe sits in the project root; when running as a plain
# script the launcher lives one level deeper (launcher/launcher.py).
ROOT = (
    Path(sys.executable).parent
    if IS_FROZEN
    else Path(__file__).resolve().parent.parent
)

LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

# ── Logging ───────────────────────────────────────────────────────────────────
import logging

_log_path = LOG_DIR / "launcher.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    handlers=[
        logging.FileHandler(_log_path, encoding="utf-8"),
    ],
)
log = logging.getLogger("charlie")

# ── Python discovery ──────────────────────────────────────────────────────────
def _find_python() -> str | None:
    """Return path to a usable Python 3 interpreter on the host system."""
    candidates = (
        ["py", "python", "python3"] if IS_WINDOWS else ["python3", "python"]
    )
    for name in candidates:
        exe = shutil.which(name)
        if not exe:
            continue
        try:
            out = subprocess.check_output(
                [exe, "--version"], stderr=subprocess.STDOUT, text=True
            )
            if "Python 3" in out:
                log.info("Found system Python: %s (%s)", exe, out.strip())
                return exe
        except Exception:
            pass
    return None

# ── Venv helpers ──────────────────────────────────────────────────────────────
def _venv_py(service_dir: Path) -> Path:
    if IS_WINDOWS:
        return service_dir / ".venv" / "Scripts" / "python.exe"
    return service_dir / ".venv" / "bin" / "python"

def _setup_venv(service_dir: Path, req_file: str, sys_py: str) -> Path:
    py = _venv_py(service_dir)
    if not (service_dir / ".venv").exists():
        log.info("Creating venv in %s …", service_dir)
        subprocess.run(
            [sys_py, "-m", "venv", str(service_dir / ".venv")],
            check=True, cwd=service_dir,
            creationflags=_NO_CONSOLE,
        )
    log.info("Installing deps for %s …", service_dir.name)
    subprocess.run(
        [str(py), "-m", "pip", "install", "-q", "--upgrade", "pip"],
        check=True, creationflags=_NO_CONSOLE,
    )
    subprocess.run(
        [str(py), "-m", "pip", "install", "-q", "-r",
         str(service_dir / req_file)],
        check=True, creationflags=_NO_CONSOLE,
    )
    return py

# ── Process management ────────────────────────────────────────────────────────
_procs: dict[str, subprocess.Popen] = {}
_lock  = threading.Lock()

def _logfile(name: str):
    return open(LOG_DIR / f"{name}.log", "a", buffering=1)

def _start_backend(py: Path) -> None:
    server = ROOT / "Server"
    (server / "uploads").mkdir(exist_ok=True)
    (server / "validation" / "completed" / "Excel_Files").mkdir(
        parents=True, exist_ok=True
    )
    if (ROOT / ".env").exists():
        shutil.copy(ROOT / ".env", server / ".env")

    proc = subprocess.Popen(
        [str(py), "-m", "uvicorn", "Main:app",
         "--host", "127.0.0.1", "--port", "8000", "--log-level", "info"],
        cwd=server,
        stdout=_logfile("backend"),
        stderr=subprocess.STDOUT,
        creationflags=_NO_CONSOLE,
    )
    with _lock:
        _procs["backend"] = proc
    log.info("Backend started (pid %d)", proc.pid)

def _start_nlp(py: Path) -> None:
    nlp = ROOT / "NLP"
    if (ROOT / ".env").exists():
        shutil.copy(ROOT / ".env", nlp / ".env")

    # gunicorn does not run on Windows — use waitress instead
    if IS_WINDOWS:
        cmd = [str(py), "-m", "waitress",
               "--listen=127.0.0.1:9000", "app:app"]
    else:
        cmd = [str(py), "-m", "gunicorn",
               "--bind", "127.0.0.1:9000",
               "--workers", "2", "--timeout", "300", "app:app"]

    proc = subprocess.Popen(
        cmd,
        cwd=nlp,
        env={**os.environ, "FLASK_APP": "app.py"},
        stdout=_logfile("nlp"),
        stderr=subprocess.STDOUT,
        creationflags=_NO_CONSOLE,
    )
    with _lock:
        _procs["nlp"] = proc
    log.info("NLP service started (pid %d)", proc.pid)

def _wait_port(port: int, timeout: int = 90) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1):
                return True
        except OSError:
            time.sleep(1)
    return False

def stop_all() -> None:
    log.info("Stopping all services…")
    with _lock:
        for name, proc in _procs.items():
            if proc.poll() is None:
                proc.terminate()
                log.info("Terminated %s (pid %d)", name, proc.pid)
        _procs.clear()

# ── Startup sequence ──────────────────────────────────────────────────────────
_status_cb: "list[callable]" = []   # functions to call with a status string

def _set_status(msg: str) -> None:
    log.info(msg)
    for fn in _status_cb:
        try:
            fn(msg)
        except Exception:
            pass

def startup() -> None:
    """Full startup sequence — always runs in a background thread."""
    try:
        sys_py = _find_python()
        if not sys_py:
            _set_status("Project Charlie — Python 3 not found")
            return

        _set_status("Project Charlie — setting up backend…")
        backend_py = _setup_venv(ROOT / "Server", "Requirements.txt", sys_py)

        _set_status("Project Charlie — setting up NLP service…")
        nlp_py = _setup_venv(ROOT / "NLP", "requirements.txt", sys_py)

        _set_status("Project Charlie — starting services…")
        _start_backend(backend_py)
        _start_nlp(nlp_py)

        _set_status("Project Charlie — waiting for backend…")
        if _wait_port(8000, timeout=90):
            _set_status("Project Charlie — ready ✓")
            webbrowser.open("http://localhost:8000")
        else:
            _set_status("Project Charlie — backend timed out (check logs)")

    except Exception as exc:
        _set_status(f"Project Charlie — error: {exc}")
        log.exception("Startup failed")

# ── Tray icon ─────────────────────────────────────────────────────────────────
def _make_tray_image() -> "Image.Image":
    """Draw a simple blue circle with a white 'C' arc."""
    sz = 64
    img = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([2, 2, sz - 2, sz - 2], fill=(0, 102, 204, 255))
    d.arc([14, 14, sz - 14, sz - 14], start=50, end=310, fill="white", width=9)
    return img

def _open_logs() -> None:
    path = str(LOG_DIR)
    if IS_WINDOWS:
        os.startfile(path)
    elif IS_MAC:
        subprocess.Popen(["open", path])
    else:
        subprocess.Popen(["xdg-open", path])

def run_tray() -> None:
    icon_img = _make_tray_image()

    def on_open(icon, _item):
        webbrowser.open("http://localhost:8000")

    def on_restart(icon, _item):
        stop_all()
        time.sleep(1)
        threading.Thread(target=startup, daemon=True).start()

    def on_logs(icon, _item):
        _open_logs()

    def on_quit(icon, _item):
        stop_all()
        icon.stop()

    menu = pystray.Menu(
        pystray.MenuItem("Open Project Charlie", on_open, default=True),
        pystray.MenuItem("Restart Services",     on_restart),
        pystray.MenuItem("View Logs",            on_logs),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Quit",                 on_quit),
    )

    icon = pystray.Icon(
        "ProjectCharlie", icon_img, "Project Charlie — starting…", menu
    )

    # Let the tray icon update its tooltip to reflect current status
    def _update_title(msg: str):
        icon.title = msg

    _status_cb.append(_update_title)

    # Kick off the startup sequence in a background thread
    threading.Thread(target=startup, daemon=True).start()

    # icon.run() must be called from the main thread (required on macOS)
    icon.run()

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if _HAS_TRAY:
        run_tray()
    else:
        # Headless fallback (e.g. Linux server without a display)
        print("[Charlie] pystray not found — running headless. Ctrl+C to quit.")
        threading.Thread(target=startup, daemon=True).start()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            stop_all()
