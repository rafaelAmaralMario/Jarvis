"""Git operations via subprocess (git CLI)."""

import os
import re
import subprocess
from dataclasses import dataclass

_GIT_TIMEOUT = 30


@dataclass
class GitStatus:
    staged: bool = False
    status: str = " "
    is_untracked: bool = False
    path: str = ""


@dataclass
class GitBranch:
    is_current: bool = False
    name: str = ""


@dataclass
class GitLogEntry:
    hash: str = ""
    author: str = ""
    email: str = ""
    message: str = ""
    date: str = ""


@dataclass
class GitGutterLine:
    line: int = 0
    type: str = ""


class GitManager:
    def __init__(self):
        self._username = ""
        self._token = ""

    def is_repo(self, path: str) -> bool:
        return os.path.isdir(os.path.join(path, ".git"))

    def init(self, path: str) -> bool:
        result = self._run(path, "init")
        return result is not None

    def clone(self, url: str, path: str) -> bool:
        result = self._run_err(os.path.dirname(path), "clone", url, path)
        return result is not None and "fatal:" not in result

    def status(self, repo_path: str) -> list[GitStatus]:
        out = self._run(repo_path, "status", "--porcelain")
        if not out:
            return []
        result: list[GitStatus] = []
        for line in out.splitlines():
            if len(line) < 3:
                continue
            s = GitStatus()
            s.staged = line[0] != " "
            s.status = line[0] if line[0] != " " else line[1]
            s.is_untracked = line[1] == "?" or line[0] == "?"
            path = line[3:].strip()
            if " -> " in path:
                parts = path.split(" -> ", 1)
                if len(parts) > 1:
                    path = parts[1]
            s.path = path
            result.append(s)
        return result

    def diff(self, repo_path: str, file_path: str = "") -> str:
        args = ["diff", "--"]
        if file_path:
            args.append(file_path)
        return self._run(repo_path, *args) or ""

    def diff_gutter(self, repo_path: str, file_path: str) -> list[GitGutterLine]:
        out = self._run(repo_path, "diff", "--unified=0", "--", file_path)
        if not out:
            return []
        result: list[GitGutterLine] = []
        hunk_re = re.compile(r"@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@")
        old_line = 0
        new_line = 0
        in_hunk = False
        for line in out.splitlines():
            m = hunk_re.match(line)
            if m:
                old_line = int(m.group(1))
                new_line = int(m.group(2))
                in_hunk = True
                continue
            if not in_hunk:
                continue
            if line.startswith("---") or line.startswith("+++"):
                continue
            if line.startswith(" "):
                old_line += 1
                new_line += 1
            elif line.startswith("+") and not line.startswith("+++"):
                result.append(GitGutterLine(line=new_line, type="a"))
                new_line += 1
            elif line.startswith("-") and not line.startswith("---"):
                result.append(GitGutterLine(
                    line=new_line - 1 if new_line > 0 else 0,
                    type="d",
                ))
                old_line += 1
        return result

    def stage(self, repo_path: str, file_path: str) -> bool:
        result = self._run_err(repo_path, "add", "--", file_path)
        return result is not None and "fatal:" not in result

    def unstage(self, repo_path: str, file_path: str) -> bool:
        result = self._run_err(repo_path, "reset", "HEAD", "--", file_path)
        return result is not None and "fatal:" not in result

    def stage_all(self, repo_path: str) -> bool:
        result = self._run_err(repo_path, "add", "-A")
        return result is not None and "fatal:" not in result

    def commit(self, repo_path: str, message: str) -> bool:
        result = self._run_err(repo_path, "commit", "-m", message)
        if result is None:
            return False
        return "fatal:" not in result and "nothing to commit" not in result

    def branches(self, repo_path: str) -> list[GitBranch]:
        out = self._run(repo_path, "branch", "--list")
        if not out:
            return []
        result: list[GitBranch] = []
        for line in out.splitlines():
            b = GitBranch()
            b.is_current = line.startswith("*")
            b.name = line[2:].strip()
            result.append(b)
        return result

    def checkout(self, repo_path: str, branch: str) -> bool:
        result = self._run_err(repo_path, "checkout", branch)
        return result is not None and "fatal:" not in result

    def create_branch(self, repo_path: str, branch: str) -> bool:
        result = self._run_err(repo_path, "branch", branch)
        return result is not None and "fatal:" not in result

    def delete_branch(self, repo_path: str, branch: str) -> bool:
        result = self._run_err(repo_path, "branch", "-d", branch)
        return result is not None and "fatal:" not in result

    def push(self, repo_path: str, remote: str = "", branch: str = "") -> bool:
        if not remote:
            remote = "origin"
        args = ["push", remote]
        if branch:
            args.append(branch)

        if self._username and self._token:
            remote_url = self._run(repo_path, "remote", "get-url", remote)
            if remote_url:
                auth_url = remote_url
                auth_url = auth_url.replace(
                    "https://",
                    f"https://{self._username}:{self._token}@",
                )
                args = ["push", auth_url]
                if branch:
                    args.append(branch)

        result = self._run_err(repo_path, *args)
        if result is None:
            return False
        return "fatal:" not in result and "error:" not in result

    def pull(self, repo_path: str, remote: str = "", branch: str = "") -> bool:
        if not remote:
            remote = "origin"
        args = ["pull", remote]
        if branch:
            args.append(branch)
        result = self._run_err(repo_path, *args)
        return result is not None and "fatal:" not in result

    def fetch(self, repo_path: str, remote: str = "") -> bool:
        args = ["fetch"]
        if remote:
            args.append(remote)
        result = self._run_err(repo_path, *args)
        return result is not None and "fatal:" not in result

    def log(self, repo_path: str, count: int = 10) -> list[GitLogEntry]:
        fmt = "--format=%H%n%an%n%ae%n%s%n%ai%n---"
        out = self._run(repo_path, "log", fmt, f"-{count}")
        if not out:
            return []
        result: list[GitLogEntry] = []
        for entry in out.split("\n---\n"):
            lines = [l.strip() for l in entry.splitlines() if l.strip()]
            if len(lines) < 5:
                continue
            result.append(GitLogEntry(
                hash=lines[0],
                author=lines[1],
                email=lines[2],
                message=lines[3],
                date=lines[4],
            ))
        return result

    def current_branch(self, repo_path: str) -> str:
        result = self._run(repo_path, "rev-parse", "--abbrev-ref", "HEAD")
        return result or ""

    def set_credentials(self, username: str, token: str) -> None:
        self._username = username
        self._token = token

    def _run(self, repo_path: str, *args: str) -> str | None:
        try:
            result = subprocess.run(
                ["git", *args],
                capture_output=True,
                text=True,
                cwd=repo_path,
                timeout=_GIT_TIMEOUT,
            )
            return result.stdout.rstrip("\n\r")
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return None

    def _run_err(self, repo_path: str, *args: str) -> str | None:
        try:
            result = subprocess.run(
                ["git", *args],
                capture_output=True,
                text=True,
                cwd=repo_path,
                timeout=_GIT_TIMEOUT,
            )
            out = result.stdout.rstrip("\n\r")
            err = result.stderr.rstrip("\n\r")
            if err:
                out = out + "\n" + err if out else err
            return out
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return None
