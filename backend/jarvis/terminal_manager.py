"""Terminal emulation — PTY via subprocess with I/O."""

import os
import subprocess
import sys
import threading
import uuid
from dataclasses import dataclass, field


@dataclass
class TerminalInstance:
    id: str = ""
    process: subprocess.Popen | None = None
    shell: str = ""
    cwd: str = ""
    is_running: bool = False
    cols: int = 80
    rows: int = 24
    buffer: str = ""


class TerminalManager:
    def __init__(self):
        self._terminals: dict[str, TerminalInstance] = {}
        self._output_callback = None
        self._exit_callback = None
        self._lock = threading.Lock()

    def create(self, cwd: str = "") -> str:
        shell = self._detect_shell()
        term_id = uuid.uuid4().hex

        try:
            proc = subprocess.Popen(
                [shell],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=cwd or None,
                bufsize=0,
                text=False,
            )
        except FileNotFoundError:
            return ""

        if cwd:
            self._write_to_process(proc, f"cd \"{cwd}\"\n")

        inst = TerminalInstance(
            id=term_id,
            process=proc,
            shell=shell,
            cwd=cwd,
            is_running=True,
        )

        with self._lock:
            self._terminals[term_id] = inst

        self._start_reader(inst, proc.stdout, is_stderr=False)
        self._start_reader(inst, proc.stderr, is_stderr=True)

        return term_id

    def write(self, term_id: str, data: str) -> bool:
        with self._lock:
            inst = self._terminals.get(term_id)
        if not inst or not inst.process or not inst.is_running:
            return False
        self._write_to_process(inst.process, data)
        return True

    def resize(self, term_id: str, cols: int, rows: int) -> bool:
        with self._lock:
            inst = self._terminals.get(term_id)
        if not inst:
            return False
        inst.cols = cols
        inst.rows = rows
        return True

    def close(self, term_id: str) -> bool:
        with self._lock:
            inst = self._terminals.pop(term_id, None)
        if not inst or not inst.process:
            return False
        try:
            inst.process.terminate()
            inst.process.wait(timeout=3)
        except Exception:
            try:
                inst.process.kill()
                inst.process.wait(timeout=1)
            except Exception:
                pass
        inst.is_running = False
        return True

    def close_all(self) -> None:
        ids = self.list()
        for tid in ids:
            self.close(tid)

    def list(self) -> list[str]:
        with self._lock:
            return list(self._terminals.keys())

    def get(self, term_id: str) -> TerminalInstance | None:
        with self._lock:
            return self._terminals.get(term_id)

    def on_output(self, callback) -> None:
        self._output_callback = callback

    def on_exit(self, callback) -> None:
        self._exit_callback = callback

    def _detect_shell(self) -> str:
        if sys.platform == "win32":
            return os.environ.get("COMSPEC", "cmd.exe")
        return os.environ.get("SHELL", "/bin/bash")

    def _write_to_process(self, proc: subprocess.Popen, data: str) -> None:
        if proc.stdin and proc.stdin.writable():
            try:
                proc.stdin.write(data.encode("utf-8"))
                proc.stdin.flush()
            except (BrokenPipeError, OSError):
                pass

    def _start_reader(
        self, inst: TerminalInstance, pipe, is_stderr: bool
    ) -> None:
        def _reader():
            try:
                while inst.is_running:
                    chunk = pipe.read(4096)
                    if not chunk:
                        break
                    text = chunk.decode("utf-8", errors="replace")
                    inst.buffer += text
                    if self._output_callback:
                        self._output_callback(inst.id, text)
            except (OSError, ValueError):
                pass
            finally:
                self._on_process_exit(inst)

        thread = threading.Thread(target=_reader, daemon=True)
        thread.start()

    def _on_process_exit(self, inst: TerminalInstance) -> None:
        if not inst.is_running:
            return
        inst.is_running = False
        proc = inst.process
        exit_code = -1
        if proc:
            try:
                proc.wait(timeout=1)
                exit_code = proc.returncode
            except Exception:
                pass
        if self._exit_callback:
            self._exit_callback(inst.id, exit_code)
