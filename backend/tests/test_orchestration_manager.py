from unittest.mock import MagicMock

import pytest

from jarvis.agents_manager import Agent, AgentsManager
from jarvis.database import Database
from jarvis.llm_gateway import LLMGateway
from jarvis.models_manager import ModelsManager
from jarvis.ollama_client import (
    OllamaClient,
    OllamaGenerateRequest,
    OllamaGenerateResponse,
)
from jarvis.orchestration_manager import (
    OrchestrationConfig,
    OrchestrationManager,
)


@pytest.fixture
def db():
    return MagicMock(spec=Database)


@pytest.fixture
def ollama():
    mock = MagicMock(spec=OllamaClient)

    def fake_generate(req: OllamaGenerateRequest) -> OllamaGenerateResponse:
        return OllamaGenerateResponse(
            response=f"Response for: {req.prompt[:60]}",
            done=True,
            eval_count=50,
        )

    mock.generate.side_effect = fake_generate
    return mock


@pytest.fixture
def llm_gateway(ollama):
    mock = MagicMock(spec=LLMGateway)
    fake_resp = MagicMock()
    fake_resp.content = "Response for: test"
    fake_resp.provider = "ollama"
    mock.generate.return_value = fake_resp
    return mock


@pytest.fixture
def default_agent():
    return Agent(
        id="agent_default",
        name="Assistant Geral",
        specialty="chat",
        model="llama3.2:3b",
        system_prompt="You are a helpful assistant.",
        temperature=0.7,
        max_tokens=2048,
        can_orchestrate=True,
    )


@pytest.fixture
def code_agent():
    return Agent(
        id="agent_code",
        name="Code Expert",
        specialty="code",
        model="qwen2.5-coder:7b",
        system_prompt="You are a code expert.",
        temperature=0.3,
        max_tokens=4096,
        can_orchestrate=True,
    )


@pytest.fixture
def agents(default_agent, code_agent):
    mock = MagicMock(spec=AgentsManager)
    mock.get_default_agent.return_value = default_agent
    mock.get_orchestration_pool.return_value = [default_agent, code_agent]
    mock.list_agents.return_value = [default_agent, code_agent]
    return mock


@pytest.fixture
def models():
    return MagicMock(spec=ModelsManager)


@pytest.fixture
def manager(db, agents, models, llm_gateway):
    return OrchestrationManager(models=models, agents=agents, db=db, llm_gateway=llm_gateway)


class TestOrchestrationManager:
    def test_execute_single_agent(self, manager, default_agent):
        config = manager.get_config()
        assert isinstance(config, OrchestrationConfig)

    def test_get_config_loads_defaults(self, db, agents, models, llm_gateway):
        db.fetchone.return_value = None
        m = OrchestrationManager(models=models, agents=agents, db=db, llm_gateway=llm_gateway)
        config = m.get_config()
        assert config.enabled is True
        assert config.critic_enabled is True
        assert config.critic_temperature == 0.1
        assert config.max_agents_per_query == 3
        assert config.show_trace is True

    def test_update_config_persists(self, db, agents, models, llm_gateway):
        db.fetchone.return_value = None
        m = OrchestrationManager(models=models, agents=agents, db=db, llm_gateway=llm_gateway)
        new_cfg = OrchestrationConfig(
            enabled=False,
            critic_enabled=False,
            critic_temperature=0.5,
            max_agents_per_query=5,
            show_trace=False,
        )
        assert m.update_config(new_cfg) is True
        db.execute.assert_called_once()

    def test_get_trace_returns_none_for_unknown(self, manager):
        assert manager.get_trace("nonexistent") is None

    def test_execute_single_agent_disabled(self, manager, llm_gateway):
        manager._config.enabled = False
        result = manager.execute_query("Hello")
        assert isinstance(result, str)

    def test_execute_single_agent_no_agent(self, manager, agents):
        agents.get_default_agent.return_value = None
        manager._config.enabled = False
        result = manager.execute_query("Hello")
        assert result == "No agent configured."

    def test_execute_orchestrated_query(self, manager, llm_gateway):
        chunks = []
        manager.set_stream_callback(lambda c: chunks.append(c))
        result = manager.execute_query("Review this code")
        assert isinstance(result, str)

    def test_orchestrated_query_produces_trace(self, manager, llm_gateway):
        chunks = []
        manager.set_stream_callback(lambda c: chunks.append(c))
        result = manager.execute_query("Write a function")
        assert isinstance(result, str)

    def test_orchestrator_fallback_empty_pool(self, manager, agents):
        agents.get_orchestration_pool.return_value = []
        agents.get_default_agent.return_value = agents.list_agents.return_value[0]
        reasoning, names = manager._orchestrator_plan("Hello")
        assert len(names) >= 0

    def test_execute_agent_builds_correct_request(self, manager, default_agent, llm_gateway):
        manager._execute_agent(default_agent, "test prompt")
        call_args = llm_gateway.generate.call_args[0][0]
        assert call_args.model == default_agent.model

    def test_emit_chunk_no_callback(self, manager):
        manager._emit_chunk("test")

    def test_emit_chunk_with_callback(self, manager):
        received = []
        manager.set_stream_callback(lambda c: received.append(c))
        manager._emit_chunk("hello ")
        manager._emit_chunk("world")
        assert received == ["hello ", "world"]

    def test_find_agent_by_name(self, manager, code_agent):
        assert manager._find_agent("Code Expert") is code_agent

    def test_find_agent_by_id(self, manager, code_agent):
        assert manager._find_agent("agent_code") is code_agent

    def test_find_agent_unknown_returns_default(self, manager, default_agent):
        assert manager._find_agent("nonexistent") is default_agent
