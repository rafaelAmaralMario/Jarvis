-- Migration 001: Core System Tables
-- Configuration, settings, and system metadata

CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS extension_registry (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '0.1.0',
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_audit_module ON audit_log(module);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
