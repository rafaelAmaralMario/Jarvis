# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for JARVIS desktop app."""

import os
import sys

try:
    spec_dir = os.path.dirname(os.path.abspath(__file__))
except NameError:
    spec_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
PROJECT_ROOT = os.path.abspath(os.path.join(spec_dir, ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
UI_DIST_DIR = os.path.join(PROJECT_ROOT, "ui", "dist")

block_cipher = None

a = Analysis(
    [os.path.join(BACKEND_DIR, "jarvis", "main.py")],
    pathex=[BACKEND_DIR],
    binaries=[],
    datas=[
        (UI_DIST_DIR, "ui/dist"),
        (os.path.join(PROJECT_ROOT, "scripts", "jarvis.ico"), "scripts"),
    ],
    hiddenimports=[
        # Core
        "jarvis.bridge",
        "jarvis.database",
        "jarvis.logging_config",
        "jarvis.version",
        "jarvis.main",
        # Models / LLM
        "jarvis.ollama_client",
        "jarvis.llm_gateway",
        "jarvis.llm_router",
        "jarvis.models_manager",
        "jarvis.gguf_manager",
        # Agents
        "jarvis.agents_manager",
        "jarvis.tool_agent",
        "jarvis.tool_manager",
        "jarvis.orchestration_manager",
        "jarvis.chat_manager",
        "jarvis.self_improvement",
        "jarvis.background_agents",
        "jarvis.plugin_system",
        # Workspace / Editor
        "jarvis.workspace_manager",
        "jarvis.editor_manager",
        "jarvis.terminal_manager",
        "jarvis.git_manager",
        "jarvis.network_manager",
        # MCP / Security
        "jarvis.mcp_manager",
        "jarvis.module_loader",
        "jarvis.security_manager",
        "jarvis.output_manager",
        "jarvis.memory_service",
        # Workflow / Knowledge
        "jarvis.workflow_engine",
        "jarvis.migration_runner",
        "jarvis.knowledge_manager",
        "jarvis.graph_builder",
        "jarvis.rag_service",
        # Services
        "jarvis.calendar_service",
        "jarvis.camera_service",
        "jarvis.email_service",
        "jarvis.github_service",
        "jarvis.homeassistant_service",
        "jarvis.ocr_service",
        "jarvis.document_service",
        "jarvis.document_generator",
        "jarvis.video_service",
        "jarvis.voice_clone",
        "jarvis.voice_conversation",
        "jarvis.whatsapp_service",
        "jarvis.audio_tts",
        "jarvis.audio_gen",
        "jarvis.microservices",
        "jarvis.image_service",
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
