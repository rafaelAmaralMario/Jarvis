import datetime
import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Callable

from jarvis.agents_manager import AgentsManager, Agent
from jarvis.database import Database
from jarvis.llm_gateway import LLMGateway, LLMProvider, LLMRequest, LLMMessage
from jarvis.models_manager import ModelsManager


@dataclass
class OrchestrationConfig:
    enabled: bool = True
    orchestrator_model: str = ""
    critic_enabled: bool = True
    critic_temperature: float = 0.1
    max_agents_per_query: int = 3
    show_trace: bool = True


@dataclass
class AgentResult:
    agent_name: str = ""
    specialty: str = ""
    model: str = ""
    response: str = ""
    tokens_used: int = 0
    latency_ms: int = 0


@dataclass
class AgentTrace:
    query_id: str = ""
    query: str = ""
    orchestrator_reasoning: str = ""
    agents_consulted: list[AgentResult] = field(default_factory=list)
    critic_review: str = ""
    final_response: str = ""


_SPECIALTY_ICONS = {
    "code": "💻",
    "reasoning": "🧠",
    "embedding": "📐",
    "chat": "💬",
}

_DEFAULT_CRITIC_PROMPT = (
    "You are a critic agent. Review this response for:\n"
    "1. Does it fully answer the user's query?\n"
    "2. Is the information accurate?\n"
    "3. Is it well-formatted?\n"
    "4. Any improvements needed?\n\n"
    "User query: {query}\n\n"
    "Response to review:\n{responses}\n\n"
    "If approved, start with '✅ Aprovado'. If changes needed, start with '🔄 Refinar'."
)

_DEFAULT_ROUTING_PROMPT = (
    "You are an orchestrator. Analyze this user query and decide which specialist "
    "agent(s) to route it to. Available agents:\n{agents}\n"
    "User query: {query}\n\n"
    "Respond with ONLY a comma-separated list of agent names that should handle this. "
    "If none match, respond with 'default'."
)


class OrchestrationManager:
    def __init__(
        self,
        models: ModelsManager,
        agents: AgentsManager,
        db: Database,
        llm_gateway: LLMGateway,
    ):
        self._models = models
        self._agents = agents
        self._db = db
        self._llm = llm_gateway
        self._stream_cb: Callable[[str], None] | None = None
        self._traces: dict[str, AgentTrace] = {}
        self._load_config()

    def set_stream_callback(self, cb: Callable[[str], None]) -> None:
        self._stream_cb = cb

    def execute_query(self, query: str) -> str:
        if not self._config.enabled or not self._stream_cb:
            return self._execute_single_agent(query)

        query_id = uuid.uuid4().hex
        trace = AgentTrace(query_id=query_id, query=query)

        self._emit_chunk("\n")
        self._emit_chunk("🧠 **Orquestrador**: Analisando sua pergunta...\n\n")

        plan_reasoning, agent_names = self._orchestrator_plan(query)
        trace.orchestrator_reasoning = plan_reasoning
        self._emit_chunk(plan_reasoning + "\n\n---\n\n")

        for agent_name in agent_names[:self._config.max_agents_per_query]:
            agent = self._find_agent(agent_name)
            if not agent:
                continue

            icon = _SPECIALTY_ICONS.get(agent.specialty, "🤖")
            self._emit_chunk(f"**{icon} {agent.name}**: trabalhando...\n\n")

            t1 = time.monotonic()
            response = self._execute_agent(agent, query)
            t2 = time.monotonic()

            result = AgentResult(
                agent_name=agent.name,
                specialty=agent.specialty,
                model=agent.model,
                response=response,
                latency_ms=int((t2 - t1) * 1000),
            )
            trace.agents_consulted.append(result)
            self._emit_chunk(response + "\n\n---\n\n")

        if self._config.critic_enabled:
            self._emit_chunk("🧠 **Critic Agent**: Revisando resposta...\n\n")
            review = self._critic_review(query, trace)
            trace.critic_review = review
            self._emit_chunk(review + "\n\n")

        final_response = self._consolidate_response(trace)
        trace.final_response = final_response
        self._traces[query_id] = trace

        return final_response

    def get_trace(self, query_id: str) -> AgentTrace | None:
        return self._traces.get(query_id)

    def get_config(self) -> OrchestrationConfig:
        return self._config

    def update_config(self, config: OrchestrationConfig) -> bool:
        self._config = config
        now = _now()
        self._db.execute(
            """
            UPDATE orchestration_config SET
                enabled = ?, orchestrator_model = ?, critic_enabled = ?,
                critic_temperature = ?, max_agents_per_query = ?,
                show_trace = ?, updated_at = ?
            WHERE id = 1
            """,
            (
                1 if config.enabled else 0,
                config.orchestrator_model,
                1 if config.critic_enabled else 0,
                config.critic_temperature,
                config.max_agents_per_query,
                1 if config.show_trace else 0,
                now,
            ),
        )
        return True

    def _load_config(self) -> None:
        row = self._db.fetchone(
            "SELECT * FROM orchestration_config WHERE id = 1"
        )
        if row:
            self._config = OrchestrationConfig(
                enabled=bool(row["enabled"]),
                orchestrator_model=row["orchestrator_model"],
                critic_enabled=bool(row["critic_enabled"]),
                critic_temperature=row["critic_temperature"],
                max_agents_per_query=row["max_agents_per_query"],
                show_trace=bool(row["show_trace"]),
            )
        else:
            self._config = OrchestrationConfig()

    def _execute_single_agent(self, query: str) -> str:
        agent = self._agents.get_default_agent()
        if not agent:
            return "No agent configured."
        return self._execute_agent(agent, query)

    def _execute_agent(self, agent: Agent, query: str) -> str:
        messages = [LLMMessage(role="user", content=query)]
        system = agent.system_prompt
        if system:
            system += "\n\nResponda em markdown."
        provider_str = agent.provider if agent.provider else "ollama"
        req = LLMRequest(
            provider=LLMProvider(provider_str),
            model=agent.model,
            messages=messages,
            system=system or "",
            temperature=agent.temperature,
            max_tokens=agent.max_tokens,
        )
        try:
            result = self._llm.generate(req)
            return result.content
        except Exception as e:
            return f"**Erro ao executar agente '{agent.name}':** {e}"

    def _orchestrator_plan(self, query: str) -> tuple[str, list[str]]:
        pool = self._agents.get_orchestration_pool()
        agent_names: list[str] = []

        if not pool:
            reasoning = (
                "Nenhum agent especializado disponivel. Usando assistente padrao."
            )
            default = self._agents.get_default_agent()
            if default:
                agent_names.append(default.name)
            return reasoning, agent_names

        agent_list = "\n".join(
            f"- {a.name} ({a.specialty}): {a.description}"
            for a in pool[:5]
        )

        routing_prompt = _DEFAULT_ROUTING_PROMPT.format(
            agents=agent_list, query=query
        )

        model = (
            self._config.orchestrator_model
            if self._config.orchestrator_model
            else pool[0].model
        )
        req = LLMRequest(
            model=model,
            messages=[LLMMessage(role="user", content=routing_prompt)],
            temperature=0.1,
            max_tokens=256,
        )

        try:
            result = self._llm.generate(req)
            response = result.content.strip()
            agent_names = [
                name.strip()
                for name in response.split(",")
                if name.strip()
            ]
            reasoning = f"📋 **Roteamento**: {response}"
        except Exception as e:
            reasoning = (
                f"⚠️ Orchestrator error: {e}. Usando agente padrao."
            )
            default = self._agents.get_default_agent()
            if default:
                agent_names.append(default.name)

        if not agent_names:
            agent_names.append("default")

        return reasoning, agent_names

    def _critic_review(self, query: str, trace: AgentTrace) -> str:
        combined = "\n\n".join(
            f"Agent: {r.agent_name}\n{r.response}"
            for r in trace.agents_consulted
        )
        prompt = _DEFAULT_CRITIC_PROMPT.format(
            query=query, responses=combined
        )

        pool = self._agents.get_orchestration_pool()
        model = pool[0].model if pool else "llama3.2"

        req = LLMRequest(
            model=model,
            messages=[LLMMessage(role="user", content=prompt)],
            temperature=self._config.critic_temperature,
            max_tokens=512,
        )
        try:
            result = self._llm.generate(req)
            return result.content
        except Exception:
            return "✅ Aprovado (critico indisponivel)"

    def _consolidate_response(self, trace: AgentTrace) -> str:
        if not trace.agents_consulted:
            return "Nenhuma resposta gerada."
        return trace.agents_consulted[-1].response

    def _find_agent(self, name: str) -> Agent | None:
        agents = self._agents.list_agents()
        for a in agents:
            if a.name == name or a.id == name:
                return a
        return self._agents.get_default_agent()

    def _emit_chunk(self, chunk: str) -> None:
        if self._stream_cb:
            self._stream_cb(chunk)


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%S.%fZ"
    )
