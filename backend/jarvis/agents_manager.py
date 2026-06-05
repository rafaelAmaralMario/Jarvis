import datetime
import json
import secrets
from dataclasses import dataclass, field

from jarvis.database import Database


@dataclass
class CreateAgentDTO:
    name: str = ""
    description: str = ""
    model: str = ""
    system_prompt: str = ""
    temperature: float = 0.7
    max_tokens: int = 2048
    specialty: str = "general"
    tools: list[str] = field(default_factory=list)
    can_orchestrate: bool = True
    priority: int = 5


@dataclass
class Agent:
    id: str = ""
    name: str = ""
    description: str = ""
    model: str = ""
    system_prompt: str = ""
    temperature: float = 0.0
    max_tokens: int = 0
    specialty: str = ""
    tools: list[str] = field(default_factory=list)
    is_default: bool = False
    can_orchestrate: bool = False
    priority: int = 0
    created_at: str = ""
    updated_at: str = ""


def _row_to_agent(row) -> Agent:
    return Agent(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        model=row["model"],
        system_prompt=row["system_prompt"],
        temperature=row["temperature"],
        max_tokens=row["max_tokens"],
        specialty=row["specialty"],
        tools=json.loads(row["tools"]) if row["tools"] else [],
        is_default=bool(row["is_default"]),
        can_orchestrate=bool(row["can_orchestrate"]),
        priority=row["priority"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


_SEED_AGENTS = [
    {
        "name": "Assistant Geral",
        "description": "Assistente geral para tarefas do dia a dia",
        "model": "llama3.2:3b",
        "system_prompt": (
            "Voce e o JARVIS, um assistente de IA util, amigavel e preciso. "
            "Responda em portugues brasileiro. Use markdown para formatar respostas."
        ),
        "temperature": 0.7,
        "max_tokens": 2048,
        "specialty": "general",
        "is_default": 1,
        "can_orchestrate": 1,
        "priority": 5,
    },
    {
        "name": "Code Expert",
        "description": "Especialista em revisao de codigo e arquitetura",
        "model": "codellama:7b",
        "system_prompt": (
            "Voce e um engenheiro de software senior especializado em C++, "
            "arquitetura limpa e design patterns. Revise codigo, sugira "
            "melhorias e explique conceitos complexos."
        ),
        "temperature": 0.2,
        "max_tokens": 4096,
        "specialty": "code",
        "is_default": 0,
        "can_orchestrate": 1,
        "priority": 8,
    },
]


class AgentsManager:
    def __init__(self, db: Database):
        self._db = db
        self._seed_if_empty()

    def list_agents(self) -> list[Agent]:
        rows = self._db.fetchall(
            "SELECT * FROM agents ORDER BY priority DESC, name ASC"
        )
        return [_row_to_agent(r) for r in rows]

    def get_agent(self, id: str) -> Agent | None:
        row = self._db.fetchone("SELECT * FROM agents WHERE id = ?", (id,))
        return _row_to_agent(row) if row else None

    def create_agent(self, dto: CreateAgentDTO) -> Agent:
        now = _now()
        tools_json = json.dumps(dto.tools)
        agent_id = secrets.token_hex(16).lower()
        self._db.execute(
            """
            INSERT INTO agents (id, name, description, model, system_prompt,
                                temperature, max_tokens, specialty, tools,
                                can_orchestrate, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                agent_id,
                dto.name,
                dto.description,
                dto.model,
                dto.system_prompt,
                dto.temperature,
                dto.max_tokens,
                dto.specialty,
                tools_json,
                1 if dto.can_orchestrate else 0,
                dto.priority,
            ),
        )
        return self.get_agent(agent_id)

    def update_agent(self, id: str, dto: CreateAgentDTO) -> Agent | None:
        now = _now()
        tools_json = json.dumps(dto.tools)
        self._db.execute(
            """
            UPDATE agents SET
                name = ?, description = ?, model = ?, system_prompt = ?,
                temperature = ?, max_tokens = ?, specialty = ?, tools = ?,
                can_orchestrate = ?, priority = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                dto.name,
                dto.description,
                dto.model,
                dto.system_prompt,
                dto.temperature,
                dto.max_tokens,
                dto.specialty,
                tools_json,
                1 if dto.can_orchestrate else 0,
                dto.priority,
                now,
                id,
            ),
        )
        return self.get_agent(id)

    def delete_agent(self, id: str) -> bool:
        self._db.execute("DELETE FROM agents WHERE id = ?", (id,))
        return self._db.fetchone("SELECT changes()")[0] > 0

    def set_default_agent(self, id: str) -> bool:
        now = _now()
        self._db.begin()
        try:
            self._db.execute(
                "UPDATE agents SET is_default = 0, updated_at = ?", (now,)
            )
            self._db.execute(
                "UPDATE agents SET is_default = 1, updated_at = ? WHERE id = ?",
                (now, id),
            )
            self._db.commit()
            return True
        except Exception:
            self._db.rollback()
            return False

    def get_default_agent(self) -> Agent | None:
        row = self._db.fetchone(
            "SELECT * FROM agents WHERE is_default = 1 LIMIT 1"
        )
        if row:
            return _row_to_agent(row)
        row = self._db.fetchone("SELECT * FROM agents LIMIT 1")
        return _row_to_agent(row) if row else None

    def get_orchestration_pool(self) -> list[Agent]:
        rows = self._db.fetchall(
            "SELECT * FROM agents WHERE can_orchestrate = 1 "
            "ORDER BY priority DESC, name ASC"
        )
        return [_row_to_agent(r) for r in rows]

    def _seed_if_empty(self) -> None:
        row = self._db.fetchone("SELECT COUNT(*) AS cnt FROM agents")
        if row and row["cnt"] == 0:
            for agent in _SEED_AGENTS:
                self._db.execute(
                    """
                    INSERT INTO agents (name, description, model, system_prompt,
                        temperature, max_tokens, specialty, is_default,
                        can_orchestrate, priority)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        agent["name"],
                        agent["description"],
                        agent["model"],
                        agent["system_prompt"],
                        agent["temperature"],
                        agent["max_tokens"],
                        agent["specialty"],
                        agent["is_default"],
                        agent["can_orchestrate"],
                        agent["priority"],
                    ),
                )


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%S.%fZ"
    )
