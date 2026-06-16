"""Self-Improvement module for JARVIS.

Enables the agent to autonomously analyze its own codebase, propose improvements,
and execute them step by step with user confirmation at key decision points.
"""

import json
import logging
import os
import re
import threading
from typing import Callable

from jarvis.llm_gateway import LLMGateway, LLMMessage, LLMProvider, LLMRequest
from jarvis.tool_agent import ToolAgent
from jarvis.tool_manager import ToolManager

logger = logging.getLogger(__name__)

_IMPROVEMENT_SYSTEM = """You are **JARVIS Self-Improvement Agent**, an autonomous AI that improves the JARVIS codebase itself.

You have access to tools for reading, writing, and executing commands.

## How you work

1. **Analyze** — Read Project.md and key files to understand the current state
2. **Plan** — Design a specific, actionable improvement
3. **Execute** — Implement changes step by step using tools
4. **Verify** — Run tests and lint to ensure nothing is broken
5. **Commit** — Create git commits with clear messages

## Critical Rules

1. **Read before writing.** Always read existing files to understand context before modifying them.
2. **Run tests after changes.** After implementing, run the test suite.
3. **Fix TypeScript errors.** After any frontend change, run `npx tsc --noEmit` and fix errors.
4. **One change at a time.** Implement one logical change, verify it, then move to the next.
5. **Ask permission before dangerous operations.** Before running destructive commands (delete, force-push, etc.), use `ask_user`.
6. **Keep a record.** Log what you changed and why.
7. **Stay within scope.** Focus on the specific improvement task, not unrelated refactoring.

Available tools:
{tool_descriptions}

Current workspace: {workspace}
"""


class SelfImprovement:
    """Self-improvement workflow for JARVIS.

    Flow:
    1. Load Project.md and codebase context
    2. Generate improvement proposal using LLM
    3. Get user approval for the proposal
    4. Execute proposal step by step using a ToolAgent
    5. Report results
    """

    def __init__(
        self,
        llm: LLMGateway,
        tools: ToolManager,
        model: str = "",
        provider: str = "ollama",
        on_token: Callable[[str], None] | None = None,
        on_progress: Callable[[dict], None] | None = None,
    ):
        self._llm = llm
        self._tools = tools
        self._model = model
        self._provider = provider
        self._on_token = on_token
        self._on_progress = on_progress
        self._cancelled = False
        self._answer_event = threading.Event()
        self._answer_data: tuple[str, str] | None = None
        self._workspace = tools.workspace_root or ""

    def cancel(self) -> None:
        self._cancelled = True
        self._answer_event.set()

    def answer_question(self, question_id: str, answer: str) -> None:
        self._answer_data = (question_id, answer)
        self._answer_event.set()

    def _emit(self, step: str, status: str, detail: str = "", progress: float = 0.0):
        if self._on_progress:
            self._on_progress({
                "step": step,
                "status": status,
                "detail": detail,
                "progress": progress,
            })
        if self._on_token:
            self._on_token(f"\n**[{step}]** {detail}\n")

    def _ask_user(self, question: str, timeout: int = 300) -> str | None:
        self._answer_event.clear()
        self._answer_data = None
        self._emit("permission", "waiting", question)
        self._answer_event.wait(timeout=timeout)
        if self._cancelled:
            return None
        if self._answer_data:
            _, answer = self._answer_data
            self._answer_data = None
            return answer
        return None

    def _read_project_context(self) -> str:
        context = ""
        md_path = os.path.join(self._workspace, "Project.md")
        if os.path.isfile(md_path):
            with open(md_path) as f:
                context += f"## Project.md\n\n{f.read()}\n\n"

        plan_path = os.path.join(self._workspace, ".jarvis", "plans")
        if os.path.isdir(plan_path):
            plans = os.listdir(plan_path)[-3:]
            for p in plans:
                try:
                    with open(os.path.join(plan_path, p)) as f:
                        data = json.load(f)
                    context += f"## Checkpoint: {data.get('plan_id', p)}\n"
                    context += f"Task: {data.get('plan', {}).get('summary', 'N/A')}\n"
                    context += f"Completed: {len(data.get('results', []))}/{len(data.get('plan', {}).get('steps', []))}\n\n"
                except Exception:
                    pass

        ctx_path = os.path.join(self._workspace, ".context")
        if os.path.isdir(ctx_path):
            try:
                for fname in sorted(os.listdir(ctx_path)):
                    if fname.endswith(".md"):
                        with open(os.path.join(ctx_path, fname)) as f:
                            context += f"## Context: {fname}\n\n{f.read()[:2000]}\n\n"
            except Exception:
                pass

        git_log = self._exec("git log --oneline -20")
        if git_log:
            context += f"## Recent Commits\n\n```\n{git_log}\n```\n\n"

        return context

    def _exec(self, command: str) -> str:
        try:
            import subprocess
            r = subprocess.run(
                command, shell=True, capture_output=True, text=True,
                cwd=self._workspace, timeout=15,
            )
            return r.stdout.strip()[:2000]
        except Exception as e:
            return f"Error: {e}"

    def analyze(self) -> dict:
        """Analyze the project and generate improvement proposals."""
        context = self._read_project_context()

        self._emit("analyze", "running", "Reading codebase context...")
        file_tree = self._exec("dir /s /b /a-d 2>nul || find . -type f | head -100")
        context += f"## File Tree (first 100 files)\n\n```\n{file_tree[:3000]}\n```\n\n"

        self._emit("analyze", "running", "Analyzing architecture and generating proposals...")

        system = """You are a **Software Architect** analyzing the JARVIS codebase for improvement opportunities.

Based on the project context, identify:
1. What is the highest-priority next task from Project.md?
2. What specific files need to change?
3. What is the step-by-step implementation plan?
4. What risks or dependencies exist?

Respond with valid JSON ONLY:
```json
{
  "summary": "One-line summary of the proposed improvement",
  "priority": "critical" | "high" | "medium" | "low",
  "rationale": "Why this improvement matters now",
  "steps": [
    {
      "goal": "What to accomplish in this step",
      "verification": "How to verify success",
      "files": ["relative/path/to/file1.ext"]
    }
  ],
  "risks": ["Risk 1", "Risk 2"],
  "estimated_effort": "small" | "medium" | "large"
}
```"""
        req = LLMRequest(
            provider=LLMProvider(self._provider),
            model=self._model,
            messages=[LLMMessage(role="user", content=context)],
            system=system,
            temperature=0.2,
            max_tokens=4096,
        )

        try:
            resp = self._llm.generate(req)
            text = resp.content.strip()
            m = re.search(r'```(?:json)?\s*\n?(\{[\s\S]*?\})\n?\s*```', text)
            if m:
                proposal = json.loads(m.group(1))
            else:
                proposal = json.loads(text)

            if not isinstance(proposal.get("steps"), list):
                proposal["steps"] = []
            return proposal
        except Exception as e:
            logger.exception("Failed to analyze")
            return {
                "summary": f"Analysis failed: {e}",
                "priority": "medium",
                "rationale": "Could not generate proposal",
                "steps": [],
                "risks": ["Analysis error"],
                "estimated_effort": "unknown",
            }

    def execute_proposal(self, proposal: dict) -> dict:
        """Execute improvement proposal steps, asking for permission at key decisions."""
        results = []
        steps = proposal.get("steps", [])
        total = len(steps)
        success_count = 0

        for i, step in enumerate(steps):
            if self._cancelled:
                break

            goal = step.get("goal", f"Step {i+1}")
            verification = step.get("verification", "")
            files = step.get("files", [])

            self._emit("execute", "running", f"Step {i+1}/{total}: {goal}", progress=(i / total))
            allowed = self._ask_user(
                f"**Permitir execução do passo {i+1}/{total}?**\n\n"
                f"**Objetivo:** {goal}\n"
                f"**Arquivos envolvidos:** {', '.join(files) if files else 'N/A'}\n"
                f"{'**Verificação:** ' + verification if verification else ''}\n\n"
                f"Responda 'sim' para permitir, 'não' para pular, ou 'parar' para cancelar."
            )

            if allowed is None:
                self._emit("execute", "cancelled", "Cancelled by user")
                break

            if allowed.strip().lower() in ("não", "nao", "no", "n", "pular", "skip"):
                self._emit("execute", "skipped", f"Skipped step {i+1}: {goal}")
                results.append({"goal": goal, "success": False, "output": "", "error": "Skipped by user", "retries": 0})
                continue

            if allowed.strip().lower() in ("parar", "stop", "cancel"):
                self._emit("execute", "cancelled", "Cancelled by user")
                break

            self._emit("execute", "running", f"Executing: {goal}", progress=(i / total))

            query = f"""Goal: {goal}
Verification: {verification}
Files to modify: {json.dumps(files)}

Use the available tools to accomplish this goal. Read files first, make changes, then verify.
Run tests if applicable. Report what was accomplished."""

            agent = ToolAgent(
                llm=self._llm,
                tools=self._tools,
                model=self._model,
                provider=self._provider,
                max_tool_rounds=35,
            )

            step_result = agent.execute(query)
            step_output = step_result.get("content", "")
            step_success = True

            if verification:
                verify_agent = ToolAgent(
                    llm=self._llm,
                    tools=self._tools,
                    model=self._model,
                    provider=self._provider,
                    max_tool_rounds=10,
                )
                verify_result = verify_agent.execute(f"Verify: {verification}")
                verify_output = verify_result.get("content", "")
                step_success = "✅" in verify_output or "passed" in verify_output.lower() or "success" in verify_output.lower()
                step_output += f"\n\n**Verification:**\n{verify_output[:1000]}"

            results.append({
                "goal": goal,
                "success": step_success,
                "output": step_output[:3000],
                "retries": 0,
            })

            if step_success:
                success_count += 1
            self._emit("execute", "completed" if step_success else "failed",
                       f"Step {i+1}: {'✅' if step_success else '❌'} {goal}",
                       progress=((i + 1) / total))

        return {
            "success": success_count == total and total > 0,
            "total_steps": total,
            "completed_steps": len(results),
            "successful_steps": success_count,
            "results": results,
            "cancelled": self._cancelled,
        }

    def full_cycle(self) -> dict:
        """Run a complete self-improvement cycle: analyze → propose → execute."""
        self._emit("cycle", "started", "Starting self-improvement cycle...")

        proposal = self.analyze()
        if not proposal.get("steps"):
            self._emit("cycle", "failed", "No improvement steps generated.")
            return {"success": False, "error": "No steps generated", "proposal": proposal}

        self._emit("proposal", "ready", json.dumps(proposal, indent=2, ensure_ascii=False))

        answer = self._ask_user(
            f"**Proposta de Melhoria**\n\n"
            f"**{proposal.get('summary', 'N/A')}**\n"
            f"Prioridade: {proposal.get('priority', 'N/A')}\n"
            f"Esforço estimado: {proposal.get('estimated_effort', 'N/A')}\n"
            f"Passos: {len(proposal['steps'])}\n"
            f"Riscos: {', '.join(proposal.get('risks', ['N/A']))}\n\n"
            f"{proposal.get('rationale', '')}\n\n"
            f"Deseja executar esta melhoria? (sim/não)"
        )

        if not answer or answer.strip().lower() not in ("sim", "s", "yes", "y", "permitir", "allow", ""):
            self._emit("cycle", "cancelled", "Improvement rejected by user.")
            return {"success": False, "error": "Rejected by user", "proposal": proposal}

        results = self.execute_proposal(proposal)

        if results.get("success"):
            self._emit("cycle", "completed", "Self-improvement cycle completed successfully!")
        else:
            self._emit("cycle", "partial", f"Completed {results.get('successful_steps', 0)}/{results.get('total_steps', 0)} steps.")

        return {
            "success": results.get("success", False),
            "proposal": proposal,
            "results": results,
        }
