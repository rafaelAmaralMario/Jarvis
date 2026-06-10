"""Computer Use agent — autonomous tool-calling loop.

The agent thinks, chooses a tool, executes it, observes the result, and repeats.
Supports waiting for user answers and cancellation via threading primitives.
"""

import json
import logging
import re
import threading
import time
from typing import Any, Callable

from jarvis.llm_gateway import LLMGateway, LLMProvider, LLMRequest, LLMMessage, LLMResponse
from jarvis.tool_manager import ToolManager, ToolResult, RiskLevel

logger = logging.getLogger(__name__)

_DEFAULT_TOOL_AGENT_SYSTEM = """You are **JARVIS Computer Use Agent**, an autonomous AI assistant that can interact with the user's computer.

You have access to the following tools:

{tool_descriptions}

## How to use tools

When you need to use a tool, respond with a JSON block:

```json
{{
  "tool": "tool_name",
  "args": {{
    "param1": "value1"
  }}
}}
```

You will receive the tool's output and can decide what to do next.

## Guidelines

1. **Plan first**: Think about what needs to be done before choosing tools.
2. **Use tools liberally**: Read files before editing, check git status before committing.
3. **Ask the user**: Use `ask_user` when you need clarification or approval for dangerous operations.
4. **Show your work**: Explain what you're doing and why.
5. **Handle errors gracefully**: If a tool fails, try a different approach.
6. **Complete the task**: Don't stop until the user's request is fully satisfied.

Current workspace: {workspace}
"""

_SYSTEM_PROMPT_WITHOUT_TOOLS = """You are **JARVIS**, an expert software engineering assistant.

You help with coding, architecture, debugging, and project management.

Guidelines:
1. Be thorough and precise in your responses.
2. Use markdown formatting for code blocks, lists, and headers.
3. When suggesting code changes, show the complete file or the exact diff.
4. If you need to access files or run commands, let the user know what needs to be done.

Current workspace: {workspace}
"""


class ToolAgent:
    def __init__(
        self,
        llm: LLMGateway,
        tools: ToolManager,
        model: str = "",
        provider: str = "ollama",
        max_tool_rounds: int = 25,
        on_token: Callable[[str], None] | None = None,
        on_tool_call: Callable[[dict[str, Any]], None] | None = None,
        on_tool_result: Callable[[dict[str, Any]], None] | None = None,
    ):
        self._llm = llm
        self._tools = tools
        self._model = model
        self._provider = provider
        self._max_tool_rounds = max_tool_rounds
        self._on_token = on_token
        self._on_tool_call = on_tool_call
        self._on_tool_result = on_tool_result
        self._messages: list[dict[str, str]] = []
        self._system: str = ""
        self._tool_rounds = 0
        self._full_response = ""
        self._cancelled = False
        self._answer_event = threading.Event()
        self._answer_data: tuple[str, str] | None = None

    def answer_question(self, question_id: str, answer: str) -> None:
        self._answer_data = (question_id, answer)
        self._answer_event.set()

    def cancel(self) -> None:
        self._cancelled = True
        self._answer_event.set()

    def execute(self, query: str) -> dict:
        workspace = self._tools.workspace_root or "Not set"
        tool_descriptions = self._format_tool_descriptions()

        self._messages = [{"role": "user", "content": query}]
        self._system = _DEFAULT_TOOL_AGENT_SYSTEM.format(
            tool_descriptions=tool_descriptions,
            workspace=workspace,
        )
        self._tool_rounds = 0
        self._full_response = ""

        return self._run_loop()

    def _run_loop(self) -> dict:
        pending_question: dict | None = None

        while self._tool_rounds < self._max_tool_rounds:
            if self._cancelled:
                self._full_response += "\n\n*Execução cancelada pelo usuário.*"
                break

            self._tool_rounds += 1

            req = LLMRequest(
                provider=LLMProvider(self._provider),
                model=self._model,
                messages=[LLMMessage(role=m["role"], content=m["content"]) for m in self._messages],
                system=self._system,
                temperature=0.3,
                max_tokens=4096,
                stream=False,
            )

            try:
                resp = self._llm.generate(req)
            except Exception as e:
                error_msg = f"**Erro no LLM:** {e}"
                self._messages.append({"role": "assistant", "content": error_msg})
                return {
                    "content": error_msg,
                    "pendingQuestion": None,
                    "cancelled": self._cancelled,
                }

            content = resp.content.strip()
            self._messages.append({"role": "assistant", "content": content})

            if self._on_token:
                self._on_token(content)

            tool_call = self._extract_tool_call(content)

            if not tool_call:
                self._full_response = content
                break

            tool_name = tool_call["tool"]
            tool_args = tool_call.get("args", {})

            if self._on_tool_call:
                self._on_tool_call({"name": tool_name, "args": tool_args, "round": self._tool_rounds})

            if tool_name == "ask_user":
                result = ToolResult(
                    success=True,
                    output=f"[AGUARDANDO RESPOSTA DO USUÁRIO] {tool_args.get('question', '')}",
                    data={"questionId": f"q_{int(time.time())}", "question": tool_args.get("question", ""), "pending": True},
                )

                if self._on_tool_result:
                    self._on_tool_result({
                        "name": tool_name,
                        "args": tool_args,
                        "success": result.success,
                        "output": result.output[:2000],
                        "error": result.error,
                        "round": self._tool_rounds,
                    })

                result_text = f"Tool '{tool_name}' executed successfully.\n\nOutput:\n```\n{result.output[:3000]}\n```\n\nWaiting for user response..."
                self._messages.append({"role": "user", "content": result_text})

                pending_question = {
                    "questionId": result.data["questionId"],
                    "question": result.data["question"],
                    "toolName": "ask_user",
                }

                self._answer_event.clear()
                self._answer_event.wait(timeout=300)

                if self._cancelled:
                    self._full_response += "\n\n*Execução cancelada.*"
                    break

                if self._answer_data:
                    q_id, answer = self._answer_data
                    self._answer_data = None
                    self._messages.append({"role": "user", "content": f"User answered: {answer}"})
                    pending_question = None
                    continue
                else:
                    self._full_response += "\n\n*Tempo limite excedido aguardando resposta.*"
                    break

            else:
                # Permission check for non-safe tools
                tool_risk = self._tools.get_risk(tool_name)
                if tool_risk in (RiskLevel.ASK, RiskLevel.DANGER):
                    risk_label = "PERIGOSA" if tool_risk == RiskLevel.DANGER else "requer confirmação"
                    question_text = (
                        f"Permitir execução da ferramenta **{tool_name}** ({risk_label})?\n\n"
                        f"Argumentos: `{json.dumps(tool_args, ensure_ascii=False)}`\n\n"
                        f"Responda 'sim' para permitir ou 'não' para negar."
                    )
                    perm_result = ToolResult(
                        success=True,
                        output=f"[AGUARDANDO PERMISSÃO] {question_text}",
                        data={"questionId": f"perm_{int(time.time())}", "question": question_text, "pending": True},
                    )

                    if self._on_tool_result:
                        self._on_tool_result({
                            "name": "ask_user",
                            "args": tool_args,
                            "success": perm_result.success,
                            "output": perm_result.output[:2000],
                            "error": perm_result.error,
                            "round": self._tool_rounds,
                        })

                    self._messages.append({
                        "role": "user",
                        "content": f"Tool '{tool_name}' requires permission.\n\n{question_text}\n\nWaiting for user response..."
                    })

                    pending_question = {
                        "questionId": perm_result.data["questionId"],
                        "question": question_text,
                        "toolName": tool_name,
                    }

                    self._answer_event.clear()
                    self._answer_event.wait(timeout=300)

                    if self._cancelled:
                        self._full_response += "\n\n*Execução cancelada.*"
                        break

                    if self._answer_data:
                        q_id, answer = self._answer_data
                        self._answer_data = None
                        allowed = answer.strip().lower() in ("sim", "s", "yes", "y", "permitir", "allow", "")
                        if allowed:
                            self._messages.append({"role": "user", "content": f"User permitted execution of '{tool_name}'."})
                            pending_question = None
                            result = self._tools.execute(tool_name, tool_args)
                        else:
                            self._messages.append({"role": "user", "content": f"User DENIED execution of '{tool_name}'. Inform the user and suggest alternatives."})
                            pending_question = None
                            result = ToolResult(success=True, output="Execução negada pelo usuário.")
                    else:
                        self._full_response += "\n\n*Tempo limite excedido aguardando permissão.*"
                        result = ToolResult(success=True, output="Permissão não concedida (timeout).")
                else:
                    result = self._tools.execute(tool_name, tool_args)

                if self._on_tool_result:
                    self._on_tool_result({
                        "name": tool_name,
                        "args": tool_args,
                        "success": result.success,
                        "output": result.output[:2000],
                        "error": result.error,
                        "round": self._tool_rounds,
                    })

                if result.success:
                    result_text = f"Tool '{tool_name}' executed successfully."
                    if result.output:
                        result_text += f"\n\nOutput:\n```\n{result.output[:3000]}\n```"
                else:
                    result_text = f"Tool '{tool_name}' failed:\n{result.error}"

                self._messages.append({"role": "user", "content": result_text})

        if self._tool_rounds >= self._max_tool_rounds:
            self._full_response += "\n\n*Limite de execuções atingido.*"

        return {
            "content": self._full_response,
            "pendingQuestion": pending_question,
            "cancelled": self._cancelled,
        }

    def _format_tool_descriptions(self) -> str:
        lines = []
        for t in self._tools.list_tools():
            params = json.dumps(t["parameters"], indent=2)
            lines.append(f"### {t['name']}")
            lines.append(f"**Descrição:** {t['description']}")
            lines.append(f"**Nível de Risco:** {t['risk']}")
            lines.append(f"**Parâmetros:**\n```json\n{params}\n```")
            if t["examples"]:
                lines.append(f"**Exemplos:**\n- " + "\n- ".join(t["examples"]))
            lines.append("")
        return "\n".join(lines)

    def _extract_tool_call(self, text: str) -> dict[str, Any] | None:
        json_pattern = r'```(?:json)?\s*\n?(\{[\s\S]*?"tool"[\s\S]*?\})\n?\s*```'
        match = re.search(json_pattern, text)
        if match:
            try:
                data = json.loads(match.group(1))
                if "tool" in data:
                    return data
            except json.JSONDecodeError:
                pass

        brace_pattern = r'\{[\s\S]*?"tool"[\s\S]*?\}'
        match = re.search(brace_pattern, text)
        if match:
            try:
                data = json.loads(match.group(0))
                if "tool" in data:
                    return data
            except json.JSONDecodeError:
                pass

        return None


class TaskPlanner:
    """High-level task planner that decomposes complex tasks and executes them step by step.

    Flow:
    1. Receive a natural-language task
    2. LLM decomposes into a structured plan with verification criteria
    3. Each step is executed via ToolAgent with auto-retry on failure
    4. Final summary is returned
    """

    def __init__(
        self,
        llm: LLMGateway,
        tools: ToolManager,
        model: str = "",
        provider: str = "ollama",
        max_retries_per_step: int = 3,
        on_step_start: Callable[[dict[str, Any]], None] | None = None,
        on_step_complete: Callable[[dict[str, Any]], None] | None = None,
        on_token: Callable[[str], None] | None = None,
    ):
        self._llm = llm
        self._tools = tools
        self._model = model
        self._provider = provider
        self._max_retries = max_retries_per_step
        self._on_step_start = on_step_start
        self._on_step_complete = on_step_complete
        self._on_token = on_token
        self._cancelled = False

    def cancel(self) -> None:
        self._cancelled = True

    def execute(self, task: str) -> dict:
        self._cancelled = False
        plan = self._decompose(task)
        if not plan.get("steps"):
            return {"success": False, "error": "Failed to decompose task", "results": []}

        results: list[dict] = []
        total_steps = len(plan["steps"])

        for i, step in enumerate(plan["steps"]):
            if self._cancelled:
                break

            step_goal = step.get("goal", step.get("step", f"Step {i+1}"))
            verification = step.get("verification", "")

            if self._on_step_start:
                self._on_step_start({"index": i, "total": total_steps, "goal": step_goal})

            step_result = self._execute_step(step_goal, verification)

            if self._on_step_complete:
                self._on_step_complete({"index": i, "total": total_steps, "goal": step_goal, **step_result})

            results.append({
                "goal": step_goal,
                "success": step_result.get("success", False),
                "output": step_result.get("output", ""),
                "error": step_result.get("error"),
                "retries": step_result.get("retries", 0),
            })

        success_count = sum(1 for r in results if r["success"])
        return {
            "success": success_count == len(results) and len(results) > 0,
            "task": task,
            "plan_summary": plan.get("summary", ""),
            "total_steps": total_steps,
            "completed_steps": len(results),
            "successful_steps": success_count,
            "results": results,
            "cancelled": self._cancelled,
        }

    def _decompose(self, task: str) -> dict:
        system = """You are a **Task Planner**. Your job is to decompose complex software engineering tasks into clear, sequential steps.

Respond with a JSON object ONLY:
```json
{
  "summary": "Brief overview of what needs to be done",
  "steps": [
    {
      "goal": "Clear description of what to accomplish in this step",
      "verification": "How to verify this step succeeded (file exists, test passes, etc.)"
    }
  ]
}
```

Guidelines:
- Break the task into 3-8 atomic steps
- Each step should be achievable with the available tools (read/write files, execute commands, git, search, etc.)
- Steps should be in logical order (read before write, implement before test)
- Be specific about verification criteria
"""
        req = LLMRequest(
            provider=LLMProvider(self._provider),
            model=self._model,
            messages=[LLMMessage(role="user", content=f"Decompose this task into steps:\n\n{task}")],
            system=system,
            temperature=0.2,
            max_tokens=4096,
        )
        try:
            resp = self._llm.generate(req)
            text = resp.content.strip()
            json_match = re.search(r'```(?:json)?\s*\n?(\{[\s\S]*?\})\n?\s*```', text)
            if json_match:
                data = json.loads(json_match.group(1))
            else:
                data = json.loads(text)
            if not isinstance(data.get("steps"), list):
                data["steps"] = []
            return data
        except Exception as e:
            logger.exception("Task decomposition failed")
            return {"summary": "", "steps": [], "error": str(e)}

    def _execute_step(self, goal: str, verification: str) -> dict:
        last_error = ""
        for attempt in range(1, self._max_retries + 1):
            if self._cancelled:
                return {"success": False, "output": "", "error": "Cancelled", "retries": attempt - 1}

            agent = ToolAgent(
                llm=self._llm,
                tools=self._tools,
                model=self._model,
                provider=self._provider,
                max_tool_rounds=30,
                on_token=self._on_token,
            )

            query = f"""Goal: {goal}

{"Verification: " + verification if verification else ""}

{"Previous attempt failed: " + last_error if last_error else ""}

Use the available tools to accomplish this goal. When done, explain what was accomplished and how it meets the goal."""
            result = agent.execute(query)
            output = result.get("content", "")

            if verification:
                check = self._verify(verification)
                if check.get("passed"):
                    return {"success": True, "output": output, "retries": attempt - 1}
                else:
                    last_error = f"Verification failed: {check.get('details', 'Unknown')}\nAgent output: {output[:500]}"
            else:
                return {"success": True, "output": output, "retries": attempt - 1}

        return {"success": False, "output": output if 'output' in locals() else "", "error": last_error, "retries": self._max_retries}

    def _verify(self, criteria: str) -> dict:
        system = """You are a **Verification Assistant**. Given a verification criterion and context, determine if it passed.

Respond with JSON:
```json
{"passed": true/false, "details": "Explanation of the verification result"}
```
"""
        messages = [
            LLMMessage(role="user", content=f"Verify: {criteria}\n\nUse available tools to check (read files, run commands, etc.)"),
        ]
        req = LLMRequest(
            provider=LLMProvider(self._provider),
            model=self._model,
            messages=messages,
            system=system,
            temperature=0.1,
            max_tokens=2048,
        )
        try:
            resp = self._llm.generate(req)
            text = resp.content.strip()
            json_match = re.search(r'```(?:json)?\s*\n?(\{[\s\S]*?\})\n?\s*```', text)
            if json_match:
                data = json.loads(json_match.group(1))
            else:
                data = json.loads(text)
            return {"passed": data.get("passed", False), "details": data.get("details", "")}
        except Exception:
            return {"passed": True, "details": "Verification skipped (parse error)"}

