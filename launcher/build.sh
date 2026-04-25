#!/usr/bin/env bash
# ============================================================
# Project Charlie — Build Desktop Launcher
#
# Produces:
#   Windows  →  ProjectCharlie.exe  (in project root)
#   macOS    →  ProjectCharlie.app  (in project root)
#   Linux    →  ProjectCharlie      (in project root)
#
# Requirements: Python 3.10+
# Usage: ./launcher/build.sh
# ============================================================

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$DIR")"

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   Project Charlie — Build Launcher    ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# ── 1. Create isolated build venv ────────────────────────────────────────────
BUILDENV="$DIR/.buildenv"
echo "[1/4] Setting up build environment…"

# Clear any inherited Python environment that can cause:
# "Could not find platform independent libraries <prefix>"
unset PYTHONHOME PYTHONPATH

python3 -m venv "$BUILDENV"
"$BUILDENV/bin/pip" install -q --upgrade pip
"$BUILDENV/bin/pip" install -q -r "$DIR/requirements.txt"

PYINST="$BUILDENV/bin/pyinstaller"

# ── 2. Generate icon ─────────────────────────────────────────────────────────
echo "[2/4] Generating icon…"
"$BUILDENV/bin/python" - <<'ICON_SCRIPT'
from PIL import Image, ImageDraw
from pathlib import Path

DIR = Path(__file__).parent if False else Path(".")

sizes = [16, 32, 48, 64, 128, 256]
frames = []
for sz in sizes:
    img = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = max(1, sz // 16)
    d.ellipse([pad, pad, sz - pad, sz - pad], fill=(0, 102, 204, 255))
    lw = max(1, sz // 8)
    margin = sz // 4
    d.arc([margin, margin, sz - margin, sz - margin],
          start=50, end=310, fill="white", width=lw)
    frames.append(img)

# PNG for macOS / Linux
frames[-1].save("launcher_icon.png")

# ICO for Windows (multi-size)
frames[-1].save(
    "launcher_icon.ico",
    format="ICO",
    sizes=[(s, s) for s in sizes],
)
print("  Icon files written.")
ICON_SCRIPT

mv launcher_icon.png "$DIR/icon.png"
mv launcher_icon.ico "$DIR/icon.ico"

# ── 3. Compile with PyInstaller ──────────────────────────────────────────────
echo "[3/4] Compiling launcher (this takes ~60 s)…"

OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
    ICON_ARG="$DIR/icon.png"
else
    ICON_ARG="$DIR/icon.ico"
fi

"$PYINST" \
  --onefile \
  --windowed \
  --name "ProjectCharlie" \
  --icon "$ICON_ARG" \
  --distpath "$ROOT" \
  --workpath "$DIR/.pyibuild" \
  --specpath "$DIR" \
  --noconfirm \
  "$DIR/launcher.py"

# Clean up PyInstaller artefacts
rm -rf "$DIR/.pyibuild" "$DIR/ProjectCharlie.spec"

# ── 4. Done ──────────────────────────────────────────────────────────────────
echo "[4/4] Build complete."
echo ""
if [ "$OS" = "Darwin" ]; then
    echo "  Output → $ROOT/ProjectCharlie.app"
    echo "  Drag ProjectCharlie.app to your Applications folder."
else
    echo "  Output → $ROOT/ProjectCharlie"
    echo "  Run ./ProjectCharlie to launch the app."
fi
echo ""
echo "  First launch will set up Python venvs automatically."
echo "  All logs are written to ./logs/"
echo ""
