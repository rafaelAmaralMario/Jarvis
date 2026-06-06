# Modulo Persistencia

## O que faz
Camada de abstracao sobre SQLite com migrations, controle de acesso concorrente e backup.

## Arquivos
```
backend/jarvis/database.py           — SQLite WAL thread-safe (RLock, isolation_level=None)
backend/jarvis/migration_runner.py   — Execucao de 8 migrations
```

## Funcionalidades

### Database
- Conexao SQLite com WAL mode (`PRAGMA journal_mode=WAL`)
- RLock (recursive lock) para thread safety
- Transacoes explicitas com `BEGIN`/`COMMIT`/`ROLLBACK`
- `isolation_level = None` para controle manual
- Localizacao: `%APPDATA%\JARVIS\jarvis-ai.db`

### Migration Runner
- Descoberta automatica de scripts .sql embutidos
- Execucao sequencial com controle de versao (tabela `schema_version`)
- Split multi-statement (cada `;` = 1 execucao)

### Repositories
- Cada manager acessa o banco diretamente via `database.py`
- Sem ORM — SQL direto com parametros nomeados
- Prevencao de SQL injection via `?` placeholders no sqlite3

### Backup
- Backup via `VACUUM INTO` (SQLite 3.27+)
- Alternativa: copia do arquivo .db

## Schema Migrations (8 arquivos)
1. `core_001_core.sql` — tabelas base do sistema
2. `core_002_permissions.sql` — permissoes e roles
3. `core_003_extensions.sql` — extensoes
4. `models_agents_001.sql` — modelos e agentes
5. `knowledge_001.sql` — notas e links
6. `workspace_001.sql` — projetos e arquivos
7. `editor_001.sql` — configuracoes do editor
8. `api_keys_001.sql` — chaves de API
