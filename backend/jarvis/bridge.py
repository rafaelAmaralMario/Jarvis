"""Bridge layer: exposes all backend methods as window.jarvis.* to the React frontend."""

import json
import logging
import os
import subprocess
import sys
from dataclasses import asdict, is_dataclass
from typing import Any

from jarvis.agents_manager import AgentsManager, CreateAgentDTO
from jarvis.database import Database
from jarvis.editor_manager import EditorManager
from jarvis.git_manager import GitManager
from jarvis.graph_builder import GraphBuilder
from jarvis.knowledge_manager import CreateNoteDTO, KnowledgeManager
from jarvis.llm_gateway import LLMGateway, LLMRequest, LLMMessage
from jarvis.mcp_manager import MCPManager
from jarvis.models_manager import ModelMetadata, ModelSpecialty, ModelsManager
from jarvis.module_loader import ModuleLoader
from jarvis.network_manager import NetworkManager
from jarvis.ollama_client import OllamaClient
from jarvis.orchestration_manager import OrchestrationConfig, OrchestrationManager
from jarvis.security_manager import SecurityManager
from jarvis.terminal_manager import TerminalManager
from jarvis.workflow_engine import WorkflowEngine
from jarvis.workspace_manager import WorkspaceManager

logger = logging.getLogger(__name__)


def _serialize(obj: Any) -> Any:
    if obj is None:
        return None
    if is_dataclass(obj):
        return {k: _serialize(v) for k, v in asdict(obj).items()}
    if isinstance(obj, list):
        return [_serialize(item) for item in obj]
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, Enum):
        return obj.value
    return obj


from enum import Enum


class JARVISBridge:
    """Exposed as `window.pywebview.api` (aliased to `window.jarvis` via inject script).

    Each method corresponds to a handler registered in the original C++ WebChannel bridge.
    """

    def __init__(
        self,
        db: Database | None = None,
        ollama: OllamaClient | None = None,
        workspace: WorkspaceManager | None = None,
        git: GitManager | None = None,
        editor: EditorManager | None = None,
        terminal: TerminalManager | None = None,
        network: NetworkManager | None = None,
        module_loader: ModuleLoader | None = None,
        models: ModelsManager | None = None,
        agents: AgentsManager | None = None,
        orchestration: OrchestrationManager | None = None,
        knowledge: KnowledgeManager | None = None,
        graph: GraphBuilder | None = None,
        llm_gateway: LLMGateway | None = None,
        mcp: MCPManager | None = None,
        workflows: WorkflowEngine | None = None,
        security: SecurityManager | None = None,
    ):
        self._workspace = workspace
        self._git = git
        self._editor = editor
        self._terminal = terminal
        self._network = network
        self._module_loader = module_loader
        self._models = models
        self._agents = agents
        self._orchestration = orchestration
        self._knowledge = knowledge
        self._graph = graph
        self._llm = llm_gateway
        self._mcp = mcp
        self._workflows = workflows
        self._security = security

    # ========================================================================
    # Module handlers
    # ========================================================================
    def getModules(self) -> list:
        if not self._module_loader:
            return []
        try:
            modules = self._module_loader.list_loaded()
            return _serialize(modules)
        except Exception as e:
            logger.warning("getModules failed: %s", e)
            return []

    def getModule(self, id: str):
        if not self._module_loader:
            return None
        try:
            mod = self._module_loader.get_module(id)
            return _serialize(mod)
        except Exception as e:
            logger.warning("getModule(%s) failed: %s", id, e)
            return None

    # ========================================================================
    # File handlers (legacy, overwritten by Workspace)
    # ========================================================================
    def readFile(self, path: str) -> str:
        if not self._workspace:
            return ""
        try:
            return self._workspace.read_file(path)
        except Exception as e:
            logger.warning("readFile(%s) failed: %s", path, e)
            return ""

    def writeFile(self, path: str, content: str) -> bool:
        if not self._workspace:
            return False
        try:
            return self._workspace.write_file(path, content)
        except Exception as e:
            logger.warning("writeFile(%s) failed: %s", path, e)
            return False

    def listDirectory(self) -> list:
        if not self._workspace:
            return []
        try:
            return _serialize(self._workspace.list_files(""))
        except Exception as e:
            logger.warning("listDirectory failed: %s", e)
            return []

    # ========================================================================
    # Model handlers
    # ========================================================================
    def listModels(self) -> list:
        if not self._models:
            return []
        try:
            return _serialize(self._models.list_models())
        except Exception as e:
            logger.warning("listModels failed: %s", e)
            return []

    def getModel(self, name: str):
        if not self._models:
            return None
        try:
            return _serialize(self._models.get_model(name))
        except Exception as e:
            logger.warning("getModel(%s) failed: %s", name, e)
            return None

    def pullModel(self, name: str) -> bool:
        if not self._models:
            return False
        try:
            return self._models.pull_model(name)
        except Exception as e:
            logger.warning("pullModel(%s) failed: %s", name, e)
            return False

    def deleteModel(self, name: str) -> bool:
        if not self._models:
            return False
        try:
            return self._models.delete_model(name)
        except Exception as e:
            logger.warning("deleteModel(%s) failed: %s", name, e)
            return False

    def startModel(self, name: str) -> bool:
        if not self._models:
            return False
        try:
            return self._models.start_model(name)
        except Exception as e:
            logger.warning("startModel(%s) failed: %s", name, e)
            return False

    def stopModel(self, name: str) -> bool:
        if not self._models:
            return False
        try:
            return self._models.stop_model(name)
        except Exception as e:
            logger.warning("stopModel(%s) failed: %s", name, e)
            return False

    def updateModelMetadata(self, name: str, metadata: dict) -> bool:
        if not self._models:
            return False
        try:
            meta = ModelMetadata(
                specialty=ModelSpecialty(metadata.get("specialty", "general")),
                notes=metadata.get("notes", ""),
                color=metadata.get("color", "#8b949e"),
                icon=metadata.get("icon", "🤖"),
            )
            return self._models.update_model_metadata(name, meta)
        except Exception as e:
            logger.warning("updateModelMetadata(%s) failed: %s", name, e)
            return False

    def getModelBySpecialty(self, specialty: str):
        if not self._models:
            return None
        try:
            spec = ModelSpecialty(specialty)
            return _serialize(self._models.get_model_by_specialty(spec))
        except Exception as e:
            logger.warning("getModelBySpecialty(%s) failed: %s", specialty, e)
            return None

    # ========================================================================
    # Agent handlers
    # ========================================================================
    def listAgents(self) -> list:
        if not self._agents:
            return []
        try:
            return _serialize(self._agents.list_agents())
        except Exception as e:
            logger.warning("listAgents failed: %s", e)
            return []

    def getAgent(self, id: str):
        if not self._agents:
            return None
        try:
            return _serialize(self._agents.get_agent(id))
        except Exception as e:
            logger.warning("getAgent(%s) failed: %s", id, e)
            return None

    def createAgent(self, data: dict) -> dict:
        if not self._agents:
            return {}
        try:
            dto = CreateAgentDTO(
                name=data.get("name", ""),
                description=data.get("description", ""),
                model=data.get("model", ""),
                system_prompt=data.get("systemPrompt", data.get("system_prompt", "")),
                temperature=data.get("temperature", 0.7),
                max_tokens=data.get("maxTokens", data.get("max_tokens", 2048)),
                specialty=data.get("specialty", "general"),
                tools=data.get("tools", []),
                can_orchestrate=data.get("canOrchestrate", data.get("can_orchestrate", True)),
                priority=data.get("priority", 5),
            )
            agent = self._agents.create_agent(dto)
            return _serialize(agent)
        except Exception as e:
            logger.warning("createAgent failed: %s", e)
            return {}

    def updateAgent(self, id: str, data: dict) -> dict:
        if not self._agents:
            return {}
        try:
            dto = CreateAgentDTO(
                name=data.get("name", ""),
                description=data.get("description", ""),
                model=data.get("model", ""),
                system_prompt=data.get("systemPrompt", data.get("system_prompt", "")),
                temperature=data.get("temperature", 0.7),
                max_tokens=data.get("maxTokens", data.get("max_tokens", 2048)),
                specialty=data.get("specialty", "general"),
                tools=data.get("tools", []),
                can_orchestrate=data.get("canOrchestrate", data.get("can_orchestrate", True)),
                priority=data.get("priority", 5),
            )
            agent = self._agents.update_agent(id, dto)
            return _serialize(agent)
        except Exception as e:
            logger.warning("updateAgent(%s) failed: %s", id, e)
            return {}

    def deleteAgent(self, id: str) -> bool:
        if not self._agents:
            return False
        try:
            return self._agents.delete_agent(id)
        except Exception as e:
            logger.warning("deleteAgent(%s) failed: %s", id, e)
            return False

    def setDefaultAgent(self, id: str) -> bool:
        if not self._agents:
            return False
        try:
            return self._agents.set_default_agent(id)
        except Exception as e:
            logger.warning("setDefaultAgent(%s) failed: %s", id, e)
            return False

    def getDefaultAgent(self):
        if not self._agents:
            return None
        try:
            return _serialize(self._agents.get_default_agent())
        except Exception as e:
            logger.warning("getDefaultAgent failed: %s", e)
            return None

    def getOrchestrationPool(self) -> list:
        if not self._agents:
            return []
        try:
            return _serialize(self._agents.get_orchestration_pool())
        except Exception as e:
            logger.warning("getOrchestrationPool failed: %s", e)
            return []

    # ========================================================================
    # Orchestration handlers
    # ========================================================================
    def getOrchestrationConfig(self) -> dict:
        if not self._orchestration:
            return {}
        try:
            return _serialize(self._orchestration.get_config())
        except Exception as e:
            logger.warning("getOrchestrationConfig failed: %s", e)
            return {}

    def updateOrchestrationConfig(self, config: dict) -> bool:
        if not self._orchestration:
            return False
        try:
            cfg = OrchestrationConfig(
                enabled=config.get("enabled", True),
                orchestrator_model=config.get("orchestratorModel", config.get("orchestrator_model", "")),
                critic_enabled=config.get("criticEnabled", config.get("critic_enabled", True)),
                critic_temperature=config.get("criticTemperature", config.get("critic_temperature", 0.1)),
                max_agents_per_query=config.get("maxAgentsPerQuery", config.get("max_agents_per_query", 3)),
                show_trace=config.get("showTrace", config.get("show_trace", True)),
            )
            return self._orchestration.update_config(cfg)
        except Exception as e:
            logger.warning("updateOrchestrationConfig failed: %s", e)
            return False

    def sendMessage(self, query: str) -> str:
        if not self._orchestration:
            return ""
        try:
            return self._orchestration.execute_query(query)
        except Exception as e:
            logger.warning("sendMessage failed: %s", e)
            return ""

    def executeOrchestratedQuery(self, query: str) -> str:
        if not self._orchestration:
            return ""
        try:
            return self._orchestration.execute_query(query)
        except Exception as e:
            logger.warning("executeOrchestratedQuery failed: %s", e)
            return ""

    def getAgentTrace(self, queryId: str):
        if not self._orchestration:
            return None
        try:
            return _serialize(self._orchestration.get_trace(queryId))
        except Exception as e:
            logger.warning("getAgentTrace(%s) failed: %s", queryId, e)
            return None

    # ========================================================================
    # Workspace handlers
    # ========================================================================
    def openWorkspace(self, path: str) -> bool:
        if not self._workspace:
            return False
        try:
            return self._workspace.open_workspace(path)
        except Exception as e:
            logger.warning("openWorkspace(%s) failed: %s", path, e)
            return False

    def addRoot(self, path: str) -> bool:
        if not self._workspace:
            return False
        try:
            return self._workspace.add_root(path)
        except Exception as e:
            logger.warning("addRoot(%s) failed: %s", path, e)
            return False

    def removeRoot(self, path: str) -> bool:
        if not self._workspace:
            return False
        try:
            return self._workspace.remove_root(path)
        except Exception as e:
            logger.warning("removeRoot(%s) failed: %s", path, e)
            return False

    def getRoots(self) -> list:
        if not self._workspace:
            return []
        try:
            return self._workspace.get_roots()
        except Exception as e:
            logger.warning("getRoots failed: %s", e)
            return []

    def listFiles(self, path: str = "") -> list:
        if not self._workspace:
            return []
        try:
            return _serialize(self._workspace.list_files(path))
        except Exception as e:
            logger.warning("listFiles(%s) failed: %s", path, e)
            return []

    def createFile(self, name: str, parentDir: str) -> bool:
        if not self._workspace:
            return False
        try:
            return self._workspace.create_file(name, parentDir)
        except Exception as e:
            logger.warning("createFile(%s, %s) failed: %s", name, parentDir, e)
            return False

    def createFileWithPath(self, fullPath: str) -> bool:
        if not self._workspace:
            return False
        try:
            return self._workspace.create_file_with_path(fullPath)
        except Exception as e:
            logger.warning("createFileWithPath(%s) failed: %s", fullPath, e)
            return False

    def createDirectory(self, name: str, parentDir: str) -> bool:
        if not self._workspace:
            return False
        try:
            return self._workspace.create_directory(name, parentDir)
        except Exception as e:
            logger.warning("createDirectory(%s, %s) failed: %s", name, parentDir, e)
            return False

    def deletePath(self, path: str) -> bool:
        if not self._workspace:
            return False
        try:
            return self._workspace.delete_path(path)
        except Exception as e:
            logger.warning("deletePath(%s) failed: %s", path, e)
            return False

    def renamePath(self, oldPath: str, newPath: str) -> bool:
        if not self._workspace:
            return False
        try:
            return self._workspace.rename_path(oldPath, os.path.basename(newPath))
        except Exception as e:
            logger.warning("renamePath(%s, %s) failed: %s", oldPath, newPath, e)
            return False

    def movePath(self, src: str, dest: str) -> bool:
        if not self._workspace:
            return False
        try:
            return self._workspace.move_path(src, dest)
        except Exception as e:
            logger.warning("movePath(%s, %s) failed: %s", src, dest, e)
            return False

    def getRecentFiles(self, limit: int = 10) -> list:
        if not self._workspace:
            return []
        try:
            return _serialize(self._workspace.get_recent_files(limit))
        except Exception as e:
            logger.warning("getRecentFiles failed: %s", e)
            return []

    def getProjectInfo(self, path: str):
        if not self._workspace:
            return None
        try:
            return _serialize(self._workspace.get_project_info(path))
        except Exception as e:
            logger.warning("getProjectInfo(%s) failed: %s", path, e)
            return None

    def cancelGeneration(self) -> bool:
        return True

    # ========================================================================
    # Knowledge handlers
    # ========================================================================
    def createNote(self, data: dict) -> dict:
        if not self._knowledge:
            return {}
        try:
            metadata = data.get("metadata", "{}")
            if isinstance(metadata, dict):
                metadata = json.dumps(metadata)
            dto = CreateNoteDTO(
                title=data.get("title", ""),
                content=data.get("content", ""),
                folder=data.get("folder", "/"),
                tags=data.get("tags", []),
                metadata=metadata,
            )
            note = self._knowledge.create_note(dto)
            return _serialize(note)
        except Exception as e:
            logger.warning("createNote failed: %s", e)
            return {}

    def getNote(self, id: str):
        if not self._knowledge:
            return None
        try:
            return _serialize(self._knowledge.get_note(id))
        except Exception as e:
            logger.warning("getNote(%s) failed: %s", id, e)
            return None

    def listNotes(self, folder: str = "") -> list:
        if not self._knowledge:
            return []
        try:
            return _serialize(self._knowledge.list_notes(folder))
        except Exception as e:
            logger.warning("listNotes(%s) failed: %s", folder, e)
            return []

    def updateNote(self, id: str, data: dict) -> dict:
        if not self._knowledge:
            return {}
        try:
            metadata = data.get("metadata", "{}")
            if isinstance(metadata, dict):
                metadata = json.dumps(metadata)
            dto = CreateNoteDTO(
                title=data.get("title", ""),
                content=data.get("content", ""),
                folder=data.get("folder", "/"),
                tags=data.get("tags", []),
                metadata=metadata,
            )
            note = self._knowledge.update_note(id, dto)
            return _serialize(note)
        except Exception as e:
            logger.warning("updateNote(%s) failed: %s", id, e)
            return {}

    def deleteNote(self, id: str) -> bool:
        if not self._knowledge:
            return False
        try:
            return self._knowledge.delete_note(id)
        except Exception as e:
            logger.warning("deleteNote(%s) failed: %s", id, e)
            return False

    def searchNotes(self, query: str) -> list:
        if not self._knowledge:
            return []
        try:
            return _serialize(self._knowledge.search_notes(query))
        except Exception as e:
            logger.warning("searchNotes(%s) failed: %s", query, e)
            return []

    def getBacklinks(self, noteId: str) -> list:
        if not self._knowledge:
            return []
        try:
            return _serialize(self._knowledge.get_backlinks(noteId))
        except Exception as e:
            logger.warning("getBacklinks(%s) failed: %s", noteId, e)
            return []

    def getGraph(self) -> dict:
        if not self._graph:
            return {"nodes": [], "edges": []}
        try:
            return json.loads(self._graph.build_json())
        except Exception as e:
            logger.warning("getGraph failed: %s", e)
            return {"nodes": [], "edges": []}

    def getFolders(self) -> list:
        if not self._knowledge:
            return []
        try:
            return _serialize(self._knowledge.get_folders())
        except Exception as e:
            logger.warning("getFolders failed: %s", e)
            return []

    def moveNote(self, id: str, targetFolder: str) -> bool:
        if not self._knowledge:
            return False
        try:
            return self._knowledge.move_note(id, targetFolder)
        except Exception as e:
            logger.warning("moveNote(%s) failed: %s", id, e)
            return False

    def importNote(self, filePath: str):
        if not self._knowledge:
            return None
        try:
            return _serialize(self._knowledge.import_md(filePath))
        except Exception as e:
            logger.warning("importNote(%s) failed: %s", filePath, e)
            return None

    def exportNote(self, noteId: str, outputPath: str) -> bool:
        if not self._knowledge:
            return False
        try:
            return self._knowledge.export_md(noteId, outputPath)
        except Exception as e:
            logger.warning("exportNote(%s, %s) failed: %s", noteId, outputPath, e)
            return False

    # ========================================================================
    # Editor handlers
    # ========================================================================
    def editorOpenFile(self, path: str):
        if not self._editor:
            return None
        try:
            return _serialize(self._editor.open_file(path))
        except Exception as e:
            logger.warning("editorOpenFile(%s) failed: %s", path, e)
            return None

    def editorSaveFile(self, path: str, content: str) -> bool:
        if not self._editor:
            return False
        try:
            return self._editor.save_file(path, content)
        except Exception as e:
            logger.warning("editorSaveFile(%s) failed: %s", path, e)
            return False

    def editorCloseFile(self, path: str) -> bool:
        if not self._editor:
            return False
        try:
            return self._editor.close_file(path)
        except Exception as e:
            logger.warning("editorCloseFile(%s) failed: %s", path, e)
            return False

    def editorGetOpenFiles(self) -> list:
        if not self._editor:
            return []
        try:
            return _serialize(self._editor.get_open_files())
        except Exception as e:
            logger.warning("editorGetOpenFiles failed: %s", e)
            return []

    def editorDetectLanguage(self, path: str) -> str:
        if not self._editor:
            return "plaintext"
        try:
            return self._editor.detect_language(path)
        except Exception as e:
            logger.warning("editorDetectLanguage(%s) failed: %s", path, e)
            return "plaintext"

    def editorSearchFiles(self, query: str) -> list:
        if not self._editor:
            return []
        try:
            results = []
            for buf in self._editor.get_open_files():
                if query.lower() in buf.content.lower() or query.lower() in buf.path.lower():
                    results.append({
                        "path": buf.path,
                        "language": buf.language,
                    })
            return results
        except Exception as e:
            logger.warning("editorSearchFiles(%s) failed: %s", query, e)
            return []

    def editorGetSettings(self) -> dict:
        if not self._editor:
            return {}
        try:
            return self._editor.get_settings()
        except Exception as e:
            logger.warning("editorGetSettings failed: %s", e)
            return {}

    def editorUpdateSettings(self, key: str, value: str) -> bool:
        if not self._editor:
            return False
        try:
            return self._editor.update_setting(key, value)
        except Exception as e:
            logger.warning("editorUpdateSettings(%s) failed: %s", key, e)
            return False

    # ========================================================================
    # Terminal handlers
    # ========================================================================
    def terminalCreate(self) -> str:
        if not self._terminal:
            return ""
        try:
            return self._terminal.create()
        except Exception as e:
            logger.warning("terminalCreate failed: %s", e)
            return ""

    def terminalWrite(self, id: str, data: str) -> bool:
        if not self._terminal:
            return False
        try:
            return self._terminal.write(id, data)
        except Exception as e:
            logger.warning("terminalWrite(%s) failed: %s", id, e)
            return False

    def terminalResize(self, id: str, cols: int, rows: int) -> bool:
        if not self._terminal:
            return False
        try:
            return self._terminal.resize(id, cols, rows)
        except Exception as e:
            logger.warning("terminalResize(%s) failed: %s", id, e)
            return False

    def terminalClose(self, id: str) -> bool:
        if not self._terminal:
            return False
        try:
            return self._terminal.close(id)
        except Exception as e:
            logger.warning("terminalClose(%s) failed: %s", id, e)
            return False

    def terminalList(self) -> list:
        if not self._terminal:
            return []
        try:
            return self._terminal.list()
        except Exception as e:
            logger.warning("terminalList failed: %s", e)
            return []

    def terminalCloseAll(self) -> bool:
        if not self._terminal:
            return False
        try:
            self._terminal.close_all()
            return True
        except Exception as e:
            logger.warning("terminalCloseAll failed: %s", e)
            return False

    # ========================================================================
    # Network handlers
    # ========================================================================
    def networkGet(self, url: str, headers: dict = None) -> dict:
        if not self._network:
            return {"statusCode": 0, "body": ""}
        try:
            response = self._network.get(url, headers)
            return _serialize(response)
        except Exception as e:
            logger.warning("networkGet(%s) failed: %s", url, e)
            return {"statusCode": -1, "body": "NETWORK_ERROR"}

    def networkPost(
        self, url: str, body: str, contentType: str = "", headers: dict = None
    ) -> dict:
        if not self._network:
            return {"statusCode": 0, "body": ""}
        try:
            response = self._network.post(url, body, contentType, headers)
            return _serialize(response)
        except Exception as e:
            logger.warning("networkPost(%s) failed: %s", url, e)
            return {"statusCode": -1, "body": "NETWORK_ERROR"}

    def networkOAuthStart(self, provider: str) -> str:
        if not self._network:
            return ""
        try:
            return self._network.start_oauth(provider)
        except Exception as e:
            logger.warning("networkOAuthStart(%s) failed: %s", provider, e)
            return ""

    def networkOAuthComplete(self, provider: str, code: str) -> str:
        if not self._network:
            return ""
        try:
            return self._network.complete_oauth(provider, code)
        except Exception as e:
            logger.warning("networkOAuthComplete(%s) failed: %s", provider, e)
            return ""

    def networkGetStoredToken(self, provider: str) -> str:
        if not self._network:
            return ""
        try:
            return self._network.get_stored_token(provider)
        except Exception as e:
            logger.warning("networkGetStoredToken(%s) failed: %s", provider, e)
            return ""

    def networkClearToken(self, provider: str) -> bool:
        if not self._network:
            return False
        try:
            return self._network.clear_token(provider)
        except Exception as e:
            logger.warning("networkClearToken(%s) failed: %s", provider, e)
            return False

    def networkStoreApiKey(self, service: str, key: str) -> bool:
        if not self._network:
            return False
        try:
            return self._network.store_api_key(service, key)
        except Exception as e:
            logger.warning("networkStoreApiKey(%s) failed: %s", service, e)
            return False

    def networkGetApiKey(self, service: str) -> str:
        if not self._network:
            return ""
        try:
            return self._network.get_api_key(service)
        except Exception as e:
            logger.warning("networkGetApiKey(%s) failed: %s", service, e)
            return ""

    def networkDeleteApiKey(self, service: str) -> bool:
        if not self._network:
            return False
        try:
            return self._network.delete_api_key(service)
        except Exception as e:
            logger.warning("networkDeleteApiKey(%s) failed: %s", service, e)
            return False

    def networkListApiKeys(self) -> list:
        if not self._network:
            return []
        try:
            return self._network.list_api_keys()
        except Exception as e:
            logger.warning("networkListApiKeys failed: %s", e)
            return []

    # ========================================================================
    # Git handlers
    # ========================================================================
    def gitStatus(self, repoPath: str) -> list:
        if not self._git:
            return []
        try:
            return _serialize(self._git.status(repoPath))
        except Exception as e:
            logger.warning("gitStatus(%s) failed: %s", repoPath, e)
            return []

    def gitDiff(self, repoPath: str, filePath: str = "") -> str:
        if not self._git:
            return ""
        try:
            return self._git.diff(repoPath, filePath)
        except Exception as e:
            logger.warning("gitDiff(%s) failed: %s", repoPath, e)
            return ""

    def gitDiffGutter(self, repoPath: str, filePath: str) -> list:
        if not self._git:
            return []
        try:
            return _serialize(self._git.diff_gutter(repoPath, filePath))
        except Exception as e:
            logger.warning("gitDiffGutter(%s, %s) failed: %s", repoPath, filePath, e)
            return []

    def gitStage(self, repoPath: str, filePath: str) -> bool:
        if not self._git:
            return False
        try:
            return self._git.stage(repoPath, filePath)
        except Exception as e:
            logger.warning("gitStage(%s) failed: %s", repoPath, e)
            return False

    def gitUnstage(self, repoPath: str, filePath: str) -> bool:
        if not self._git:
            return False
        try:
            return self._git.unstage(repoPath, filePath)
        except Exception as e:
            logger.warning("gitUnstage(%s) failed: %s", repoPath, e)
            return False

    def gitStageAll(self, repoPath: str) -> bool:
        if not self._git:
            return False
        try:
            return self._git.stage_all(repoPath)
        except Exception as e:
            logger.warning("gitStageAll(%s) failed: %s", repoPath, e)
            return False

    def gitCommit(self, repoPath: str, message: str) -> bool:
        if not self._git:
            return False
        try:
            return self._git.commit(repoPath, message)
        except Exception as e:
            logger.warning("gitCommit(%s) failed: %s", repoPath, e)
            return False

    def gitBranches(self, repoPath: str) -> list:
        if not self._git:
            return []
        try:
            return _serialize(self._git.branches(repoPath))
        except Exception as e:
            logger.warning("gitBranches(%s) failed: %s", repoPath, e)
            return []

    def gitCheckout(self, repoPath: str, branch: str) -> bool:
        if not self._git:
            return False
        try:
            return self._git.checkout(repoPath, branch)
        except Exception as e:
            logger.warning("gitCheckout(%s, %s) failed: %s", repoPath, branch, e)
            return False

    def gitCreateBranch(self, repoPath: str, branch: str) -> bool:
        if not self._git:
            return False
        try:
            return self._git.create_branch(repoPath, branch)
        except Exception as e:
            logger.warning("gitCreateBranch(%s, %s) failed: %s", repoPath, branch, e)
            return False

    def gitDeleteBranch(self, repoPath: str, branch: str) -> bool:
        if not self._git:
            return False
        try:
            return self._git.delete_branch(repoPath, branch)
        except Exception as e:
            logger.warning("gitDeleteBranch(%s, %s) failed: %s", repoPath, branch, e)
            return False

    def gitPush(self, repoPath: str, remote: str = "", branch: str = "") -> bool:
        if not self._git:
            return False
        try:
            return self._git.push(repoPath, remote, branch)
        except Exception as e:
            logger.warning("gitPush(%s) failed: %s", repoPath, e)
            return False

    def gitPull(self, repoPath: str, remote: str = "", branch: str = "") -> bool:
        if not self._git:
            return False
        try:
            return self._git.pull(repoPath, remote, branch)
        except Exception as e:
            logger.warning("gitPull(%s) failed: %s", repoPath, e)
            return False

    def gitLog(self, repoPath: str, count: int = 10) -> list:
        if not self._git:
            return []
        try:
            return _serialize(self._git.log(repoPath, count))
        except Exception as e:
            logger.warning("gitLog(%s) failed: %s", repoPath, e)
            return []

    def gitIsRepo(self, repoPath: str) -> bool:
        if not self._git:
            return False
        try:
            return self._git.is_repo(repoPath)
        except Exception as e:
            logger.warning("gitIsRepo(%s) failed: %s", repoPath, e)
            return False

    def gitCurrentBranch(self, repoPath: str) -> str:
        if not self._git:
            return ""
        try:
            return self._git.current_branch(repoPath)
        except Exception as e:
            logger.warning("gitCurrentBranch(%s) failed: %s", repoPath, e)
            return ""

    def gitSetCredentials(self, repoPath: str, username: str, token: str) -> bool:
        if not self._git:
            return False
        try:
            self._git.set_credentials(username, token)
            return True
        except Exception as e:
            logger.warning("gitSetCredentials failed: %s", e)
            return False

    # ========================================================================
    # LLM Gateway handlers
    # ========================================================================
    def llmGetProviders(self) -> list:
        if not self._llm:
            return []
        try:
            return self._llm.get_providers()
        except Exception as e:
            logger.warning("llmGetProviders failed: %s", e)
            return []

    def llmGetProvider(self, provider: str) -> dict | None:
        if not self._llm:
            return None
        try:
            return self._llm.get_provider(provider)
        except Exception as e:
            logger.warning("llmGetProvider(%s) failed: %s", provider, e)
            return None

    def llmSaveProvider(self, config: dict) -> bool:
        if not self._llm:
            return False
        try:
            from jarvis.llm_gateway import LLMProvider, LLMProviderConfig
            cfg = LLMProviderConfig(
                provider=LLMProvider(config.get("provider", "ollama")),
                api_key=config.get("apiKey", ""),
                api_url=config.get("apiUrl", ""),
                default_model=config.get("defaultModel", ""),
                enabled=config.get("enabled", True),
                models=config.get("models", []),
            )
            return self._llm.save_provider(cfg)
        except Exception as e:
            logger.warning("llmSaveProvider failed: %s", e)
            return False

    def llmSetDefaultProvider(self, provider: str) -> bool:
        if not self._llm:
            return False
        try:
            return self._llm.set_default_provider(provider)
        except Exception as e:
            logger.warning("llmSetDefaultProvider(%s) failed: %s", provider, e)
            return False

    def llmGetDefaultProvider(self) -> str:
        if not self._llm:
            return "ollama"
        try:
            return self._llm.get_default_provider()
        except Exception as e:
            logger.warning("llmGetDefaultProvider failed: %s", e)
            return "ollama"

    def llmTestConnection(self, provider: str) -> dict:
        if not self._llm:
            return {"success": False, "error": "LLM gateway not available"}
        try:
            return self._llm.test_connection(provider)
        except Exception as e:
            logger.warning("llmTestConnection(%s) failed: %s", provider, e)
            return {"success": False, "error": str(e)}

    def llmGenerate(self, request: dict) -> dict:
        if not self._llm:
            return {"content": "", "done": False}
        try:
            from jarvis.llm_gateway import LLMProvider
            req = LLMRequest(
                provider=LLMProvider(request.get("provider", "ollama")),
                model=request.get("model", ""),
                messages=[LLMMessage(role=m.get("role", "user"), content=m.get("content", ""))
                          for m in request.get("messages", [])],
                system=request.get("system", ""),
                temperature=request.get("temperature", 0.7),
                max_tokens=request.get("maxTokens", 2048),
            )
            resp = self._llm.generate(req)
            return {
                "content": resp.content,
                "model": resp.model,
                "provider": resp.provider.value,
                "promptTokens": resp.prompt_tokens,
                "completionTokens": resp.completion_tokens,
                "latencyMs": resp.latency_ms,
                "done": resp.done,
            }
        except Exception as e:
            logger.warning("llmGenerate failed: %s", e)
            return {"content": f"Error: {e}", "done": True}

    # ========================================================================
    # MCP Server handlers
    # ========================================================================
    def mcpListServers(self) -> list:
        if not self._mcp:
            return []
        try:
            return self._mcp.list_servers()
        except Exception as e:
            logger.warning("mcpListServers failed: %s", e)
            return []

    def mcpGetServer(self, id: str) -> dict | None:
        if not self._mcp:
            return None
        try:
            return self._mcp.get_server(id)
        except Exception as e:
            logger.warning("mcpGetServer(%s) failed: %s", id, e)
            return None

    def mcpCreateServer(self, data: dict) -> dict:
        if not self._mcp:
            return {}
        try:
            return self._mcp.create_server(data)
        except Exception as e:
            logger.warning("mcpCreateServer failed: %s", e)
            return {}

    def mcpUpdateServer(self, id: str, data: dict) -> dict:
        if not self._mcp:
            return {}
        try:
            return self._mcp.update_server(id, data)
        except Exception as e:
            logger.warning("mcpUpdateServer(%s) failed: %s", id, e)
            return {}

    def mcpDeleteServer(self, id: str) -> bool:
        if not self._mcp:
            return False
        try:
            return self._mcp.delete_server(id)
        except Exception as e:
            logger.warning("mcpDeleteServer(%s) failed: %s", id, e)
            return False

    def mcpStartServer(self, id: str) -> bool:
        if not self._mcp:
            return False
        try:
            return self._mcp.start_server(id)
        except Exception as e:
            logger.warning("mcpStartServer(%s) failed: %s", id, e)
            return False

    def mcpStopServer(self, id: str) -> bool:
        if not self._mcp:
            return False
        try:
            return self._mcp.stop_server(id)
        except Exception as e:
            logger.warning("mcpStopServer(%s) failed: %s", id, e)
            return False

    def mcpListTools(self) -> list:
        if not self._mcp:
            return []
        try:
            return self._mcp.list_tools()
        except Exception as e:
            logger.warning("mcpListTools failed: %s", e)
            return []

    def mcpCallTool(self, serverId: str, toolName: str, arguments: dict) -> dict:
        if not self._mcp:
            return {"success": False, "error": "MCP not available"}
        try:
            return self._mcp.call_tool(serverId, toolName, arguments)
        except Exception as e:
            logger.warning("mcpCallTool(%s) failed: %s", toolName, e)
            return {"success": False, "error": str(e)}

    # ========================================================================
    # Workflow handlers
    # ========================================================================
    def workflowList(self) -> list:
        if not self._workflows:
            return []
        try:
            return self._workflows.list_workflows()
        except Exception as e:
            logger.warning("workflowList failed: %s", e)
            return []

    def workflowGet(self, id: str) -> dict | None:
        if not self._workflows:
            return None
        try:
            return self._workflows.get_workflow(id)
        except Exception as e:
            logger.warning("workflowGet(%s) failed: %s", id, e)
            return None

    def workflowCreate(self, data: dict) -> dict:
        if not self._workflows:
            return {}
        try:
            return self._workflows.create_workflow(data)
        except Exception as e:
            logger.warning("workflowCreate failed: %s", e)
            return {}

    def workflowUpdate(self, id: str, data: dict) -> dict:
        if not self._workflows:
            return {}
        try:
            return self._workflows.update_workflow(id, data)
        except Exception as e:
            logger.warning("workflowUpdate(%s) failed: %s", id, e)
            return {}

    def workflowDelete(self, id: str) -> bool:
        if not self._workflows:
            return False
        try:
            return self._workflows.delete_workflow(id)
        except Exception as e:
            logger.warning("workflowDelete(%s) failed: %s", id, e)
            return False

    def workflowExecute(self, id: str, context: dict = None) -> dict:
        if not self._workflows:
            return {"success": False, "error": "Workflow engine not available"}
        try:
            return self._workflows.execute_workflow(id, context)
        except Exception as e:
            logger.warning("workflowExecute(%s) failed: %s", id, e)
            return {"success": False, "error": str(e)}

    # ========================================================================
    # Security handlers
    # ========================================================================
    def securityGetPermissions(self) -> list:
        if not self._security:
            return []
        try:
            return self._security.get_permissions()
        except Exception as e:
            logger.warning("securityGetPermissions failed: %s", e)
            return []

    def securityGetModulePermissions(self, moduleId: str) -> list:
        if not self._security:
            return []
        try:
            return self._security.get_module_permissions(moduleId)
        except Exception as e:
            logger.warning("securityGetModulePermissions(%s) failed: %s", moduleId, e)
            return []

    def securitySetPermission(self, moduleId: str, permission: str, granted: bool) -> bool:
        if not self._security:
            return False
        try:
            return self._security.set_permission(moduleId, permission, granted)
        except Exception as e:
            logger.warning("securitySetPermission(%s) failed: %s", moduleId, e)
            return False

    def securityGetAuditLog(self, module: str = "", limit: int = 50, offset: int = 0) -> list:
        if not self._security:
            return []
        try:
            return self._security.get_audit_log(module, limit, offset)
        except Exception as e:
            logger.warning("securityGetAuditLog failed: %s", e)
            return []

    def securityStoreSecret(self, key: str, value: str, category: str = "general") -> bool:
        if not self._security:
            return False
        try:
            return self._security.store_secret(key, value, category)
        except Exception as e:
            logger.warning("securityStoreSecret(%s) failed: %s", key, e)
            return False

    def securityGetSecret(self, key: str) -> str:
        if not self._security:
            return ""
        try:
            return self._security.get_secret(key)
        except Exception as e:
            logger.warning("securityGetSecret(%s) failed: %s", key, e)
            return ""

    def securityDeleteSecret(self, key: str) -> bool:
        if not self._security:
            return False
        try:
            return self._security.delete_secret(key)
        except Exception as e:
            logger.warning("securityDeleteSecret(%s) failed: %s", key, e)
            return False

    def securityListSecrets(self, category: str = "") -> list:
        if not self._security:
            return []
        try:
            return self._security.list_secrets(category)
        except Exception as e:
            logger.warning("securityListSecrets(%s) failed: %s", category, e)
            return []

    # ── Utility: Clipboard, Explorer, Platform ────────────────────────

    def copyToClipboard(self, text: str) -> bool:
        try:
            if sys.platform == "win32":
                subprocess.run(
                    ["powershell", "-NoProfile", "-Command", "Set-Clipboard", text],
                    check=True, timeout=5,
                )
            elif sys.platform == "darwin":
                subprocess.run(
                    ["osascript", "-e", f'set the clipboard to "{text}"'],
                    check=True, timeout=5,
                )
            else:
                subprocess.run(
                    ["xclip", "-selection", "clipboard"],
                    input=text.encode(), check=True, timeout=5,
                )
            return True
        except Exception as e:
            logger.warning("copyToClipboard failed: %s", e)
            return False

    def revealInExplorer(self, path: str) -> bool:
        try:
            if sys.platform == "win32":
                subprocess.Popen(["explorer", "/select,", os.path.abspath(path)])
            elif sys.platform == "darwin":
                subprocess.Popen(["open", "-R", os.path.abspath(path)])
            else:
                subprocess.Popen(["xdg-open", os.path.dirname(os.path.abspath(path))])
            return True
        except Exception as e:
            logger.warning("revealInExplorer failed: %s", e)
            return False

    def getRelativePath(self, base: str, target: str) -> str:
        try:
            rel = os.path.relpath(os.path.abspath(target), os.path.abspath(base))
            return rel.replace("\\", "/")
        except Exception as e:
            logger.warning("getRelativePath failed: %s", e)
            return target

    def getPlatform(self) -> str:
        if sys.platform == "win32":
            return "windows"
        if sys.platform == "darwin":
            return "macos"
        return "linux"

    def getPathSeparator(self) -> str:
        return "\\" if sys.platform == "win32" else "/"

    # ── Model / Ollama Server Status ──────────────────────────────────

    def getModelServerStatus(self) -> dict:
        status = {"running": False, "command": "", "pid": 0, "error": ""}
        try:
            if sys.platform == "win32":
                result = subprocess.run(
                    ["powershell", "-NoProfile", "-Command",
                     "Get-Process ollama -ErrorAction SilentlyContinue | Select-Object Id, CommandLine"],
                    capture_output=True, text=True, timeout=5,
                )
                if "ollama" in result.stdout.lower():
                    status["running"] = True
                    status["command"] = "ollama serve"
                    lines = result.stdout.strip().split("\n")
                    for line in lines:
                        if line.strip() and line.strip() != lines[0]:
                            parts = line.strip().split()
                            if parts:
                                try:
                                    status["pid"] = int(parts[0])
                                except ValueError:
                                    pass
                    return status
            else:
                result = subprocess.run(
                    ["pgrep", "-f", "ollama"],
                    capture_output=True, text=True, timeout=5,
                )
                if result.stdout.strip():
                    status["running"] = True
                    status["pid"] = int(result.stdout.strip().split("\n")[0])
                    status["command"] = "ollama serve"
                    return status

            # Not running — detect install path
            if sys.platform == "win32":
                paths = [
                    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Ollama\ollama.exe"),
                    os.path.expandvars(r"%PROGRAMFILES%\Ollama\ollama.exe"),
                    os.path.expandvars(r"%PROGRAMFILES(X86)%\Ollama\ollama.exe"),
                ]
                for p in paths:
                    if os.path.exists(p):
                        status["command"] = f'"{p}" serve'
                        break
                else:
                    status["command"] = "ollama serve"
            else:
                status["command"] = "ollama serve"

        except Exception as e:
            status["error"] = str(e)
            status["command"] = "ollama serve"

        return status

    def startModelServer(self) -> bool:
        try:
            status = self.getModelServerStatus()
            if status.get("running"):
                return True
            cmd = status.get("command", "ollama serve")
            if sys.platform == "win32":
                subprocess.Popen(
                    ["powershell", "-NoProfile", "-Command", f"Start-Process -WindowStyle Hidden '{cmd}'"],
                    shell=True,
                )
            else:
                subprocess.Popen(cmd.split(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except Exception as e:
            logger.warning("startModelServer failed: %s", e)
            return False
