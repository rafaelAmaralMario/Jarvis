"""Tool system for Computer Use — AI can act on the local environment."""

import json
import logging
import os
import subprocess
import sys
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

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
        self._plugin_loader: Any = None
        self._init_plugins()

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

    def _init_plugins(self) -> None:
        try:
            from jarvis.plugin_system import PluginLoader
            self._plugin_loader = PluginLoader()
            self._plugin_loader.load_all()
            self._sync_plugin_tools()
        except Exception as e:
            logger.warning("Plugin system init failed: %s", e)

    def _sync_plugin_tools(self) -> None:
        if not self._plugin_loader:
            return
        existing_plugin_tools = {n for n in self._tools if n.startswith("plugin_")}
        current_plugin_tools = set()
        for pt in self._plugin_loader.tools:
            tool_name = pt["name"]
            current_plugin_tools.add(tool_name)
            if tool_name not in self._tools:
                self._tools[tool_name] = ToolDefinition(
                    name=tool_name,
                    description=pt.get("description", ""),
                    parameters=pt.get("parameters", {"type": "object", "properties": {}, "required": []}),
                    risk=RiskLevel.ASK,
                )
        stale = existing_plugin_tools - current_plugin_tools
        for s in stale:
            self._tools.pop(s, None)

    def execute(self, name: str, args: dict[str, Any]) -> ToolResult:
        tool = self._tools.get(name)
        if not tool:
            return ToolResult(success=False, error=f"Unknown tool: {name}")

        handler = getattr(self, f"_handle_{name}", None)
        if handler:
            try:
                result = handler(args)
                return result
            except ToolError as e:
                return ToolResult(success=False, error=str(e))
            except Exception as e:
                logger.exception("Tool %s failed", name)
                return ToolResult(success=False, error=f"Unexpected error: {e}")

        if self._plugin_loader:
            for pt in self._plugin_loader.tools:
                if pt["name"] == name:
                    try:
                        plugin_handler = pt.get("handler")
                        if plugin_handler:
                            result = plugin_handler(args)
                            if isinstance(result, ToolResult):
                                return result
                            return ToolResult(success=True, output=str(result), data=result)
                        return ToolResult(success=False, error=f"Plugin tool '{name}' has no handler")
                    except Exception as e:
                        return ToolResult(success=False, error=f"Plugin tool '{name}' failed: {e}")

        return ToolResult(success=False, error=f"Tool '{name}' has no handler")

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
            "download_gguf": ToolDefinition(
                name="download_gguf",
                description="Download a GGUF model from Hugging Face Hub for local inference.",
                parameters={
                    "type": "object",
                    "properties": {
                        "repo_id": {"type": "string", "description": "Hugging Face repo ID (e.g. 'Qwen/Qwen2.5-1.5B-Instruct-GGUF')"},
                        "filename": {"type": "string", "description": "GGUF filename to download (e.g. 'qwen2.5-1.5b-instruct-q4_k_m.gguf')"},
                    },
                    "required": ["repo_id", "filename"],
                },
                risk=RiskLevel.SAFE,
            ),
            "transcribe_audio": ToolDefinition(
                name="transcribe_audio",
                description="Transcribe an audio file (.wav/.mp3/.ogg) to text using Whisper.",
                parameters={
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Path to the audio file"},
                        "model": {"type": "string", "description": "Model size: tiny, base, small, medium, large", "default": "tiny"},
                        "language": {"type": "string", "description": "Language code (auto-detected if empty)", "default": ""},
                    },
                    "required": ["path"],
                },
                risk=RiskLevel.SAFE,
                examples=["transcribe_audio path='audio.wav'", "transcribe_audio path='recording.mp3' model='base' language='pt'"],
            ),
            "read_pdf": ToolDefinition(
                name="read_pdf",
                description="Read text and tables from a PDF file.",
                parameters={"type": "object", "properties": {
                    "path": {"type": "string", "description": "Path to PDF file"},
                    "start_page": {"type": "number", "description": "First page (1-indexed, default: 1)"},
                    "end_page": {"type": "number", "description": "Last page (default: all)"},
                }, "required": ["path"]},
                risk=RiskLevel.SAFE,
                examples=["read_pdf path='report.pdf'", "read_pdf path='book.pdf' start_page=10 end_page=20"],
            ),
            "read_docx": ToolDefinition(
                name="read_docx",
                description="Read text and tables from a Word (.docx) file.",
                parameters={"type": "object", "properties": {
                    "path": {"type": "string", "description": "Path to DOCX file"},
                }, "required": ["path"]},
                risk=RiskLevel.SAFE,
            ),
            "read_xlsx": ToolDefinition(
                name="read_xlsx",
                description="Read data from an Excel (.xlsx) spreadsheet.",
                parameters={"type": "object", "properties": {
                    "path": {"type": "string", "description": "Path to XLSX file"},
                    "sheet": {"type": "string", "description": "Sheet name (default: first sheet)"},
                }, "required": ["path"]},
                risk=RiskLevel.SAFE,
            ),
            "github_list_issues": ToolDefinition(
                name="github_list_issues",
                description="List GitHub issues for the current or specified repository.",
                parameters={"type": "object", "properties": {
                    "repo": {"type": "string", "description": "Repository (owner/repo), defaults to current"},
                    "state": {"type": "string", "description": "open, closed, or all", "default": "open"},
                    "limit": {"type": "number", "description": "Max results", "default": 10},
                }, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "github_create_issue": ToolDefinition(
                name="github_create_issue",
                description="Create a GitHub issue.",
                parameters={"type": "object", "properties": {
                    "title": {"type": "string", "description": "Issue title"},
                    "body": {"type": "string", "description": "Issue body/description"},
                    "repo": {"type": "string", "description": "Repository (owner/repo), defaults to current"},
                    "labels": {"type": "string", "description": "Comma-separated labels"},
                }, "required": ["title"]},
                risk=RiskLevel.SAFE,
            ),
            "github_list_prs": ToolDefinition(
                name="github_list_prs",
                description="List GitHub pull requests.",
                parameters={"type": "object", "properties": {
                    "repo": {"type": "string", "description": "Repository (owner/repo), defaults to current"},
                    "state": {"type": "string", "description": "open, closed, or all", "default": "open"},
                    "limit": {"type": "number", "description": "Max results", "default": 10},
                }, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "github_create_pr": ToolDefinition(
                name="github_create_pr",
                description="Create a GitHub pull request.",
                parameters={"type": "object", "properties": {
                    "title": {"type": "string", "description": "PR title"},
                    "body": {"type": "string", "description": "PR body/description"},
                    "branch": {"type": "string", "description": "Head branch (default: current)"},
                    "base": {"type": "string", "description": "Base branch (default: repo default)"},
                    "repo": {"type": "string", "description": "Repository (owner/repo), defaults to current"},
                }, "required": ["title"]},
                risk=RiskLevel.SAFE,
            ),
            "github_merge_pr": ToolDefinition(
                name="github_merge_pr",
                description="Merge a GitHub pull request.",
                parameters={"type": "object", "properties": {
                    "pr_number": {"type": "number", "description": "PR number to merge"},
                    "repo": {"type": "string", "description": "Repository (owner/repo), defaults to current"},
                    "method": {"type": "string", "description": "Merge method: merge, squash, rebase", "default": "merge"},
                }, "required": ["pr_number"]},
                risk=RiskLevel.SAFE,
            ),
            "extract_text_from_image": ToolDefinition(
                name="extract_text_from_image",
                description="Extract text from an image using OCR (Tesseract). Supports PNG, JPG, TIFF, BMP.",
                parameters={"type": "object", "properties": {
                    "path": {"type": "string", "description": "Path to image file"},
                    "language": {"type": "string", "description": "Tesseract language(s), e.g. 'por+eng'", "default": "por+eng"},
                }, "required": ["path"]},
                risk=RiskLevel.SAFE,
                examples=["extract_text_from_image path='scan.png'", "extract_text_from_image path='doc.jpg' language='eng'"],
            ),
            "list_events": ToolDefinition(
                name="list_events",
                description="List calendar events from CalDAV.",
                parameters={"type": "object", "properties": {
                    "days": {"type": "number", "description": "Number of days to look ahead", "default": 7},
                }, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "create_event": ToolDefinition(
                name="create_event",
                description="Create a new calendar event via CalDAV.",
                parameters={"type": "object", "properties": {
                    "summary": {"type": "string", "description": "Event title"},
                    "start": {"type": "string", "description": "Start datetime (ISO format, e.g. 2025-04-01T10:00:00)"},
                    "end": {"type": "string", "description": "End datetime (ISO format)"},
                    "description": {"type": "string", "description": "Event description"},
                }, "required": ["summary", "start", "end"]},
                risk=RiskLevel.ASK,
            ),
            "update_event": ToolDefinition(
                name="update_event",
                description="Update an existing calendar event.",
                parameters={"type": "object", "properties": {
                    "uid": {"type": "string", "description": "Event UID to update"},
                    "summary": {"type": "string", "description": "New title"},
                    "start": {"type": "string", "description": "New start datetime"},
                    "end": {"type": "string", "description": "New end datetime"},
                }, "required": ["uid"]},
                risk=RiskLevel.ASK,
            ),
            "list_devices": ToolDefinition(
                name="list_devices",
                description="List Home Assistant devices and their states.",
                parameters={"type": "object", "properties": {}, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "control_device": ToolDefinition(
                name="control_device",
                description="Control a Home Assistant device (turn_on, turn_off, toggle, set).",
                parameters={"type": "object", "properties": {
                    "entity_id": {"type": "string", "description": "Entity ID, e.g. light.living_room"},
                    "action": {"type": "string", "description": "Action: turn_on, turn_off, toggle, set"},
                    "value": {"type": "string", "description": "Value for 'set' action (e.g. brightness_pct)"},
                }, "required": ["entity_id", "action"]},
                risk=RiskLevel.ASK,
            ),
            "get_sensor": ToolDefinition(
                name="get_sensor",
                description="Read a Home Assistant sensor value.",
                parameters={"type": "object", "properties": {
                    "entity_id": {"type": "string", "description": "Sensor entity ID, e.g. sensor.temperature"},
                }, "required": ["entity_id"]},
                risk=RiskLevel.SAFE,
            ),
            "synthesize_speech": ToolDefinition(
                name="synthesize_speech",
                description="Converte texto em fala usando Piper TTS. Gera arquivo .wav.",
                parameters={"type": "object", "properties": {
                    "text": {"type": "string", "description": "Texto a ser sintetizado"},
                    "voice": {"type": "string", "description": "Nome da voz (ex: pt_BR-faber-medium)", "default": "pt_BR-faber-medium"},
                    "output": {"type": "string", "description": "Caminho do arquivo .wav de saída", "default": ""},
                }, "required": ["text"]},
                risk=RiskLevel.SAFE,
                examples=["synthesize_speech text='Olá mundo'", "synthesize_speech text='Bom dia' voice='pt_BR-faber-medium'"],
            ),
            "create_docx": ToolDefinition(
                name="create_docx",
                description="Create a formatted Word document (.docx).",
                parameters={"type": "object", "properties": {
                    "path": {"type": "string", "description": "Output file path"},
                    "title": {"type": "string", "description": "Document title"},
                    "sections": {"type": "array", "items": {"type": "object"}, "description": "List of sections, each with heading, content, type"},
                }, "required": ["path", "sections"]},
                risk=RiskLevel.ASK,
            ),
            "create_pdf": ToolDefinition(
                name="create_pdf",
                description="Create a PDF document with formatted text and tables.",
                parameters={"type": "object", "properties": {
                    "path": {"type": "string", "description": "Output file path"},
                    "sections": {"type": "array", "items": {"type": "object"}, "description": "List of content sections"},
                }, "required": ["path", "sections"]},
                risk=RiskLevel.ASK,
            ),
            "create_xlsx": ToolDefinition(
                name="create_xlsx",
                description="Create an Excel spreadsheet with data and formulas.",
                parameters={"type": "object", "properties": {
                    "path": {"type": "string", "description": "Output file path"},
                    "sheets": {"type": "array", "items": {"type": "object"}, "description": "List of sheets with headers, rows, formulas"},
                }, "required": ["path", "sheets"]},
                risk=RiskLevel.ASK,
            ),
            "read_emails": ToolDefinition(
                name="read_emails",
                description="Read emails from IMAP inbox.",
                parameters={"type": "object", "properties": {
                    "folder": {"type": "string", "description": "IMAP folder (INBOX, etc.)", "default": "INBOX"},
                    "limit": {"type": "number", "description": "Max emails to return", "default": 10},
                    "search": {"type": "string", "description": "Optional search term"},
                }, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "send_email": ToolDefinition(
                name="send_email",
                description="Send an email via SMTP.",
                parameters={"type": "object", "properties": {
                    "to": {"type": "string", "description": "Recipient email address"},
                    "subject": {"type": "string", "description": "Email subject"},
                    "body": {"type": "string", "description": "Email body (HTML supported)"},
                    "html": {"type": "boolean", "description": "Send as HTML", "default": True},
                }, "required": ["to", "subject", "body"]},
                risk=RiskLevel.ASK,
            ),
            "reply_email": ToolDefinition(
                name="reply_email",
                description="Reply to an existing email thread.",
                parameters={"type": "object", "properties": {
                    "email_id": {"type": "string", "description": "Email ID to reply to"},
                    "body": {"type": "string", "description": "Reply body content"},
                    "folder": {"type": "string", "description": "Folder containing the email", "default": "INBOX"},
                }, "required": ["email_id", "body"]},
                risk=RiskLevel.ASK,
            ),
            "capture_camera": ToolDefinition(
                name="capture_camera",
                description="Capture a frame from the camera and save to file.",
                parameters={"type": "object", "properties": {
                    "path": {"type": "string", "description": "Output image path (.jpg)"},
                }, "required": ["path"]},
                risk=RiskLevel.SAFE,
            ),
            "analyze_camera": ToolDefinition(
                name="analyze_camera",
                description="Capture a camera frame and return it as base64 for analysis.",
                parameters={"type": "object", "properties": {}, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "query_documents": ToolDefinition(
                name="query_documents",
                description="Search indexed documents using semantic search (RAG). Returns relevant passages with source citations.",
                parameters={"type": "object", "properties": {
                    "query": {"type": "string", "description": "The search query"},
                    "n_results": {"type": "number", "description": "Number of results", "default": 5},
                }, "required": ["query"]},
                examples=["query_documents query='What is the budget for 2025?'", "query_documents query='architecture overview' n_results=3"],
                risk=RiskLevel.SAFE,
            ),
            "index_document": ToolDefinition(
                name="index_document",
                description="Read a document (PDF, DOCX, TXT) and index it for semantic search.",
                parameters={"type": "object", "properties": {
                    "path": {"type": "string", "description": "Path to the document file"},
                }, "required": ["path"]},
                examples=["index_document path='report.pdf'"],
                risk=RiskLevel.SAFE,
            ),
            "rag_list_documents": ToolDefinition(
                name="rag_list_documents",
                description="List all indexed documents and their chunk counts.",
                parameters={"type": "object", "properties": {}, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "remember": ToolDefinition(
                name="remember",
                description="Store an important piece of information in long-term memory. Use when the user explicitly asks you to remember something or shares personal information.",
                parameters={"type": "object", "properties": {
                    "content": {"type": "string", "description": "What to remember"},
                    "importance": {"type": "number", "description": "Importance (1-10)", "default": 5},
                }, "required": ["content"]},
                examples=["remember content='User prefers dark mode'", "remember content='Meeting scheduled for next Friday' importance=8"],
                risk=RiskLevel.SAFE,
            ),
            "recall": ToolDefinition(
                name="recall",
                description="Search long-term memory for information about a topic. Use when the user asks about something you might have learned before.",
                parameters={"type": "object", "properties": {
                    "query": {"type": "string", "description": "What to search for"},
                    "n_results": {"type": "number", "description": "Number of results", "default": 5},
                }, "required": ["query"]},
                examples=["recall query='user preferences'", "recall query='what do I know about John'"],
                risk=RiskLevel.SAFE,
            ),
            "send_whatsapp": ToolDefinition(
                name="send_whatsapp",
                description="Send a WhatsApp message via Web.",
                parameters={"type": "object", "properties": {
                    "to": {"type": "string", "description": "Phone number with country code, e.g. +5511999999999"},
                    "message": {"type": "string", "description": "Message text"},
                }, "required": ["to", "message"]},
                risk=RiskLevel.ASK,
            ),
            "read_whatsapp": ToolDefinition(
                name="read_whatsapp",
                description="Read recent WhatsApp messages (requires whatsapp-web.js setup).",
                parameters={"type": "object", "properties": {
                    "limit": {"type": "number", "description": "Max messages", "default": 10},
                }, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "clone_voice": ToolDefinition(
                name="clone_voice",
                description="Clone a voice from a short audio sample (3-10s WAV/MP3 audio bytes). Returns a speaker_id for later synthesis.",
                parameters={"type": "object", "properties": {
                    "audio_base64": {"type": "string", "description": "Base64-encoded audio sample (3-10 seconds)"},
                    "language": {"type": "string", "description": "Language code (pt, en, es, etc.)", "default": "pt"},
                }, "required": ["audio_base64"]},
                risk=RiskLevel.SAFE,
            ),
            "synthesize_speech_with_voice": ToolDefinition(
                name="synthesize_speech_with_voice",
                description="Synthesize speech using a cloned voice. Use clone_voice first to get a speaker_id.",
                parameters={"type": "object", "properties": {
                    "text": {"type": "string", "description": "Text to synthesize"},
                    "speaker_id": {"type": "string", "description": "Speaker ID from clone_voice"},
                    "language": {"type": "string", "description": "Language code", "default": "pt"},
                }, "required": ["text", "speaker_id"]},
                risk=RiskLevel.SAFE,
                examples=["synthesize_speech_with_voice text='Olá mundo' speaker_id='abc123'"],
            ),
            "list_voices": ToolDefinition(
                name="list_voices",
                description="List all cloned voices available.",
                parameters={"type": "object", "properties": {}, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "generate_music": ToolDefinition(
                name="generate_music",
                description="Generate music from a text description using MusicGen.",
                parameters={"type": "object", "properties": {
                    "description": {"type": "string", "description": "Text description of the music"},
                    "duration": {"type": "number", "description": "Duration in seconds (1-60)", "default": 8},
                    "seed": {"type": "number", "description": "Random seed (0 = random)", "default": 0},
                    "temperature": {"type": "number", "description": "Sampling temperature (0-2)", "default": 1.0},
                }, "required": ["description"]},
                risk=RiskLevel.SAFE,
                examples=["generate_music description='upbeat electronic dance music' duration=15"],
            ),
            "generate_sound_effect": ToolDefinition(
                name="generate_sound_effect",
                description="Generate a sound effect from a text description using AudioGen.",
                parameters={"type": "object", "properties": {
                    "description": {"type": "string", "description": "Text description of the sound effect"},
                    "duration": {"type": "number", "description": "Duration in seconds (1-30)", "default": 5},
                    "seed": {"type": "number", "description": "Random seed (0 = random)", "default": 0},
                }, "required": ["description"]},
                risk=RiskLevel.SAFE,
            ),
            "start_worker": ToolDefinition(
                name="start_worker",
                description="Start a micro-service worker process (isolated subprocess).",
                parameters={"type": "object", "properties": {
                    "name": {"type": "string", "description": "Worker name (e.g., image, audio, video)"},
                    "module_path": {"type": "string", "description": "Python module path (e.g., image_service, audio_gen)"},
                }, "required": ["name", "module_path"]},
                risk=RiskLevel.ASK,
            ),
            "stop_worker": ToolDefinition(
                name="stop_worker",
                description="Stop a running worker process.",
                parameters={"type": "object", "properties": {
                    "name": {"type": "string", "description": "Worker name"},
                }, "required": ["name"]},
                risk=RiskLevel.ASK,
            ),
            "list_workers": ToolDefinition(
                name="list_workers",
                description="List all registered workers and their status.",
                parameters={"type": "object", "properties": {}, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "list_agents": ToolDefinition(
                name="list_agents",
                description="List all background agents and their status.",
                parameters={"type": "object", "properties": {}, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "agent_log": ToolDefinition(
                name="agent_log",
                description="Get recent background agent activity log.",
                parameters={"type": "object", "properties": {"limit": {"type": "number", "description": "Max entries", "default": 20}}, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "list_plugins": ToolDefinition(
                name="list_plugins",
                description="List all loaded plugins from ~/.jarvis/plugins/.",
                parameters={"type": "object", "properties": {}, "required": []},
                risk=RiskLevel.SAFE,
            ),
            "generate_video": ToolDefinition(
                name="generate_video",
                description="Generate a short animated video from a text prompt using AnimateDiff.",
                parameters={"type": "object", "properties": {
                    "prompt": {"type": "string", "description": "Description of the video scene"},
                    "negative_prompt": {"type": "string", "description": "What to avoid", "default": ""},
                    "steps": {"type": "number", "description": "Inference steps", "default": 25},
                    "seed": {"type": "number", "description": "Random seed (0 = random)", "default": 0},
                    "num_frames": {"type": "number", "description": "Number of frames (8-64)", "default": 16},
                    "fps": {"type": "number", "description": "Frames per second", "default": 8},
                    "guidance_scale": {"type": "number", "description": "CFG scale", "default": 7.5},
                }, "required": ["prompt"]},
                risk=RiskLevel.SAFE,
                examples=["generate_video prompt='a cat walking on a beach' num_frames=24"],
            ),
            "edit_image": ToolDefinition(
                name="edit_image",
                description="Edit an image using inpainting. Provide the image and a mask (both base64-encoded), plus a prompt describing the edit.",
                parameters={"type": "object", "properties": {
                    "image_base64": {"type": "string", "description": "Base64-encoded PNG/JPEG image"},
                    "mask_base64": {"type": "string", "description": "Base64-encoded mask (white = edit area, black = keep)"},
                    "prompt": {"type": "string", "description": "Description of what to generate in the masked area"},
                    "negative_prompt": {"type": "string", "description": "What to avoid", "default": ""},
                    "strength": {"type": "number", "description": "How much to transform (0.0-1.0)", "default": 0.8},
                    "steps": {"type": "number", "description": "Inference steps", "default": 30},
                }, "required": ["image_base64", "mask_base64", "prompt"]},
                risk=RiskLevel.SAFE,
            ),
            "generate_image": ToolDefinition(
                name="generate_image",
                description="Generate an image from a text prompt using Stable Diffusion or Flux.",
                parameters={"type": "object", "properties": {
                    "prompt": {"type": "string", "description": "Text description of the image"},
                    "negative_prompt": {"type": "string", "description": "Things to avoid in the image", "default": ""},
                    "steps": {"type": "number", "description": "Inference steps (default: 30)", "default": 30},
                    "seed": {"type": "number", "description": "Random seed (0 = random)", "default": 0},
                    "width": {"type": "number", "description": "Image width (default: 1024)", "default": 1024},
                    "height": {"type": "number", "description": "Image height (default: 1024)", "default": 1024},
                    "guidance_scale": {"type": "number", "description": "CFG scale (default: 7.5)", "default": 7.5},
                    "model": {"type": "string", "description": "Model: sdxl, sd3, flux-schnell, flux-dev", "default": "sdxl"},
                }, "required": ["prompt"]},
                risk=RiskLevel.SAFE,
                examples=["generate_image prompt='a cat wearing a top hat' steps=50"],
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
            resp = requests.post(url, data={"q": query}, timeout=15, verify=True, headers={
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

            resp = requests.get(url, timeout=15, verify=True, headers={
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
            resp = requests.get(url, timeout=120, stream=True, verify=True, headers={
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
            return ToolResult(success=False, error="Installation timed out")
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

    def _handle_download_gguf(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.gguf_manager import GGUFManager
        models_dir = os.path.expanduser("~/.jarvis/models")
        manager = GGUFManager(models_dir)
        if not manager.validate_remote_file(args["repo_id"], args["filename"]):
            return ToolResult(
                success=False,
                error=f"Remote file not found: {args['repo_id']}/{args['filename']}",
            )
        try:
            path = manager.download_model(args["repo_id"], args["filename"])
            return ToolResult(
                success=bool(path),
                output=f"Downloaded {args['filename']} to {path}" if path else "Download failed",
                data={"path": path, "name": args["filename"]},
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Download failed: {e}")

    _whisper_cache: dict[str, Any] = {}

    def _get_whisper_model(self, model_size: str):
        if model_size not in self._whisper_cache:
            import faster_whisper
            self._whisper_cache[model_size] = faster_whisper.WhisperModel(
                model_size, device="cpu", compute_type="int8"
            )
        return self._whisper_cache[model_size]

    def _handle_transcribe_audio(self, args: dict[str, Any]) -> ToolResult:
        path = self._resolve_path(args["path"])
        if not os.path.exists(path):
            return ToolResult(success=False, error=f"File not found: {path}")
        model_size = args.get("model", "tiny")
        language = args.get("language") or None
        try:
            model = self._get_whisper_model(model_size)
            segments, info = model.transcribe(path, language=language)
            text = " ".join(seg.text for seg in segments)
            return ToolResult(
                success=True,
                output=text,
                data={"language": info.language, "duration": info.duration},
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Transcription failed: {e}")

    def _handle_read_pdf(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.document_service import DocumentReader
        path = self._resolve_path(args["path"])
        if not os.path.exists(path):
            return ToolResult(success=False, error=f"File not found: {path}")
        try:
            reader = DocumentReader()
            content = reader.read_pdf(path, args.get("start_page", 1), args.get("end_page", 0))
            output = content.text
            if content.tables:
                output += "\n\n--- Tables ---\n"
                for i, t in enumerate(content.tables):
                    output += f"\nTable {i + 1}:\n"
                    for row in t:
                        output += " | ".join(row) + "\n"
            output += f"\n\nMetadata: {content.metadata}\nPages: {content.pages}\nSize: {content.size_bytes} bytes"
            return ToolResult(success=True, output=output, data={
                "text": content.text, "tables": content.tables,
                "metadata": content.metadata, "pages": content.pages,
            })
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to read PDF: {e}")

    def _handle_read_docx(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.document_service import DocumentReader
        path = self._resolve_path(args["path"])
        if not os.path.exists(path):
            return ToolResult(success=False, error=f"File not found: {path}")
        try:
            reader = DocumentReader()
            content = reader.read_docx(path)
            return ToolResult(success=True, output=content.text, data={
                "tables": content.tables, "metadata": content.metadata,
                "fileType": content.file_type,
            })
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to read DOCX: {e}")

    def _handle_read_xlsx(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.document_service import DocumentReader
        path = self._resolve_path(args["path"])
        if not os.path.exists(path):
            return ToolResult(success=False, error=f"File not found: {path}")
        try:
            reader = DocumentReader()
            content = reader.read_xlsx(path, args.get("sheet", ""))
            return ToolResult(success=True, output=content.text, data={
                "tables": content.tables, "metadata": content.metadata,
                "sheets": content.metadata.get("sheets", []),
            })
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to read XLSX: {e}")

    def _handle_github_list_issues(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.github_service import GitHubService
        try:
            gh = GitHubService()
            result = gh.list_issues(args.get("repo", ""), args.get("state", "open"), args.get("limit", 10))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "GitHub CLI failed"))
            issues = result.get("data", [])
            if isinstance(issues, list):
                lines = [f"#{i['number']} [{i['state']}] {i['title']} — {i.get('url', '')}" for i in issues[:20]]
                return ToolResult(success=True, output="\n".join(lines) if lines else "No issues found.", data=issues)
            return ToolResult(success=True, output=str(issues), data=issues)
        except Exception as e:
            return ToolResult(success=False, error=f"GitHub error: {e}")

    def _handle_github_create_issue(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.github_service import GitHubService
        try:
            gh = GitHubService()
            labels = args.get("labels", "")
            label_list = [l.strip() for l in labels.split(",") if l.strip()] if labels else None
            result = gh.create_issue(args["title"], args.get("body", ""), args.get("repo", ""), label_list)
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Failed to create issue"))
            return ToolResult(success=True, output=f"Issue created: {result.get('data', '')}", data=result.get("data", {}))
        except Exception as e:
            return ToolResult(success=False, error=f"GitHub error: {e}")

    def _handle_github_list_prs(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.github_service import GitHubService
        try:
            gh = GitHubService()
            result = gh.list_prs(args.get("repo", ""), args.get("state", "open"), args.get("limit", 10))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "GitHub CLI failed"))
            prs = result.get("data", [])
            if isinstance(prs, list):
                lines = [f"#{p['number']} [{p['state']}] {p['title']} ({p.get('headRefName', '')} → {p.get('baseRefName', '')})" for p in prs[:20]]
                return ToolResult(success=True, output="\n".join(lines) if lines else "No PRs found.", data=prs)
            return ToolResult(success=True, output=str(prs), data=prs)
        except Exception as e:
            return ToolResult(success=False, error=f"GitHub error: {e}")

    def _handle_github_create_pr(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.github_service import GitHubService
        try:
            gh = GitHubService()
            result = gh.create_pr(args["title"], args.get("body", ""), args.get("branch", ""), args.get("repo", ""), args.get("base", ""))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Failed to create PR"))
            return ToolResult(success=True, output=f"PR created: {result.get('data', '')}", data=result.get("data", {}))
        except Exception as e:
            return ToolResult(success=False, error=f"GitHub error: {e}")

    def _handle_github_merge_pr(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.github_service import GitHubService
        try:
            gh = GitHubService()
            result = gh.merge_pr(args["pr_number"], args.get("repo", ""), args.get("method", "merge"))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Failed to merge PR"))
            return ToolResult(success=True, output=f"PR #{args['pr_number']} merged.", data=result.get("data", {}))
        except Exception as e:
            return ToolResult(success=False, error=f"GitHub error: {e}")

    def _handle_extract_text_from_image(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.ocr_service import OCRService
        path = self._resolve_path(args["path"])
        if not os.path.exists(path):
            return ToolResult(success=False, error=f"File not found: {path}")
        try:
            ocr = OCRService()
            result = ocr.extract_text(path, args.get("language", "por+eng"))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "OCR failed"))
            return ToolResult(
                success=True,
                output=result["text"],
                data={"confidence": result.get("confidence", 0), "language": result.get("language", "")},
            )
        except Exception as e:
            return ToolResult(success=False, error=f"OCR failed: {e}")

    def _handle_list_events(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.calendar_service import CalendarService
        try:
            cal = CalendarService()
            result = cal.list_events(days=args.get("days", 7))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Calendar error"))
            events = result.get("events", [])
            if not events:
                return ToolResult(success=True, output="No events found.")
            lines = [f"- {e['start']}: {e['summary']} ({e['calendar']})" for e in events]
            return ToolResult(success=True, output="\n".join(lines), data=result)
        except Exception as e:
            return ToolResult(success=False, error=f"Calendar error: {e}")

    def _handle_create_event(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.calendar_service import CalendarService
        try:
            cal = CalendarService()
            result = cal.create_event(
                summary=args["summary"], start=args["start"], end=args["end"],
                description=args.get("description", ""),
            )
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Calendar error"))
            return ToolResult(success=True, output=f"Event created: {args['summary']}", data=result)
        except Exception as e:
            return ToolResult(success=False, error=f"Calendar error: {e}")

    def _handle_update_event(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.calendar_service import CalendarService
        try:
            cal = CalendarService()
            result = cal.update_event(
                uid=args["uid"], summary=args.get("summary", ""),
                start=args.get("start", ""), end=args.get("end", ""),
            )
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Calendar error"))
            return ToolResult(success=True, output=f"Event {args['uid']} updated.")
        except Exception as e:
            return ToolResult(success=False, error=f"Calendar error: {e}")

    def _handle_list_devices(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.homeassistant_service import HomeAssistantService
        try:
            ha = HomeAssistantService()
            result = ha.list_devices()
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "HA error"))
            devices = result.get("devices", [])
            if not devices:
                return ToolResult(success=True, output="No devices found.")
            lines = [f"- {d['friendly_name'] or d['entity_id']}: {d['state']}" for d in devices]
            return ToolResult(success=True, output="\n".join(lines), data=result)
        except Exception as e:
            return ToolResult(success=False, error=f"Home Assistant error: {e}")

    def _handle_control_device(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.homeassistant_service import HomeAssistantService
        try:
            ha = HomeAssistantService()
            kwargs = {}
            if args.get("value"):
                kwargs["value"] = args["value"]
            result = ha.control_device(args["entity_id"], args["action"], **kwargs)
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "HA error"))
            return ToolResult(success=True, output=f"{args['action']} {args['entity_id']}")
        except Exception as e:
            return ToolResult(success=False, error=f"Home Assistant error: {e}")

    def _handle_get_sensor(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.homeassistant_service import HomeAssistantService
        try:
            ha = HomeAssistantService()
            result = ha.get_sensor(args["entity_id"])
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "HA error"))
            return ToolResult(
                success=True,
                output=f"{args['entity_id']}: {result['state']}",
                data=result,
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Home Assistant error: {e}")

    def _handle_synthesize_speech(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.audio_tts import synthesize
        text = args["text"]
        voice = args.get("voice", "pt_BR-faber-medium")
        output = args.get("output", "")
        try:
            if output:
                output_path = self._resolve_path(output)
                os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
                synthesize(text, voice, output_path)
                return ToolResult(success=True, output=f"Áudio gerado: {output_path}", data={"path": output_path})
            else:
                audio_bytes = synthesize(text, voice)
                import base64
                b64 = base64.b64encode(audio_bytes).decode()
                return ToolResult(success=True, output="Áudio gerado (base64 inline)", data={"audioBase64": b64, "format": "wav"})
        except Exception as e:
            return ToolResult(success=False, error=f"TTS failed: {e}")

    def _handle_create_docx(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.document_generator import DocumentGenerator
        path = self._resolve_path(args["path"])
        try:
            gen = DocumentGenerator()
            result = gen.create_docx(path, args.get("title", ""), args.get("sections", []))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Failed"))
            return ToolResult(success=True, output=f"DOCX created: {path}", data=result)
        except Exception as e:
            return ToolResult(success=False, error=f"create_docx failed: {e}")

    def _handle_create_pdf(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.document_generator import DocumentGenerator
        path = self._resolve_path(args["path"])
        try:
            gen = DocumentGenerator()
            result = gen.create_pdf(path, args.get("sections", []))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Failed"))
            return ToolResult(success=True, output=f"PDF created: {path}", data=result)
        except Exception as e:
            return ToolResult(success=False, error=f"create_pdf failed: {e}")

    def _handle_create_xlsx(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.document_generator import DocumentGenerator
        path = self._resolve_path(args["path"])
        try:
            gen = DocumentGenerator()
            result = gen.create_xlsx(path, args.get("sheets", []))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Failed"))
            return ToolResult(success=True, output=f"XLSX created: {path}", data=result)
        except Exception as e:
            return ToolResult(success=False, error=f"create_xlsx failed: {e}")

    def _handle_read_emails(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.email_service import EmailService
        try:
            svc = EmailService()
            result = svc.read_emails(args.get("folder", "INBOX"), args.get("limit", 10), args.get("search", ""))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Email error"))
            emails = result.get("emails", [])
            if not emails:
                return ToolResult(success=True, output="No emails found.")
            lines = [f"- [{e['date']}] {e['from']}: {e['subject']}" for e in emails]
            return ToolResult(success=True, output="\n".join(lines), data=result)
        except Exception as e:
            return ToolResult(success=False, error=f"Email error: {e}")

    def _handle_send_email(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.email_service import EmailService
        try:
            svc = EmailService()
            result = svc.send_email(args["to"], args["subject"], args["body"], args.get("html", True))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Email error"))
            return ToolResult(success=True, output=f"Email sent to {args['to']}: {args['subject']}")
        except Exception as e:
            return ToolResult(success=False, error=f"Email error: {e}")

    def _handle_reply_email(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.email_service import EmailService
        try:
            svc = EmailService()
            result = svc.reply_email(args["email_id"], args["body"], args.get("folder", "INBOX"))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Email error"))
            return ToolResult(success=True, output=f"Reply sent to {result.get('to', '')}")
        except Exception as e:
            return ToolResult(success=False, error=f"Email error: {e}")

    def _handle_capture_camera(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.camera_service import CameraService
        path = self._resolve_path(args["path"])
        try:
            cam = CameraService()
            result = cam.capture_and_save(path)
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Camera error"))
            return ToolResult(success=True, output=f"Camera frame saved: {path}", data=result)
        except Exception as e:
            return ToolResult(success=False, error=f"Camera error: {e}")

    def _handle_analyze_camera(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.camera_service import CameraService
        try:
            cam = CameraService()
            result = cam.analyze()
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Camera error"))
            return ToolResult(
                success=True,
                output="Camera frame captured",
                data={"imageBase64": result.get("imageBase64", ""), "format": "jpg"},
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Camera error: {e}")

    def _handle_query_documents(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.rag_service import RAGService
        try:
            rag = RAGService()
            result = rag.query_with_context(args["query"], args.get("n_results", 5))
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "RAG error"))
            return ToolResult(
                success=True,
                output=result["context"],
                data={"query": args["query"], "chunks": result["chunks"]},
            )
        except Exception as e:
            return ToolResult(success=False, error=f"RAG error: {e}")

    def _handle_index_document(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.rag_service import RAGService
        try:
            path = self._resolve_path(args["path"])
            rag = RAGService()
            result = rag.index_document(path)
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Index error"))
            return ToolResult(
                success=True,
                output=f"Document indexed: {result['chunks']} chunks from {result['file']}",
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Index error: {e}")

    def _handle_rag_list_documents(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.rag_service import RAGService
        try:
            rag = RAGService()
            docs = rag.list_indexed_documents()
            if not docs:
                return ToolResult(success=True, output="No documents indexed yet.")
            lines = [f"- {d['file']} ({d['chunks']} chunks)" for d in docs]
            return ToolResult(success=True, output="Indexed documents:\n" + "\n".join(lines))
        except Exception as e:
            return ToolResult(success=False, error=f"RAG error: {e}")

    def _handle_remember(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.memory_service import MemoryService
        try:
            ms = MemoryService()
            importance = args.get("importance", 5) / 10.0
            result = ms.remember(args["content"], importance)
            return ToolResult(
                success=True,
                output=f"Memorized: {result['entities']} entities extracted.",
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Memory error: {e}")

    def _handle_recall(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.memory_service import MemoryService
        try:
            ms = MemoryService()
            results = ms.recall(args["query"], args.get("n_results", 5))
            if not results:
                return ToolResult(success=True, output="Nothing found in memory.")
            lines = []
            for r in results:
                score = r.get("score", "?")
                source = r.get("source", "?")
                content = r["content"][:300]
                lines.append(f"[{source}] (score: {score})\n{content}")
            return ToolResult(
                success=True,
                output="Memory results:\n\n" + "\n\n---\n\n".join(lines),
                data={"results": results},
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Memory error: {e}")

    def _handle_generate_image(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.image_service import ImageGenerator
        prompt = args["prompt"]
        negative_prompt = args.get("negative_prompt", "")
        steps = int(args.get("steps", 30))
        seed = int(args.get("seed", 0))
        width = int(args.get("width", 1024))
        height = int(args.get("height", 1024))
        guidance_scale = float(args.get("guidance_scale", 7.5))
        model_key = args.get("model", "sdxl")
        try:
            model_id = ImageGenerator.resolve_model_id(model_key)
            gen = ImageGenerator(model_id)
            output_dir = os.path.join(self._workspace_root or ".", "images") if self._workspace_root else "images"
            result = gen.generate(
                prompt=prompt,
                negative_prompt=negative_prompt,
                steps=steps,
                seed=seed,
                width=width,
                height=height,
                guidance_scale=guidance_scale,
                output_dir=output_dir,
            )
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Generation failed"))
            return ToolResult(
                success=True,
                output=f"Image generated ({result['width']}x{result['height']}, seed={result['seed']}, model={model_key})",
                data={
                    "base64": result["base64"],
                    "path": result["path"],
                    "format": result["format"],
                    "width": result["width"],
                    "height": result["height"],
                    "seed": result["seed"],
                    "model": model_key,
                },
            )
        except ImportError as e:
            return ToolResult(success=False, error=f"Missing dependencies: {e}. Install with: pip install jarvis-backend[image]")
        except Exception as e:
            logger.exception("generate_image failed")
            return ToolResult(success=False, error=f"Image generation failed: {e}")

    def _handle_clone_voice(self, args: dict[str, Any]) -> ToolResult:
        import base64

        from jarvis.voice_clone import VoiceCloneService
        audio_base64 = args["audio_base64"]
        language = args.get("language", "pt")
        try:
            audio_bytes = base64.b64decode(audio_base64)
            vc = VoiceCloneService()
            result = vc.clone_voice(audio_bytes, language)
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Clone failed"))
            return ToolResult(
                success=True,
                output=f"Voice cloned! Speaker ID: {result['speaker_id']}",
                data=result,
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Voice clone failed: {e}")

    def _handle_synthesize_speech_with_voice(self, args: dict[str, Any]) -> ToolResult:
        import base64

        from jarvis.voice_clone import VoiceCloneService
        text = args["text"]
        speaker_id = args["speaker_id"]
        language = args.get("language", "pt")
        try:
            vc = VoiceCloneService()
            audio_bytes = vc.synthesize(text, speaker_id, language)
            b64 = base64.b64encode(audio_bytes).decode()
            return ToolResult(
                success=True,
                output=f"Speech synthesized with voice {speaker_id}",
                data={"audioBase64": b64, "format": "wav"},
            )
        except FileNotFoundError as e:
            return ToolResult(success=False, error=str(e))
        except ImportError as e:
            return ToolResult(success=False, error=f"Missing TTS dependency: {e}. Install with: pip install TTS")
        except Exception as e:
            return ToolResult(success=False, error=f"Synthesis failed: {e}")

    def _handle_list_voices(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.voice_clone import VoiceCloneService
        try:
            vc = VoiceCloneService()
            voices = vc.list_voices()
            if not voices:
                return ToolResult(success=True, output="No cloned voices found.")
            lines = [f"- {v['speaker_id']} ({v['language']})" for v in voices]
            return ToolResult(success=True, output="Cloned voices:\n" + "\n".join(lines), data={"voices": voices})
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to list voices: {e}")

    def _handle_generate_music(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.audio_gen import AudioGenService
        desc = args["description"]
        duration = args.get("duration", 8)
        seed = args.get("seed", 0)
        temperature = args.get("temperature", 1.0)
        try:
            svc = AudioGenService()
            result = svc.generate_music(desc, duration=duration, seed=seed, temperature=temperature)
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Generation failed"))
            return ToolResult(
                success=True,
                output=f"Music generated ({duration}s, seed={seed})",
                data=result,
            )
        except ImportError as e:
            return ToolResult(success=False, error=f"Missing dependencies: {e}. Install with: pip install transformers torch")
        except Exception as e:
            return ToolResult(success=False, error=f"Music generation failed: {e}")

    def _handle_generate_sound_effect(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.audio_gen import AudioGenService
        desc = args["description"]
        duration = args.get("duration", 5)
        seed = args.get("seed", 0)
        try:
            svc = AudioGenService()
            result = svc.generate_sound_effect(desc, duration=duration, seed=seed)
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Generation failed"))
            return ToolResult(
                success=True,
                output=f"Sound effect generated ({duration}s, seed={seed})",
                data=result,
            )
        except ImportError as e:
            return ToolResult(success=False, error=f"Missing dependencies: {e}. Install with: pip install transformers torch")
        except Exception as e:
            return ToolResult(success=False, error=f"Sound effect generation failed: {e}")

    def _handle_edit_image(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.image_service import ImageGenerator
        image_base64 = args["image_base64"]
        mask_base64 = args["mask_base64"]
        prompt = args["prompt"]
        negative_prompt = args.get("negative_prompt", "")
        strength = args.get("strength", 0.8)
        steps = args.get("steps", 30)
        try:
            gen = ImageGenerator()
            result = gen.edit_image(
                image_base64=image_base64,
                mask_base64=mask_base64,
                prompt=prompt,
                negative_prompt=negative_prompt,
                strength=strength,
                steps=steps,
            )
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Edit failed"))
            return ToolResult(
                success=True,
                output=f"Image edited (strength={strength}, steps={steps})",
                data=result,
            )
        except ImportError as e:
            return ToolResult(success=False, error=f"Missing dependencies: {e}. Install with: pip install jarvis-backend[image]")
        except Exception as e:
            return ToolResult(success=False, error=f"Image editing failed: {e}")

    def _handle_generate_video(self, args: dict[str, Any]) -> ToolResult:
        from jarvis.video_service import VideoGenerator
        prompt = args["prompt"]
        negative_prompt = args.get("negative_prompt", "")
        steps = args.get("steps", 25)
        seed = args.get("seed", 0)
        num_frames = args.get("num_frames", 16)
        fps = args.get("fps", 8)
        guidance_scale = args.get("guidance_scale", 7.5)
        try:
            gen = VideoGenerator()
            result = gen.generate_video(
                prompt=prompt,
                negative_prompt=negative_prompt,
                steps=steps,
                seed=seed,
                num_frames=num_frames,
                fps=fps,
                guidance_scale=guidance_scale,
            )
            if not result["success"]:
                return ToolResult(success=False, error=result.get("error", "Generation failed"))
            return ToolResult(
                success=True,
                output=f"Video generated ({num_frames} frames @ {fps}fps = {result['duration']:.1f}s)",
                data=result,
            )
        except ImportError as e:
            return ToolResult(success=False, error=f"Missing dependencies: {e}. Install with: pip install jarvis-backend[image]")
        except Exception as e:
            return ToolResult(success=False, error=f"Video generation failed: {e}")

    def _handle_list_plugins(self, args: dict[str, Any]) -> ToolResult:
        if not self._plugin_loader:
            return ToolResult(success=False, error="Plugin system not available")
        try:
            self._plugin_loader.check_hot_reload()
            self._sync_plugin_tools()
            plugins = self._plugin_loader.list_plugins()
            if not plugins:
                return ToolResult(success=True, output="No plugins loaded. Add .py files to ~/.jarvis/plugins/")
            lines = [f"- {p['name']} v{p['version']} ({p['tools']} tools)" for p in plugins]
            return ToolResult(success=True, output="Loaded plugins:\n" + "\n".join(lines), data={"plugins": plugins})
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to list plugins: {e}")

    def _init_worker_manager(self) -> Any:
        from jarvis.microservices import WorkerManager
        wm = WorkerManager()
        return wm

    def _handle_start_worker(self, args: dict[str, Any]) -> ToolResult:
        name = args["name"]
        module_path = args["module_path"]
        try:
            if not hasattr(self, "_worker_manager") or self._worker_manager is None:
                self._worker_manager = self._init_worker_manager()
            self._worker_manager.register(name, module_path)
            ok = self._worker_manager.start(name)
            if ok:
                w = self._worker_manager._workers[name]
                return ToolResult(success=True, output=f"Worker '{name}' started on port {w.port} (pid={w.info.pid})")
            return ToolResult(success=False, error=f"Worker '{name}' failed to start")
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to start worker: {e}")

    def _handle_stop_worker(self, args: dict[str, Any]) -> ToolResult:
        name = args["name"]
        try:
            if not hasattr(self, "_worker_manager") or self._worker_manager is None:
                return ToolResult(success=False, error="No worker manager initialized")
            self._worker_manager.stop(name)
            return ToolResult(success=True, output=f"Worker '{name}' stopped")
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to stop worker: {e}")

    def _handle_list_workers(self, args: dict[str, Any]) -> ToolResult:
        try:
            if not hasattr(self, "_worker_manager") or self._worker_manager is None:
                return ToolResult(success=True, output="No workers registered")
            workers = self._worker_manager.list_workers()
            if not workers:
                return ToolResult(success=True, output="No workers registered")
            lines = [f"- {w['name']}: {w['status']} (port={w['port']}, pid={w['pid']})" for w in workers]
            return ToolResult(success=True, output="Workers:\n" + "\n".join(lines), data={"workers": workers})
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to list workers: {e}")

    def _get_background_agents(self) -> Any:
        if not hasattr(self, "_bg_agents") or self._bg_agents is None:
            from jarvis.background_agents import BackgroundAgentManager
            self._bg_agents = BackgroundAgentManager(workspace_root=self._workspace_root or "")
            self._bg_agents.start()
        return self._bg_agents

    def _handle_list_agents(self, args: dict[str, Any]) -> ToolResult:
        try:
            mgr = self._get_background_agents()
            agents = mgr.list_agents()
            lines = []
            for a in agents:
                lines.append(f"- {a['name']} ({a['type']})")
                if a.get("tasks"):
                    for t in a["tasks"]:
                        lines.append(f"  - {t['name']}: every {t['interval_seconds']}s {'enabled' if t['enabled'] else 'disabled'}")
            return ToolResult(success=True, output="Background agents:\n" + "\n".join(lines), data={"agents": agents})
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to list agents: {e}")

    def _handle_agent_log(self, args: dict[str, Any]) -> ToolResult:
        try:
            mgr = self._get_background_agents()
            limit = args.get("limit", 20)
            log = mgr.get_log(limit=limit)
            if not log:
                return ToolResult(success=True, output="No agent activity yet.")
            lines = [f"[{e['timestamp']}] {e['agent']}: {e['message']}" for e in log]
            return ToolResult(success=True, output="Agent log:\n" + "\n".join(lines), data={"log": log})
        except Exception as e:
            return ToolResult(success=False, error=f"Failed to get agent log: {e}")
