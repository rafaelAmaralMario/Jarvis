"""Knowledge management — notes, wikilinks, FTS5 search, import/export."""

import datetime
import json
import os
import re
import uuid
from dataclasses import dataclass, field

from jarvis.database import Database
from jarvis.graph_builder import GraphBuilder, GraphData


@dataclass
class Note:
    id: str = ""
    title: str = ""
    content: str = ""
    folder: str = "/"
    tags: list[str] = field(default_factory=list)
    metadata: str = "{}"
    created_at: str = ""
    updated_at: str = ""


@dataclass
class CreateNoteDTO:
    title: str = ""
    content: str = ""
    folder: str = "/"
    tags: list[str] = field(default_factory=list)
    metadata: str = "{}"


@dataclass
class SearchResult:
    id: str = ""
    title: str = ""
    snippet: str = ""
    score: float = 0.0


@dataclass
class Backlink:
    note_id: str = ""
    title: str = ""
    context: str = ""


@dataclass
class FolderEntry:
    path: str = ""
    name: str = ""
    note_count: int = 0





_WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")


class KnowledgeManager:
    def __init__(self, db: Database):
        self._db = db

    def create_note(self, dto: CreateNoteDTO) -> Note:
        note = Note(
            id=_generate_id(),
            title=dto.title,
            content=dto.content,
            folder=_normalize_folder(dto.folder),
            tags=dto.tags,
            metadata=dto.metadata,
            created_at=_now(),
            updated_at=_now(),
        )
        tags_str = ",".join(note.tags)
        self._db.execute(
            """INSERT INTO notes (id, title, content, folder, tags, metadata, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (note.id, note.title, note.content, note.folder,
             tags_str, note.metadata, note.created_at, note.updated_at),
        )
        self._update_wikilinks(note.id, note.content)
        self._update_tags(note.id, note.tags)
        return note

    def get_note(self, note_id: str) -> Note | None:
        row = self._db.fetchone(
            "SELECT * FROM notes WHERE id = ?", (note_id,)
        )
        if not row:
            return None
        return _row_to_note(row)

    def list_notes(self, folder: str = "") -> list[Note]:
        if folder:
            rows = self._db.fetchall(
                "SELECT * FROM notes WHERE folder = ? ORDER BY updated_at DESC",
                (folder,),
            )
        else:
            rows = self._db.fetchall(
                "SELECT * FROM notes ORDER BY updated_at DESC"
            )
        return [_row_to_note(r) for r in rows]

    def update_note(self, note_id: str, dto: CreateNoteDTO) -> Note:
        existing = self.get_note(note_id)
        if not existing:
            raise ValueError(f"Note not found: {note_id}")

        title = dto.title if dto.title else existing.title
        content = dto.content if dto.content else existing.content
        folder = _normalize_folder(dto.folder) if dto.folder else existing.folder
        tags = dto.tags if dto.tags else existing.tags
        metadata = dto.metadata if dto.metadata else existing.metadata
        now = _now()

        tags_str = ",".join(tags)
        self._db.execute(
            """UPDATE notes SET title=?, content=?, folder=?, tags=?, metadata=?, updated_at=?
               WHERE id=?""",
            (title, content, folder, tags_str, metadata, now, note_id),
        )
        self._update_wikilinks(note_id, content)
        self._update_tags(note_id, tags)
        return Note(
            id=note_id, title=title, content=content, folder=folder,
            tags=tags, metadata=metadata, created_at=existing.created_at,
            updated_at=now,
        )

    def delete_note(self, note_id: str) -> bool:
        self._db.execute("DELETE FROM note_links WHERE source_id=? OR target_id=?", (note_id, note_id))
        self._db.execute("DELETE FROM note_tags WHERE note_id=?", (note_id,))
        self._db.execute("DELETE FROM notes WHERE id=?", (note_id,))
        return True

    def search_notes(self, query: str) -> list[SearchResult]:
        safe = _escape_fts(query)
        if not safe:
            return []
        fts_query = f"{safe}*"
        rows = self._db.fetchall(
            """SELECT n.id, n.title,
                      snippet(notes_fts, 1, '<mark>', '</mark>', '...', 40) AS snippet,
                      rank
               FROM notes_fts
               JOIN notes n ON n.rowid = notes_fts.rowid
               WHERE notes_fts MATCH ?
               ORDER BY rank
               LIMIT 50""",
            (fts_query,),
        )
        return [
            SearchResult(
                id=r["id"],
                title=r["title"],
                snippet=r["snippet"],
                score=float(r["rank"]),
            )
            for r in rows
        ]

    def get_backlinks(self, note_id: str) -> list[Backlink]:
        rows = self._db.fetchall(
            """SELECT n.id, n.title, l.context
               FROM note_links l
               JOIN notes n ON n.id = l.source_id
               WHERE l.target_id = ?
               ORDER BY n.title""",
            (note_id,),
        )
        return [
            Backlink(note_id=r["id"], title=r["title"], context=r["context"])
            for r in rows
        ]

    def get_graph(self) -> GraphData:
        return GraphBuilder(self._db).build()

    def get_folders(self) -> list[FolderEntry]:
        rows = self._db.fetchall(
            """SELECT folder, COUNT(*) AS cnt
               FROM notes
               GROUP BY folder
               ORDER BY folder"""
        )
        return [
            FolderEntry(
                path=r["folder"],
                name=os.path.basename(r["folder"].rstrip("/")) if r["folder"] != "/" else "root",
                note_count=r["cnt"],
            )
            for r in rows
        ]

    def move_note(self, note_id: str, target_folder: str) -> bool:
        target_folder = _normalize_folder(target_folder)
        self._db.execute(
            "UPDATE notes SET folder=?, updated_at=? WHERE id=?",
            (target_folder, _now(), note_id),
        )
        return True

    def import_md(self, file_path: str) -> Note | None:
        if not os.path.isfile(file_path):
            return None

        with open(file_path, "r", encoding="utf-8") as f:
            raw = f.read()

        front, content = _parse_front_matter(raw)
        title = front.get("title", os.path.splitext(os.path.basename(file_path))[0])
        tags = front.get("tags", [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]

        dto = CreateNoteDTO(
            title=title,
            content=content,
            tags=tags,
            metadata=json.dumps(front),
        )
        return self.create_note(dto)

    def export_md(self, note_id: str, output_path: str) -> bool:
        note = self.get_note(note_id)
        if not note:
            return False

        front: dict = {}
        if note.metadata and note.metadata != "{}":
            try:
                front = json.loads(note.metadata)
            except json.JSONDecodeError:
                pass
        front["title"] = note.title
        front["tags"] = note.tags
        front["created_at"] = note.created_at
        front["updated_at"] = note.updated_at

        yaml_lines = ["---"]
        for k, v in front.items():
            if isinstance(v, list):
                if v:
                    yaml_lines.append(f"{k}:")
                    for item in v:
                        yaml_lines.append(f"  - {item}")
                else:
                    yaml_lines.append(f"{k}: []")
            else:
                yaml_lines.append(f"{k}: {v}")
        yaml_lines.append("---")

        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(yaml_lines))
            f.write("\n")
            f.write(note.content)

        return True

    def _update_wikilinks(self, note_id: str, content: str) -> None:
        self._db.execute(
            "DELETE FROM note_links WHERE source_id = ?", (note_id,)
        )
        targets = _parse_wikilinks(content)
        for raw_target in targets:
            title = raw_target.split("|")[0].strip()
            target_note = self._db.fetchone(
                "SELECT id FROM notes WHERE title = ?", (title,)
            )
            if target_note:
                target_id = target_note["id"]
            else:
                target_note2 = self.create_note(CreateNoteDTO(
                    title=title,
                    content="*Broken link*",
                    folder="/",
                ))
                target_id = target_note2.id

            context = _extract_context(content, raw_target)
            self._db.execute(
                """INSERT OR IGNORE INTO note_links
                   (source_id, target_id, link_type, context)
                   VALUES (?, ?, 'wikilink', ?)""",
                (note_id, target_id, context),
            )

    def _update_tags(self, note_id: str, tags: list[str]) -> None:
        self._db.execute(
            "DELETE FROM note_tags WHERE note_id = ?", (note_id,)
        )
        for tag in tags:
            tag = tag.strip()
            if tag:
                self._db.execute(
                    "INSERT OR IGNORE INTO note_tags (note_id, tag) VALUES (?, ?)",
                    (note_id, tag),
                )


def _generate_id() -> str:
    raw = uuid.uuid4().hex
    return f"{raw[:8]}-{raw[8:12]}-{raw[12:16]}-{raw[16:20]}-{raw[20:]}"


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%S.%fZ"
    )


def _normalize_folder(path: str) -> str:
    path = path.replace("\\", "/").strip()
    if not path.startswith("/"):
        path = "/" + path
    path = os.path.normpath(path).replace("\\", "/")
    if path == "." or path == "/.":
        path = "/"
    return path


def _parse_tags(tags_str: str) -> list[str]:
    if not tags_str:
        return []
    return [t.strip() for t in tags_str.split(",") if t.strip()]


def _row_to_note(row) -> Note:
    return Note(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        folder=row["folder"],
        tags=_parse_tags(row["tags"]),
        metadata=row["metadata"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _parse_wikilinks(content: str) -> list[str]:
    return _WIKILINK_RE.findall(content)


def _extract_context(content: str, target: str, context_chars: int = 80) -> str:
    idx = content.find(f"[[{target}]]")
    if idx == -1:
        return ""
    start = max(0, idx - context_chars)
    end = min(len(content), idx + len(target) + 4 + context_chars)
    snippet = content[start:end].replace("\n", " ").strip()
    return snippet


def _escape_fts(query: str) -> str:
    for ch in ['"', '*', '^', '(', ')', '+', '-', '~', ':', '!']:
        query = query.replace(ch, " ")
    return " ".join(query.split())


def _parse_front_matter(raw: str) -> tuple[dict, str]:
    content = raw
    front: dict = {}
    content = raw
    if raw.startswith("---"):
        end = raw.find("---", 3)
        if end != -1:
            yaml_block = raw[3:end].strip()
            content = raw[end + 3:].strip()
            lines = yaml_block.split("\n")
            current_key = ""
            current_list: list[str] = []
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    continue
                if ":" in stripped and not stripped.startswith("- "):
                    if current_key and current_list:
                        front[current_key] = current_list
                        current_list = []
                    key, _, val = stripped.partition(":")
                    current_key = key.strip()
                    val = val.strip()
                    if val.startswith("["):
                        front[current_key] = _parse_yaml_list(val)
                        current_key = ""
                    elif val == "":
                        current_list = []
                    else:
                        front[current_key] = val.strip("\"'")
                        current_key = ""
                elif stripped.startswith("- ") and current_key:
                    current_list.append(stripped[2:].strip())
            if current_key and current_list:
                front[current_key] = current_list

    return front, content


def _parse_yaml_list(val: str) -> list[str]:
    val = val.strip("[]").strip()
    if not val:
        return []
    return [v.strip().strip("\"'") for v in val.split(",")]
