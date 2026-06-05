-- Migration 006: Workspace Module
-- Tables for multi-root workspaces and recent files tracking

CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL DEFAULT 'workspace',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_opened TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS workspace_folders (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    PRIMARY KEY (workspace_id, path)
);

CREATE TABLE IF NOT EXISTS recent_files (
    path TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    last_opened TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    open_count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_recent_files_opened ON recent_files(last_opened DESC);
