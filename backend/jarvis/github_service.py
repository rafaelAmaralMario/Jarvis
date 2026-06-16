"""GitHub integration — tools for issues, PRs via gh CLI or REST API."""

import json
import logging
import subprocess

logger = logging.getLogger(__name__)


class GitHubService:
    def __init__(self):
        self._use_cli = self._check_cli()

    def _check_cli(self) -> bool:
        try:
            subprocess.run(
                ["gh", "--version"], capture_output=True, text=True, timeout=5
            )
            return True
        except Exception:
            return False

    def _gh(self, args: list[str]) -> dict:
        result = subprocess.run(
            ["gh"] + args, capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            return {"success": False, "error": result.stderr.strip()}
        try:
            data = json.loads(result.stdout) if result.stdout.strip() else {}
            return {"success": True, "data": data}
        except json.JSONDecodeError:
            return {"success": True, "data": result.stdout.strip()}

    def list_issues(self, repo: str = "", state: str = "open", limit: int = 10) -> dict:
        args = ["issue", "list", "--json", "number,title,state,createdAt,labels,url", f"--limit={limit}"]
        if repo:
            args.extend(["-R", repo])
        if state:
            args.extend(["-s", state])
        return self._gh(args)

    def create_issue(self, title: str, body: str = "", repo: str = "", labels: list[str] = None) -> dict:
        args = ["issue", "create", "--title", title, "--body", body]
        if repo:
            args.extend(["-R", repo])
        if labels:
            args.extend(["--label", ",".join(labels)])
        return self._gh(args)

    def list_prs(self, repo: str = "", state: str = "open", limit: int = 10) -> dict:
        args = ["pr", "list", "--json", "number,title,state,createdAt,headRefName,baseRefName,url", f"--limit={limit}"]
        if repo:
            args.extend(["-R", repo])
        if state:
            args.extend(["-s", state])
        return self._gh(args)

    def create_pr(self, title: str, body: str = "", branch: str = "", repo: str = "", base: str = "") -> dict:
        args = ["pr", "create", "--title", title, "--body", body]
        if branch:
            args.extend(["-H", branch])
        if repo:
            args.extend(["-R", repo])
        if base:
            args.extend(["-B", base])
        return self._gh(args)

    def merge_pr(self, pr_number: int, repo: str = "", method: str = "merge") -> dict:
        args = ["pr", "merge", str(pr_number), f"--{method}"]
        if repo:
            args.extend(["-R", repo])
        return self._gh(args)
