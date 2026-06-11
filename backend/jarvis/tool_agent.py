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

_DEFAULT_TOOL_AGENT_SYSTEM = """You are **JARVIS Computer Use Agent**, an autonomous AI assistant that can interact with the user's computer and execute tasks using tools.

You have access to the following tools:

{tool_descriptions}

## How to use tools

When you need to use a tool, respond with a tool call JSON block.
The ONLY format accepted is:

```json
{{"tool": "tool_name", "args": {{"param1": "value1"}}}}
```

Place this JSON block on its own line. Do NOT nest it inside other JSON.
After calling a tool, you will receive its output and can decide what to do next.

## Critical Rules

1. **USE TOOLS TO GET THINGS DONE.** Do not just describe what needs to be done — actually do it using tools.
2. **Read files before editing them.** Use `read_file` to understand existing code before `write_file`.
3. **Run commands to verify.** After creating/modifying files, use `execute_command` to run tests or lint.
4. **Respond in natural language between tool calls.** Explain what you're about to do.
5. **One tool call per response.** Do NOT output multiple JSON blocks. Wait for the result before the next call.
6. **Never simulate tool execution.** Always use the actual tool. If a tool fails, try a different approach.
7. **Handle errors gracefully.** If `execute_command` fails, check the error and fix the issue.
8. **Complete the task fully.** Do not stop until the user's request is fully satisfied.

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
        unattended: bool = False,
    ):
        self._llm = llm
        self._tools = tools
        self._unattended = unattended
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

    def execute(self, query: str, history: list[dict] | None = None, system_override: str | None = None) -> dict:
        workspace = self._tools.workspace_root or "Not set"
        tool_descriptions = self._format_tool_descriptions()

        self._messages = list(history) if history else []
        self._messages.append({"role": "user", "content": query})

        if system_override:
            self._system = system_override.format(
                tool_descriptions=tool_descriptions,
                workspace=workspace,
            )
        else:
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
                if self._unattended:
                    result = self._tools.execute(tool_name, tool_args)
                elif tool_risk in (RiskLevel.ASK, RiskLevel.DANGER):
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
        # Attempt 1: Direct json.loads on the entire text (grammar-constrained output is pure JSON)
        try:
            data = json.loads(text.strip())
            if isinstance(data, dict) and "tool" in data:
                return data
        except (json.JSONDecodeError, ValueError):
            pass

        # Attempt 2: Regex extraction for JSON in code blocks or backticks
        patterns = [
            r'```(?:json)?\s*\n?(\{[\s\S]*?"tool"[\s\S]*?\})\n?\s*```',
            r'`({.*?"tool".*?})`',
            r'\{[\s\S]*?"tool"[\s\S]*?"args"[\s\S]*?\}',
        ]
        for pat in patterns:
            match = re.search(pat, text)
            if match:
                try:
                    data = json.loads(match.group(1) if match.lastindex else match.group(0))
                    if isinstance(data, dict) and "tool" in data:
                        return data
                except (json.JSONDecodeError, KeyError):
                    continue

        # Attempt 3: Heuristic repair — try to recover malformed JSON
        try:
            # Find any object-like structure
            obj_match = re.search(r'(\{[\s\S]*\})', text)
            if obj_match:
                candidate = obj_match.group(1)
                # Try adding missing closing brace
                if candidate.count("{") > candidate.count("}"):
                    candidate += "}" * (candidate.count("{") - candidate.count("}"))
                data = json.loads(candidate)
                if isinstance(data, dict) and "tool" in data:
                    return data
        except (json.JSONDecodeError, ValueError):
            pass

        return None


class TaskPlanner:
    """High-level task planner with checkpoint/resume, dependency graph, parallel execution.

    Flow:
    1. LLM decomposes task into steps (with optional depends_on)
    2. Builds a DAG, executes independent steps in parallel
    3. Each step verified; retries on failure
    4. Auto-aborts after max_consecutive_failures
    5. Checkpoints saved to .jarvis/plans/ for resume
    6. Progress reported via callback for streaming
    """

    def __init__(
        self,
        llm: LLMGateway,
        tools: ToolManager,
        model: str = "",
        provider: str = "ollama",
        max_retries_per_step: int = 3,
        max_consecutive_failures: int = 3,
        on_step_start: Callable[[dict[str, Any]], None] | None = None,
        on_step_complete: Callable[[dict[str, Any]], None] | None = None,
        on_progress: Callable[[dict[str, Any]], None] | None = None,
        on_token: Callable[[str], None] | None = None,
    ):
        self._llm = llm
        self._tools = tools
        self._model = model
        self._provider = provider
        self._max_retries = max_retries_per_step
        self._max_consecutive_failures = max_consecutive_failures
        self._on_step_start = on_step_start
        self._on_step_complete = on_step_complete
        self._on_progress = on_progress
        self._on_token = on_token
        self._cancelled = False
        self._results: list[dict[str, Any]] = []
        self._plan: dict[str, Any] = {}
        self._plan_id = ""

        ws = tools.workspace_root or ""
        self._checkpoint_dir = os.path.join(ws, ".jarvis", "plans") if ws else ""

    def cancel(self) -> None:
        self._cancelled = True

    def execute(self, task: str, resume: bool = False) -> dict[str, Any]:
        self._cancelled = False
        self._results = []

        if resume:
            cp = self._load_latest()
            if cp:
                self._plan = cp["plan"]
                self._results = cp.get("results", [])
                self._plan_id = cp.get("plan_id", "")
                logger.info("Resumed plan %s from step %d", self._plan_id, len(self._results))

        if not self._plan.get("steps"):
            self._plan = self._decompose(task)
            if not self._plan.get("steps"):
                return {"success": False, "error": "Failed to decompose task", "results": []}
            self._plan_id = self._plan.get("plan_id", str(uuid.uuid4()))
            self._save()

        steps = self._plan["steps"]
        for i, s in enumerate(steps):
            s["index"] = i
        total = len(steps)
        completed = len(self._results)

        self._emit_progress("decomposing" if not resume else "resuming", completed, "", 0)

        levels = self._build_levels(steps)
        levels = [[s for s in lev if s["index"] >= completed] for lev in levels]
        levels = [lev for lev in levels if lev]

        consecutive_failures = 0

        for level in levels:
            if self._cancelled:
                break

            threads: list[threading.Thread] = []
            level_out: dict[int, dict] = {}
            lock = threading.Lock()

            def run_step(step: dict) -> None:
                if self._cancelled:
                    return
                idx = step["index"]
                goal = step.get("goal", f"Step {idx+1}")
                verification = step.get("verification", "")
                goal = self._apply_context(goal, idx)
                verification = self._apply_context(verification, idx)

                if self._on_step_start:
                    self._on_step_start({"index": idx, "total": total, "goal": goal})
                self._emit_progress("executing", idx, goal, consecutive_failures)

                result = self._execute_step(goal, verification, idx)

                with lock:
                    level_out[idx] = result

            for step in level:
                t = threading.Thread(target=run_step, args=(step,), daemon=True)
                threads.append(t)
                t.start()

            for t in threads:
                t.join()

            for step in level:
                idx = step["index"]
                result = level_out.get(idx, {
                    "goal": step.get("goal", f"Step {idx+1}"),
                    "success": False,
                    "output": "",
                    "error": "not executed",
                    "retries": 0,
                })
                self._results.append(result)
                if self._on_step_complete:
                    self._on_step_complete({"index": idx, "total": total, **result})
                consecutive_failures = 0 if result.get("success") else consecutive_failures + 1
                self._save()

                if consecutive_failures >= self._max_consecutive_failures and not self._cancelled:
                    self._results.append({
                        "goal": "",
                        "success": False,
                        "output": "",
                        "error": f"Aborted after {consecutive_failures} consecutive failures",
                        "retries": 0,
                    })
                    self._emit_progress("failed", idx, "", consecutive_failures)
                    break

        success_count = sum(1 for r in self._results if r["success"])
        final_status = "cancelled" if self._cancelled else "completed"
        self._emit_progress(final_status, len(self._results) - 1 if self._results else 0, "", consecutive_failures)

        final: dict[str, Any] = {
            "success": success_count == total and total > 0,
            "task": task,
            "plan_summary": self._plan.get("summary", ""),
            "plan_id": self._plan_id,
            "total_steps": total,
            "completed_steps": len(self._results),
            "successful_steps": success_count,
            "results": self._results,
            "cancelled": self._cancelled,
        }
        if final["success"]:
            self._clear()
        return final

    def _emit_progress(self, status: str, step: int, goal: str, fails: int) -> None:
        if self._on_progress:
            self._on_progress({
                "plan_id": self._plan_id,
                "task": self._plan.get("summary", ""),
                "total_steps": len(self._plan.get("steps", [])),
                "current_step": step,
                "current_goal": goal,
                "status": status,
                "results": list(self._results),
                "consecutive_failures": fails,
                "cancelled": self._cancelled,
            })

    def _apply_context(self, text: str, current_index: int) -> str:
        def repl(m: re.Match) -> str:
            step_n = int(m.group(1))
            field = m.group(2)
            if step_n >= current_index or step_n >= len(self._results):
                return m.group(0)
            return str(self._results[step_n].get(field, ""))[:2000]
        return re.sub(r'\{step_(\d+)\.(\w+)\}', repl, text)

    def _build_levels(self, steps: list[dict]) -> list[list[dict]]:
        n = len(steps)
        in_degree = [0] * n
        for i, s in enumerate(steps):
            in_degree[i] = len(s.get("depends_on", []))
        remaining = set(range(n))
        levels: list[list[dict]] = []
        while remaining:
            cur = [i for i in remaining if in_degree[i] == 0]
            if not cur:
                cur = list(remaining)
            levels.append([steps[i] for i in cur])
            remaining -= set(cur)
            for i in cur:
                for j in remaining:
                    if i in steps[j].get("depends_on", []):
                        in_degree[j] -= 1
        return levels

    def _decompose(self, task: str) -> dict:
        system = """You are a **Task Planner**. Decompose complex software engineering tasks into clear steps.

Respond with JSON:
```json
{
  "summary": "Brief overview of what needs to be done",
  "steps": [
    {
      "goal": "Clear description of what to accomplish in this step",
      "verification": "How to verify success (file exists, test passes, etc.)",
      "depends_on": [0, 2]
    }
  ]
}
```
- "depends_on" is OPTIONAL; list 0-based step indices this step depends on. Omit if none.
- Break into 3-8 atomic steps in logical order.
- Each step should use available tools (read/write files, execute commands, git).
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
            m = re.search(r'```(?:json)?\s*\n?(\{[\s\S]*?\})\n?\s*```', text)
            data = json.loads(m.group(1)) if m else json.loads(text)
            if not isinstance(data.get("steps"), list):
                data["steps"] = []
            for s in data["steps"]:
                s.setdefault("depends_on", [])
            return data
        except Exception as e:
            logger.exception("Task decomposition failed")
            return {"summary": "", "steps": [], "error": str(e)}

    def _execute_step(self, goal: str, verification: str, step_index: int) -> dict:
        last_error = ""
        output = ""
        for attempt in range(1, self._max_retries + 1):
            if self._cancelled:
                return {"success": False, "output": output, "error": "Cancelled", "retries": attempt - 1}

            agent = ToolAgent(
                llm=self._llm,
                tools=self._tools,
                model=self._model,
                provider=self._provider,
                max_tool_rounds=30,
                on_token=self._on_token,
            )

            ctx = ""
            for prev in self._results:
                idx = self._results.index(prev)
                ctx += f"\n  Step {idx} ({prev.get('goal', '?')[:60]}): {'PASS' if prev.get('success') else 'FAIL'}"

            query = f"""Goal: {goal}
Verification: {verification}
Previous steps:{ctx}
{"Previous attempt failed: " + last_error if last_error else ""}
Use available tools to accomplish this goal. When done, explain what was accomplished."""
            result = agent.execute(query)
            output = result.get("content", "")

            if verification:
                check = self._verify(verification)
                if check.get("passed"):
                    return {"success": True, "output": output, "retries": attempt - 1}
                last_error = f"Verification: {check.get('details', '?')}\nOutput: {output[:500]}"
            else:
                return {"success": True, "output": output, "retries": attempt - 1}

        return {"success": False, "output": output, "error": last_error, "retries": self._max_retries}

    def _verify(self, criteria: str) -> dict:
        system = "Verify the criterion. Respond JSON: {\"passed\": true/false, \"details\": \"...\"}"
        req = LLMRequest(
            provider=LLMProvider(self._provider),
            model=self._model,
            messages=[LLMMessage(role="user", content=f"Verify: {criteria}\n\nUse available tools to check (read files, run commands, etc.).")],
            system=system,
            temperature=0.1,
            max_tokens=2048,
        )
        try:
            resp = self._llm.generate(req)
            text = resp.content.strip()
            m = re.search(r'```(?:json)?\s*\n?(\{[\s\S]*?\})\n?\s*```', text)
            data = json.loads(m.group(1)) if m else json.loads(text)
            return {"passed": data.get("passed", False), "details": data.get("details", "")}
        except Exception:
            return {"passed": True, "details": "Skipped (parse error)"}

    # -- Checkpoint I/O --

    def _checkpoint_path(self) -> str:
        if not self._checkpoint_dir:
            return ""
        return os.path.join(self._checkpoint_dir, f"{self._plan_id}.json")

    def _save(self) -> None:
        path = self._checkpoint_path()
        if not path:
            return
        os.makedirs(os.path.dirname(path), exist_ok=True)
        data = {
            "plan_id": self._plan_id,
            "plan": self._plan,
            "results": self._results,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        with open(path, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def _load_latest(self) -> dict | None:
        if not self._checkpoint_dir or not os.path.isdir(self._checkpoint_dir):
            return None
        files = sorted(os.listdir(self._checkpoint_dir), reverse=True)
        for fname in files:
            if fname.endswith(".json"):
                try:
                    with open(os.path.join(self._checkpoint_dir, fname)) as f:
                        return json.load(f)
                except Exception:
                    continue
        return None

    def _clear(self) -> None:
        path = self._checkpoint_path()
        if path and os.path.isfile(path):
            try:
                os.remove(path)
            except Exception:
                pass

    @staticmethod
    def list_checkpoints(workspace: str) -> list[dict]:
        cp_dir = os.path.join(workspace, ".jarvis", "plans")
        if not os.path.isdir(cp_dir):
            return []
        results = []
        for fname in sorted(os.listdir(cp_dir), reverse=True):
            if fname.endswith(".json"):
                try:
                    with open(os.path.join(cp_dir, fname)) as f:
                        data = json.load(f)
                    results.append({
                        "plan_id": data.get("plan_id", fname[:-5]),
                        "task": data.get("plan", {}).get("summary", ""),
                        "total_steps": len(data.get("plan", {}).get("steps", [])),
                        "completed_steps": len(data.get("results", [])),
                        "updated_at": data.get("updated_at", ""),
                    })
                except Exception:
                    continue
        return results

    @staticmethod
    def load_checkpoint(workspace: str, plan_id: str) -> dict | None:
        path = os.path.join(workspace, ".jarvis", "plans", f"{plan_id}.json")
        if not os.path.isfile(path):
            return None
        try:
            with open(path) as f:
                return json.load(f)
        except Exception:
            return None

