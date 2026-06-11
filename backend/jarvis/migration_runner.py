from dataclasses import dataclass, field

from jarvis.database import Database


@dataclass
class Migration:
    version: int
    name: str
    sql: str = field(repr=False)


MIGRATIONS: list[Migration] = [
    Migration(1, "core", """
        CREATE TABLE IF NOT EXISTS system_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS extension_registry (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version TEXT NOT NULL DEFAULT '0.1.0',
            enabled INTEGER NOT NULL DEFAULT 1,
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
        CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_log(module);
        CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
    """),
    Migration(2, "permissions", """
        CREATE TABLE IF NOT EXISTS permissions (
            module_id TEXT NOT NULL,
            permission TEXT NOT NULL,
            granted INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            PRIMARY KEY (module_id, permission)
        );
        CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module_id);
    """),
    Migration(3, "extensions", """
        CREATE TABLE IF NOT EXISTS extensions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            description TEXT NOT NULL DEFAULT '',
            entry_point TEXT NOT NULL DEFAULT '',
            permissions TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
    """),
    Migration(4, "models-agents", """
        CREATE TABLE IF NOT EXISTS model_metadata (
            model_name TEXT PRIMARY KEY,
            specialty TEXT NOT NULL DEFAULT 'general'
                CHECK (specialty IN ('chat','code','reasoning','embedding','vision','general')),
            notes TEXT NOT NULL DEFAULT '',
            color TEXT NOT NULL DEFAULT '#6b7280',
            icon TEXT NOT NULL DEFAULT '🤖',
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            model TEXT NOT NULL,
            system_prompt TEXT NOT NULL DEFAULT '',
            temperature REAL NOT NULL DEFAULT 0.7
                CHECK (temperature >= 0.0 AND temperature <= 2.0),
            max_tokens INTEGER NOT NULL DEFAULT 2048 CHECK (max_tokens > 0),
            specialty TEXT NOT NULL DEFAULT 'general',
            tools TEXT NOT NULL DEFAULT '[]',
            is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
            can_orchestrate INTEGER NOT NULL DEFAULT 1 CHECK (can_orchestrate IN (0,1)),
            priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 0 AND priority <= 10),
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS orchestration_config (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
            orchestrator_model TEXT NOT NULL DEFAULT '',
            critic_enabled INTEGER NOT NULL DEFAULT 1 CHECK (critic_enabled IN (0,1)),
            critic_temperature REAL NOT NULL DEFAULT 0.1
                CHECK (critic_temperature >= 0.0 AND critic_temperature <= 2.0),
            max_agents_per_query INTEGER NOT NULL DEFAULT 3 CHECK (max_agents_per_query > 0),
            show_trace INTEGER NOT NULL DEFAULT 1 CHECK (show_trace IN (0,1)),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS agent_conversations (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
            title TEXT NOT NULL DEFAULT 'New conversation',
            model TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS conversation_messages (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            conversation_id TEXT NOT NULL
                REFERENCES agent_conversations(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
            content TEXT NOT NULL,
            agent_id TEXT REFERENCES agents(id),
            model TEXT,
            tokens_used INTEGER DEFAULT 0,
            latency_ms INTEGER DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE INDEX IF NOT EXISTS idx_agents_default ON agents(is_default) WHERE is_default = 1;
        CREATE INDEX IF NOT EXISTS idx_agents_orchestrate
            ON agents(can_orchestrate) WHERE can_orchestrate = 1;
        CREATE INDEX IF NOT EXISTS idx_conv_agent ON agent_conversations(agent_id);
        CREATE INDEX IF NOT EXISTS idx_messages_conv
            ON conversation_messages(conversation_id, created_at);
        INSERT OR IGNORE INTO orchestration_config (id, enabled) VALUES (1, 1);
    """),
    Migration(5, "knowledge", """
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            title TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            folder TEXT NOT NULL DEFAULT '/',
            tags TEXT NOT NULL DEFAULT '',
            metadata TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS note_links (
            source_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
            target_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
            link_type TEXT NOT NULL DEFAULT 'wikilink',
            context TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (source_id, target_id)
        );
        CREATE TABLE IF NOT EXISTS note_tags (
            note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
            tag TEXT NOT NULL,
            PRIMARY KEY (note_id, tag)
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
            USING fts5(title, content, tags,
                       content='notes', content_rowid='rowid',
                       tokenize='porter unicode61');
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
    """),
    Migration(6, "workspace", """
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
    """),
    Migration(7, "editor", """
        CREATE TABLE IF NOT EXISTS editor_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        INSERT OR IGNORE INTO editor_settings (key, value) VALUES ('fontSize', '14');
        INSERT OR IGNORE INTO editor_settings (key, value) VALUES ('tabSize', '4');
        INSERT OR IGNORE INTO editor_settings (key, value) VALUES ('wordWrap', 'off');
        INSERT OR IGNORE INTO editor_settings (key, value) VALUES ('theme', 'vs-dark');
        INSERT OR IGNORE INTO editor_settings (key, value) VALUES ('minimap', 'true');
        INSERT OR IGNORE INTO editor_settings (key, value) VALUES ('lineNumbers', 'on');
        INSERT OR IGNORE INTO editor_settings (key, value) VALUES ('autoSave', 'true');
        INSERT OR IGNORE INTO editor_settings (key, value) VALUES ('autoSaveDelay', '2000');
    """),
    Migration(8, "api-keys", """
        CREATE TABLE IF NOT EXISTS oauth_tokens (
            provider TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            refresh_token TEXT,
            expires_at TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS api_keys (
            service TEXT PRIMARY KEY,
            key_encrypted TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
    """),
    Migration(9, "llm-gateway", """
        CREATE TABLE IF NOT EXISTS llm_providers (
            provider TEXT PRIMARY KEY,
            api_key TEXT NOT NULL DEFAULT '',
            api_url TEXT NOT NULL DEFAULT '',
            default_model TEXT NOT NULL DEFAULT '',
            enabled INTEGER NOT NULL DEFAULT 1,
            models TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS mcp_servers (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name TEXT NOT NULL,
            transport TEXT NOT NULL DEFAULT 'stdio' CHECK (transport IN ('stdio','sse','websocket')),
            command TEXT NOT NULL DEFAULT '',
            url TEXT NOT NULL DEFAULT '',
            args TEXT NOT NULL DEFAULT '[]',
            env TEXT NOT NULL DEFAULT '{}',
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS workflows (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual','schedule','event','webhook')),
            trigger_config TEXT NOT NULL DEFAULT '{}',
            steps TEXT NOT NULL DEFAULT '[]',
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        INSERT OR IGNORE INTO llm_providers (provider, api_url, default_model, enabled)
        VALUES ('ollama', 'http://localhost:11434', 'llama3.2', 1);
    """),
    Migration(12, "llm-fallback-config", """
        CREATE TABLE IF NOT EXISTS llm_fallback_config (
            provider TEXT PRIMARY KEY,
            fallback_order TEXT NOT NULL DEFAULT '[]',
            timeout_seconds INTEGER NOT NULL DEFAULT 30,
            model_overrides TEXT NOT NULL DEFAULT '[]',
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
    """),
    Migration(10, "secret-storage", """
        CREATE TABLE IF NOT EXISTS secret_storage (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT 'general',
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE INDEX IF NOT EXISTS idx_secrets_category ON secret_storage(category);
    """),
    Migration(11, "builtin-agents-workflows", """
        ALTER TABLE agents ADD COLUMN is_builtin INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE workflows ADD COLUMN is_builtin INTEGER NOT NULL DEFAULT 0;
    """),
    Migration(12, "agent-provider", """
        ALTER TABLE agents ADD COLUMN provider TEXT NOT NULL DEFAULT 'ollama';
    """),
]


class MigrationRunner:
    def __init__(self, db: Database):
        self._db = db
        self._ensure_schema_table()

    def _ensure_schema_table(self) -> None:
        self._db.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            )
        """)

    def current_version(self) -> int:
        row = self._db.fetchone(
            "SELECT COALESCE(MAX(version), 0) AS v FROM schema_version"
        )
        return row["v"] if row else 0

    def pending(self) -> list[Migration]:
        cur = self.current_version()
        return [m for m in MIGRATIONS if m.version > cur]

    def run_pending(self) -> bool:
        pending = self.pending()
        if not pending:
            return False
        for m in pending:
            self._db.exec(m.sql)
            self._db.execute(
                "INSERT INTO schema_version (version, name) VALUES (?, ?)",
                (m.version, m.name),
            )
        return bool(pending)
