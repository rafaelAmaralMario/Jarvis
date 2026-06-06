# Banco de Dados SQLite

## Configuracao

| Item | Valor |
|------|-------|
| Engine | SQLite 3.x nativo (`sqlite3` module) |
| Modo WAL | Sim (`PRAGMA journal_mode=WAL`) |
| Thread safety | `threading.RLock` (recursive lock) |
| Localizacao | `%APPDATA%\JARVIS\jarvis-ai.db` |
| Schema version | 8 |
| Tabelas | ~26 |
| Transacoes | Explicitas (`BEGIN`/`COMMIT`/`ROLLBACK`) |

## Migrations (8 scripts)

```
core_001_core.sql
  └── modules, service_registry, config
core_002_permissions.sql
  └── permissions, roles, role_permissions
core_003_extensions.sql
  └── extensions, extension_configs
models_agents_001.sql
  └── models, agents, orchestration_config, agent_traces
knowledge_001.sql
  └── knowledge_notes, knowledge_links, knowledge_tags, note_tags
workspace_001.sql
  └── workspace_projects, workspace_files
editor_001.sql
  └── editor_settings
api_keys_001.sql
  └── api_keys, webhook_configs, sessions, backup_registry
```

## Tabelas Principais

### knowledge_notes
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador unico |
| title | TEXT | Titulo da nota |
| content | TEXT | Conteudo em Markdown |
| folder_id | TEXT | Pasta pai |
| tags | TEXT | Tags separadas por virgula |
| created_at | TEXT | ISO 8601 |
| updated_at | TEXT | ISO 8601 |

### knowledge_links
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| source_id | TEXT | Nota de origem |
| target_id | TEXT | Nota de destino |
| type | TEXT | Tipo do link |

### agents
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador |
| name | TEXT | Nome do agente |
| model_id | TEXT | Modelo associado |
| system_prompt | TEXT | Prompt do sistema |
| temperature | REAL | Criatividade |
| is_active | INTEGER | Booleano |

### orchestration_config
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | TEXT | "default" |
| strategy | TEXT | "sequential" ou "parallel" |
| max_iterations | INTEGER | Limite de iteracoes |
| timeout_ms | INTEGER | Timeout em ms |

## Notas Tecnicas

- `database.py` usa `sqlite3.connect()` com `isolation_level = None` para controle manual de transacoes
- `RLock` garante seguranca em multiplas threads (pywebview roda eventos em thread separada)
- WAL mode permite leitura concorrente durante escritas
- Backup via `VACUUM INTO` ou copia do arquivo (sem `sqlite3_backup_*`)
- FTS5 habilitado para busca full-text nas notas
