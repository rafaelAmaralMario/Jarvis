-- Migration 005: Knowledge Module (Obsidian-like Notes)
-- Core tables for notes, wikilinks, full-text search, and knowledge graph

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    folder TEXT NOT NULL DEFAULT '/',
    tags TEXT NOT NULL DEFAULT '',      -- comma-separated
    metadata TEXT NOT NULL DEFAULT '{}', -- JSON blob
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS note_links (
    source_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL DEFAULT 'wikilink',
    context TEXT NOT NULL DEFAULT '',     -- surrounding text snippet
    PRIMARY KEY (source_id, target_id)
);

CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    PRIMARY KEY (note_id, tag)
);

-- FTS5 full-text search virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    title,
    content,
    tags,
    content='notes',
    content_rowid='rowid',
    tokenize='porter unicode61'
);

-- Triggers to keep FTS5 in sync
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag);
