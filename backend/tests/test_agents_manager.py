import json
import pytest

from jarvis.database import Database
from jarvis.agents_manager import AgentsManager, CreateAgentDTO, Agent


@pytest.fixture
def db_with_agents(tmp_path):
    d = Database(tmp_path / "test.db")
    d.exec("""
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            model TEXT NOT NULL,
            system_prompt TEXT NOT NULL DEFAULT '',
            temperature REAL NOT NULL DEFAULT 0.7
                CHECK (temperature >= 0.0 AND temperature <= 2.0),
            max_tokens INTEGER NOT NULL DEFAULT 2048 CHECK (max_tokens > 0),
            specialty TEXT NOT NULL DEFAULT 'general',
            tools TEXT NOT NULL DEFAULT '[]',
            is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
            can_orchestrate INTEGER NOT NULL DEFAULT 1 CHECK (can_orchestrate IN (0,1)),
            priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 0 AND priority <= 10),
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    """)
    yield d
    d.close()


@pytest.fixture
def manager(db_with_agents):
    return AgentsManager(db_with_agents)


@pytest.fixture
def empty_db(tmp_path):
    d = Database(tmp_path / "empty.db")
    d.exec("""
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            model TEXT NOT NULL,
            system_prompt TEXT NOT NULL DEFAULT '',
            temperature REAL NOT NULL DEFAULT 0.7,
            max_tokens INTEGER NOT NULL DEFAULT 2048,
            specialty TEXT NOT NULL DEFAULT 'general',
            tools TEXT NOT NULL DEFAULT '[]',
            is_default INTEGER NOT NULL DEFAULT 0,
            can_orchestrate INTEGER NOT NULL DEFAULT 1,
            priority INTEGER NOT NULL DEFAULT 5,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    """)
    yield d
    d.close()


def test_seeds_default_agents_on_empty_db(empty_db):
    count_before = empty_db.fetchone("SELECT COUNT(*) AS cnt FROM agents")["cnt"]
    assert count_before == 0

    manager = AgentsManager(empty_db)
    agents = manager.list_agents()

    assert len(agents) >= 2
    names = [a.name for a in agents]
    assert "Assistant Geral" in names
    assert "Code Expert" in names


def test_list_agents_returns_seeded(manager):
    agents = manager.list_agents()
    assert len(agents) >= 2


def test_get_agent_by_id(manager):
    agents = manager.list_agents()
    agent = manager.get_agent(agents[0].id)
    assert agent is not None
    assert agent.id == agents[0].id


def test_get_agent_nonexistent(manager):
    agent = manager.get_agent("nonexistent-id")
    assert agent is None


def test_create_agent(manager):
    dto = CreateAgentDTO(
        name="Test Agent",
        model="llama3.2:3b",
        description="A test agent",
        system_prompt="You are a test agent.",
        temperature=0.5,
        max_tokens=1024,
        specialty="chat",
        tools=["read_file", "write_file"],
        can_orchestrate=False,
        priority=3,
    )
    agent = manager.create_agent(dto)
    assert agent.name == "Test Agent"
    assert agent.model == "llama3.2:3b"
    assert agent.temperature == 0.5
    assert agent.max_tokens == 1024
    assert agent.specialty == "chat"
    assert agent.tools == ["read_file", "write_file"]
    assert agent.can_orchestrate is False
    assert agent.priority == 3
    assert agent.id != ""


def test_create_agent_defaults(manager):
    dto = CreateAgentDTO(name="Default Agent", model="mistral:7b")
    agent = manager.create_agent(dto)
    assert agent.temperature == 0.7
    assert agent.max_tokens == 2048
    assert agent.specialty == "general"
    assert agent.tools == []
    assert agent.can_orchestrate is True
    assert agent.priority == 5


def test_update_agent(manager):
    agents = manager.list_agents()
    original = agents[0]

    dto = CreateAgentDTO(
        name="Updated Name",
        description="Updated description",
        model="codellama:7b",
        temperature=0.1,
        max_tokens=4096,
        specialty="code",
        tools=["git_commit"],
        can_orchestrate=True,
        priority=10,
    )
    updated = manager.update_agent(original.id, dto)
    assert updated is not None
    assert updated.name == "Updated Name"
    assert updated.temperature == 0.1
    assert updated.max_tokens == 4096
    assert updated.tools == ["git_commit"]


def test_update_agent_nonexistent(manager):
    dto = CreateAgentDTO(name="Ghost")
    result = manager.update_agent("no-such-id", dto)
    assert result is None


def test_delete_agent(manager):
    agents = manager.list_agents()
    target = agents[0]
    assert manager.delete_agent(target.id) is True
    assert manager.get_agent(target.id) is None


def test_delete_agent_nonexistent(manager):
    assert manager.delete_agent("no-such-id") is False


def test_set_default_agent(manager):
    agents = manager.list_agents()
    target_id = agents[-1].id

    assert manager.set_default_agent(target_id) is True

    default = manager.get_default_agent()
    assert default is not None
    assert default.id == target_id
    assert default.is_default is True


def test_get_default_agent_falls_back(empty_db):
    manager = AgentsManager(empty_db)  # seeds 2 agents
    empty_db.execute("DELETE FROM agents")
    dto = CreateAgentDTO(name="Orphan", model="llama3")
    agent = manager.create_agent(dto)
    default = manager.get_default_agent()
    assert default is not None
    assert default.name == "Orphan"


def test_get_default_agent_empty(empty_db):
    manager = AgentsManager(empty_db)
    # Clear any seeded agents
    empty_db.execute("DELETE FROM agents")
    default = manager.get_default_agent()
    assert default is None


def test_get_orchestration_pool(manager):
    pool = manager.get_orchestration_pool()
    for agent in pool:
        assert agent.can_orchestrate is True


def test_orchestration_pool_excludes_non_orchestrators(manager):
    dto = CreateAgentDTO(
        name="Non-Orch",
        model="llama3",
        can_orchestrate=False,
    )
    manager.create_agent(dto)
    pool = manager.get_orchestration_pool()
    names = [a.name for a in pool]
    assert "Non-Orch" not in names


def test_list_agents_ordered_by_priority(manager):
    manager.create_agent(CreateAgentDTO(name="Low", model="m", priority=1))
    manager.create_agent(CreateAgentDTO(name="High", model="m", priority=10))
    agents = manager.list_agents()
    idx_low = next(i for i, a in enumerate(agents) if a.name == "Low")
    idx_high = next(i for i, a in enumerate(agents) if a.name == "High")
    assert idx_high < idx_low


def test_agent_tools_roundtrip(manager):
    dto = CreateAgentDTO(
        name="Tool Agent",
        model="llama3",
        tools=["a", "b", "c"],
    )
    agent = manager.create_agent(dto)
    assert agent.tools == ["a", "b", "c"]


def test_agent_temperature_clamped_by_db(manager):
    import sqlite3
    with pytest.raises(sqlite3.IntegrityError):
        manager.create_agent(CreateAgentDTO(
            name="Bad Temp", model="m", temperature=99.9,
        ))
