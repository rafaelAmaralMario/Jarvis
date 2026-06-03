# 010 — Módulo Persistência

## Metadados
- **Status:** ⬜ A Fazer
- **Prioridade:** 🟡 Média
- **Dependências:** 002 (Estrutura C++ Kernel)

## Descrição
Implementar o módulo **Persistência** com repositórios SQLite tipados,
migrations versionadas, WAL mode, backup, e transações.
Todos os outros módulos consomem persistência através deste módulo.

## Especificação Técnica

### Arquivos Planejados
```
kernel/include/jarvis/persistence/
├── database.h                 ← IDatabase (connection pool, WAL, pragma)
├── migration_runner.h         ← IMigrationRunner (versioned SQL migrations)
├── repository.h               ← IRepository<T> (CRUD genérico)
├── backup_manager.h           ← IBackupManager
└── query_builder.h            ← Query builder fluente

kernel/src/persistence/
├── database.cpp               ← Single SQLite connection (WAL mode)
├── migration_runner.cpp       ← Schema version table, run pending
├── repository.cpp             ← Template base (ou header-only)
├── backup_manager.cpp         ← .backup file export/import
└── query_builder.cpp          ← SELECT/INSERT/UPDATE/DELETE builder

kernel/resources/sql/
├── 001-core.sql               ← core tables
├── 002-permissions.sql        ← permissions tables
├── 003-workspace.sql          ← workspace tables
├── 004-models-agents.sql      ← models + agents tables
├── 005-knowledge.sql          ← notes + FTS tables
└── 006-extensions.sql         ← extension registry
```

### Features
- SQLite com WAL mode (journal_mode=WAL)
- Migrations versionadas (timestamp-based)
- Repositório genérico com CRUD tipado
- Backup automático (savepoint antes de operações perigosas)
- Query builder fluente: `db.from("notes").where("tags LIKE ?", "%cpp%").orderBy("updated_at DESC").limit(10)`
- Conexão única com mutex para thread-safety

## Critérios de Aceitação
- [ ] Database abre SQLite com WAL mode
- [ ] Migration runner executa scripts em ordem
- [ ] Rollback em caso de migration com erro
- [ ] Repositório genérico com CRUD completo
- [ ] Backup salva/restaura .backup
- [ ] Query builder funciona com parâmetros
- [ ] Thread-safe (mutex)

---

## Test Cases

### TC-001: Database abre e WAL mode ativado
- **Pré-condições:** Arquivo .db não existe
- **Passos:**
  1. `database.open("jarvis.db")`
  2. `database.execute("PRAGMA journal_mode")`
- **Resultado esperado:** journal_mode = "wal"
- **Cobertura:** normal

### TC-002: Database abre existente
- **Pré-condições:** jarvis.db já existe
- **Passos:**
  1. `database.open("jarvis.db")`
- **Resultado esperado:** Abre sem erro, dados preservados
- **Cobertura:** normal

### TC-003: Migration runner executa 001 → 002
- **Pré-condições:** Banco vazio, migrations 001 e 002 disponíveis
- **Passos:**
  1. `runner.runPending()`
- **Resultado esperado:** Tabelas de 001 e 002 criadas, schema_version = 2
- **Cobertura:** normal

### TC-004: Migration runner não re-executa
- **Pré-condições:** Schema version = 2
- **Passos:**
  1. `runner.runPending()` (sem novas migrations)
- **Resultado esperado:** Nada executado, version não muda
- **Cobertura:** borda

### TC-005: Migration runner erro reverte
- **Pré-condições:** Migration 003 tem erro (SQL inválido)
- **Passos:**
  1. `runner.runPending()`
- **Resultado esperado:** Erro reportado, version ainda = 2, banco não corrompido
- **Cobertura:** erro

### TC-006: Repositório CRUD genérico
- **Pré-condições:** Tabela "notes" existe
- **Passos:**
  1. `repo.insert({title: "Test", content: "..."})` → id
  2. `repo.getById(id)` → objeto
  3. `repo.update(id, {title: "Updated"})` → sucesso
  4. `repo.list()` → array com 1 item
  5. `repo.delete(id)` → sucesso
  6. `repo.list()` → array vazio
- **Resultado esperado:** CRUD funcional
- **Cobertura:** normal

### TC-007: Repositório getById inexistente
- **Pré-condições:** Nenhum registro
- **Passos:**
  1. `repo.getById("id-invalido")`
- **Resultado esperado:** nullopt ou exceção tratada
- **Cobertura:** borda

### TC-008: Query builder SELECT com WHERE
- **Pré-condições:** Tabela com 10 registros, 3 com tag "cpp"
- **Passos:**
  1. `db.from("notes").where("tags LIKE ?", "%cpp%").limit(5).execute()`
- **Resultado esperado:** 3 resultados
- **Cobertura:** normal

### TC-009: Query builder INSERT com bindings
- **Pré-condições:** Nenhuma
- **Passos:**
  1. `db.from("notes").insert({title: "?", content: "?"}).bind(["A", "B"]).execute()`
- **Resultado esperado:** 1 row inserted
- **Cobertura:** normal

### TC-010: Query builder SQL injection
- **Pré-condições:** Nenhuma
- **Passos:**
  1. `db.from("notes").where("title = ?", "'; DROP TABLE notes; --").execute()`
- **Resultado esperado:** Apenas busca segura, tabela notes intacta
- **Cobertura:** segurança

### TC-011: Backup manager salva e restaura
- **Pré-condições:** Banco com dados
- **Passos:**
  1. `backup.save("backup.db")`
  2. Deletar dados originais
  3. `backup.restore("backup.db")`
  4. Verificar dados restaurados
- **Resultado esperado:** Backup e restore funcionais
- **Cobertura:** normal

### TC-012: Backup manager arquivo inexistente
- **Pré-condições:** backup.db não existe
- **Passos:**
  1. `backup.restore("backup.db")`
- **Resultado esperado:** Erro retornado
- **Cobertura:** erro

### TC-013: Thread safety concorrente
- **Pré-condições:** Database aberta
- **Passos:**
  1. Disparar 10 threads fazendo INSERT simultâneo
  2. Aguardar todas
  3. Verificar total de registros = 10
- **Resultado esperado:** Nenhum crash, todos inserts bem-sucedidos
- **Cobertura:** concorrência

### TC-014: Transação commit/rollback
- **Pré-condições:** Database aberta
- **Passos:**
  1. `database.beginTransaction()`
  2. Inserir registro
  3. `database.rollback()`
  4. `repo.list()` → 0 registros
  5. `database.beginTransaction()`
  6. Inserir registro
  7. `database.commit()`
  8. `repo.list()` → 1 registro
- **Resultado esperado:** Transações funcionam
- **Cobertura:** normal

### TC-015: WAL checkpoint manual
- **Pré-condições:** WAL mode, transações feitas
- **Passos:**
  1. `database.checkpoint()`
- **Resultado esperado:** WAL file reduzido, checkpoint sucedido
- **Cobertura:** normal
