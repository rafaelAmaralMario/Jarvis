# Módulo Persistência

## O que faz
Camada de abstração sobre SQLite com migrations, repositories, query builder e backup.

## Arquivos
```
kernel/src/persistence/database.cpp          — Wrapper SQLite (WAL, multi-statement)
kernel/src/persistence/migration_runner.cpp  — Execução de migrations
kernel/src/persistence/repository.cpp        — Repositório genérico
kernel/src/persistence/query_builder.cpp     — Builder de queries
kernel/src/persistence/backup_manager.cpp    — Backup nativo SQLite
```

## Funcionalidades

### Database
- Conexão SQLite com WAL mode
- Mutex recursivo para thread safety
- Factory `createDatabase()` com `getJarvisDataDir()`
- Suporte a transações

### Migration Runner
- Descoberta automática de scripts .sql
- Execução sequencial com controle de versão
- Split multi-statement (cada `;` = 1 execução)
- Tabela de controle: `schema_version`

### Repository
- CRUD genérico para qualquer tabela
- Query por ID
- Listagem com filtros
- Paginação

### Query Builder
- Montagem programática de SQL
- Suporte a WHERE, JOIN, ORDER BY, LIMIT
- Parâmetros nomeados
- Prevenção de SQL injection (via Qt)

### Backup Manager
- Backup nativo via API `sqlite3_backup_*`
- Backup para arquivo .db
- Restore de backup
- Listagem de backups disponíveis
- Agendamento automático (configurável)

## Schema Migrations (8 arquivos)
1. `core_001_core.sql` — tabelas base do sistema
2. `core_002_permissions.sql` — permissões e roles
3. `core_003_extensions.sql` — extensões
4. `models_agents_001.sql` — modelos e agentes
5. `knowledge_001.sql` — notas e links
6. `workspace_001.sql` — projetos e arquivos
7. `editor_001.sql` — configurações do editor
8. `api_keys_001.sql` — chaves de API
