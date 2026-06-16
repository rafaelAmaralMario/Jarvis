"""Background agents — scheduler, directory watcher, periodic analysis, notifications."""

import datetime
import logging
import os
import queue
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

logger = logging.getLogger(__name__)


@dataclass
class ScheduledTask:
    name: str
    interval_seconds: int
    func: Callable[[], str | None]
    last_run: float = 0.0
    enabled: bool = True


class TaskScheduler:
    """Runs recurring tasks in background threads."""

    def __init__(self):
        self._tasks: dict[str, ScheduledTask] = {}
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def add(self, name: str, interval_seconds: int, func: Callable[[], str | None]) -> None:
        self._tasks[name] = ScheduledTask(name=name, interval_seconds=interval_seconds, func=func)

    def remove(self, name: str) -> None:
        self._tasks.pop(name, None)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True, name="task-scheduler")
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)

    def _loop(self) -> None:
        while not self._stop_event.is_set():
            now = time.time()
            for task in list(self._tasks.values()):
                if not task.enabled:
                    continue
                if now - task.last_run >= task.interval_seconds:
                    task.last_run = now
                    try:
                        result = task.func()
                        if result:
                            logger.info("[Schedule:%s] %s", task.name, result)
                    except Exception as e:
                        logger.exception("[Schedule:%s] Error: %s", task.name, e)
            self._stop_event.wait(5.0)

    def list_tasks(self) -> list[dict[str, Any]]:
        return [
            {
                "name": t.name,
                "interval_seconds": t.interval_seconds,
                "enabled": t.enabled,
                "last_run_ago": int(time.time() - t.last_run) if t.last_run else None,
            }
            for t in self._tasks.values()
        ]


class DirectoryWatcher:
    """Watch a directory for file changes and trigger callbacks."""

    def __init__(self, callback: Callable[[list[str]], None] | None = None):
        self._watched: dict[str, float] = {}
        self._callback = callback
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def watch(self, path: str) -> None:
        p = Path(path)
        if p.is_dir():
            for f in p.rglob("*"):
                if f.is_file():
                    self._watched[str(f)] = f.stat().st_mtime
        elif p.is_file():
            self._watched[str(p)] = p.stat().st_mtime

    def unwatch(self, path: str) -> None:
        self._watched = {k: v for k, v in self._watched.items() if not k.startswith(path)}

    def start(self, interval: float = 3.0) -> None:
        self._interval = interval
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True, name="dir-watcher")
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)

    def _loop(self) -> None:
        while not self._stop_event.is_set():
            changed = []
            for fpath, old_mtime in list(self._watched.items()):
                try:
                    new_mtime = Path(fpath).stat().st_mtime
                    if new_mtime > old_mtime:
                        self._watched[fpath] = new_mtime
                        changed.append(fpath)
                except OSError:
                    pass
            if changed and self._callback:
                try:
                    self._callback(changed)
                except Exception as e:
                    logger.exception("Watcher callback error: %s", e)
            self._stop_event.wait(self._interval)

    def list_watched(self) -> list[str]:
        return list(self._watched.keys())


class BackgroundAgentManager:
    """Aggregates scheduler + watchers + notification queue."""

    def __init__(self, bridge_url: str = "", workspace_root: str = ""):
        self.scheduler = TaskScheduler()
        self.watcher = DirectoryWatcher(callback=self._on_files_changed)
        self._notification_queue: queue.Queue = queue.Queue()
        self._bridge_url = bridge_url or "http://127.0.0.1:28900"
        self._workspace_root = workspace_root or os.getcwd()
        self._agent_log: list[dict] = []
        self._started = False

    def start(self) -> None:
        if self._started:
            return
        self.scheduler.start()
        self.watcher.start()
        self._register_default_agents()
        self._started = True
        logger.info("Background agents started")

    def stop(self) -> None:
        self.scheduler.stop()
        self.watcher.stop()
        self._started = False
        logger.info("Background agents stopped")

    def _register_default_agents(self) -> None:
        self.scheduler.add(
            "git-log-check",
            3600,
            self._agent_check_git_log,
        )
        self.scheduler.add(
            "workspace-cleanup",
            86400,
            self._agent_workspace_cleanup,
        )

        workspace = Path(self._workspace_root)
        if workspace.exists():
            self.watcher.watch(str(workspace))

    def _agent_check_git_log(self) -> str | None:
        try:
            repo_path = self._workspace_root
            git_dir = Path(repo_path) / ".git"
            if not git_dir.exists():
                return None
            import subprocess
            result = subprocess.run(
                ["git", "log", "--oneline", "-10"],
                capture_output=True, text=True, cwd=repo_path, timeout=15
            )
            if result.returncode != 0:
                return None
            commits = result.stdout.strip()
            if not commits:
                return None
            self._log_activity("git-log-check", f"Last 10 commits:\n{commits}")
            return f"Git log checked: {len(commits.split(chr(10)))} commits"
        except Exception as e:
            logger.debug("git-log-check failed: %s", e)
            return None

    def _agent_workspace_cleanup(self) -> str | None:
        try:
            temp_files = []
            for f in Path(self._workspace_root).rglob("*"):
                if f.suffix in (".tmp", ".log", ".bak") and f.is_file():
                    age = time.time() - f.stat().st_mtime
                    if age > 86400:
                        temp_files.append(str(f))
            if temp_files:
                msg = f"Found {len(temp_files)} stale temp files"
                self._log_activity("workspace-cleanup", msg)
                return msg
            return None
        except Exception as e:
            logger.debug("workspace-cleanup failed: %s", e)
            return None

    def _on_files_changed(self, changed: list[str]) -> None:
        msg = f"Files changed: {len(changed)}"
        self._log_activity("file-watcher", msg + "\n" + "\n".join(changed[:10]))

    def _log_activity(self, agent: str, message: str) -> None:
        entry = {
            "agent": agent,
            "message": message,
            "timestamp": datetime.datetime.now().isoformat(),
        }
        self._agent_log.append(entry)
        if len(self._agent_log) > 1000:
            self._agent_log = self._agent_log[-500:]
        self._notification_queue.put(entry)
        logger.info("[Agent:%s] %s", agent, message[:120])

    def get_log(self, limit: int = 50) -> list[dict]:
        return self._agent_log[-limit:]

    def get_notifications(self) -> list[dict]:
        notifications = []
        while not self._notification_queue.empty():
            try:
                notifications.append(self._notification_queue.get_nowait())
            except queue.Empty:
                break
        return notifications

    def list_agents(self) -> list[dict[str, Any]]:
        tasks = self.scheduler.list_tasks()
        watched = self.watcher.list_watched()
        return [
            {
                "name": "task-scheduler",
                "type": "periodic",
                "tasks": tasks,
            },
            {
                "name": "directory-watcher",
                "type": "watchdog",
                "watched_files": len(watched),
            },
        ]
