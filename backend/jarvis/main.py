"""JARVIS entry point — launches pywebview window with React frontend."""

import argparse
import os
from pathlib import Path

from jarvis.agents_manager import AgentsManager
from jarvis.bridge import JARVISBridge
from jarvis.database import Database
from jarvis.editor_manager import EditorManager
from jarvis.git_manager import GitManager
from jarvis.graph_builder import GraphBuilder
from jarvis.knowledge_manager import KnowledgeManager
from jarvis.migration_runner import MigrationRunner
from jarvis.models_manager import ModelsManager
from jarvis.module_loader import ModuleLoader
from jarvis.network_manager import NetworkManager
from jarvis.ollama_client import OllamaClient
from jarvis.orchestration_manager import OrchestrationManager
from jarvis.terminal_manager import TerminalManager
from jarvis.workspace_manager import WorkspaceManager


def get_db_path() -> Path:
    appdata = os.environ.get("APPDATA", "")
    db_dir = Path(appdata) / "JARVIS"
    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir / "jarvis-ai.db"


DEV_SERVER_URL = "http://127.0.0.1:1420"


def get_ui_path(dev_mode: bool = False) -> Path | str:
    if dev_mode:
        return DEV_SERVER_URL
    dev_index = Path(__file__).resolve().parent.parent.parent / "ui" / "dist" / "index.html"
    if dev_index.exists():
        return dev_index
    return Path(__file__).resolve().parent / "ui" / "index.html"


def main():
    parser = argparse.ArgumentParser(description="JARVIS AI Assistant")
    parser.add_argument("--dev", action="store_true", help="Connect to Vite dev server")
    args = parser.parse_args()

    db_path = get_db_path()
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
    orchestration = OrchestrationManager(models, agents, db, ollama)

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
    )

    import webview

    window = webview.create_window(
        title="JARVIS",
        url=str(get_ui_path(args.dev)),
        js_api=bridge,
        width=1280,
        height=800,
        min_size=(900, 600),
    )

    webview.start(debug=True)


if __name__ == "__main__":
    main()
