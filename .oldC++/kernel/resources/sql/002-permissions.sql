-- Migration 002: Permissions System
-- Module-level permission grants and denials

CREATE TABLE IF NOT EXISTS permissions (
    module_id TEXT NOT NULL,
    permission TEXT NOT NULL,
    granted INTEGER NOT NULL DEFAULT 1 CHECK (granted IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (module_id, permission)
);

CREATE INDEX idx_permissions_module ON permissions(module_id);
