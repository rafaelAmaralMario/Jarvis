"""Bridge layer: exposes all backend methods as window.jarvis.* to the React frontend."""

import json
import logging
import os
import subprocess
import sys
import threading
import uuid
from dataclasses import asdict, is_dataclass
from typing import Any

from jarvis.agents_manager import AgentsManager, CreateAgentDTO
from jarvis.chat_manager import ChatManager
from jarvis.database import Database
from jarvis.editor_manager import EditorManager
from jarvis.git_manager import GitManager
from jarvis.graph_builder import GraphBuilder
from jarvis.knowledge_manager import CreateNoteDTO, KnowledgeManager
from jarvis.gguf_manager import GGUFManager
from jarvis.llm_gateway import LLMGateway, LLMRequest, LLMMessage
from jarvis.llm_router import LLMRouter, RouterRule, RouterMatch
from jarvis.mcp_manager import MCPManager
from jarvis.models_manager import ModelMetadata, ModelSpecialty, ModelsManager
from jarvis.module_loader import ModuleLoader
from jarvis.network_manager import NetworkManager
from jarvis.ollama_client import OllamaClient
from jarvis.orchestration_manager import OrchestrationConfig, OrchestrationManager
from jarvis.security_manager import SecurityManager
from jarvis.terminal_manager import TerminalManager
from jarvis.tool_agent import ToolAgent, TaskPlanner
from jarvis.self_improvement import SelfImprovement
from jarvis.tool_manager import ToolManager
from jarvis.workflow_engine import WorkflowEngine
from jarvis.workspace_manager import WorkspaceManager

logger = logging.getLogger(__name__)


def _snake_to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _serialize(obj: Any) -> Any:
    if obj is None:
        return None
    if is_dataclass(obj):
        return {_snake_to_camel(k): _serialize(v) for k, v in asdict(obj).items()}
    if isinstance(obj, list):
        return [_serialize(item) for item in obj]
    if isinstance(obj, dict):
        return {_snake_to_camel(k): _serialize(v) for k, v in obj.items()}
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
        self._llm_router = LLMRouter(gateway=llm_gateway, db=db) if llm_gateway else None
        self._db = db
        self._chat = ChatManager(db) if db else None
        try:
            roots = workspace.get_roots() if workspace else []
            ws_root = roots[0] if roots else None
        except Exception:
            logger.warning("Failed to get workspace roots, using None")
            ws_root = None
        self._tools = ToolManager(workspace_root=ws_root)
        if knowledge:
            self._tools.set_knowledge_manager(knowledge)
        self._tool_agent: ToolAgent | None = None
        self._si_instance: SelfImprovement | None = None

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
            logger.warning("listModels failed (server offline?): %s", e)
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
            return "Erro: Nenhum agente de orquestração configurado."
        try:
            return self._orchestration.execute_query(query)
        except Exception as e:
            logger.warning("sendMessage failed: %s", e)
            return f"**Erro:** {e}"

    def aiGenerateAgent(self, prompt: str) -> dict:
        if not self._llm:
            return {"error": "LLM gateway not available"}
        try:
            from jarvis.llm_gateway import LLMProvider
            system = """You are a JSON generator for AI agent configurations. Respond ONLY with valid JSON matching this schema:
{
  "name": "string (short, kebab-case)",
  "description": "string",
  "model": "string (pick one: llama3.2, deepseek-r1:8b, qwen2.5:7b, phi4:14b, mistral:7b, gemma3:12b, command-r:35b, nemotron-mini:7b)",
  "systemPrompt": "string (detailed system prompt for the agent)",
  "temperature": 0.0-1.0,
  "maxTokens": 128-8192,
  "specialty": "string (e.g. coding, research, writing, general)",
  "tools": ["string array - available tools"],
  "canOrchestrate": true/false,
  "priority": 1-10
}
Available tools: code_analysis, file_operations, web_search, terminal, memory, knowledge_base
Use realistic values based on the user's request."""
            req = LLMRequest(
                provider=LLMProvider.OLLAMA,
                model="",
                messages=[LLMMessage(role="user", content=prompt)],
                system=system,
                temperature=0.3,
                max_tokens=4096,
            )
            resp = self._llm.generate(req)
            import json
            data = json.loads(resp.content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip())
            return self.createAgent(data)
        except json.JSONDecodeError as e:
            logger.warning("aiGenerateAgent JSON parse failed: %s | raw: %s", e, resp.content[:200])
            return {"error": f"Failed to parse AI response: {e}"}
        except Exception as e:
            logger.warning("aiGenerateAgent failed: %s", e)
            return {"error": str(e)}

    def aiGenerateWorkflow(self, prompt: str) -> dict:
        if not self._llm:
            return {"error": "LLM gateway not available"}
        try:
            from jarvis.llm_gateway import LLMProvider
            system = """You are a JSON generator for workflow configurations. Respond ONLY with valid JSON matching this schema:
{
  "name": "string (short, kebab-case)",
  "description": "string",
  "triggerType": "manual | schedule | event | webhook",
  "steps": [
    {
      "name": "string",
      "type": "code_execution | ai_generation | file_operation | web_request | notification | condition",
      "config": {
        "command": "string or script for code_execution",
        "prompt": "string for ai_generation",
        "path": "string for file_operation",
        "url": "string for web_request",
        "message": "string for notification",
        "condition": "string for condition"
      }
    }
  ],
  "enabled": true/false
}
Generate 2-5 steps. Use realistic values based on the user's request."""
            req = LLMRequest(
                provider=LLMProvider.OLLAMA,
                model="",
                messages=[LLMMessage(role="user", content=prompt)],
                system=system,
                temperature=0.3,
                max_tokens=4096,
            )
            resp = self._llm.generate(req)
            import json
            data = json.loads(resp.content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip())
            return self.workflowCreate(data)
        except json.JSONDecodeError as e:
            logger.warning("aiGenerateWorkflow JSON parse failed: %s | raw: %s", e, resp.content[:200])
            return {"error": f"Failed to parse AI response: {e}"}
        except Exception as e:
            logger.warning("aiGenerateWorkflow failed: %s", e)
            return {"error": str(e)}

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
            result = self._workspace.open_workspace(path)
            if result:
                self._tools.set_workspace_root(path)
            return result
        except Exception as e:
            logger.warning("openWorkspace(%s) failed: %s", path, e)
            return False

    def addRoot(self, path: str) -> bool:
        if not self._workspace:
            return False
        try:
            result = self._workspace.add_root(path)
            if result:
                self._tools.set_workspace_root(path)
            return result
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
        try:
            if self._tool_agent:
                self._tool_agent.cancel()
                return True
            return True
        except Exception as e:
            logger.warning("cancelGeneration failed: %s", e)
            return False

    # ========================================================================
    # Chat handlers (persistent conversations)
    # ========================================================================

    def chatListConversations(self) -> list:
        if not self._chat:
            return []
        try:
            return _serialize(self._chat.list_conversations())
        except Exception as e:
            logger.warning("chatListConversations failed: %s", e)
            return []

    def chatGetMessages(self, conv_id: str) -> list:
        if not self._chat:
            return []
        try:
            return _serialize(self._chat.get_messages(conv_id))
        except Exception as e:
            logger.warning("chatGetMessages(%s) failed: %s", conv_id, e)
            return []

    def chatCreateConversation(self, title: str = "Nova conversa", agent_id: str = "", model: str = "") -> dict:
        if not self._chat:
            return {}
        try:
            return _serialize(self._chat.create_conversation(title, agent_id or None, model))
        except Exception as e:
            logger.warning("chatCreateConversation failed: %s", e)
            return {}

    def chatSaveMessage(self, conv_id: str, role: str, content: str, agent_id: str = "", model: str = "", tokens_used: int = 0, latency_ms: int = 0) -> dict:
        if not self._chat:
            return {}
        try:
            return _serialize(self._chat.save_message(conv_id, role, content, agent_id or None, model or None, tokens_used, latency_ms))
        except Exception as e:
            logger.warning("chatSaveMessage failed: %s", e)
            return {}

    def chatDeleteConversation(self, conv_id: str) -> bool:
        if not self._chat:
            return False
        try:
            return self._chat.delete_conversation(conv_id)
        except Exception as e:
            logger.warning("chatDeleteConversation(%s) failed: %s", conv_id, e)
            return False

    def chatAutoTitle(self, conv_id: str, first_message: str) -> str:
        if not self._chat:
            return first_message[:60]
        try:
            return self._chat.auto_title(conv_id, first_message)
        except Exception as e:
            logger.warning("chatAutoTitle failed: %s", e)
            return first_message[:60]

    # ========================================================================
    # Tool system handlers (Computer Use)
    # ========================================================================

    def toolsList(self) -> list:
        try:
            return self._tools.list_tools()
        except Exception as e:
            logger.warning("toolsList failed: %s", e)
            return []

    def toolsGetRisk(self, name: str) -> str:
        try:
            return self._tools.get_risk(name).value
        except Exception:
            return "danger"

    def toolsExecute(self, name: str, args: dict) -> dict:
        try:
            result = self._tools.execute(name, args)
            return {
                "success": result.success,
                "output": result.output,
                "error": result.error,
                "data": result.data,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def toolsSetWorkspace(self, path: str) -> bool:
        try:
            self._tools.set_workspace_root(path)
            return True
        except Exception as e:
            logger.warning("toolsSetWorkspace(%s) failed: %s", path, e)
            return False

    def toolAgentExecute(self, query: str, conv_id: str = "") -> dict:
        if not self._llm:
            return {"content": "**Erro:** LLM não configurado.", "toolCalls": [], "conversationId": conv_id}
        try:
            agent_model = ""
            agent_provider = "ollama"
            try:
                if self._llm:
                    agent_provider = self._llm.get_default_provider()
            except Exception:
                pass
            if self._agents:
                default = self._agents.get_default_agent()
                if default:
                    agent_model = default.model
                    agent_provider = default.provider or agent_provider

            tool_calls_log: list[dict] = []
            tool_results_log: list[dict] = []

            def on_tool_call(tc: dict) -> None:
                tool_calls_log.append(tc)

            def on_tool_result(tr: dict) -> None:
                tool_results_log.append(tr)

            self._tool_agent = ToolAgent(
                llm=self._llm,
                tools=self._tools,
                model=agent_model,
                provider=agent_provider,
                on_tool_call=on_tool_call,
                on_tool_result=on_tool_result,
            )

            result = self._tool_agent.execute(query)

            return {
                "content": result.get("content", ""),
                "toolCalls": tool_calls_log,
                "toolResults": tool_results_log,
                "conversationId": conv_id,
                "pendingQuestion": result.get("pendingQuestion"),
                "cancelled": result.get("cancelled", False),
            }
        except Exception as e:
            logger.exception("toolAgentExecute failed")
            self._tool_agent = None
            return {"content": f"**Erro:** {e}", "toolCalls": [], "conversationId": conv_id}

    def toolAgentAnswer(self, question_id: str, answer: str) -> dict:
        try:
            if not self._tool_agent:
                return {"success": False, "error": "Nenhum agente em execução.", "content": ""}

            self._tool_agent.answer_question(question_id, answer)

            return {"success": True, "content": "", "pendingQuestion": None}
        except Exception as e:
            logger.exception("toolAgentAnswer failed")
            return {"success": False, "error": str(e), "content": ""}

    # ========================================================================
    # Streaming execution (thread-based polling)
    # ========================================================================

    _streams: dict[str, dict] = {}

    def toolAgentExecuteStream(self, query: str, conv_id: str = "", history: list | None = None, agent_id: str = "", unattended: bool = False, provider_override: str = "", model_override: str = "") -> dict:
        task_id = str(uuid.uuid4())
        JARVISBridge._streams[task_id] = {
            "content": "",
            "toolCalls": [],
            "toolResults": [],
            "pendingQuestion": None,
            "cancelled": False,
            "done": False,
            "error": None,
        }

        def _run():
            try:
                agent_model = ""
                agent_provider = "ollama"
                agent_system = None

                if agent_id and self._agents:
                    agent = self._agents.get_agent(agent_id)
                    if agent:
                        agent_model = agent.model or ""
                        agent_provider = agent.provider or agent_provider
                        if agent.system_prompt:
                            agent_system = agent.system_prompt
                elif self._agents:
                    default = self._agents.get_default_agent()
                    if default:
                        agent_model = default.model or ""
                        agent_provider = default.provider or agent_provider
                        if default.system_prompt:
                            agent_system = default.system_prompt

                # Chat overrides take highest priority
                if model_override:
                    agent_model = model_override
                if provider_override:
                    agent_provider = provider_override

                # Fallback to default provider if still not set
                if not agent_provider or agent_provider == "ollama":
                    try:
                        if self._llm:
                            agent_provider = self._llm.get_default_provider()
                    except Exception:
                        pass

                tool_calls_log: list[dict] = []
                tool_results_log: list[dict] = []
                stream = JARVISBridge._streams[task_id]

                def on_token(token: str) -> None:
                    stream["content"] += token

                def on_tool_call(tc: dict) -> None:
                    tool_calls_log.append(tc)
                    stream["toolCalls"] = list(tool_calls_log)

                def on_tool_result(tr: dict) -> None:
                    tool_results_log.append(tr)
                    stream["toolResults"] = list(tool_results_log)

                self._tools.unattended = unattended
                agent_instance = ToolAgent(
                    llm=self._llm,
                    tools=self._tools,
                    model=agent_model,
                    provider=agent_provider,
                    on_token=on_token,
                    on_tool_call=on_tool_call,
                    on_tool_result=on_tool_result,
                    unattended=unattended,
                )

                if agent_system:
                    agent_system += "\n\nAvailable tools:\n{tool_descriptions}\n\nCurrent workspace: {workspace}"
                    if "{tool_descriptions}" not in agent_system:
                        agent_system += "\n\n{tool_descriptions}\n\nCurrent workspace: {workspace}"

                self._tool_agent = agent_instance

                history_list = []
                if history:
                    for msg in history:
                        role = msg.get("role", "user")
                        content = msg.get("content", "")
                        if role in ("user", "assistant") and content:
                            history_list.append({"role": role, "content": content})

                result = agent_instance.execute(
                    query,
                    history=history_list if history_list else None,
                    system_override=agent_system,
                )
                stream["content"] = result.get("content", "")
                stream["pendingQuestion"] = result.get("pendingQuestion")
                stream["cancelled"] = result.get("cancelled", False)

            except Exception as e:
                logger.exception("toolAgentExecuteStream failed")
                JARVISBridge._streams[task_id]["error"] = str(e)
            finally:
                JARVISBridge._streams[task_id]["done"] = True

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        return {"taskId": task_id}

    def toolAgentGetStream(self, task_id: str) -> dict:
        stream = JARVISBridge._streams.get(task_id)
        if not stream:
            return {"done": True, "error": "Task not found"}
        return dict(stream)

    def _resolve_model_provider(self) -> tuple[str, str]:
        model = ""
        provider = "ollama"
        try:
            if self._llm:
                provider = self._llm.get_default_provider()
        except Exception:
            pass
        try:
            if self._agents:
                default = self._agents.get_default_agent()
                if default:
                    model = default.model or ""
                    provider = default.provider or provider
        except Exception:
            pass
        return model, provider

    def taskPlannerExecute(self, query: str, resume: bool = False) -> dict:
        model, provider = self._resolve_model_provider()
        planner = TaskPlanner(
            llm=self._llm,
            tools=self._tools,
            model=model,
            provider=provider,
            on_token=lambda t: None,
        )
        return planner.execute(query, resume=resume)

    _planner_streams: dict[str, dict] = {}

    def plannerExecuteStream(self, query: str, resume_plan_id: str = "") -> dict:
        task_id = str(uuid.uuid4())
        stream: dict = {
            "plan_id": resume_plan_id or "",
            "task": "",
            "total_steps": 0,
            "current_step": 0,
            "current_goal": "",
            "status": "starting",
            "results": [],
            "consecutive_failures": 0,
            "cancelled": False,
            "done": False,
            "error": None,
        }
        JARVISBridge._planner_streams[task_id] = stream

        def _run() -> None:
            try:
                def on_progress(p: dict) -> None:
                    stream.update(p)

                model, provider = self._resolve_model_provider()
                planner = TaskPlanner(
                    llm=self._llm,
                    tools=self._tools,
                    model=model,
                    provider=provider,
                    on_progress=on_progress,
                )

                if resume_plan_id:
                    cp = TaskPlanner.load_checkpoint(self._tools.workspace_root or "", resume_plan_id)
                    if cp:
                        result = planner.execute(cp.get("plan", {}).get("summary", ""), resume=True)
                    else:
                        stream["error"] = f"Checkpoint {resume_plan_id} not found"
                        return
                else:
                    result = planner.execute(query)

                stream["status"] = "completed" if result.get("success") else "failed"
            except Exception as e:
                logger.exception("plannerExecuteStream failed")
                stream["error"] = str(e)
            finally:
                stream["done"] = True

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        return {"taskId": task_id}

    def plannerGetProgress(self, task_id: str) -> dict:
        stream = JARVISBridge._planner_streams.get(task_id)
        if not stream:
            return {"done": True, "error": "Task not found"}
        return dict(stream)

    def plannerCancel(self, task_id: str) -> dict:
        stream = JARVISBridge._planner_streams.get(task_id)
        if stream:
            stream["cancelled"] = True
            stream["status"] = "cancelled"
            stream["done"] = True
        return {"success": True}

    def plannerListCheckpoints(self) -> list:
        ws = self._tools.workspace_root or ""
        return TaskPlanner.list_checkpoints(ws)

    def plannerResumeCheckpoint(self, plan_id: str) -> dict:
        return self.plannerExecuteStream("", resume_plan_id=plan_id)

    # ========================================================================
    # Fallback config
    # ========================================================================

    def llmGetFallbackConfig(self, provider: str = "") -> list | dict | None:
        if not self._llm:
            return None
        configs = self._llm.get_fallback_configs()
        if provider:
            for c in configs:
                if c["provider"] == provider:
                    return c
            return None
        return configs

    def llmSaveFallbackConfig(self, config: dict) -> bool:
        if not self._llm:
            return False
        return self._llm.save_fallback_config(config)

    # ========================================================================
    # GGUF model management
    # ========================================================================

    def _get_gguf_manager(self) -> GGUFManager:
        models_dir = os.path.expanduser("~/.jarvis/models")
        if self._llm:
            providers = self._llm.get_providers()
            for p in providers:
                if p.get("provider") == "native" and p.get("apiUrl"):
                    models_dir = p["apiUrl"]
                    break
        return GGUFManager(models_dir)

    def hfSearchModels(self, query: str = "") -> list:
        """Search HuggingFace for GGUF models by query string."""
        try:
            import httpx
            search_query = query.strip() or "gguf"
            url = f"https://huggingface.co/api/models?search={search_query}&sort=downloads&direction=-1&limit=20"
            resp = httpx.get(url, timeout=15)
            if resp.status_code != 200:
                logger.warning("HF search returned %d", resp.status_code)
                return []
            data = resp.json()
            results = []
            for item in data:
                model_id = item.get("modelId", "")
                if not model_id:
                    continue
                results.append({
                    "modelId": model_id,
                    "pipelineTag": item.get("pipeline_tag") or "",
                    "downloads": item.get("downloads", 0),
                    "likes": item.get("likes", 0),
                    "description": (item.get("cardData") or {}).get("short_description", "") or "",
                })
            return results[:20]
        except Exception as e:
            logger.warning("hfSearchModels failed: %s", e)
            return []

    def ggufDownload(self, repo_id: str, filename: str) -> dict:
        manager = self._get_gguf_manager()
        if not manager.validate_remote_file(repo_id, filename):
            return {"success": False, "error": "Remote file not found"}
        try:
            path = manager.download_model(repo_id, filename)
            return {"success": bool(path), "path": path, "name": filename}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def ggufList(self) -> list:
        return self._get_gguf_manager().list_models()

    def ggufDelete(self, name: str) -> dict:
        ok = self._get_gguf_manager().delete_model(name)
        return {"success": ok}

    def ggufCatalog(self) -> list:
        return self._get_gguf_manager().get_catalog()

    def ggufDiskUsage(self) -> dict:
        return self._get_gguf_manager().get_disk_usage()

    # ========================================================================
    # Audio transcription
    # ========================================================================

    def audioTranscribe(self, audio_base64: str, model: str = "tiny") -> dict:
        import base64
        import tempfile
        try:
            audio_bytes = base64.b64decode(audio_base64)
        except Exception as e:
            return {"success": False, "text": "", "error": f"Invalid audio data: {e}"}
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        tmp.write(audio_bytes)
        tmp.close()
        try:
            result = self._tools.execute("transcribe_audio", {"path": tmp.name, "model": model})
            return {"success": result.success, "text": result.output, "error": result.error}
        except Exception as e:
            return {"success": False, "text": "", "error": str(e)}
        finally:
            os.unlink(tmp.name)

    def ttsSynthesize(self, text: str, voice: str = "pt_BR-faber-medium") -> dict:
        try:
            from jarvis.audio_tts import synthesize
            audio_bytes = synthesize(text, voice)
            import base64
            return {
                "success": True,
                "audioBase64": base64.b64encode(audio_bytes).decode(),
                "format": "wav",
            }
        except Exception as e:
            logger.exception("ttsSynthesize failed")
            return {"success": False, "error": str(e)}

    def logError(self, message: str, stack: str = "") -> None:
        logger.error("Frontend error: %s\n%s", message, stack)

    # ========================================================================
    # LLM Router
    # ========================================================================

    def llmRouterGetRules(self) -> list:
        if not self._llm_router:
            return []
        return self._llm_router.get_rules()

    def llmRouterSaveRule(self, data: dict) -> bool:
        if not self._llm_router:
            return False
        match = data.get("match", {})
        rule = RouterRule(
            name=data["name"],
            match=RouterMatch(
                by_model=match.get("byModel", []),
                by_capability=match.get("byCapability", []),
                by_provider=match.get("byProvider", []),
                max_cost_per_1k=match.get("maxCostPer1k", 0.0),
            ),
            providers=data.get("providers", []),
            priority=data.get("priority", 0),
            enabled=data.get("enabled", True),
        )
        return self._llm_router.save_rule(rule)

    def llmRouterDeleteRule(self, name: str) -> bool:
        if not self._llm_router:
            return False
        return self._llm_router.delete_rule(name)

    def llmRouterGetMetrics(self) -> list:
        if not self._llm_router:
            return []
        return self._llm_router.get_metrics()

    def llmRouterClearCache(self) -> dict:
        if not self._llm_router:
            return {"cleared": 0}
        count = self._llm_router.clear_cache()
        return {"cleared": count}

    def llmRouterGetCacheInfo(self) -> dict:
        if not self._llm_router:
            return {"size": 0, "maxSize": 0}
        return self._llm_router.get_cache_info()

    # ========================================================================
    # Self-Improvement (streaming)
    # ========================================================================

    _sistreams: dict[str, dict] = {}

    def selfImprovementStream(self, action: str = "full_cycle") -> dict:
        task_id = str(uuid.uuid4())
        JARVISBridge._sistreams[task_id] = {
            "step": "init",
            "status": "starting",
            "detail": "",
            "progress": 0.0,
            "pendingQuestion": None,
            "done": False,
            "error": None,
        }

        def _run():
            try:
                agent_model, agent_provider = self._resolve_model_provider()

                si = SelfImprovement(
                    llm=self._llm,
                    tools=self._tools,
                    model=agent_model,
                    provider=agent_provider,
                    on_token=lambda t: None,
                    on_progress=lambda p: JARVISBridge._sistreams[task_id].update(p),
                )

                def _on_answer(qid: str, ans: str):
                    si.answer_question(qid, ans)

                self._si_instance = si

                if action == "analyze":
                    result = si.analyze()
                    JARVISBridge._sistreams[task_id].update({
                        "step": "analyze", "status": "completed",
                        "detail": json.dumps(result, ensure_ascii=False)[:5000],
                        "progress": 1.0, "done": True,
                        "result": result,
                    })
                elif action == "propose_and_execute":
                    proposal = si.analyze()
                    if proposal.get("steps"):
                        self._emit_si_progress(task_id, "proposal", "ready",
                                               json.dumps(proposal, indent=2, ensure_ascii=False)[:5000])
                        JARVISBridge._sistreams[task_id].update({
                            "pendingQuestion": {
                                "questionId": "si_proposal",
                                "question": (
                                    f"**Proposta de Melhoria**\n\n"
                                    f"**{proposal.get('summary', 'N/A')}**\n"
                                    f"Prioridade: {proposal.get('priority', 'N/A')}\n"
                                    f"Passos: {len(proposal.get('steps', []))}\n"
                                    f"{proposal.get('rationale', '')}\n\n"
                                    f"Deseja executar? (sim/não)"
                                ),
                                "toolName": "self_improvement",
                            }
                        })
                        si._answer_event = threading.Event()
                        si._answer_data = None
                        si._answer_event.wait(timeout=600)
                        if si._cancelled:
                            JARVISBridge._sistreams[task_id].update({
                                "step": "cancelled", "status": "cancelled", "done": True,
                            })
                            return
                        if si._answer_data and si._answer_data[1].strip().lower() in ("sim", "s", "yes", "y"):
                            JARVISBridge._sistreams[task_id].update({"pendingQuestion": None})
                            exec_result = si.execute_proposal(proposal)
                            JARVISBridge._sistreams[task_id].update({
                                "step": "executed", "status": "completed",
                                "detail": json.dumps(exec_result, ensure_ascii=False)[:5000],
                                "progress": 1.0, "done": True,
                                "result": {"proposal": proposal, "execution": exec_result},
                            })
                        else:
                            JARVISBridge._sistreams[task_id].update({
                                "step": "rejected", "status": "completed", "done": True,
                            })
                    else:
                        JARVISBridge._sistreams[task_id].update({
                            "step": "failed", "status": "error", "done": True,
                            "error": "No improvement steps generated",
                        })
                else:
                    result = si.full_cycle()
                    JARVISBridge._sistreams[task_id].update({
                        "step": "completed", "status": "completed",
                        "detail": json.dumps(result, ensure_ascii=False)[:5000],
                        "progress": 1.0, "done": True,
                        "result": result,
                    })

            except Exception as e:
                logger.exception("selfImprovementStream failed")
                JARVISBridge._sistreams[task_id]["error"] = str(e)
            finally:
                JARVISBridge._sistreams[task_id]["done"] = True

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        return {"taskId": task_id}

    def _emit_si_progress(self, task_id: str, step: str, status: str, detail: str, progress: float = 0.0):
        JARVISBridge._sistreams[task_id].update({
            "step": step, "status": status, "detail": detail, "progress": progress,
        })

    def selfImprovementGetStream(self, task_id: str) -> dict:
        stream = JARVISBridge._sistreams.get(task_id)
        if not stream:
            return {"done": True, "error": "Task not found"}
        d = dict(stream)
        if "result" in d:
            del d["result"]
        return d

    def selfImprovementAnswer(self, question_id: str, answer: str) -> dict:
        try:
            if self._si_instance:
                self._si_instance.answer_question(question_id, answer)
                return {"success": True}
            return {"success": False, "error": "No active improvement session"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def selfImprovementCancel(self, task_id: str) -> dict:
        try:
            if self._si_instance:
                self._si_instance.cancel()
            if task_id and task_id in JARVISBridge._sistreams:
                JARVISBridge._sistreams[task_id]["done"] = True
                JARVISBridge._sistreams[task_id]["cancelled"] = True
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

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
            if self._llm_router:
                resp = self._llm_router.generate(req)
            else:
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
            import pyperclip
            pyperclip.copy(text)
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

    def getLogPath(self) -> str:
        from jarvis.logging_config import get_log_dir
        return str(get_log_dir())

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
            process_found = False
            pid = 0

            if sys.platform == "win32":
                result = subprocess.run(
                    ["powershell", "-NoProfile", "-Command",
                     "Get-Process ollama -ErrorAction SilentlyContinue | Select-Object Id, CommandLine"],
                    capture_output=True, text=True, timeout=5,
                )
                if "ollama" in result.stdout.lower():
                    process_found = True
                    lines = result.stdout.strip().split("\n")
                    for line in lines:
                        if line.strip() and line.strip() != lines[0]:
                            parts = line.strip().split()
                            if parts:
                                try:
                                    pid = int(parts[0])
                                except ValueError:
                                    pass
            else:
                result = subprocess.run(
                    ["pgrep", "-f", "ollama"],
                    capture_output=True, text=True, timeout=5,
                )
                if result.stdout.strip():
                    process_found = True
                    pid = int(result.stdout.strip().split("\n")[0])

            if process_found:
                try:
                    ping_client = OllamaClient()
                    ping_client._client.timeout = httpx.Timeout(3.0)
                    ping_ok = ping_client.ping()
                    ping_client.close()
                except Exception:
                    ping_ok = False

                if ping_ok:
                    status["running"] = True
                    status["pid"] = pid
                    status["command"] = "ollama serve"
                    return status
                status["error"] = "Processo Ollama encontrado mas API não responde em localhost:11434"
                status["command"] = "ollama serve"
                return status

            # Not running — detect install path
            if sys.platform == "win32":
                paths = [
                    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Ollama\ollama.exe"),
                    os.path.expandvars(r"%PROGRAMFILES%\Ollama\ollama.exe"),
                    os.path.expandvars(r"%PROGRAMFILES(X86)%\Ollama\ollama.exe"),
                    os.path.expandvars(r"%USERPROFILE%\AppData\Local\Programs\Ollama\ollama.exe"),
                ]
                for p in paths:
                    if os.path.exists(p):
                        status["command"] = p
                        break
                else:
                    status["command"] = self._find_ollama_in_path()
            else:
                status["command"] = self._find_ollama_in_path()

        except Exception as e:
            status["error"] = str(e)
            status["command"] = self._find_ollama_in_path()

        return status

    def _find_ollama_in_path(self) -> str:
        try:
            result = subprocess.run(
                ["where" if sys.platform == "win32" else "which", "ollama"],
                capture_output=True, text=True, timeout=5,
            )
            if result.stdout.strip():
                return result.stdout.strip().split("\n")[0]
        except Exception:
            pass
        return "ollama serve"

    def startModelServer(self) -> bool:
        try:
            status = self.getModelServerStatus()
            if status.get("running"):
                return True
            cmd = status.get("command", "ollama serve")
            if sys.platform == "win32":
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                subprocess.Popen(
                    cmd,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=subprocess.CREATE_NO_WINDOW,
                    startupinfo=startupinfo,
                )
            else:
                subprocess.Popen(
                    [cmd] if " " not in cmd else cmd.split(),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            return True
        except Exception as e:
            logger.warning("startModelServer failed: %s", e)
            return False

    def showFolderPicker(self) -> str | None:
        try:
            if sys.platform == "win32":
                script = r"""
Add-Type -AssemblyName System.Windows.Forms
$folder = New-Object System.Windows.Forms.FolderBrowserDialog
$folder.Description = "Selecione a pasta do projeto"
$folder.ShowNewFolderButton = $true
$result = $folder.ShowDialog((New-Object System.Windows.Forms.Form -Property @{TopMost=$true}))
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $folder.SelectedPath
}
"""
                result = subprocess.run(
                    ["powershell", "-NoProfile", "-Command", script],
                    capture_output=True, text=True, timeout=30,
                )
                out = result.stdout.strip()
                return out if out and os.path.isdir(out) else None
            elif sys.platform == "darwin":
                script = 'set folderPath to choose folder with prompt "Selecione a pasta do projeto"\nif folderPath is not "" then return POSIX path of folderPath'
                result = subprocess.run(
                    ["osascript", "-e", script],
                    capture_output=True, text=True, timeout=30,
                )
                out = result.stdout.strip()
                return out if out and os.path.isdir(out) else None
            else:
                # Linux — use zenity or kdialog
                for cmd, args in [
                    ("zenity", ["zenity", "--file-selection", "--directory", "--title=Selecione a pasta do projeto"]),
                    ("kdialog", ["kdialog", "--getexistingdirectory", "."]),
                ]:
                    try:
                        result = subprocess.run(args, capture_output=True, text=True, timeout=30)
                        if result.returncode == 0:
                            out = result.stdout.strip()
                            return out if out and os.path.isdir(out) else None
                    except FileNotFoundError:
                        continue
                return None
        except Exception as e:
            logger.warning("showFolderPicker failed: %s", e)
            return None

    # ── Version / Update ────────────────────────────────────────────────

    def getAppVersion(self) -> dict:
        from jarvis.version import get_app_version
        return {"version": get_app_version(), "app_name": "JARVIS"}

    def checkForUpdates(self) -> dict:
        from jarvis.version import check_for_updates
        result = check_for_updates()
        return _serialize(result)

    def getAvailableVersions(self) -> list:
        from jarvis.version import get_available_versions
        return get_available_versions()

    def downloadAndInstall(self, version: str) -> dict:
        from jarvis.version import download_and_install
        try:
            result = download_and_install(version)
            return result
        except Exception as e:
            return {"success": False, "error": str(e), "restart": False}

    # ========================================================================
    # Voice Conversation (streaming)
    # ========================================================================

    _voice_streams: dict[str, dict] = {}

    def voiceConversationStream(self, audio_base64: str, conv_id: str = "", history: list | None = None, agent_id: str = "") -> dict:
        task_id = str(uuid.uuid4())
        stream = {
            "text": "", "response": "", "audioBase64": "",
            "status": "transcribing", "timings": {},
            "done": False, "error": None,
        }
        JARVISBridge._voice_streams[task_id] = stream

        def _run():
            try:
                agent_model = ""
                agent_provider = ""
                if agent_id and self._agents:
                    agent = self._agents.get_agent(agent_id)
                    if agent:
                        agent_model = agent.model or ""
                        agent_provider = getattr(agent, "provider", "")

                from jarvis.voice_conversation import run_pipeline

                def on_progress(**kw):
                    JARVISBridge._voice_streams[task_id].update(kw)

                stream["status"] = "transcribing"
                result = run_pipeline(
                    audio_base64,
                    llm_gateway=self._llm,
                    tools=self._tools,
                    model=agent_model,
                    provider=agent_provider,
                    history=history,
                    on_progress=on_progress,
                )
                JARVISBridge._voice_streams[task_id].update(result)
                stream["status"] = "done" if not result.get("error") else "error"
            except Exception as e:
                logger.exception("voiceConversationStream failed")
                JARVISBridge._voice_streams[task_id].update({"error": str(e), "status": "error"})
            finally:
                JARVISBridge._voice_streams[task_id]["done"] = True

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        return {"taskId": task_id}

    def voiceConversationGetStream(self, task_id: str) -> dict:
        stream = JARVISBridge._voice_streams.get(task_id)
        if not stream:
            return {"done": True, "error": "Task not found"}
        return dict(stream)

    # ========================================================================
    # Camera capture
    # ========================================================================

    def cameraCapture(self) -> dict:
        try:
            from jarvis.camera_service import CameraService
            cam = CameraService()
            return cam.capture()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def cameraAnalyze(self, prompt: str = "Describe what you see in this image") -> dict:
        try:
            from jarvis.camera_service import CameraService
            cam = CameraService()
            result = cam.capture()
            if not result["success"]:
                return result
            if not self._llm_router:
                return {"success": False, "error": "LLM not available"}
            from jarvis.llm_gateway import LLMRequest, LLMMessage, LLMProvider
            req = LLMRequest(
                provider=LLMProvider.OLLAMA,
                model="",
                messages=[LLMMessage(role="user", content=prompt)],
                images=[result["imageBase64"]],
            )
            resp = self._llm_router.generate(req)
            return {
                "success": True,
                "imageBase64": result["imageBase64"],
                "description": resp.content,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def quitApp(self) -> None:
        """Close the application window."""
        try:
            import webview
            for w in webview.windows:
                w.destroy()
        except Exception:
            import os
            os._exit(0)
