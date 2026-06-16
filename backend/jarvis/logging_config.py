"""Logging configuration — writes to separate files per level:
  logs/errors/<session>.log    (ERROR, CRITICAL + full traceback)
  logs/warnings/<session>.log  (WARNING)
  logs/info/<session>.log      (DEBUG, INFO)
"""

import logging
import logging.handlers
import os
import sys
import threading
from datetime import datetime
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


SESSION_TS = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")


class _LevelRouterHandler(logging.Handler):
    """Routes log records to subdirectories based on severity level.

    Layout:
      logs/errors/<session>.log     → ERROR / CRITICAL
      logs/warnings/<session>.log   → WARNING
      logs/info/<session>.log       → DEBUG / INFO
    """

    _SUBDIRS = {
        "errors": logging.ERROR,
        "warnings": logging.WARNING,
        "info": logging.DEBUG,
    }

    def __init__(self, base_dir: Path, level: int = logging.DEBUG):
        super().__init__(level)
        self._base_dir = base_dir
        self._sub_to_handler: dict[str, logging.FileHandler] = {}
        self._formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)-8s %(name)s:%(lineno)d — %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        self._setup_handlers()

    def _setup_handlers(self) -> None:
        for sub in self._SUBDIRS:
            path = self._base_dir / sub / f"{SESSION_TS}.log"
            path.parent.mkdir(parents=True, exist_ok=True)
            h = logging.FileHandler(path, encoding="utf-8")
            h.setFormatter(self._formatter)
            h.setLevel(logging.DEBUG)
            self._sub_to_handler[sub] = h

    def _sub_for(self, levelno: int) -> str:
        if levelno >= logging.ERROR:
            return "errors"
        if levelno >= logging.WARNING:
            return "warnings"
        return "info"

    def emit(self, record: logging.LogRecord) -> None:
        try:
            sub = self._sub_for(record.levelno)
            self._sub_to_handler[sub].handle(record)
        except Exception:
            self.handleError(record)

    def close(self) -> None:
        for h in self._sub_to_handler.values():
            h.close()
        super().close()


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
    # Always return the path even when already initialized (for crash dialogs)
    log_dir = get_log_dir()
    if _initialized:
        return str(log_dir / "errors" / f"{SESSION_TS}.log")
    _initialized = True

    root = logging.getLogger()
    root.setLevel(level)

    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)-8s %(name)s:%(lineno)d — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Level‑based file routing
    router = _LevelRouterHandler(log_dir)
    router.setLevel(logging.DEBUG)
    root.addHandler(router)

    # Console: only WARNING+
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(logging.WARNING)
    console_handler.setFormatter(formatter)
    root.addHandler(console_handler)

    info_path = log_dir / "info" / f"{SESSION_TS}.log"
    logging.getLogger("jarvis").info("Logging initialized — %s", info_path)

    return str(info_path)


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
