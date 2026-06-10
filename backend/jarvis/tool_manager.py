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
from urllib.parse import quote_plus

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
    def __init__(self, workspace_root: str | None = None, knowledge_manager: Any = None):
        self._workspace_root = workspace_root
        self._knowledge_manager = knowledge_manager
        self._unattended: bool = False
        self._tools: dict[str, ToolDefinition] = {}
        self._register_tools()

    @property
    def workspace_root(self) -> str | None:
        return self._workspace_root

    def set_workspace_root(self, path: str | None) -> None:
        self._workspace_root = path

    def set_knowledge_manager(self, km: Any) -> None:
        self._knowledge_manager = km

    @property
    def unattended(self) -> bool:
        return self._unattended

    @unattended.setter
    def unattended(self, val: bool) -> None:
        self._unattended = val

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
            "web_search": ToolDefinition(
                name="web_search",
                description="Search the web for the given query and return a list of results with titles, snippets, and URLs.",
                parameters={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"},
                        "max_results": {"type": "number", "description": "Maximum results to return", "default": 5},
                    },
                    "required": ["query"],
                },
                risk=RiskLevel.SAFE,
                examples=["web_search query='python asyncio tutorial'"],
            ),
            "web_fetch": ToolDefinition(
                name="web_fetch",
                description="Fetch the content of a URL and return it as text (HTML stripped). Useful for reading documentation, articles, or API responses.",
                parameters={
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "URL to fetch"},
                        "max_length": {"type": "number", "description": "Maximum characters to return", "default": 10000},
                    },
                    "required": ["url"],
                },
                risk=RiskLevel.SAFE,
                examples=["web_fetch url='https://example.com/docs'"],
            ),
            "download_file": ToolDefinition(
                name="download_file",
                description="Download a file from a URL and save it to the specified path. Supports images, videos, archives, etc.",
                parameters={
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "URL of the file to download"},
                        "path": {"type": "string", "description": "Local path to save the file (relative to workspace)"},
                    },
                    "required": ["url", "path"],
                },
                risk=RiskLevel.ASK,
                examples=["download_file url='https://example.com/image.png' path='assets/image.png'"],
            ),
            "install_package": ToolDefinition(
                name="install_package",
                description="Install a package using npm, pip, or other package managers. Detects the project type automatically.",
                parameters={
                    "type": "object",
                    "properties": {
                        "package": {"type": "string", "description": "Package name to install"},
                        "manager": {"type": "string", "description": "Package manager: 'npm', 'pip', 'pip3' (auto-detected if omitted)"},
                        "dev": {"type": "boolean", "description": "Install as dev dependency (npm only)", "default": False},
                    },
                    "required": ["package"],
                },
                risk=RiskLevel.ASK,
                examples=["install_package package='tailwindcss' manager='npm' dev=true", "install_package package='requests'"],
            ),
            "create_note": ToolDefinition(
                name="create_note",
                description="Create a knowledge note (documentation, plan, specification) in the Knowledge base. Notes are searchable and can be linked with [[wikilinks]].",
                parameters={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Note title"},
                        "content": {"type": "string", "description": "Note content in Markdown. Use [[Note Title]] for links to other notes."},
                        "folder": {"type": "string", "description": "Folder path (e.g. '/projects/myapp')", "default": "/"},
                        "tags": {"type": "array", "items": {"type": "string"}, "description": "Tags for categorization"},
                    },
                    "required": ["title", "content"],
                },
                risk=RiskLevel.ASK,
                examples=["create_note title='Architecture Overview' content='## System Design\n\nThe system uses...' folder='/projects/myapp'"],
            ),
            "list_notes": ToolDefinition(
                name="list_notes",
                description="List knowledge notes, optionally filtered by folder.",
                parameters={
                    "type": "object",
                    "properties": {
                        "folder": {"type": "string", "description": "Folder to filter by (e.g. '/projects/myapp')", "default": ""},
                    },
                    "required": [],
                },
                risk=RiskLevel.SAFE,
            ),
            "search_notes": ToolDefinition(
                name="search_notes",
                description="Search knowledge notes by text query. Returns matching notes with snippets.",
                parameters={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"},
                    },
                    "required": ["query"],
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

    def _handle_web_search(self, args: dict[str, Any]) -> ToolResult:
        query = args["query"]
        max_results = int(args.get("max_results", 5))
        try:
            import requests
            from bs4 import BeautifulSoup

            url = "https://html.duckduckgo.com/html/"
            resp = requests.post(url, data={"q": query}, timeout=15, verify=False, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JARVIS/1.0",
            })
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "html.parser")
            results = []
            for link in soup.select(".result__a"):
                title = link.get_text(strip=True)
                href = link.get("href", "")
                if not href.startswith("http"):
                    continue
                snippet_el = link.find_parent(".result") or link.find_parent("div")
                snippet = ""
                if snippet_el:
                    snip = snippet_el.select_one(".result__snippet")
                    if snip:
                        snippet = snip.get_text(strip=True)
                results.append(f"- [{title}]({href})\n  {snippet}" if snippet else f"- [{title}]({href})")
                if len(results) >= max_results:
                    break

            if not results:
                output = f"No results found for '{query}'"
            else:
                output = f"## Search results for: {query}\n\n" + "\n".join(results)
            return ToolResult(success=True, output=output, data={"results": results, "count": len(results)})
        except ImportError:
            return ToolResult(success=False, error="Missing dependencies: requests and beautifulsoup4")
        except Exception as e:
            return ToolResult(success=False, error=f"Web search failed: {e}")

    def _handle_web_fetch(self, args: dict[str, Any]) -> ToolResult:
        url = args["url"]
        max_length = int(args.get("max_length", 10000))
        try:
            import requests
            from bs4 import BeautifulSoup

            resp = requests.get(url, timeout=15, verify=False, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JARVIS/1.0",
            })
            resp.raise_for_status()

            content_type = resp.headers.get("content-type", "")
            if "application/json" in content_type:
                try:
                    data = resp.json()
                    text = json.dumps(data, indent=2, ensure_ascii=False)
                except Exception:
                    text = resp.text
            else:
                soup = BeautifulSoup(resp.text, "html.parser")
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()
                text = soup.get_text(separator="\n", strip=True)

            if len(text) > max_length:
                text = text[:max_length] + "\n\n[...truncated]"
            return ToolResult(success=True, output=text, data={"url": url, "length": len(text)})
        except ImportError:
            return ToolResult(success=False, error="Missing dependencies: requests and beautifulsoup4")
        except Exception as e:
            return ToolResult(success=False, error=f"Web fetch failed: {e}")

    def _handle_download_file(self, args: dict[str, Any]) -> ToolResult:
        url = args["url"]
        path = self._resolve_path(args["path"])
        try:
            import requests
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
            resp = requests.get(url, timeout=120, stream=True, verify=False, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JARVIS/1.0",
            })
            resp.raise_for_status()
            with open(path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            return ToolResult(success=True, output=f"Downloaded {url} → {path} ({len(resp.content)} bytes)")
        except ImportError:
            return ToolResult(success=False, error="Missing dependency: requests")
        except Exception as e:
            return ToolResult(success=False, error=f"Download failed: {e}")

    def _handle_install_package(self, args: dict[str, Any]) -> ToolResult:
        pkg = args["package"]
        manager = args.get("manager", "")
        dev = args.get("dev", False)
        try:
            if not manager:
                if os.path.exists(os.path.join(self._workspace_root or ".", "package.json")):
                    manager = "npm"
                elif os.path.exists(os.path.join(self._workspace_root or ".", "requirements.txt")):
                    manager = "pip"
                elif os.path.exists(os.path.join(self._workspace_root or ".", "pyproject.toml")):
                    manager = "pip"
                else:
                    manager = "npm"
            if manager == "npm":
                cmd = f"npm install {pkg}"
                if dev:
                    cmd += " --save-dev"
            elif manager in ("pip", "pip3"):
                cmd = f"{manager} install {pkg}"
            else:
                return ToolResult(success=False, error=f"Unknown package manager: {manager}")
            result = subprocess.run(
                cmd, shell=True, capture_output=True, text=True, timeout=120,
                cwd=self._workspace_root or ".",
            )
            output = result.stdout.strip()
            if result.stderr:
                output += "\n--- stderr ---\n" + result.stderr.strip()
            return ToolResult(success=result.returncode == 0, output=output or f"Installed {pkg}")
        except subprocess.TimeoutExpired:
            return ToolResult(success=False, error=f"Installation timed out")
        except Exception as e:
            return ToolResult(success=False, error=f"Install failed: {e}")

    def _handle_create_note(self, args: dict[str, Any]) -> ToolResult:
        if not self._knowledge_manager:
            return ToolResult(success=False, error="Knowledge module not available")
        try:
            from jarvis.knowledge_manager import CreateNoteDTO
            dto = CreateNoteDTO(
                title=args["title"],
                content=args["content"],
                folder=args.get("folder", "/projects"),
                tags=args.get("tags", []),
            )
            note = self._knowledge_manager.create_note(dto)
            return ToolResult(
                success=True,
                output=f"Note created: **{note.title}** (id: `{note.id}`)\nFolder: {note.folder}\nTimestamp: {note.created_at}",
                data={"note_id": note.id, "title": note.title, "folder": note.folder, "created_at": note.created_at},
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to create note: {e}")

    def _handle_list_notes(self, args: dict[str, Any]) -> ToolResult:
        if not self._knowledge_manager:
            return ToolResult(success=False, error="Knowledge module not available")
        try:
            folder = args.get("folder", "")
            notes = self._knowledge_manager.list_notes(folder)
            if not notes:
                return ToolResult(success=True, output="No notes found.")
            lines = [f"### Notes in '{folder or 'all'}'"]
            for n in notes:
                updated = n.updated_at[:19] if n.updated_at else "?"
                lines.append(f"- **{n.title}** (`{n.id}`) [{n.folder}] — updated {updated}")
            return ToolResult(success=True, output="\n".join(lines), data={"count": len(notes)})
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to list notes: {e}")

    def _handle_search_notes(self, args: dict[str, Any]) -> ToolResult:
        if not self._knowledge_manager:
            return ToolResult(success=False, error="Knowledge module not available")
        try:
            query = args["query"]
            results = self._knowledge_manager.search_notes(query)
            if not results:
                return ToolResult(success=True, output=f"No notes matching '{query}'")
            lines = [f"### Search results for: {query}"]
            for r in results:
                lines.append(f"- **{r.title}** (score: {r.score:.2f})\n  {r.snippet}")
            return ToolResult(success=True, output="\n".join(lines), data={"count": len(results)})
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to search notes: {e}")
