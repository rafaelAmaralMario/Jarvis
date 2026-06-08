"""Build JARVIS as a standalone Windows executable using PyInstaller."""

import os
import shutil
import subprocess
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
UI_DIR = os.path.join(PROJECT_ROOT, "ui")
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")
SPEC_FILE = os.path.join(PROJECT_ROOT, "scripts", "jarvis.spec")


def build_ui():
    print(":: Building React frontend...")
    subprocess.run(["npm", "install"], cwd=UI_DIR, check=True)
    subprocess.run(["npm", "run", "build"], cwd=UI_DIR, check=True)
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
        ["pyinstaller", "--clean", "--noconfirm", SPEC_FILE],
        cwd=PROJECT_ROOT,
        check=True,
    )
    print(":: Executable built successfully")


def main():
    build_ui()
    build_exe()
    print(f"\n✅ Build complete! Executable in: {os.path.join(DIST_DIR, 'JARVIS.exe')}")


if __name__ == "__main__":
    main()
