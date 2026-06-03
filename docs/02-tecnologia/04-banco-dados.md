# Banco de Dados e Persistencia

## Decisao: SQLite

SQLite como unico banco de dados local, acessado via Qt SQL (QSqlDatabase).

## Justificativa

- **Zero configuracao** — nao precisa de servidor, instalacao, nem setup
- **Embedded** — roda no mesmo processo, sem overhead de rede
- **Confiabilidade** — ACID, journaling, WAL mode
- **Performance** — excellente para leitura/escrita local
- **Qt SQL** — integracao nativa com Qt, QSqlQuery, QSqlTableModel
- **Portabilidade** — mesmo banco funciona em Windows/Linux/macOS

## Esquemas Planejados

### knowledge.db — Modulo Conhecimento (cerebro)

```sql
-- Notas (estilo Obsidian)
CREATE TABLE notes (
    id          TEXT PRIMARY KEY,      -- UUID
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,          -- Markdown
    tags        TEXT,                   -- JSON array
    folder      TEXT DEFAULT '/',
    created_at  TEXT NOT NULL,          -- ISO 8601
    updated_at  TEXT NOT NULL,
    is_deleted  INTEGER DEFAULT 0       -- Soft delete
);

-- Backlinks (grafos de conhecimento)
CREATE TABLE links (
    source_id   TEXT NOT NULL REFERENCES notes(id),
    target_id   TEXT NOT NULL REFERENCES notes(id),
    link_type   TEXT DEFAULT 'wiki',    -- wiki, tag, mention
    created_at  TEXT NOT NULL,
    PRIMARY KEY (source_id, target_id)
);

-- Tags
CREATE TABLE tags (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    color       TEXT                    -- Hex color
);

-- Atalhos (para search full-text com FTS5)
CREATE VIRTUAL TABLE notes_fts USING fts5(
    title, content, tags,
    content='notes',
    content_rowid='rowid'
);
```

### core.db — Dados do Sistema

```sql
-- Configuracoes
CREATE TABLE settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

-- Permissoes concedidas
CREATE TABLE permissions (
    id          TEXT PRIMARY KEY,
    module_id   TEXT NOT NULL,
    permission  TEXT NOT NULL,
    granted     INTEGER DEFAULT 0,
    updated_at  TEXT NOT NULL
);

-- Audit log
CREATE TABLE audit_log (
    id          TEXT PRIMARY KEY,
    timestamp   TEXT NOT NULL,
    actor       TEXT NOT NULL,          -- module_id or "user"
    action      TEXT NOT NULL,
    target      TEXT,
    result      TEXT,                   -- allowed, denied, error
    detail      TEXT                    -- JSON adicional
);
```

### ai.db — Modulo AI Engine

```sql
-- Historico de conversas
CREATE TABLE conversations (
    id          TEXT PRIMARY KEY,
    title       TEXT,
    module_id   TEXT NOT NULL,          -- qual modulo iniciou
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

-- Mensagens
CREATE TABLE messages (
    id          TEXT PRIMARY KEY,
    conv_id     TEXT NOT NULL REFERENCES conversations(id),
    role        TEXT NOT NULL,          -- user, assistant, system, tool
    content     TEXT NOT NULL,
    model       TEXT,
    tokens_in   INTEGER,
    tokens_out  INTEGER,
    latency_ms  INTEGER,
    created_at  TEXT NOT NULL
);
```

## Politica de Backup

- Banco principal em `%APPDATA%/JARVIS/data/` (Windows) ou `~/.jarvis/data/`
- Backup automatico diario (copiar banco para `.backup/YYYY-MM-DD/`)
- Export para Markdown/JSON disponivel na interface

## Consideracoes Futuras

- **ChromaDB / sqlite-vec** para embeddings search (quando implementar busca semantica)
- **WAL mode** para concorrencia leitura/escrita
- **Criptografia** via SQLCipher se necessario para dados sensiveis
