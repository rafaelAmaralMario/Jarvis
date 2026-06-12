"""JARVIS entry point — launches pywebview window with React frontend."""

import argparse
import logging
import os
import sys
import traceback
from pathlib import Path

logger = logging.getLogger(__name__)

from jarvis.agents_manager import AgentsManager, CreateAgentDTO
from jarvis.bridge import JARVISBridge
from jarvis.database import Database
from jarvis.editor_manager import EditorManager
from jarvis.git_manager import GitManager
from jarvis.graph_builder import GraphBuilder
from jarvis.knowledge_manager import KnowledgeManager
from jarvis.llm_gateway import LLMGateway
from jarvis.mcp_manager import MCPManager
from jarvis.migration_runner import MigrationRunner
from jarvis.models_manager import ModelsManager
from jarvis.module_loader import ModuleLoader
from jarvis.network_manager import NetworkManager
from jarvis.ollama_client import OllamaClient
from jarvis.orchestration_manager import OrchestrationManager
from jarvis.security_manager import SecurityManager
from jarvis.terminal_manager import TerminalManager
from jarvis.workflow_engine import WorkflowEngine
from jarvis.workspace_manager import WorkspaceManager
from jarvis.logging_config import setup_logging, install_exception_hooks, on_crash


APP_NAME = "JARVIS"


def _show_error_dialog(title: str, message: str) -> None:
    """Show a Windows message box. Falls back to print."""
    try:
        import ctypes
        ctypes.windll.user32.MessageBoxW(0, message, title, 0x10)
    except Exception:
        try:
            import subprocess
            subprocess.run(
                ["mshta", "javascript:alert(new ActiveXObject('WScript.Shell').Popup("
                 f"'{message}',0,'{title}',0x10));close();"],
                capture_output=True, timeout=5,
            )
        except Exception:
            print(f"FATAL: {title} — {message}", flush=True)


def show_error_dialog(title: str, message: str) -> None:
    _show_error_dialog(title, message)


def get_db_path() -> Path:
    appdata = os.environ.get("APPDATA", "")
    db_dir = Path(appdata) / "JARVIS"
    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir / "jarvis-ai.db"


DEV_SERVER_URL = "http://127.0.0.1:1420"


def get_ui_path(dev_mode: bool = False) -> str:
    if dev_mode:
        return DEV_SERVER_URL
    if getattr(sys, "frozen", False):
        base = Path(sys._MEIPASS)
        candidates = [
            base / "ui" / "dist" / "index.html",
            base / "index.html",
        ]
    else:
        root = Path(__file__).resolve().parent.parent.parent
        candidates = [
            root / "ui" / "dist" / "index.html",
            root / "ui" / "index.html",
        ]
    for c in candidates:
        resolved = c.resolve()
        if resolved.exists():
            return str(resolved)
    return str(candidates[0])


def main():
    parser = argparse.ArgumentParser(description=f"{APP_NAME} AI Assistant")
    parser.add_argument("--dev", action="store_true", help="Connect to Vite dev server")
    parser.add_argument("--log-level", default="DEBUG", help="Log level (DEBUG/INFO/WARNING/ERROR)")
    args = parser.parse_args()

    log_file = setup_logging(level=getattr(logging, args.log_level.upper(), logging.DEBUG))
    install_exception_hooks()

    logger.info("Starting %s (frozen=%s, dev=%s)", APP_NAME, getattr(sys, "frozen", False), args.dev)

    db_path = get_db_path()
    logger.info("Database path: %s", db_path)
    db = Database(db_path)

    runner = MigrationRunner(db)
    runner.run_pending()

    ollama = OllamaClient()
    workspace = WorkspaceManager(db)
    git = GitManager()
    editor = EditorManager(db)
    terminal = TerminalManager()
    network = NetworkManager(db)
    module_loader = ModuleLoader()
    models = ModelsManager(db, ollama)
    agents = AgentsManager(db)
    knowledge = KnowledgeManager(db)
    graph = GraphBuilder(db)
    llm_gateway = LLMGateway(db)
    orchestration = OrchestrationManager(models, agents, db, llm_gateway)
    mcp = MCPManager(db)
    workflows = WorkflowEngine(db)
    security = SecurityManager(db)

    bridge = JARVISBridge(
        db=db,
        ollama=ollama,
        workspace=workspace,
        git=git,
        editor=editor,
        terminal=terminal,
        network=network,
        module_loader=module_loader,
        models=models,
        agents=agents,
        orchestration=orchestration,
        knowledge=knowledge,
        graph=graph,
        llm_gateway=llm_gateway,
        mcp=mcp,
        workflows=workflows,
        security=security,
    )

    # Fix agent models that don't exist in any provider (Ollama or GGUF)
    try:
        ollama_models = [m.name for m in ollama.list_models()]
        gguf_models: list[str] = []
        try:
            import glob
            models_dir = os.path.expanduser("~/.jarvis/models")
            gguf_models = [os.path.basename(p) for p in glob.glob(os.path.join(models_dir, "*.gguf"))]
        except Exception:
            pass
        available = set(ollama_models + gguf_models)
        if available:
            first_available = next(iter(available))
            for agent in agents.list_agents():
                if agent.model not in available:
                    old_model = agent.model
                    agents.update_agent(agent.id, CreateAgentDTO(
                        name=agent.name,
                        description=agent.description,
                        model=first_available,
                        system_prompt=agent.system_prompt,
                        temperature=agent.temperature,
                        max_tokens=agent.max_tokens,
                        specialty=agent.specialty,
                        tools=agent.tools,
                        can_orchestrate=agent.can_orchestrate,
                        priority=agent.priority,
                    ))
                    logger.info(
                        "Agent '%s': model '%s' not found, fixed to '%s'",
                        agent.name, old_model, first_available,
                    )
    except Exception as e:
        logger.warning("Agent model validation failed: %s", e)

    logger.info("UI path: %s", get_ui_path(args.dev))
    import webview

    window = webview.create_window(
        title=APP_NAME,
        url=str(get_ui_path(args.dev)),
        js_api=bridge,
        width=1280,
        height=800,
        min_size=(900, 600),
    )

    logger.info("Starting pywebview (debug=%s)", args.dev)
    webview.start(debug=args.dev)


if __name__ == "__main__":
    on_crash(lambda msg: _show_error_dialog(
        f"{APP_NAME} — Erro inesperado",
        "Ocorreu um erro inesperado.\n\n"
        f"Veja o log em: {setup_logging()}\n\n"
        f"{msg[:500]}"
    ))
    try:
        main()
    except Exception as exc:
        tb = traceback.format_exc()
        logger.critical("Fatal startup error:\n%s", tb)
        _show_error_dialog(
            f"{APP_NAME} — Erro ao iniciar",
            f"{APP_NAME} encontrou um erro e não pode continuar.\n\n"
            f"{exc}\n\n"
            f"Veja o log completo em:\n{setup_logging()}"
        )
        sys.exit(1)
