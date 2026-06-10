"""Tool system for Computer Use — AI can act on the local environment."""

import datetime
import json
import logging
import os
import re
import subprocess
import sys
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    SAFE = "safe"
    ASK = "ask"
    DANGER = "danger"


@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters: dict[str, Any]
    risk: RiskLevel = RiskLevel.SAFE
    examples: list[str] = field(default_factory=list)


@dataclass
class ToolResult:
    success: bool
    output: str = ""
    error: str = ""
    data: Any = None


class ToolError(Exception):
    pass


class ToolManager:
    def __init__(self, workspace_root: str | None = None):
        self._workspace_root = workspace_root
        self._tools: dict[str, ToolDefinition] = {}
        self._register_tools()

    @property
    def workspace_root(self) -> str | None:
        return self._workspace_root

    def set_workspace_root(self, path: str | None) -> None:
        self._workspace_root = path

    def list_tools(self) -> list[dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "parameters": t.parameters,
                "risk": t.risk.value,
                "examples": t.examples,
            }
            for t in self._tools.values()
        ]

    def get_tool(self, name: str) -> ToolDefinition | None:
        return self._tools.get(name)

    def get_risk(self, name: str) -> RiskLevel:
        t = self._tools.get(name)
        return t.risk if t else RiskLevel.DANGER

    def execute(self, name: str, args: dict[str, Any]) -> ToolResult:
        tool = self._tools.get(name)
        if not tool:
            return ToolResult(success=False, error=f"Unknown tool: {name}")

        handler = getattr(self, f"_handle_{name}", None)
        if not handler:
            return ToolResult(success=False, error=f"Tool '{name}' has no handler")

        try:
            result = handler(args)
            return result
        except ToolError as e:
            return ToolResult(success=False, error=str(e))
        except Exception as e:
            logger.exception("Tool %s failed", name)
            return ToolResult(success=False, error=f"Unexpected error: {e}")

    def _register_tools(self) -> None:
        self._tools = {
            "read_file": ToolDefinition(
                name="read_file",
                description="Read the contents of a file at the given path.",
                parameters={
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Absolute or relative path to the file"}
                    },
                    "required": ["path"],
                },
                risk=RiskLevel.SAFE,
                examples=["read_file path='src/main.ts'"],
            ),
            "write_file": ToolDefinition(
                name="write_file",
                description="Write content to a file. Creates the file if it doesn't exist.",
                parameters={
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Path to the file"},
                        "content": {"type": "string", "description": "Content to write"},
                    },
                    "required": ["path", "content"],
                },
                risk=RiskLevel.ASK,
                examples=["write_file path='src/hello.ts' content='console.log(\"hello\")'"],
            ),
            "create_file": ToolDefinition(
                name="create_file",
                description="Create a new empty file or with initial content.",
                parameters={
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Path where to create the file"},
                        "content": {"type": "string", "description": "Optional initial content"},
                    },
                    "required": ["path"],
                },
                risk=RiskLevel.ASK,
            ),
            "delete_file": ToolDefinition(
                name="delete_file",
                description="Delete a file or empty directory.",
                parameters={
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Path to delete"}
                    },
                    "required": ["path"],
                },
                risk=RiskLevel.DANGER,
            ),
            "list_directory": ToolDefinition(
                name="list_directory",
                description="List files and directories in a given path.",
                parameters={
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Directory path", "default": "."}
                    },
                    "required": [],
                },
                risk=RiskLevel.SAFE,
            ),
            "execute_command": ToolDefinition(
                name="execute_command",
                description="Execute a shell command (PowerShell on Windows, bash on Linux/macOS) and return stdout/stderr.",
                parameters={
                    "type": "object",
                    "properties": {
                        "command": {"type": "string", "description": "Command to execute"},
                        "workdir": {"type": "string", "description": "Working directory (defaults to workspace root)"},
                        "timeout": {"type": "number", "description": "Timeout in seconds", "default": 30},
                    },
                    "required": ["command"],
                },
                risk=RiskLevel.ASK,
                examples=["execute_command command='npm test'", "execute_command command='git status'"],
            ),
            "grep_search": ToolDefinition(
                name="grep_search",
                description="Search for a pattern in files using ripgrep or grep.",
                parameters={
                    "type": "object",
                    "properties": {
                        "pattern": {"type": "string", "description": "Regex or text pattern to search"},
                        "path": {"type": "string", "description": "Directory to search (defaults to workspace root)", "default": "."},
                        "include": {"type": "string", "description": "File glob pattern (e.g. *.ts, *.py)"},
                    },
                    "required": ["pattern"],
                },
                risk=RiskLevel.SAFE,
            ),
            "glob_files": ToolDefinition(
                name="glob_files",
                description="Find files matching a glob pattern.",
                parameters={
                    "type": "object",
                    "properties": {
                        "pattern": {"type": "string", "description": "Glob pattern (e.g. **/*.ts, src/**/*.py)"},
                        "path": {"type": "string", "description": "Root directory", "default": "."},
                    },
                    "required": ["pattern"],
                },
                risk=RiskLevel.SAFE,
            ),
            "git_status": ToolDefinition(
                name="git_status",
                description="Show the working tree status.",
                parameters={
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Repository path", "default": "."}
                    },
                    "required": [],
                },
                risk=RiskLevel.SAFE,
            ),
            "git_diff": ToolDefinition(
                name="git_diff",
                description="Show changes in the working tree or between commits.",
                parameters={
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Repository path", "default": "."},
                        "file": {"type": "string", "description": "Optional specific file to diff"},
                    },
                    "required": [],
                },
                risk=RiskLevel.SAFE,
            ),
            "git_commit": ToolDefinition(
                name="git_commit",
                description="Stage all changes and create a commit.",
                parameters={
                    "type": "object",
                    "properties": {
                        "message": {"type": "string", "description": "Commit message"},
                        "path": {"type": "string", "description": "Repository path", "default": "."},
                    },
                    "required": ["message"],
                },
                risk=RiskLevel.ASK,
            ),
            "ask_user": ToolDefinition(
                name="ask_user",
                description="Ask the user a question and wait for their response. Use this when you need clarification or approval.",
                parameters={
                    "type": "object",
                    "properties": {
                        "question": {"type": "string", "description": "Question to ask the user"}
                    },
                    "required": ["question"],
                },
                risk=RiskLevel.SAFE,
            ),
        }

    def _resolve_path(self, path: str) -> str:
        if os.path.isabs(path):
            return path
        if self._workspace_root:
            return os.path.join(self._workspace_root, path)
        return os.path.abspath(path)

    def _handle_read_file(self, args: dict[str, Any]) -> ToolResult:
        path = self._resolve_path(args["path"])
        if not os.path.exists(path):
            return ToolResult(success=False, error=f"File not found: {path}")
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            return ToolResult(success=True, output=content, data={"size": len(content)})
        except Exception as e:
            return ToolResult(success=False, error=f"Error reading file: {e}")

    def _handle_write_file(self, args: dict[str, Any]) -> ToolResult:
        path = self._resolve_path(args["path"])
        content = args["content"]
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            return ToolResult(success=True, output=f"Written {len(content)} bytes to {path}")
        except Exception as e:
            return ToolResult(success=False, error=f"Error writing file: {e}")

    def _handle_create_file(self, args: dict[str, Any]) -> ToolResult:
        path = self._resolve_path(args["path"])
        content = args.get("content", "")
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            return ToolResult(success=True, output=f"Created {path}")
        except Exception as e:
            return ToolResult(success=False, error=f"Error creating file: {e}")

    def _handle_delete_file(self, args: dict[str, Any]) -> ToolResult:
        path = self._resolve_path(args["path"])
        if not os.path.exists(path):
            return ToolResult(success=False, error=f"Not found: {path}")
        try:
            if os.path.isdir(path):
                os.rmdir(path)
            else:
                os.remove(path)
            return ToolResult(success=True, output=f"Deleted {path}")
        except Exception as e:
            return ToolResult(success=False, error=f"Error deleting: {e}")

    def _handle_list_directory(self, args: dict[str, Any]) -> ToolResult:
        path = self._resolve_path(args.get("path", "."))
        if not os.path.isdir(path):
            return ToolResult(success=False, error=f"Not a directory: {path}")
        try:
            entries = []
            for name in sorted(os.listdir(path)):
                full = os.path.join(path, name)
                entries.append({
                    "name": name,
                    "isDirectory": os.path.isdir(full),
                    "size": os.path.getsize(full) if os.path.isfile(full) else 0,
                })
            lines = []
            for e in entries:
                icon = "📁" if e["isDirectory"] else "📄"
                size = f" ({e['size']} B)" if not e["isDirectory"] else ""
                lines.append(f"{icon} {e['name']}{size}")
            return ToolResult(
                success=True,
                output="\n".join(lines),
                data={"entries": entries, "path": path},
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Error listing directory: {e}")

    def _handle_execute_command(self, args: dict[str, Any]) -> ToolResult:
        command = args["command"]
        workdir = args.get("workdir", self._workspace_root or ".")
        timeout = args.get("timeout", 30)
        workdir = self._resolve_path(workdir)

        try:
            shell = True
            if sys.platform == "win32":
                proc = subprocess.run(
                    ["powershell", "-NoProfile", "-Command", command],
                    capture_output=True, text=True, timeout=timeout,
                    cwd=workdir,
                )
            else:
                proc = subprocess.run(
                    ["bash", "-c", command],
                    capture_output=True, text=True, timeout=timeout,
                    cwd=workdir,
                )

            output = proc.stdout
            if proc.stderr:
                output += "\n--- stderr ---\n" + proc.stderr

            if proc.returncode == 0:
                return ToolResult(success=True, output=output.strip())
            else:
                return ToolResult(
                    success=True,
                    output=output.strip() or f"Exit code: {proc.returncode}",
                    data={"exitCode": proc.returncode},
                )
        except subprocess.TimeoutExpired:
            return ToolResult(success=False, error=f"Command timed out after {timeout}s")
        except Exception as e:
            return ToolResult(success=False, error=f"Error executing command: {e}")

    def _handle_grep_search(self, args: dict[str, Any]) -> ToolResult:
        pattern = args["pattern"]
        search_path = self._resolve_path(args.get("path", "."))
        include = args.get("include", "")

        try:
            cmd = ["rg" if sys.platform != "win32" else "rg.bat", "--line-number", "--heading", pattern, search_path]
            if include:
                cmd.extend(["--glob", include])

            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30,
            )
            if result.returncode > 1:
                return ToolResult(success=False, error=f"rg failed: {result.stderr}")
            output = result.stdout.strip()
            if not output:
                output = f"No matches found for '{pattern}'"
            return ToolResult(success=True, output=output)
        except FileNotFoundError:
            try:
                cmd = ["grep", "-rn", pattern, search_path]
                if include:
                    cmd.extend(["--include", include])
                result = subprocess.run(
                    cmd, capture_output=True, text=True, timeout=30,
                )
                output = result.stdout.strip() or f"No matches found for '{pattern}'"
                return ToolResult(success=True, output=output)
            except Exception as e2:
                return ToolResult(success=False, error=f"grep also failed: {e2}")
        except Exception as e:
            return ToolResult(success=False, error=f"Error searching: {e}")

    def _handle_glob_files(self, args: dict[str, Any]) -> ToolResult:
        pattern = args["pattern"]
        search_path = self._resolve_path(args.get("path", "."))
        try:
            import glob as glob_mod
            full_pattern = os.path.join(search_path, pattern)
            matches = glob_mod.glob(full_pattern, recursive=True)
            if not matches:
                return ToolResult(success=True, output=f"No files matching '{pattern}'")
            lines = []
            for m in sorted(matches):
                rel = os.path.relpath(m, search_path)
                lines.append(rel)
            return ToolResult(success=True, output="\n".join(lines), data={"count": len(lines)})
        except Exception as e:
            return ToolResult(success=False, error=f"Error globbing: {e}")

    def _handle_git_status(self, args: dict[str, Any]) -> ToolResult:
        path = self._resolve_path(args.get("path", "."))
        try:
            result = subprocess.run(
                ["git", "-C", path, "status", "--short"],
                capture_output=True, text=True, timeout=15,
            )
            branch = subprocess.run(
                ["git", "-C", path, "branch", "--show-current"],
                capture_output=True, text=True, timeout=5,
            )
            branch_name = branch.stdout.strip()
            output = f"Branch: {branch_name}\n" if branch_name else ""
            output += result.stdout.strip() or "Clean working tree"
            return ToolResult(success=True, output=output)
        except Exception as e:
            return ToolResult(success=False, error=f"git status failed: {e}")

    def _handle_git_diff(self, args: dict[str, Any]) -> ToolResult:
        path = self._resolve_path(args.get("path", "."))
        cmd = ["git", "-C", path, "diff"]
        if args.get("file"):
            cmd.append("--")
            cmd.append(args["file"])
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            output = result.stdout.strip() or "No changes"
            return ToolResult(success=True, output=output)
        except Exception as e:
            return ToolResult(success=False, error=f"git diff failed: {e}")

    def _handle_git_commit(self, args: dict[str, Any]) -> ToolResult:
        path = self._resolve_path(args.get("path", "."))
        message = args["message"]
        try:
            subprocess.run(
                ["git", "-C", path, "add", "-A"],
                capture_output=True, text=True, timeout=15, check=True,
            )
            result = subprocess.run(
                ["git", "-C", path, "commit", "-m", message],
                capture_output=True, text=True, timeout=15,
            )
            if result.returncode == 0:
                return ToolResult(success=True, output=result.stdout.strip())
            else:
                return ToolResult(success=True, output=result.stdout.strip() or result.stderr.strip())
        except Exception as e:
            return ToolResult(success=False, error=f"git commit failed: {e}")

    def _handle_ask_user(self, args: dict[str, Any]) -> ToolResult:
        return ToolResult(
            success=True,
            output=f"[AGUARDANDO RESPOSTA DO USUÁRIO] {args['question']}",
            data={"question": args["question"], "pending": True},
        )
