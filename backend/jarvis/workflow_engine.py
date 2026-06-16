"""Workflow Automation Engine — step-based execution with triggers."""

import json
import logging
import time
from dataclasses import dataclass, field
from typing import Callable

import httpx

from jarvis.database import Database

logger = logging.getLogger(__name__)


class WorkflowStepType:
    RUN_COMMAND = "run_command"
    API_CALL = "api_call"
    AI_QUERY = "ai_query"
    WAIT = "wait"
    CONDITION = "condition"
    CREATE_NOTE = "create_note"
    SEARCH_NOTES = "search_notes"
    SEND_MESSAGE = "send_message"
    GIT_COMMIT = "git_commit"


@dataclass
class WorkflowStep:
    id: str = ""
    type: str = ""
    name: str = ""
    config: dict = field(default_factory=dict)
    next_on_success: str = ""
    next_on_failure: str = ""


@dataclass
class Workflow:
    id: str = ""
    name: str = ""
    description: str = ""
    trigger_type: str = "manual"
    trigger_config: str = "{}"
    steps: str = "[]"
    enabled: bool = True


@dataclass
class WorkflowExecution:
    id: str = ""
    workflow_id: str = ""
    status: str = "pending"
    trigger: str = ""
    started_at: str = ""
    completed_at: str = ""
    results: str = "[]"


# ---------------------------------------------------------------------------
# Built-in software development workflows
# ---------------------------------------------------------------------------
_BUILTIN_WORKFLOWS = [
    {
        "id": "wf000000-0000-0000-0000-000000000001",
        "name": "Ciclo Completo de Desenvolvimento",
        "description": "Fluxo completo de desenvolvimento de software: análise de requisitos, arquitetura, design, implementação, testes, revisão, deploy e documentação.",
        "trigger_type": "manual",
        "trigger_config": {},
        "enabled": True,
        "steps": [
            {
                "id": "s1", "type": "ai_query", "name": "Análise de Requisitos",
                "config": {"agent": "Analista de Requisitos", "prompt": "Analise os requisitos do projeto e documente histórias de usuário, critérios de aceitação e regras de negócio."},
                "nextOnSuccess": "s2", "nextOnFailure": "",
            },
            {
                "id": "s2", "type": "ai_query", "name": "Arquitetura de Software",
                "config": {"agent": "Arquiteto de Software", "prompt": "Com base nos requisitos, projete a arquitetura do sistema, escolha tecnologias e documente decisões arquiteturais."},
                "nextOnSuccess": "s3", "nextOnFailure": "",
            },
            {
                "id": "s3", "type": "ai_query", "name": "Design de Software",
                "config": {"agent": "Designer de Software", "prompt": "Projete a interface do usuário, árvore de componentes e fluxos de navegação baseados na arquitetura definida."},
                "nextOnSuccess": "s4", "nextOnFailure": "",
            },
            {
                "id": "s4", "type": "ai_query", "name": "Planejamento Técnico",
                "config": {"agent": "Engenheiro de Software", "prompt": "Planeje tecnicamente a implementação: divida em tarefas, estime esforço e defina a estratégia de desenvolvimento."},
                "nextOnSuccess": "s5", "nextOnFailure": "",
            },
            {
                "id": "s5", "type": "ai_query", "name": "Implementação",
                "config": {"agent": "Desenvolvedor Full-Stack", "prompt": "Implemente o código seguindo as especificações de arquitetura, design e planejamento técnico."},
                "nextOnSuccess": "s6", "nextOnFailure": "",
            },
            {
                "id": "s6", "type": "ai_query", "name": "Testes",
                "config": {"agent": "Especialista em Testes", "prompt": "Crie e execute testes para validar a implementação: unitários, integração e end-to-end."},
                "nextOnSuccess": "s7", "nextOnFailure": "",
            },
            {
                "id": "s7", "type": "ai_query", "name": "Revisão de Código",
                "config": {"agent": "Revisor de Código", "prompt": "Revise o código implementado e os testes. Identifique problemas e sugira melhorias."},
                "nextOnSuccess": "s8", "nextOnFailure": "s5",
            },
            {
                "id": "s8", "type": "ai_query", "name": "Documentação",
                "config": {"agent": "Documentador Técnico", "prompt": "Documente o projeto: README, API docs, guias de uso e contribuição."},
                "nextOnSuccess": "", "nextOnFailure": "",
            },
        ],
    },
    {
        "id": "wf000000-0000-0000-0000-000000000002",
        "name": "Análise e Planejamento",
        "description": "Fluxo inicial de análise de requisitos, arquitetura e planejamento técnico para novos projetos ou funcionalidades.",
        "trigger_type": "manual",
        "trigger_config": {},
        "enabled": True,
        "steps": [
            {
                "id": "s1", "type": "ai_query", "name": "Análise de Requisitos",
                "config": {"agent": "Analista de Requisitos", "prompt": "Analise os requisitos e produza um documento de especificação detalhado."},
                "nextOnSuccess": "s2", "nextOnFailure": "",
            },
            {
                "id": "s2", "type": "ai_query", "name": "Arquitetura",
                "config": {"agent": "Arquiteto de Software", "prompt": "Projete a arquitetura baseada nos requisitos aprovados."},
                "nextOnSuccess": "s3", "nextOnFailure": "",
            },
            {
                "id": "s3", "type": "ai_query", "name": "Design",
                "config": {"agent": "Designer de Software", "prompt": "Projete a interface e experiência do usuário."},
                "nextOnSuccess": "s4", "nextOnFailure": "",
            },
            {
                "id": "s4", "type": "ai_query", "name": "Planejamento Técnico",
                "config": {"agent": "Engenheiro de Software", "prompt": "Crie o plano de implementação com tarefas, estimativas e milestones."},
                "nextOnSuccess": "", "nextOnFailure": "",
            },
        ],
    },
    {
        "id": "wf000000-0000-0000-0000-000000000003",
        "name": "Implementação e Desenvolvimento",
        "description": "Fluxo de codificação com implementação, testes e revisão para garantir código de qualidade.",
        "trigger_type": "manual",
        "trigger_config": {},
        "enabled": True,
        "steps": [
            {
                "id": "s1", "type": "ai_query", "name": "Planejamento da Implementação",
                "config": {"agent": "Engenheiro de Software", "prompt": "Analise as especificações e crie um plano detalhado de implementação."},
                "nextOnSuccess": "s2", "nextOnFailure": "",
            },
            {
                "id": "s2", "type": "ai_query", "name": "Desenvolvimento",
                "config": {"agent": "Desenvolvedor Full-Stack", "prompt": "Implemente o código seguindo o plano de implementação."},
                "nextOnSuccess": "s3", "nextOnFailure": "",
            },
            {
                "id": "s3", "type": "ai_query", "name": "Testes",
                "config": {"agent": "Especialista em Testes", "prompt": "Crie testes abrangentes para o código implementado."},
                "nextOnSuccess": "s4", "nextOnFailure": "",
            },
            {
                "id": "s4", "type": "ai_query", "name": "Revisão de Código",
                "config": {"agent": "Revisor de Código", "prompt": "Revise o código e os testes produzidos."},
                "nextOnSuccess": "", "nextOnFailure": "s2",
            },
        ],
    },
    {
        "id": "wf000000-0000-0000-0000-000000000004",
        "name": "Testes e Garantia de Qualidade",
        "description": "Fluxo completo de testes e validação de qualidade: unitários, integração, e2e e revisão.",
        "trigger_type": "manual",
        "trigger_config": {},
        "enabled": True,
        "steps": [
            {
                "id": "s1", "type": "ai_query", "name": "Plano de Testes",
                "config": {"agent": "Especialista em Testes", "prompt": "Crie um plano de testes abrangente baseado nos requisitos e na implementação."},
                "nextOnSuccess": "s2", "nextOnFailure": "",
            },
            {
                "id": "s2", "type": "ai_query", "name": "Implementação de Testes",
                "config": {"agent": "Desenvolvedor Full-Stack", "prompt": "Implemente os testes conforme o plano de testes definido."},
                "nextOnSuccess": "s3", "nextOnFailure": "",
            },
            {
                "id": "s3", "type": "ai_query", "name": "Execução e Relatório",
                "config": {"agent": "Especialista em Testes", "prompt": "Execute os testes, analise resultados e produza relatório de qualidade."},
                "nextOnSuccess": "s4", "nextOnFailure": "s2",
            },
            {
                "id": "s4", "type": "ai_query", "name": "Revisão de Qualidade",
                "config": {"agent": "Revisor de Código", "prompt": "Revise a qualidade geral: cobertura de testes, code smells e métricas."},
                "nextOnSuccess": "", "nextOnFailure": "",
            },
        ],
    },
    {
        "id": "wf000000-0000-0000-0000-000000000005",
        "name": "Revisão e Documentação",
        "description": "Fluxo final de revisão de código, documentação técnica e preparação para deploy.",
        "trigger_type": "manual",
        "trigger_config": {},
        "enabled": True,
        "steps": [
            {
                "id": "s1", "type": "ai_query", "name": "Revisão de Código",
                "config": {"agent": "Revisor de Código", "prompt": "Realize uma revisão completa do código-fonte do projeto."},
                "nextOnSuccess": "s2", "nextOnFailure": "",
            },
            {
                "id": "s2", "type": "ai_query", "name": "Documentação Técnica",
                "config": {"agent": "Documentador Técnico", "prompt": "Crie a documentação técnica completa do projeto."},
                "nextOnSuccess": "s3", "nextOnFailure": "",
            },
            {
                "id": "s3", "type": "ai_query", "name": "Preparação para Deploy",
                "config": {"agent": "Especialista em DevOps", "prompt": "Prepare a configuração de infraestrutura e deploy para o projeto."},
                "nextOnSuccess": "", "nextOnFailure": "",
            },
        ],
    },
]


class WorkflowEngine:
    def __init__(self, db: Database):
        self._db = db
        self._step_handlers: dict[str, Callable] = {}
        self._register_default_handlers()
        self._ensure_builtins()

    def _register_default_handlers(self):
        self._step_handlers[WorkflowStepType.RUN_COMMAND] = self._handle_run_command
        self._step_handlers[WorkflowStepType.API_CALL] = self._handle_api_call
        self._step_handlers[WorkflowStepType.AI_QUERY] = self._handle_ai_query
        self._step_handlers[WorkflowStepType.WAIT] = self._handle_wait
        self._step_handlers[WorkflowStepType.CONDITION] = self._handle_condition
        self._step_handlers[WorkflowStepType.CREATE_NOTE] = self._handle_create_note
        self._step_handlers[WorkflowStepType.SEARCH_NOTES] = self._handle_search_notes

    def register_step_handler(self, step_type: str, handler: Callable):
        self._step_handlers[step_type] = handler

    def _get_is_builtin(self, row) -> bool:
        try:
            return bool(row["is_builtin"])
        except (KeyError, IndexError):
            return False

    def list_workflows(self) -> list[dict]:
        rows = self._db.fetchall(
            "SELECT * FROM workflows ORDER BY is_builtin DESC, name ASC"
        )
        return [
            {
                "id": r["id"],
                "name": r["name"],
                "description": r["description"],
                "triggerType": r["trigger_type"],
                "enabled": bool(r["enabled"]),
                "stepCount": len(json.loads(r["steps"])),
                "isBuiltin": self._get_is_builtin(r),
            }
            for r in rows
        ]

    def get_workflow(self, id: str) -> dict | None:
        row = self._db.fetchone("SELECT * FROM workflows WHERE id = ?", (id,))
        if not row:
            return None
        return {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "triggerType": row["trigger_type"],
            "triggerConfig": json.loads(row["trigger_config"]),
            "steps": json.loads(row["steps"]),
            "enabled": bool(row["enabled"]),
            "isBuiltin": self._get_is_builtin(row),
        }

    def create_workflow(self, data: dict) -> dict:
        import uuid
        wid = uuid.uuid4().hex
        self._db.execute(
            """INSERT INTO workflows (id, name, description, trigger_type, trigger_config, steps, enabled)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                wid,
                data.get("name", "New Workflow"),
                data.get("description", ""),
                data.get("triggerType", "manual"),
                json.dumps(data.get("triggerConfig", {})),
                json.dumps(data.get("steps", [])),
                1 if data.get("enabled", True) else 0,
            ),
        )
        return self.get_workflow(wid) or {}

    def update_workflow(self, id: str, data: dict) -> dict:
        existing = self._db.fetchone("SELECT * FROM workflows WHERE id = ?", (id,))
        if not existing:
            return {}
        self._db.execute(
            """UPDATE workflows SET name=?, description=?, trigger_type=?, trigger_config=?,
               steps=?, enabled=? WHERE id=?""",
            (
                data.get("name", existing["name"]),
                data.get("description", existing["description"]),
                data.get("triggerType", existing["trigger_type"]),
                json.dumps(data.get("triggerConfig", json.loads(existing["trigger_config"]))),
                json.dumps(data.get("steps", json.loads(existing["steps"]))),
                1 if data.get("enabled", existing["enabled"]) else 0,
                id,
            ),
        )
        return self.get_workflow(id) or {}

    def delete_workflow(self, id: str) -> bool:
        wf = self.get_workflow(id)
        if wf and wf.get("isBuiltin"):
            return False
        self._db.execute("DELETE FROM workflows WHERE id = ?", (id,))
        return True

    def _ensure_builtins(self):
        for wf in _BUILTIN_WORKFLOWS:
            existing = self._db.fetchone(
                "SELECT id FROM workflows WHERE id = ?", (wf["id"],)
            )
            steps_json = json.dumps(wf["steps"])
            config_json = json.dumps(wf["trigger_config"])
            if existing:
                self._db.execute(
                    """UPDATE workflows SET name=?, description=?, trigger_type=?,
                       trigger_config=?, steps=?, enabled=?, is_builtin=1 WHERE id=?""",
                    (
                        wf["name"], wf["description"], wf["trigger_type"],
                        config_json, steps_json, 1 if wf["enabled"] else 0,
                        wf["id"],
                    ),
                )
            else:
                self._db.execute(
                    """INSERT INTO workflows (id, name, description, trigger_type,
                       trigger_config, steps, enabled, is_builtin)
                       VALUES (?, ?, ?, ?, ?, ?, ?, 1)""",
                    (
                        wf["id"], wf["name"], wf["description"],
                        wf["trigger_type"], config_json, steps_json,
                        1 if wf["enabled"] else 0,
                    ),
                )

    def execute_workflow(self, id: str, context: dict | None = None) -> dict:
        wf = self.get_workflow(id)
        if not wf:
            return {"success": False, "error": "Workflow not found"}
        if not wf["enabled"]:
            return {"success": False, "error": "Workflow is disabled"}

        import datetime
        import uuid
        execution_id = uuid.uuid4().hex
        now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        results = []
        current_context = dict(context or {})

        steps = wf["steps"]
        i = 0
        while i < len(steps):
            step = steps[i]
            step_result = self._execute_step(step, current_context)
            results.append({
                "stepId": step.get("id", ""),
                "stepName": step.get("name", ""),
                "stepType": step.get("type", ""),
                "success": step_result.get("success", False),
                "output": step_result.get("output", ""),
                "error": step_result.get("error", ""),
            })

            step.get("id", "")
            success = step_result.get("success", False)

            if success:
                current_context.update(step_result.get("output", {}))
                next_id = step.get("nextOnSuccess", "")
                if next_id:
                    idx = self._find_step_index(steps, next_id)
                    if idx is not None:
                        i = idx
                        continue
            else:
                next_id = step.get("nextOnFailure", "")
                if next_id:
                    idx = self._find_step_index(steps, next_id)
                    if idx is not None:
                        i = idx
                        continue
            i += 1

        all_ok = all(r.get("success", False) for r in results)
        completed = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

        return {
            "executionId": execution_id,
            "workflowId": id,
            "status": "completed" if all_ok else "failed",
            "trigger": "manual",
            "startedAt": now,
            "completedAt": completed,
            "results": results,
            "success": all_ok,
        }

    def _find_step_index(self, steps: list[dict], step_id: str) -> int | None:
        for idx, s in enumerate(steps):
            if s.get("id") == step_id:
                return idx
        return None

    def _execute_step(self, step: dict, context: dict) -> dict:
        step_type = step.get("type", "")
        handler = self._step_handlers.get(step_type)
        if not handler:
            return {"success": False, "error": f"Unknown step type: {step_type}"}
        try:
            return handler(step.get("config", {}), context)
        except Exception as e:
            logger.warning("Step %s failed: %s", step.get("name", ""), e)
            return {"success": False, "error": str(e)}

    def _handle_run_command(self, config: dict, context: dict) -> dict:
        import subprocess
        cmd = config.get("command", "")
        if not cmd:
            return {"success": False, "error": "No command specified"}
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            return {
                "success": result.returncode == 0,
                "output": {
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "exitCode": result.returncode,
                },
                "error": result.stderr if result.returncode != 0 else "",
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Command timed out"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _handle_api_call(self, config: dict, context: dict) -> dict:
        method = config.get("method", "GET").upper()
        url = config.get("url", "")
        headers = config.get("headers", {})
        body = config.get("body", "")
        if not url:
            return {"success": False, "error": "No URL specified"}
        try:
            client = httpx.Client(timeout=30.0)
            if method == "GET":
                resp = client.get(url, headers=headers)
            elif method == "POST":
                resp = client.post(url, content=body, headers=headers)
            else:
                return {"success": False, "error": f"Unsupported method: {method}"}
            return {
                "success": resp.status_code < 400,
                "output": {"statusCode": resp.status_code, "body": resp.text},
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _handle_ai_query(self, config: dict, context: dict) -> dict:
        prompt = config.get("prompt", "")
        if not prompt:
            return {"success": False, "error": "No prompt specified"}
        return {"success": True, "output": {"result": f"AI response to: {prompt[:50]}..."}}

    def _handle_wait(self, config: dict, context: dict) -> dict:
        seconds = config.get("seconds", 1)
        time.sleep(seconds)
        return {"success": True, "output": {"waited": seconds}}

    def _handle_condition(self, config: dict, context: dict) -> dict:
        condition = config.get("condition", "")
        if not condition:
            return {"success": False, "error": "No condition specified"}
        try:
            result = bool(eval(condition, {"__builtins__": {}}, context))
            return {"success": result, "output": {"condition": condition, "result": result}}
        except Exception as e:
            return {"success": False, "error": f"Condition eval error: {e}"}

    def _handle_create_note(self, config: dict, context: dict) -> dict:
        from jarvis.knowledge_manager import CreateNoteDTO, KnowledgeManager
        km = KnowledgeManager(self._db)
        dto = CreateNoteDTO(
            title=config.get("title", "Workflow Note"),
            content=config.get("content", ""),
            folder=config.get("folder", "/"),
            tags=config.get("tags", []),
        )
        note = km.create_note(dto)
        return {"success": True, "output": {"noteId": note.id, "title": note.title}}

    def _handle_search_notes(self, config: dict, context: dict) -> dict:
        from jarvis.knowledge_manager import KnowledgeManager
        km = KnowledgeManager(self._db)
        query = config.get("query", "")
        results = km.search_notes(query)
        return {"success": True, "output": {"results": [r.id for r in results]}}

    def get_executions(self, workflow_id: str, limit: int = 10) -> list[dict]:
        return []
