"""Micro-services architecture — worker manager, HTTP protocol, process isolation."""

import json
import logging
import os
import socket
import subprocess
import sys
import threading
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable

import httpx

logger = logging.getLogger(__name__)

WORKER_PORT_START = 29100
WORKER_PORT_END = 29200


class ServiceStatus(Enum):
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    FAILED = "failed"
    DEGRADED = "degraded"


@dataclass
class WorkerInfo:
    name: str
    host: str = "127.0.0.1"
    port: int = 0
    pid: int = 0
    status: ServiceStatus = ServiceStatus.STOPPED
    process: subprocess.Popen | None = None
    last_heartbeat: float = 0.0
    started_at: str = ""
    error: str = ""


def _find_free_port() -> int:
    for port in range(WORKER_PORT_START, WORKER_PORT_END):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise RuntimeError("No free ports available")


class WorkerProcess:
    """Manages a single worker subprocess with health checks."""

    def __init__(self, name: str, module_path: str, host: str = "127.0.0.1"):
        self.name = name
        self.module_path = module_path
        self.host = host
        self._port = _find_free_port()
        self.info = WorkerInfo(name=name, host=host, port=self._port)
        self._http_client: httpx.Client | None = None
        self._stop_event = threading.Event()
        self._health_thread: threading.Thread | None = None

    @property
    def pid(self) -> int:
        return self.info.pid

    @property
    def port(self) -> int:
        return self._port

    def client(self) -> httpx.Client:
        if self._http_client is None:
            self._http_client = httpx.Client(base_url=f"http://{self.host}:{self.port}", timeout=30.0)
        return self._http_client

    def start(self) -> bool:
        if self.info.status == ServiceStatus.RUNNING:
            return True
        self.info.status = ServiceStatus.STARTING
        self.info.started_at = datetime.now().isoformat()
        try:
            self.info.process = subprocess.Popen(
                [
                    sys.executable,
                    "-c",
                    f"import jarvis.{self.module_path} as _w; _w.run_worker(host='{self.host}', port={self.port})",
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
            )
            self.info.pid = self.info.process.pid
            self._wait_for_ready(5.0)
            self.info.status = ServiceStatus.RUNNING
            self._start_health_checks()
            logger.info("Worker %s started on %s:%d (pid=%d)", self.name, self.host, self.port, self.info.pid)
            return True
        except Exception as e:
            self.info.status = ServiceStatus.FAILED
            self.info.error = str(e)
            logger.exception("Failed to start worker %s", self.name)
            return False

    def stop(self) -> None:
        self._stop_event.set()
        if self._health_thread:
            self._health_thread.join(timeout=3)
        if self.info.process:
            try:
                self.info.process.terminate()
                self.info.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.info.process.kill()
            self.info.process = None
        self.info.status = ServiceStatus.STOPPED
        if self._http_client:
            self._http_client.close()
            self._http_client = None
        logger.info("Worker %s stopped", self.name)

    def health(self) -> bool:
        try:
            resp = self.client().get("/health", timeout=5.0)
            if resp.status_code == 200:
                self.info.last_heartbeat = time.time()
                self.info.status = ServiceStatus.RUNNING
                return True
            self.info.status = ServiceStatus.DEGRADED
            return False
        except Exception:
            self.info.status = ServiceStatus.DEGRADED
            return False

    def request(self, endpoint: str, payload: dict[str, Any] = None) -> dict[str, Any]:
        try:
            resp = self.client().post(endpoint, json=payload or {})
            resp.raise_for_status()
            return resp.json()
        except httpx.RequestError as e:
            self.info.status = ServiceStatus.DEGRADED
            return {"success": False, "error": f"Worker {self.name} unavailable: {e}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _wait_for_ready(self, timeout: float) -> bool:
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                resp = httpx.get(f"http://{self.host}:{self.port}/health", timeout=2.0)
                if resp.status_code == 200:
                    return True
            except Exception:
                pass
            time.sleep(0.3)
        raise TimeoutError(f"Worker {self.name} did not become ready in {timeout}s")

    def _start_health_checks(self) -> None:
        self._stop_event.clear()

        def _loop():
            while not self._stop_event.is_set():
                try:
                    self.health()
                except Exception:
                    pass
                self._stop_event.wait(15.0)
        self._health_thread = threading.Thread(target=_loop, daemon=True, name=f"health-{self.name}")
        self._health_thread.start()


class WorkerManager:
    """Manages all worker processes: start, stop, monitor, dispatch."""

    def __init__(self, services_dir: str = ""):
        self._workers: dict[str, WorkerProcess] = {}
        self._services_dir = services_dir or str(Path.home() / ".jarvis" / "services")
        self._lock = threading.Lock()

    def register(self, name: str, module_path: str) -> None:
        with self._lock:
            if name in self._workers:
                logger.warning("Worker %s already registered", name)
                return
            self._workers[name] = WorkerProcess(name=name, module_path=module_path)

    def start(self, name: str) -> bool:
        worker = self._workers.get(name)
        if not worker:
            logger.warning("Worker %s not found", name)
            return False
        return worker.start()

    def stop(self, name: str) -> None:
        worker = self._workers.get(name)
        if worker:
            worker.stop()

    def start_all(self) -> None:
        for name in list(self._workers.keys()):
            try:
                self.start(name)
            except Exception as e:
                logger.error("Failed to start worker %s: %s", name, e)

    def stop_all(self) -> None:
        for name in list(self._workers.keys()):
            try:
                self.stop(name)
            except Exception as e:
                logger.error("Failed to stop worker %s: %s", name, e)

    def health_all(self) -> dict[str, bool]:
        return {name: w.health() for name, w in self._workers.items()}

    def dispatch(self, service: str, endpoint: str, payload: dict[str, Any] = None) -> dict[str, Any]:
        worker = self._workers.get(service)
        if not worker:
            return {"success": False, "error": f"Worker '{service}' not registered"}
        if worker.info.status != ServiceStatus.RUNNING:
            started = worker.start()
            if not started:
                return {"success": False, "error": f"Worker '{service}' failed to start: {worker.info.error}"}
        return worker.request(endpoint, payload)

    def list_workers(self) -> list[dict[str, Any]]:
        return [
            {
                "name": w.name,
                "port": w.port,
                "pid": w.pid,
                "status": w.info.status.value,
                "started_at": w.info.started_at,
                "error": w.info.error,
            }
            for w in self._workers.values()
        ]

    def shutdown(self) -> None:
        self.stop_all()


def run_worker(host: str = "127.0.0.1", port: int = 29100) -> None:
    """Entry point for a worker subprocess. Override in subclass."""
    logger.info("Worker process starting on %s:%d", host, port)
    while True:
        time.sleep(1)
