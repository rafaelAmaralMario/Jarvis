"""Editor service — file open/save/close, language detection, settings."""

import os
from dataclasses import dataclass

from jarvis.database import Database

_LANG_MAP: dict[str, str] = {
    ".js": "javascript", ".jsx": "javascript",
    ".ts": "typescript", ".tsx": "typescript",
    ".mjs": "javascript", ".cjs": "javascript",
    ".py": "python",
    ".cpp": "cpp", ".cc": "cpp", ".cxx": "cpp",
    ".hpp": "cpp", ".hh": "cpp", ".hxx": "cpp",
    ".h": "c",
    ".c": "c",
    ".java": "java",
    ".rs": "rust",
    ".go": "go",
    ".rb": "ruby",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin", ".kts": "kotlin",
    ".scala": "scala",
    ".dart": "dart",
    ".lua": "lua",
    ".pl": "perl", ".pm": "perl",
    ".r": "r",
    ".json": "json",
    ".md": "markdown", ".mdx": "markdown",
    ".html": "html", ".htm": "html",
    ".css": "css", ".scss": "scss", ".less": "less",
    ".xml": "xml", ".svg": "xml",
    ".yaml": "yaml", ".yml": "yaml",
    ".toml": "toml",
    ".sql": "sql",
    ".sh": "shell", ".bash": "shell", ".zsh": "shell",
    ".bat": "bat", ".cmd": "bat",
    ".ps1": "powershell",
    ".dockerfile": "dockerfile", "dockerfile": "dockerfile",
    ".gitignore": "ignore",
    ".env": "plaintext",
    ".txt": "plaintext",
    ".csv": "plaintext",
    ".log": "plaintext",
    ".diff": "diff", ".patch": "diff",
}


@dataclass
class FileBuffer:
    path: str
    content: str
    language: str = "plaintext"
    is_dirty: bool = False
    cursor_line: int = 1
    cursor_column: int = 1


class EditorManager:
    def __init__(self, db: Database | None = None):
        self._db = db
        self._open_files: dict[str, FileBuffer] = {}

    def open_file(self, path: str) -> FileBuffer | None:
        if not os.path.isfile(path):
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
        except (UnicodeDecodeError, Exception):
            return None

        lang = self._detect_language(path)
        buf = FileBuffer(path=path, content=content, language=lang)

        if path in self._open_files:
            self._open_files[path].content = content
            self._open_files[path].is_dirty = False
            self._open_files[path].language = lang
        else:
            self._open_files[path] = buf

        return buf

    def save_file(self, path: str, content: str) -> bool:
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
        except Exception:
            return False

        if path in self._open_files:
            self._open_files[path].content = content
            self._open_files[path].is_dirty = False
        else:
            lang = self._detect_language(path)
            self._open_files[path] = FileBuffer(path=path, content=content, language=lang)

        return True

    def close_file(self, path: str) -> bool:
        return self._open_files.pop(path, None) is not None

    def get_open_files(self) -> list[FileBuffer]:
        return list(self._open_files.values())

    def get_file(self, path: str) -> FileBuffer | None:
        return self._open_files.get(path)

    def detect_language(self, path: str) -> str:
        return self._detect_language(path)

    def update_cursor(self, path: str, line: int, column: int) -> bool:
        buf = self._open_files.get(path)
        if not buf:
            return False
        buf.cursor_line = line
        buf.cursor_column = column
        return True

    def get_settings(self) -> dict[str, str]:
        if not self._db:
            return _default_settings()
        rows = self._db.fetchall(
            "SELECT key, value FROM editor_settings ORDER BY key"
        )
        settings = dict(_default_settings())
        for r in rows:
            settings[r["key"]] = r["value"]
        return settings

    def update_setting(self, key: str, value: str) -> bool:
        if not self._db:
            return False
        self._db.execute(
            "INSERT OR REPLACE INTO editor_settings (key, value) VALUES (?, ?)",
            (key, value),
        )
        return True

    def _detect_language(self, path: str) -> str:
        name = os.path.basename(path).lower()
        if name in _LANG_MAP:
            return _LANG_MAP[name]
        ext = os.path.splitext(path)[1].lower()
        return _LANG_MAP.get(ext, "plaintext")


def _default_settings() -> dict[str, str]:
    return {
        "fontSize": "14",
        "tabSize": "4",
        "wordWrap": "off",
        "theme": "vs-dark",
        "minimap": "true",
        "lineNumbers": "on",
        "autoSave": "true",
        "autoSaveDelay": "2000",
    }
