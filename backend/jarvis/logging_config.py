"""Logging configuration — writes to separate files per component and level.

Layout:
  logs/backend/{errors,warnings,info}/<session>.log
  logs/frontend/{errors,warnings,info}/<session>.log
  logs/server/{errors,warnings,info}/<session>.log
"""

import logging
import logging.handlers
import os
import sys
import threading
from datetime import datetime
from pathlib import Path
from typing import Callable, Literal

Component = Literal["backend", "frontend", "server"]


def get_log_dir() -> Path:
    if os.environ.get("APPDATA"):
        base = Path(os.environ["APPDATA"]) / "JARVIS"
    else:
        base = Path.home() / ".jarvis"
    log_dir = base / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


SESSION_TS = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")


class _ComponentRouterHandler(logging.Handler):
    """Routes log records to component + level subdirectories.

    Layout:
      logs/{component}/{errors|warnings|info}/<session>.log
    """

    def __init__(self, base_dir: Path, component: Component, level: int = logging.DEBUG):
        super().__init__(level)
        self._component = component
        self._base_dir = base_dir
        self._handlers: dict[str, logging.FileHandler] = {}
        self._formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)-8s %(name)s:%(lineno)d — %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        self._setup_levels()

    def _setup_levels(self) -> None:
        for sub in ("errors", "warnings", "info"):
            path = self._base_dir / self._component / sub / f"{SESSION_TS}.log"
            path.parent.mkdir(parents=True, exist_ok=True)
            h = logging.FileHandler(path, encoding="utf-8")
            h.setFormatter(self._formatter)
            h.setLevel(logging.DEBUG)
            self._handlers[sub] = h

    def _sub_for(self, levelno: int) -> str:
        if levelno >= logging.ERROR:
            return "errors"
        if levelno >= logging.WARNING:
            return "warnings"
        return "info"

    def emit(self, record: logging.LogRecord) -> None:
        try:
            sub = self._sub_for(record.levelno)
            self._handlers[sub].handle(record)
        except Exception:
            self.handleError(record)

    def close(self) -> None:
        for h in self._handlers.values():
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


def setup_logging(
    level: int = logging.DEBUG,
    component: Component = "backend",
) -> str:
    global _initialized
    log_dir = get_log_dir()

    if not _initialized:
        _initialized = True
        root = logging.getLogger()
        root.setLevel(level)

        formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)-8s %(name)s:%(lineno)d — %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        # Component router for the main component
        router = _ComponentRouterHandler(log_dir, component, level)
        root.addHandler(router)

        # Console: only WARNING+ by default, DEBUG in debug mode
        console_level = logging.DEBUG if level <= logging.DEBUG else logging.WARNING
        console_handler = logging.StreamHandler(sys.stderr)
        console_handler.setLevel(console_level)
        console_handler.setFormatter(formatter)
        root.addHandler(console_handler)

    return str(log_dir / component / "info" / f"{SESSION_TS}.log")


def get_component_logger(component: Component) -> logging.Logger:
    """Get or create a logger for a specific component.

    Each component has its own handler so logs go to the right subdirectory.
    """
    log_dir = get_log_dir()
    name = f"jarvis.{component}"
    logger = logging.getLogger(name)

    # Only add the component router once
    if not any(isinstance(h, _ComponentRouterHandler) and h._component == component for h in logger.handlers):
        router = _ComponentRouterHandler(log_dir, component, logging.DEBUG)
        logger.addHandler(router)
        logger.propagate = False  # Don't duplicate to root

    return logger


def log_from_frontend(level: str, message: str, data: dict | None = None) -> None:
    """Bridge method: receives logs from the frontend and writes to frontend log files."""
    logger = get_component_logger("frontend")
    text = message
    if data:
        text += f" | {data}"
    level_map = {
        "debug": logger.debug,
        "info": logger.info,
        "warn": logger.warning,
        "error": logger.error,
    }
    level_map.get(level, logger.info)(text)


def log_from_server(level: str, message: str, data: dict | None = None) -> None:
    """Receives logs from the sync server via bridge."""
    logger = get_component_logger("server")
    text = message
    if data:
        text += f" | {data}"
    level_map = {
        "debug": logger.debug,
        "info": logger.info,
        "warn": logger.warning,
        "error": logger.error,
    }
    level_map.get(level, logger.info)(text)


# Shortcut to write frontend logs directly
def frontend_log(level: str, message: str, data: dict | None = None) -> None:
    log_from_frontend(level, message, data)


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
