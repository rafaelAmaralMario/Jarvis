# Contexto: Módulo Persistência (SQLite)

**ID:** CONTEXT-007
**Timestamp:** 2026-06-03T15:30:00-03:00
**Status:** active
**Supersedes:** —
**Superseded by:** —
**Skill usada:** —

## Decisao

Implementado o módulo **Persistência** como camada unificada de acesso a SQLite,
substituindo as conexões independentes que cada módulo criava.

### Componentes criados

- `IDatabase` — interface para conexão SQLite com WAL mode, thread-safety (mutex),
  transações, checkpoint
- `IMigrationRunner` — migrações versionadas (versão 1 a 6)
- `IRepository` — CRUD genérico com `QJsonObject`
- `QueryBuilder` — builder fluente SELECT/INSERT/UPDATE/DELETE
- `IBackupManager` — backup/restore via `VACUUM INTO`

### Migrações registradas

| Versão | Nome | Tabelas |
|--------|------|---------|
| 001 | core | system_config, extension_registry, audit_log |
| 002 | permissions | permissions |
| 003 | extensions | extensions |
| 004 | models-agents | model_metadata, agents, orchestration_config, agent_conversations, conversation_messages |
| 005 | knowledge | notes, note_links, note_tags, notes_fts (FTS5) |
| 006 | workspace | workspaces, workspace_folders, recent_files |

### Refatoração

- `knowledge_manager` e `workspace_manager` agora recebem `IDatabase*` em vez de `dbPath`
- Removido `initDb()` de ambos — tabelas criadas via migrations
- Search engine também refatorado para usar `IDatabase*`
- Database registrado no ServiceLocator como `persistence-db`

## Arquivos Afetados

- `kernel/include/jarvis/persistence/*` (5 headers — novos)
- `kernel/src/persistence/*` (5 cpps — novos)
- `kernel/resources/sql/*` (6 SQL migrations)
- `kernel/src/knowledge/knowledge_manager.cpp` (refatorado)
- `kernel/src/knowledge/search_engine.cpp` (refatorado)
- `kernel/src/workspace/workspace_manager.cpp` (refatorado)
- `kernel/src/main.cpp` (integração persistence + migrações)
- `kernel/CMakeLists.txt` (novos sources)

## Proximos Passos

- Migrar models_manager, agents_manager, orchestration_manager para IDatabase*
- Task 012: Sync Server
