"""Build JARVIS as a standalone Windows executable using PyInstaller."""

import os
import subprocess
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
UI_DIR = os.path.join(PROJECT_ROOT, "ui")
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")
SPEC_FILE = os.path.join(PROJECT_ROOT, "scripts", "jarvis.spec")

# Read version from version.py
sys.path.insert(0, BACKEND_DIR)
from jarvis.version import APP_VERSION  # noqa: E402


def build_ui():
    print(":: Building React frontend...")
    subprocess.run("npm install", cwd=UI_DIR, shell=True, check=True)
    subprocess.run("npm run build", cwd=UI_DIR, shell=True, check=True)
    ui_dist = os.path.join(UI_DIR, "dist")
    if not os.path.exists(ui_dist):
        print("ERROR: UI build failed — ui/dist/ not found")
        sys.exit(1)
    print(":: Frontend built successfully")


def build_exe():
    print(":: Building executable with PyInstaller...")
    os.makedirs(DIST_DIR, exist_ok=True)

    if not os.path.exists(SPEC_FILE):
        print(f"ERROR: spec file not found at {SPEC_FILE}")
        sys.exit(1)

    subprocess.run(
        [sys.executable, "-m", "PyInstaller", "--clean", "--noconfirm", SPEC_FILE],
        cwd=PROJECT_ROOT,
        check=True,
    )
    print(":: Executable built successfully")


def main():
    skip_ui = "--skip-ui" in sys.argv
    if not skip_ui:
        build_ui()
    build_exe()
    exe_path = os.path.join(DIST_DIR, "JARVIS.exe")
    print(f"\nOK - Build complete! Version: {APP_VERSION}")
    print(f"  Executable: {exe_path}")
    print(f"  Size: {os.path.getsize(exe_path) / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
