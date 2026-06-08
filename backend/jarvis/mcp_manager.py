"""MCP (Model Context Protocol) Server Manager — client for external MCP tools/servers."""

import json
import logging
import subprocess
from dataclasses import dataclass, field
from typing import Any

import httpx

from jarvis.database import Database

logger = logging.getLogger(__name__)


@dataclass
class MCPServerConfig:
    id: str = ""
    name: str = ""
    transport: str = "stdio"
    command: str = ""
    url: str = ""
    args: str = "[]"
    env: str = "{}"
    enabled: bool = True


@dataclass
class MCPTool:
    name: str = ""
    description: str = ""
    parameters: dict = field(default_factory=dict)
    server_id: str = ""


@dataclass
class MCPCallResult:
    success: bool = False
    content: Any = None
    error: str = ""


class MCPServerProcess:
    def __init__(self, config: MCPServerConfig):
        self._config = config
        self._process: subprocess.Popen | None = None
        self._http_client: httpx.Client | None = None

    def start(self) -> bool:
        if self._config.transport == "stdio":
            env = {}
            if self._config.env:
                try:
                    env = json.loads(self._config.env)
                except json.JSONDecodeError:
                    pass
            full_env = {**dict(env), **{"PATH": __import__("os").environ.get("PATH", "")}}
            args = json.loads(self._config.args) if self._config.args else []
            try:
                self._process = subprocess.Popen(
                    [self._config.command, *args],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=full_env,
                    text=True,
                )
                return True
            except FileNotFoundError as e:
                logger.warning("MCP server %s not found: %s", self._config.name, e)
                return False
        elif self._config.transport in ("sse", "websocket"):
            self._http_client = httpx.Client(timeout=30.0)
            return True
        return False

    def list_tools(self) -> list[MCPTool]:
        return []

    def call_tool(self, tool_name: str, arguments: dict) -> MCPCallResult:
        return MCPCallResult(success=False, error="MCP not yet implemented for this transport")

    def stop(self):
        if self._process:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._process.kill()
            self._process = None
        if self._http_client:
            self._http_client.close()
            self._http_client = None


class MCPManager:
    def __init__(self, db: Database):
        self._db = db
        self._servers: dict[str, MCPServerConfig] = {}
        self._processes: dict[str, MCPServerProcess] = {}
        self._load_servers()

    def _load_servers(self):
        rows = self._db.fetchall("SELECT * FROM mcp_servers")
        for row in rows:
            cfg = MCPServerConfig(
                id=row["id"],
                name=row["name"],
                transport=row["transport"],
                command=row["command"],
                url=row["url"],
                args=row["args"],
                env=row["env"],
                enabled=bool(row["enabled"]),
            )
            self._servers[row["id"]] = cfg

    def list_servers(self) -> list[dict]:
        return [
            {
                "id": sid,
                "name": s.name,
                "transport": s.transport,
                "command": s.command,
                "url": s.url,
                "enabled": s.enabled,
                "running": sid in self._processes,
            }
            for sid, s in self._servers.items()
        ]

    def get_server(self, id: str) -> dict | None:
        s = self._servers.get(id)
        if not s:
            return None
        return {
            "id": s.id,
            "name": s.name,
            "transport": s.transport,
            "command": s.command,
            "url": s.url,
            "args": json.loads(s.args) if s.args else [],
            "env": json.loads(s.env) if s.env else {},
            "enabled": s.enabled,
            "running": id in self._processes,
        }

    def create_server(self, data: dict) -> dict:
        import uuid
        sid = uuid.uuid4().hex
        self._db.execute(
            """INSERT INTO mcp_servers (id, name, transport, command, url, args, env, enabled)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                sid,
                data.get("name", ""),
                data.get("transport", "stdio"),
                data.get("command", ""),
                data.get("url", ""),
                json.dumps(data.get("args", [])),
                json.dumps(data.get("env", {})),
                1 if data.get("enabled", True) else 0,
            ),
        )
        self._servers[sid] = MCPServerConfig(
            id=sid,
            name=data.get("name", ""),
            transport=data.get("transport", "stdio"),
            command=data.get("command", ""),
            url=data.get("url", ""),
            args=json.dumps(data.get("args", [])),
            env=json.dumps(data.get("env", {})),
            enabled=data.get("enabled", True),
        )
        return self.get_server(sid) or {}

    def update_server(self, id: str, data: dict) -> dict:
        existing = self._servers.get(id)
        if not existing:
            return {}
        self._db.execute(
            """UPDATE mcp_servers SET name=?, transport=?, command=?, url=?, args=?, env=?, enabled=?
               WHERE id=?""",
            (
                data.get("name", existing.name),
                data.get("transport", existing.transport),
                data.get("command", existing.command),
                data.get("url", existing.url),
                json.dumps(data.get("args", json.loads(existing.args))),
                json.dumps(data.get("env", json.loads(existing.env))),
                1 if data.get("enabled", existing.enabled) else 0,
                id,
            ),
        )
        self._processes.pop(id, None)
        self._load_servers()
        return self.get_server(id) or {}

    def delete_server(self, id: str) -> bool:
        self.stop_server(id)
        self._db.execute("DELETE FROM mcp_servers WHERE id = ?", (id,))
        self._servers.pop(id, None)
        return True

    def start_server(self, id: str) -> bool:
        s = self._servers.get(id)
        if not s or not s.enabled:
            return False
        if id in self._processes:
            return True
        proc = MCPServerProcess(s)
        if proc.start():
            self._processes[id] = proc
            return True
        return False

    def stop_server(self, id: str) -> bool:
        proc = self._processes.pop(id, None)
        if proc:
            proc.stop()
            return True
        return False

    def list_tools(self) -> list[dict]:
        tools = []
        for sid, proc in self._processes.items():
            cfg = self._servers.get(sid)
            for tool in proc.list_tools():
                tools.append({
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.parameters,
                    "serverId": sid,
                    "serverName": cfg.name if cfg else "",
                })
        return tools

    def call_tool(self, server_id: str, tool_name: str, arguments: dict) -> dict:
        proc = self._processes.get(server_id)
        if not proc:
            return {"success": False, "error": "Server not running"}
        result = proc.call_tool(tool_name, arguments)
        return {"success": result.success, "content": result.content, "error": result.error}
