# Banco de Dados SQLite

## Configuração

| Item | Valor |
|------|-------|
| Engine | SQLite 3.x via Qt QSqlDatabase |
| Driver | QSQLITE |
| Modo WAL | Sim |
| Mutex | Recursivo (QMutex) |
| Localização | `%APPDATA%\JARVIS\JARVIS\jarvis-ai.db` |
| Schema version | 8 |
| Tabelas | ~26 |

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
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador único |
| title | TEXT | Título da nota |
| content | TEXT | Conteúdo em Markdown |
| folder_id | TEXT | Pasta pai |
| tags | TEXT | Tags separadas por vírgula |
| created_at | TEXT | ISO 8601 |
| updated_at | TEXT | ISO 8601 |

### knowledge_links
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| source_id | TEXT | Nota de origem |
| target_id | TEXT | Nota de destino |
| type | TEXT | Tipo do link |

### agents
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador |
| name | TEXT | Nome do agente |
| model_id | TEXT | Modelo associado |
| system_prompt | TEXT | Prompt do sistema |
| temperature | REAL | Criatividade |
| is_active | INTEGER | Booleano |

### orchestration_config
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT | "default" |
| strategy | TEXT | "sequential" ou "parallel" |
| max_iterations | INTEGER | Limite de iterações |
| timeout_ms | INTEGER | Timeout em ms |

## Notas Técnicas

- `database.cpp` usa `QSqlDatabase::database()` com nome de conexão `"jarvis_main"`
- Factory `createDatabase()` cria ou abre o banco em `getJarvisDataDir()/jarvis-ai.db`
- `exec()` no `database.cpp` divide SQL por `;` com `Qt::SkipEmptyParts` e executa cada statement individualmente (necessário porque `QSqlQuery::exec()` só executa 1 statement por vez)
- Backup nativo via `backup_manager.cpp` usando `sqlite3_backup_*` API
