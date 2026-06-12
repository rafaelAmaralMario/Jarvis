"""Logging configuration — writes to file and console (if available)."""

import logging
import logging.handlers
import os
import sys
import threading
from pathlib import Path
from typing import Callable


def get_log_dir() -> Path:
    if os.environ.get("APPDATA"):
        base = Path(os.environ["APPDATA"]) / "JARVIS"
    else:
        base = Path.home() / ".jarvis"
    log_dir = base / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


_initialized = False
_crash_callbacks: list[Callable[[str], None]] = []


def on_crash(callback: Callable[[str], None]) -> None:
    _crash_callbacks.append(callback)


def _notify_crash(message: str) -> None:
    for cb in _crash_callbacks:
        try:
            cb(message)
        except Exception:
            pass


def setup_logging(level: int = logging.DEBUG) -> str:
    global _initialized
    if _initialized:
        return str(get_log_dir() / "jarvis.log")
    _initialized = True

    log_dir = get_log_dir()
    log_file = log_dir / "jarvis.log"

    root = logging.getLogger()
    root.setLevel(level)

    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)-8s %(name)s:%(lineno)d — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    file_handler = logging.handlers.RotatingFileHandler(
        log_file, maxBytes=5_242_880, backupCount=3, encoding="utf-8"
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)

    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(logging.WARNING)
    console_handler.setFormatter(formatter)
    root.addHandler(console_handler)

    logging.getLogger("jarvis").info("Logging initialized — log file: %s", log_file)

    return str(log_file)


def install_exception_hooks() -> None:
    """Install global hooks to catch unhandled exceptions and log them."""

    original_excepthook = sys.excepthook

    def _excepthook(exc_type, exc_value, exc_tb) -> None:
        import traceback
        msg = "".join(traceback.format_exception(exc_type, exc_value, exc_tb))
        logging.getLogger("jarvis").critical("Unhandled exception:\n%s", msg)
        _notify_crash(msg)
        if original_excepthook:
            original_excepthook(exc_type, exc_value, exc_tb)

    sys.excepthook = _excepthook

    original_thread_hook = threading.excepthook

    def _thread_hook(args: threading.ExceptHookArgs) -> None:
        import traceback
        msg = "".join(traceback.format_exception(args.exc_type, args.exc_value, args.exc_traceback))
        logging.getLogger("jarvis").critical("Unhandled thread exception:\n%s", msg)
        _notify_crash(msg)
        if original_thread_hook:
            original_thread_hook(args)

    threading.excepthook = _thread_hook
