# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for JARVIS desktop app."""

import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
UI_DIST_DIR = os.path.join(PROJECT_ROOT, "ui", "dist")

block_cipher = None

a = Analysis(
    [os.path.join(BACKEND_DIR, "jarvis", "main.py")],
    pathex=[BACKEND_DIR],
    binaries=[],
    datas=[
        (UI_DIST_DIR, "ui/dist"),
    ],
    hiddenimports=[
        "jarvis.bridge",
        "jarvis.database",
        "jarvis.version",
        "jarvis.ollama_client",
        "jarvis.llm_gateway",
        "jarvis.models_manager",
        "jarvis.agents_manager",
        "jarvis.orchestration_manager",
        "jarvis.workspace_manager",
        "jarvis.editor_manager",
        "jarvis.terminal_manager",
        "jarvis.git_manager",
        "jarvis.network_manager",
        "jarvis.mcp_manager",
        "jarvis.module_loader",
        "jarvis.security_manager",
        "jarvis.workflow_engine",
        "jarvis.migration_runner",
        "jarvis.knowledge_manager",
        "jarvis.graph_builder",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "PyQt5", "PyQt6", "PySide2", "PySide6",
        "tkinter", "matplotlib", "scipy", "pandas",
        "numpy", "PIL", "cv2",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="JARVIS",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(PROJECT_ROOT, "scripts", "jarvis.ico") if os.path.exists(os.path.join(PROJECT_ROOT, "scripts", "jarvis.ico")) else None,
)
