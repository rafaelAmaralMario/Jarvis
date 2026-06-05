-- Migration 003: Extensions / Plugins
-- Declarative plugin manifests and state

CREATE TABLE IF NOT EXISTS extensions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    description TEXT NOT NULL DEFAULT '',
    entry_point TEXT NOT NULL DEFAULT '',
    permissions TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
