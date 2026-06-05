"""JARVIS entry point — launches pywebview window with React frontend."""

import os
from pathlib import Path

from jarvis.bridge import JARVISBridge
from jarvis.database import Database
from jarvis.migration_runner import MigrationRunner


def get_db_path() -> Path:
    appdata = os.environ.get("APPDATA", "")
    db_dir = Path(appdata) / "JARVIS"
    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir / "jarvis-ai.db"


def get_ui_path() -> Path:
    dev_index = Path(__file__).resolve().parent.parent.parent / "ui" / "dist" / "index.html"
    if dev_index.exists():
        return dev_index
    # Fallback: bundled with pyinstaller
    return Path(__file__).resolve().parent / "ui" / "index.html"


def main():
    db_path = get_db_path()
    db = Database(db_path)

    runner = MigrationRunner(db)
    runner.run_pending()

    bridge = JARVISBridge()

    import webview

    window = webview.create_window(
        title="JARVIS",
        url=str(get_ui_path()),
        js_api=bridge,
        width=1280,
        height=800,
        min_size=(900, 600),
    )

    webview.start(debug=True)


if __name__ == "__main__":
    main()
