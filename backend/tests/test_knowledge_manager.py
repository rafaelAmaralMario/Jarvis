"""Tests for KnowledgeManager — notes CRUD, wikilinks, FTS5, graph, import/export."""

import os
import tempfile

import pytest

from jarvis.graph_builder import GraphData
from jarvis.knowledge_manager import (
    CreateNoteDTO,
    KnowledgeManager,
    _escape_fts,
    _extract_context,
    _generate_id,
    _normalize_folder,
    _parse_front_matter,
    _parse_wikilinks,
)

_SCHEMA = """
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    folder TEXT NOT NULL DEFAULT '/',
    tags TEXT NOT NULL DEFAULT '',
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS note_links (
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    link_type TEXT NOT NULL DEFAULT 'wikilink',
    context TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (source_id, target_id)
);
CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (note_id, tag)
);
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    title, content, tags,
    content='notes', content_rowid='rowid',
    tokenize='porter unicode61'
);
CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, title, content, tags)
    VALUES (new.rowid, new.title, new.content, new.tags);
END;
CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, content, tags)
    VALUES ('delete', old.rowid, old.title, old.content, old.tags);
END;
CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, content, tags)
    VALUES ('delete', old.rowid, old.title, old.content, old.tags);
    INSERT INTO notes_fts(rowid, title, content, tags)
    VALUES (new.rowid, new.title, new.content, new.tags);
END;
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag);
"""


@pytest.fixture
def db():
    from jarvis.database import Database

    tmp = tempfile.mktemp(suffix=".db")
    db = Database(tmp)
    db.exec(_SCHEMA)
    yield db
    db.close()
    if os.path.exists(tmp):
        os.unlink(tmp)


@pytest.fixture
def km(db):
    return KnowledgeManager(db)


class TestHelpers:
    def test_generate_id_format(self):
        nid = _generate_id()
        parts = nid.split("-")
        assert len(parts) == 5
        assert len(parts[0]) == 8
        assert len(parts[1]) == 4
        assert len(parts[2]) == 4
        assert len(parts[3]) == 4
        assert len(parts[4]) == 12

    def test_normalize_folder_root(self):
        assert _normalize_folder("") == "/"
        assert _normalize_folder("/") == "/"
        assert _normalize_folder(".") == "/"

    def test_normalize_folder_adds_leading_slash(self):
        assert _normalize_folder("dev") == "/dev"
        assert _normalize_folder("dev/cpp") == "/dev/cpp"

    def test_normalize_folder_backslash(self):
        assert _normalize_folder("dev\\cpp") == "/dev/cpp"

    def test_parse_wikilinks_none(self):
        assert _parse_wikilinks("no links here") == []

    def test_parse_wikilinks_single(self):
        assert _parse_wikilinks("see [[note]] here") == ["note"]

    def test_parse_wikilinks_multiple(self):
        assert _parse_wikilinks("[[a]] and [[b|c]]") == ["a", "b|c"]

    def test_extract_context(self):
        content = "hello world [[target]] more text"
        ctx = _extract_context(content, "target", 10)
        assert "target" in ctx

    def test_escape_fts_removes_special_chars(self):
        assert '"' not in _escape_fts('hello "world"')
        assert "*" not in _escape_fts("test*")

    def test_parse_front_matter_no_front_matter(self):
        front, content = _parse_front_matter("hello")
        assert front == {}
        assert content == "hello"

    def test_parse_front_matter_with_title(self):
        raw = "---\ntitle: My Note\n---\ncontent here"
        front, content = _parse_front_matter(raw)
        assert front["title"] == "My Note"
        assert content == "content here"

    def test_parse_front_matter_with_tags_list(self):
        raw = "---\ntitle: Test\ntags:\n  - a\n  - b\n---\nbody"
        front, content = _parse_front_matter(raw)
        assert front["title"] == "Test"
        assert content == "body"

    def test_parse_front_matter_inline_list(self):
        raw = "---\ntags: [a, b]\n---\nbody"
        front, _ = _parse_front_matter(raw)
        assert front.get("tags") == ["a", "b"]


class TestKnowledgeManager:
    def test_create_note(self, km, db):
        dto = CreateNoteDTO(title="Test", content="Hello")
        note = km.create_note(dto)
        assert note.id
        assert note.title == "Test"
        assert note.content == "Hello"
        assert note.folder == "/"
        row = db.fetchone("SELECT * FROM notes WHERE id=?", (note.id,))
        assert row["title"] == "Test"

    def test_get_note(self, km):
        dto = CreateNoteDTO(title="Get Me", content="exists")
        created = km.create_note(dto)
        fetched = km.get_note(created.id)
        assert fetched is not None
        assert fetched.title == "Get Me"
        assert fetched.content == "exists"

    def test_get_note_not_found(self, km):
        assert km.get_note("nonexistent") is None

    def test_list_notes_all(self, km):
        km.create_note(CreateNoteDTO(title="A"))
        km.create_note(CreateNoteDTO(title="B"))
        notes = km.list_notes()
        assert len(notes) >= 2

    def test_list_notes_by_folder(self, km):
        km.create_note(CreateNoteDTO(title="In Dev", folder="/dev"))
        km.create_note(CreateNoteDTO(title="Root"))
        dev_notes = km.list_notes(folder="/dev")
        assert len(dev_notes) == 1
        assert dev_notes[0].title == "In Dev"

    def test_update_note(self, km):
        note = km.create_note(CreateNoteDTO(title="Original"))
        updated = km.update_note(note.id, CreateNoteDTO(title="Updated"))
        assert updated.title == "Updated"
        fetched = km.get_note(note.id)
        assert fetched.title == "Updated"

    def test_update_note_not_found(self, km):
        with pytest.raises(ValueError):
            km.update_note("nonexistent", CreateNoteDTO(title="X"))

    def test_delete_note(self, km):
        note = km.create_note(CreateNoteDTO(title="To Delete"))
        km.delete_note(note.id)
        assert km.get_note(note.id) is None

    def test_search_notes(self, km):
        km.create_note(CreateNoteDTO(title="Python Coding", content="python code here"))
        km.create_note(CreateNoteDTO(title="Random", content="something else"))
        results = km.search_notes("python")
        assert len(results) >= 1

    def test_search_notes_empty_query(self, km):
        assert km.search_notes("") == []

    def test_get_backlinks(self, km):
        b = km.create_note(CreateNoteDTO(title="Target"))
        a = km.create_note(CreateNoteDTO(title="Source", content="link to [[Target]]"))
        bl = km.get_backlinks(b.id)
        assert len(bl) >= 1
        assert bl[0].note_id == a.id

    def test_get_graph(self, km):
        km.create_note(CreateNoteDTO(title="A"))
        km.create_note(CreateNoteDTO(title="B"))
        km.create_note(CreateNoteDTO(title="C"))
        graph = km.get_graph()
        assert isinstance(graph, GraphData)
        assert len(graph.nodes) >= 3
        labels = {n.label for n in graph.nodes}
        assert "A" in labels

    def test_get_folders(self, km):
        km.create_note(CreateNoteDTO(title="F1", folder="/dev"))
        km.create_note(CreateNoteDTO(title="F2", folder="/dev"))
        km.create_note(CreateNoteDTO(title="F3", folder="/docs"))
        folders = km.get_folders()
        paths = {f.path for f in folders}
        assert "/dev" in paths
        assert "/docs" in paths
        for f in folders:
            if f.path == "/dev":
                assert f.note_count == 2

    def test_move_note(self, km):
        note = km.create_note(CreateNoteDTO(title="Movable", folder="/old"))
        result = km.move_note(note.id, "/new")
        assert result is True
        moved = km.get_note(note.id)
        assert moved.folder == "/new"

    def test_wikilink_auto_creates_target(self, km):
        note = km.create_note(CreateNoteDTO(
            title="Source",
            content="See [[Auto Created Target]] for details",
        ))
        links = km._db.fetchall(
            "SELECT target_id FROM note_links WHERE source_id=?",
            (note.id,),
        )
        assert len(links) == 1
        target_id = links[0]["target_id"]
        target = km.get_note(target_id)
        assert target is not None
        assert target.title == "Auto Created Target"

    def test_tags_roundtrip(self, km):
        dto = CreateNoteDTO(title="Tagged", tags=["python", "test"])
        note = km.create_note(dto)
        assert "python" in note.tags
        rows = km._db.fetchall(
            "SELECT tag FROM note_tags WHERE note_id=? ORDER BY tag",
            (note.id,),
        )
        assert [r["tag"] for r in rows] == ["python", "test"]

    def test_import_md(self, km):
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".md", delete=False, encoding="utf-8"
        ) as f:
            f.write("---\ntitle: Imported\ntags: [a, b]\n---\nbody text")
            fname = f.name
        try:
            note = km.import_md(fname)
            assert note is not None
            assert note.title == "Imported"
            assert "a" in note.tags
            assert note.content == "body text"
        finally:
            os.unlink(fname)

    def test_import_md_file_not_found(self, km):
        assert km.import_md("/nonexistent/file.md") is None

    def test_export_md(self, km):
        note = km.create_note(CreateNoteDTO(title="Export Me", content="export content"))
        out = tempfile.mktemp(suffix=".md")
        try:
            result = km.export_md(note.id, out)
            assert result is True
            with open(out, encoding="utf-8") as f:
                raw = f.read()
            assert "Export Me" in raw
            assert "export content" in raw
        finally:
            if os.path.exists(out):
                os.unlink(out)

    def test_export_md_note_not_found(self, km):
        assert km.export_md("nonexistent", "out.md") is False

    def test_update_note_preserves_created_at(self, km):
        note = km.create_note(CreateNoteDTO(title="Preserve"))
        updated = km.update_note(note.id, CreateNoteDTO(title="Updated"))
        assert updated.created_at == note.created_at

    def test_delete_note_removes_links(self, km):
        b = km.create_note(CreateNoteDTO(title="B"))
        a = km.create_note(CreateNoteDTO(title="A", content="link to [[B]]"))
        km.delete_note(a.id)
        bl = km.get_backlinks(b.id)
        assert len(bl) == 0

    def test_import_md_with_front_matter_yaml_list(self, km):
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".md", delete=False, encoding="utf-8"
        ) as f:
            f.write("---\ntitle: Complex\ntags:\n  - tag1\n  - tag2\n---\ncontent")
            fname = f.name
        try:
            note = km.import_md(fname)
            assert note.title == "Complex"
            assert "tag1" in note.tags
        finally:
            os.unlink(fname)

    def test_search_with_multiple_results(self, km):
        km.create_note(CreateNoteDTO(title="Note A", content="alpha beta gamma"))
        km.create_note(CreateNoteDTO(title="Note B", content="beta gamma delta"))
        km.create_note(CreateNoteDTO(title="Note C", content="gamma delta epsilon"))
        results = km.search_notes("gamma")
        assert len(results) >= 2

    def test_search_with_special_chars(self, km):
        km.create_note(CreateNoteDTO(title="Test", content="special chars here"))
        results = km.search_notes('special "chars" *test')
        assert len(results) >= 1

    def test_export_md_with_tags(self, km):
        note = km.create_note(CreateNoteDTO(
            title="Tagged Export", content="body", tags=["a", "b"]
        ))
        out = tempfile.mktemp(suffix=".md")
        try:
            km.export_md(note.id, out)
            with open(out, encoding="utf-8") as f:
                raw = f.read()
            assert "a" in raw
            assert "b" in raw
        finally:
            if os.path.exists(out):
                os.unlink(out)

    def test_move_note_to_root(self, km):
        note = km.create_note(CreateNoteDTO(title="Mover", folder="/sub"))
        km.move_note(note.id, "/")
        moved = km.get_note(note.id)
        assert moved.folder == "/"
