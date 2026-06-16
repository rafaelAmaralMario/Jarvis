"""Workspace management — file I/O, directory watching, project info."""

import json
import shutil
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from jarvis.database import Database

_BINARY_EXTS = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".exe", ".dll", ".so", ".dylib", ".o", ".obj",
    ".mp3", ".mp4", ".avi", ".mov", ".wav", ".flac",
    ".woff", ".woff2", ".ttf", ".eot",
    ".pyc", ".class", ".jar",
}

_WINDOWS_RESERVED = {
    "con", "prn", "aux", "nul",
    "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8", "com9",
    "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9",
}


@dataclass
class FileEntry:
    name: str = ""
    path: str = ""
    is_directory: bool = False
    size: int = 0
    modified_at: str = ""


@dataclass
class Workspace:
    id: str = ""
    name: str = ""
    folders: list[str] = field(default_factory=list)
    created_at: str = ""
    last_opened: str = ""


@dataclass
class RecentFile:
    path: str = ""
    name: str = ""
    last_opened: str = ""
    open_count: int = 0


@dataclass
class ProjectInfo:
    id: str = ""
    name: str = ""
    root_path: str = ""
    type: str = "unknown"
    version: str = ""
    folders: list[str] = field(default_factory=list)


@dataclass
class WatchedDirectory:
    path: str
    known_entries: set[str] = field(default_factory=set)
    last_scan: float = 0.0


class WorkspaceManager:
    def __init__(self, db: Database):
        self._db = db
        self._watchers: dict[str, WatchedDirectory] = {}
        self._event_callback = None
        self._watch_interval: float = 2.0

    def open_workspace(self, path: str) -> bool:
        p = Path(path).resolve()
        if not p.is_dir():
            return False
        normalized = str(p)
        roots = self.get_roots()
        if normalized in roots:
            return True
        return self.add_root(normalized)

    def add_root(self, path: str) -> bool:
        p = Path(path).resolve()
        if not p.is_dir():
            return False
        normalized = str(p)
        self._db.execute(
            "INSERT OR IGNORE INTO workspaces (id, name) VALUES (?, ?)",
            (normalized, p.name),
        )
        self._db.execute(
            "INSERT OR IGNORE INTO workspace_folders (workspace_id, path) VALUES (?, ?)",
            (normalized, normalized),
        )
        self._watch_directory(normalized)
        self._scan_directory(normalized)
        return True

    def remove_root(self, path: str) -> bool:
        p = Path(path).resolve()
        normalized = str(p)
        self._unwatch_directory(normalized)
        self._db.execute(
            "DELETE FROM workspace_folders WHERE workspace_id = ?",
            (normalized,),
        )
        self._db.execute(
            "DELETE FROM workspaces WHERE id = ?",
            (normalized,),
        )
        return True

    def get_roots(self) -> list[str]:
        rows = self._db.fetchall(
            "SELECT DISTINCT path FROM workspace_folders ORDER BY path"
        )
        return [r["path"] for r in rows]

    def list_workspaces(self) -> list[Workspace]:
        rows = self._db.fetchall(
            """SELECT w.*, GROUP_CONCAT(wf.path, '|') AS folder_paths
               FROM workspaces w
               LEFT JOIN workspace_folders wf ON wf.workspace_id = w.id
               GROUP BY w.id
               ORDER BY w.last_opened DESC"""
        )
        result: list[Workspace] = []
        for r in rows:
            folders = r["folder_paths"].split("|") if r["folder_paths"] else []
            result.append(Workspace(
                id=r["id"], name=r["name"],
                folders=folders,
                created_at=r["created_at"], last_opened=r["last_opened"],
            ))
        return result

    def list_files(self, path: str = "") -> list[FileEntry]:
        entries: list[FileEntry] = []
        dir_path = Path(path) if path else Path.cwd()
        if not dir_path.is_dir():
            return entries
        try:
            for child in sorted(dir_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
                try:
                    stat = child.stat()
                    entries.append(FileEntry(
                        name=child.name,
                        path=str(child.resolve()),
                        is_directory=child.is_dir(),
                        size=stat.st_size,
                        modified_at=datetime.fromtimestamp(
                            stat.st_mtime, tz=timezone.utc
                        ).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                    ))
                except OSError:
                    continue
        except PermissionError:
            pass
        return entries

    def read_file(self, path: str) -> str:
        p = Path(path).resolve()
        if not p.is_file():
            raise FileNotFoundError(f"Cannot open file: {path}")
        content = p.read_text(encoding="utf-8")
        self._track_file_open(path)
        return content

    def write_file(self, path: str, content: str) -> bool:
        try:
            Path(path).write_text(content, encoding="utf-8")
            return True
        except Exception:
            return False

    def create_file(self, name: str, parent_dir: str) -> bool:
        if not _is_valid_filename(name):
            return False
        full_path = Path(parent_dir).resolve() / name
        if full_path.exists():
            return False
        try:
            full_path.write_text("", encoding="utf-8")
            return True
        except Exception:
            return False

    def create_file_with_path(self, full_path: str) -> bool:
        p = Path(full_path).resolve()
        if p.exists():
            return False
        if not _is_valid_filename(p.name):
            return False
        try:
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text("", encoding="utf-8")
            return True
        except Exception:
            return False

    def create_directory(self, name: str, parent_dir: str) -> bool:
        if not _is_valid_filename(name):
            return False
        try:
            Path(parent_dir).resolve().joinpath(name).mkdir(exist_ok=True)
            return True
        except Exception:
            return False

    def delete_path(self, path: str) -> bool:
        p = Path(path).resolve()
        if not p.exists():
            return False
        try:
            if p.is_dir():
                shutil.rmtree(str(p))
            else:
                p.unlink()
            return True
        except Exception:
            return False

    def rename_path(self, old_path: str, new_name: str) -> bool:
        if not _is_valid_filename(new_name):
            return False
        src = Path(old_path).resolve()
        if not src.exists():
            return False
        new_path = src.parent / new_name
        if new_path.exists():
            return False
        try:
            src.rename(new_path)
            return True
        except Exception:
            return False

    def move_path(self, src: str, dest: str) -> bool:
        src_path = Path(src).resolve()
        if not src_path.exists():
            return False
        dest_dir = Path(dest).resolve()
        if not dest_dir.is_dir():
            return False
        new_path = dest_dir / src_path.name
        if new_path.exists():
            return False
        try:
            src_path.rename(new_path)
            return True
        except Exception:
            return False

    def get_recent_files(self, limit: int = 20) -> list[RecentFile]:
        rows = self._db.fetchall(
            "SELECT * FROM recent_files ORDER BY last_opened DESC LIMIT ?",
            (limit,),
        )
        return [
            RecentFile(
                path=r["path"], name=r["name"],
                last_opened=r["last_opened"], open_count=r["open_count"],
            )
            for r in rows
        ]

    def add_recent_file(self, path: str) -> None:
        self._track_file_open(path)

    def get_project_info(self, root_path: str) -> ProjectInfo:
        info = ProjectInfo(root_path=root_path)
        dir_path = Path(root_path).resolve()
        info.name = dir_path.name
        info.id = root_path

        if (dir_path / "CMakeLists.txt").is_file():
            info.type = "cpp"
            cmake = (dir_path / "CMakeLists.txt").read_text(encoding="utf-8")
            for line in cmake.splitlines():
                if "project(" in line.lower() and "VERSION" in line.upper():
                    idx = line.upper().find("VERSION")
                    rest = line[idx + 7:].strip()
                    info.version = rest.split()[0].rstrip(")")
                    break
        elif (dir_path / "package.json").is_file():
            info.type = "node"
            try:
                pkg = json.loads((dir_path / "package.json").read_text(encoding="utf-8"))
                info.version = pkg.get("version", "")
            except json.JSONDecodeError:
                pass
        elif (dir_path / "Cargo.toml").is_file():
            info.type = "rust"
        elif (dir_path / "pyproject.toml").is_file() or (dir_path / "setup.py").is_file():
            info.type = "python"

        info.folders = [root_path]
        return info

    def start_watching(self, path: str, callback=None) -> bool:
        p = Path(path).resolve()
        if not p.is_dir():
            return False
        normalized = str(p)
        if callback:
            self._event_callback = callback
        self._watch_directory(normalized)
        return True

    def stop_watching(self, path: str) -> bool:
        normalized = str(Path(path).resolve())
        return self._unwatch_directory(normalized)

    def poll_watchers(self) -> None:
        now = time.monotonic()
        for wdir in list(self._watchers.values()):
            if now - wdir.last_scan < self._watch_interval:
                continue
            self._poll_directory(wdir)

    def set_file_event_callback(self, callback) -> None:
        self._event_callback = callback

    def _watch_directory(self, path: str) -> None:
        if path in self._watchers:
            return
        wdir = WatchedDirectory(path=path)
        self._scan_directory_known(path, wdir)
        self._watchers[path] = wdir

    def _unwatch_directory(self, path: str) -> bool:
        return self._watchers.pop(path, None) is not None

    def _scan_directory(self, path: str) -> None:
        p = Path(path)
        if not p.is_dir():
            return
        try:
            for child in p.iterdir():
                if child.is_dir():
                    self._watch_directory(str(child))
                    self._scan_directory(str(child))
        except PermissionError:
            pass

    def _scan_directory_known(self, path: str, wdir: WatchedDirectory) -> None:
        p = Path(path)
        if not p.is_dir():
            return
        try:
            for child in p.iterdir():
                wdir.known_entries.add(str(child))
                if child.is_dir():
                    sub = self._watchers.get(str(child))
                    if sub:
                        self._scan_directory_known(str(child), sub)
        except PermissionError:
            pass

    def _poll_directory(self, wdir: WatchedDirectory) -> None:
        wdir.last_scan = time.monotonic()
        p = Path(wdir.path)
        if not p.is_dir():
            if self._event_callback:
                self._event_callback({
                    "type": "deleted",
                    "path": wdir.path,
                })
            self._watchers.pop(wdir.path, None)
            return

        try:
            current: set[str] = set()
            for child in p.iterdir():
                current.add(str(child))
                if str(child) not in wdir.known_entries:
                    wdir.known_entries.add(str(child))
                    if self._event_callback:
                        self._event_callback({
                            "type": "created",
                            "path": str(child),
                        })
                    if child.is_dir():
                        self._watch_directory(str(child))

            removed = wdir.known_entries - current
            for entry in removed:
                wdir.known_entries.discard(entry)
                if self._event_callback:
                    self._event_callback({
                        "type": "deleted",
                        "path": entry,
                    })
        except PermissionError:
            pass

    def _track_file_open(self, path: str) -> None:
        p = Path(path).resolve()
        if not p.is_file():
            return
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        self._db.execute(
            """INSERT INTO recent_files (path, name, last_opened, open_count)
               VALUES (?, ?, ?, 1)
               ON CONFLICT(path) DO UPDATE SET
                   last_opened = excluded.last_opened,
                   open_count = open_count + 1""",
            (str(p), p.name, now),
        )


def _is_valid_filename(name: str) -> bool:
    if not name or name in (".", ".."):
        return False
    if len(name) > 255:
        return False
    if all(c == " " for c in name):
        return False
    invalid_chars = "<>:\"/\\|?*\n\r\t"
    for c in name:
        if c in invalid_chars:
            return False
    base = name.split(".")[0].lower()
    if base in _WINDOWS_RESERVED:
        return False
    return True


def normalize_path(path: str) -> str:
    return str(Path(path).resolve())


def get_extension(path: str) -> str:
    return Path(path).suffix.lower()


def get_mime_type(path: str) -> str:
    ext = get_extension(path)
    mime_map = {
        ".txt": "text/plain", ".md": "text/plain",
        ".html": "text/html", ".htm": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".xml": "application/xml",
        ".py": "text/x-python",
        ".cpp": "text/x-c++src", ".cc": "text/x-c++src", ".cxx": "text/x-c++src",
        ".h": "text/x-c++hdr", ".hpp": "text/x-c++hdr",
        ".c": "text/x-csrc",
        ".java": "text/x-java",
        ".ts": "text/x-typescript", ".tsx": "text/x-typescript",
        ".rs": "text/x-rust",
        ".go": "text/x-go",
        ".yaml": "text/yaml", ".yml": "text/yaml",
        ".toml": "text/toml",
        ".sh": "text/x-shellscript", ".bash": "text/x-shellscript",
        ".ps1": "text/x-powershell",
        ".sql": "text/x-sql",
        ".cmake": "text/x-cmake",
        ".png": "image/png",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
        ".ico": "image/x-icon",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
    }
    return mime_map.get(ext, "application/octet-stream")


def is_binary_extension(ext: str) -> bool:
    return ext.lower() in _BINARY_EXTS


def is_binary_file(path: str) -> bool:
    return get_extension(path) in _BINARY_EXTS
