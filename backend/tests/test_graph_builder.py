"""Tests for GraphBuilder — standalone graph builder with JSON export."""

import json
import os
import tempfile

import pytest

from jarvis.graph_builder import GraphBuilder
from jarvis.knowledge_manager import (
    CreateNoteDTO,
    GraphData,
    KnowledgeManager,
)


_SCHEMA = """
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    folder TEXT NOT NULL DEFAULT '/',
    tags TEXT NOT NULL DEFAULT '',
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
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


@pytest.fixture
def gb(db):
    return GraphBuilder(db)


class TestGraphBuilder:
    def test_build_empty(self, gb):
        graph = gb.build()
        assert isinstance(graph, GraphData)
        assert graph.nodes == []
        assert graph.edges == []

    def test_build_with_nodes(self, km, gb):
        km.create_note(CreateNoteDTO(title="Alpha"))
        km.create_note(CreateNoteDTO(title="Beta"))
        graph = gb.build()
        assert len(graph.nodes) == 2
        labels = {n.label for n in graph.nodes}
        assert labels == {"Alpha", "Beta"}

    def test_build_with_wikilink_edge(self, km, gb):
        b = km.create_note(CreateNoteDTO(title="Target"))
        km.create_note(CreateNoteDTO(title="Source", content="link to [[Target]]"))
        graph = gb.build()
        assert len(graph.nodes) == 2
        assert len(graph.edges) == 1
        assert graph.edges[0].link_type == "wikilink"

    def test_edge_only_includes_existing_nodes(self, km, gb):
        a = km.create_note(CreateNoteDTO(title="A", content="link to [[B]]"))
        graph = gb.build()
        assert len(graph.nodes) >= 1
        for e in graph.edges:
            ids = {n.id for n in graph.nodes}
            assert e.source in ids
            assert e.target in ids

    def test_link_count(self, km, gb):
        a = km.create_note(CreateNoteDTO(title="A"))
        b = km.create_note(CreateNoteDTO(title="B"))
        c = km.create_note(CreateNoteDTO(title="C", content="links to [[A]] and [[B]]"))
        graph = gb.build()
        counts = {n.label: n.link_count for n in graph.nodes}
        assert counts.get("C", 0) >= 2

    def test_build_json_returns_valid_json(self, km, gb):
        km.create_note(CreateNoteDTO(title="A"))
        km.create_note(CreateNoteDTO(title="B"))
        raw = gb.build_json()
        data = json.loads(raw)
        assert "nodes" in data
        assert "edges" in data
        assert len(data["nodes"]) == 2

    def test_build_json_node_structure(self, km, gb):
        km.create_note(CreateNoteDTO(title="Node", tags=["t1"]))
        raw = gb.build_json()
        data = json.loads(raw)
        node = data["nodes"][0]
        assert "id" in node
        assert node["label"] == "Node"
        assert node["tags"] == ["t1"]
        assert "linkCount" in node
        assert "folder" in node

    def test_build_json_edge_structure(self, km, gb):
        b = km.create_note(CreateNoteDTO(title="B"))
        a = km.create_note(CreateNoteDTO(title="A", content="[[B]]"))
        raw = gb.build_json()
        data = json.loads(raw)
        assert len(data["edges"]) >= 1
        edge = data["edges"][0]
        assert "source" in edge
        assert "target" in edge
        assert edge["linkType"] == "wikilink"

    def test_build_json_empty(self, gb):
        raw = gb.build_json()
        data = json.loads(raw)
        assert data == {"nodes": [], "edges": []}

    def test_multiple_edges_between_same_nodes_combined(self, km, gb):
        a = km.create_note(CreateNoteDTO(title="A"))
        b = km.create_note(CreateNoteDTO(title="B", content="[[A]]"))
        c = km.create_note(CreateNoteDTO(title="C", content="[[A]] and [[B]]"))
        graph = gb.build()
        sources = [(e.source, e.target) for e in graph.edges]
        assert len(sources) >= 2

    def test_link_count_includes_both_directions(self, km, gb):
        a = km.create_note(CreateNoteDTO(title="A", content="[[B]]"))
        b = km.create_note(CreateNoteDTO(title="B", content="[[A]]"))
        graph = gb.build()
        for n in graph.nodes:
            if n.label == "A":
                assert n.link_count >= 1
            if n.label == "B":
                assert n.link_count >= 1
