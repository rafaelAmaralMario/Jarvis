"""Output and Problems manager — tracks build logs, execution output, and code problems."""

import logging
import threading
import time
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class LogEntry:
    timestamp: float
    level: str
    source: str
    message: str


@dataclass
class ProblemEntry:
    file: str
    line: int
    column: int
    severity: str
    message: str
    code: str = ""


class OutputManager:
    def __init__(self, max_entries: int = 1000):
        self._logs: list[LogEntry] = []
        self._problems: list[ProblemEntry] = []
        self._max_entries = max_entries
        self._lock = threading.Lock()

    def log(self, message: str, level: str = "info", source: str = "system") -> None:
        entry = LogEntry(timestamp=time.time(), level=level, source=source, message=message)
        with self._lock:
            self._logs.append(entry)
            if len(self._logs) > self._max_entries:
                self._logs = self._logs[-self._max_entries:]

    def get_logs(self, source: str = "", level: str = "", limit: int = 200) -> list[dict]:
        with self._lock:
            entries = self._logs
            if source:
                entries = [e for e in entries if e.source == source]
            if level:
                entries = [e for e in entries if e.level == level]
            entries = entries[-limit:]
            return [
                {
                    "timestamp": e.timestamp,
                    "level": e.level,
                    "source": e.source,
                    "message": e.message,
                }
                for e in entries
            ]

    def clear_logs(self) -> None:
        with self._lock:
            self._logs.clear()

    def add_problem(
        self,
        file: str,
        line: int,
        column: int,
        severity: str,
        message: str,
        code: str = "",
    ) -> None:
        entry = ProblemEntry(file=file, line=line, column=column, severity=severity, message=message, code=code)
        with self._lock:
            self._problems.append(entry)

    def get_problems(self, file: str = "", severity: str = "") -> list[dict]:
        with self._lock:
            entries = self._problems
            if file:
                entries = [e for e in entries if e.file == file]
            if severity:
                entries = [e for e in entries if e.severity == severity]
            return [
                {
                    "file": e.file,
                    "line": e.line,
                    "column": e.column,
                    "severity": e.severity,
                    "message": e.message,
                    "code": e.code,
                }
                for e in entries
            ]

    def clear_problems(self, file: str = "") -> None:
        with self._lock:
            if file:
                self._problems = [p for p in self._problems if p.file != file]
            else:
                self._problems.clear()
