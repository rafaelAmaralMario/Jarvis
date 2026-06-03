# 012 — Sync Server Completo

## Metadados
- **Status:** ⬜ A Fazer
- **Prioridade:** 🟡 Média
- **Dependências:** 004 (Docker & Infra), 008 (Módulo Conhecimento)

## Descrição
Completar o servidor de sincronização para colaboração multi-workspace.
Autenticação JWT, operações CRUD via REST, sincronização real-time via
WebSocket (broadcast), e merge de conflitos.

## Especificação Técnica

### Arquivos
```
server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    ← Express + WebSocket bootstrap
│   ├── config.ts                   ← Config from env
│   ├── auth/
│   │   ├── jwt.ts                  ← JWT sign/verify
│   │   ├── middleware.ts            ← Auth middleware
│   │   └── routes.ts               ← Login/register endpoints
│   ├── db/
│   │   ├── schema.ts               ← PostgreSQL schema
│   │   ├── migrations/             ← SQL migration files
│   │   └── connection.ts           ← pg pool
│   ├── routes/
│   │   ├── notes.ts                ← Notes CRUD REST
│   │   ├── workspaces.ts           ← Workspace sharing
│   │   └── users.ts                ← User management
│   ├── ws/
│   │   ├── handler.ts              ← WebSocket message router
│   │   ├── rooms.ts                ← Workspace rooms
│   │   └── sync.ts                 ← Conflict resolution
│   └── services/
│       ├── note-sync.ts            ← Note synchronization logic
│       └── merge.ts                ← OT/CRDT merge strategy
└── docker-compose.yml              ← postgres + sync-server
```

### Schemas PostgreSQL
```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members
CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID REFERENCES users(id),
    role TEXT DEFAULT 'editor',  -- owner, editor, viewer
    PRIMARY KEY (workspace_id, user_id)
);

-- Synced notes
CREATE TABLE synced_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### API REST
```
POST   /api/auth/register       → { email, password, displayName }
POST   /api/auth/login          → { token, user }
GET    /api/notes?workspace=... → notes[]
POST   /api/notes               → create note
PUT    /api/notes/:id           → update note (com version check)
DELETE /api/notes/:id           → soft delete
```

### WebSocket Events
```
Client → Server:
  { type: "note:update", noteId, content, version }
  { type: "note:select", noteId }
  { type: "ping" }

Server → Client:
  { type: "note:updated", noteId, content, version, updatedBy }
  { type: "note:deleted", noteId }
  { type: "user:joined", userId, displayName }
  { type: "user:left", userId }
  { type: "error", message }
  { type: "pong" }
```

### Conflict Resolution
- Last-Writer-Wins (LWW) baseado em version + updated_at
- Se version mismatch, envia diff para reconciliação
- Histórico de versões mantido (últimas 10)

## Critérios de Aceitação
- [ ] Registro e login com JWT
- [ ] CRUD de notas via REST com version check
- [ ] WebSocket broadcast em tempo real
- [ ] Workspace rooms (membros veem mudanças apenas do seu workspace)
- [ ] Conflict detection (version mismatch)
- [ ] Soft delete com sync
- [ ] Docker compose integrado

---

## Test Cases

### TC-001: Registro de usuário
- **Pré-condições:** Sync server rodando
- **Passos:**
  1. `POST /api/auth/register { email: "a@b.com", password: "123456", displayName: "Test" }`
- **Resultado esperado:** 201, retorna { user, token }
- **Cobertura:** normal

### TC-002: Registro com email duplicado
- **Pré-condições:** Email já registrado
- **Passos:**
  1. `POST /api/auth/register { email: "a@b.com", ... }`
- **Resultado esperado:** 409, erro "Email já cadastrado"
- **Cobertura:** erro

### TC-003: Login com credenciais corretas
- **Pré-condições:** Usuário registrado
- **Passos:**
  1. `POST /api/auth/login { email: "a@b.com", password: "123456" }`
- **Resultado esperado:** 200, retorna JWT token
- **Cobertura:** normal

### TC-004: Login com senha errada
- **Pré-condições:** Usuário registrado
- **Passos:**
  1. `POST /api/auth/login { email: "a@b.com", password: "senha_errada" }`
- **Resultado esperado:** 401, erro "Credenciais inválidas"
- **Cobertura:** erro

### TC-005: REST sem token
- **Pré-condições:** Nenhum
- **Passos:**
  1. `GET /api/notes` sem Authorization header
- **Resultado esperado:** 401
- **Cobertura:** erro

### TC-006: REST com token inválido
- **Pré-condições:** Nenhum
- **Passos:**
  1. `GET /api/notes` com Authorization: Bearer token_invalido
- **Resultado esperado:** 401
- **Cobertura:** erro

### TC-007: CRUD nota via REST
- **Pré-condições:** Usuário logado, workspace criado
- **Passos:**
  1. `POST /api/notes { title: "Test", content: "Hello", workspaceId }` → id
  2. `GET /api/notes/:id` → dados
  3. `PUT /api/notes/:id { title: "Updated", content: "World", version: 1 }` → 200
  4. `DELETE /api/notes/:id` → 204
  5. `GET /api/notes/:id` → 404
- **Resultado esperado:** CRUD completo
- **Cobertura:** normal

### TC-008: Version conflict detection
- **Pré-condições:** Nota com version=2
- **Passos:**
  1. `PUT /api/notes/:id { version: 1, ... }` (versão desatualizada)
- **Resultado esperado:** 409 Conflict
- **Cobertura:** borda

### TC-009: WebSocket connect e auth
- **Pré-condições:** Token JWT válido
- **Passos:**
  1. `ws://localhost:3001/ws?token=...`
- **Resultado esperado:** Conexão aceita
- **Cobertura:** normal

### TC-010: WebSocket sem token
- **Pré-condições:** Nenhum
- **Passos:**
  1. `ws://localhost:3001/ws` sem token
- **Resultado esperado:** Conexão rejeitada (400 ou close)
- **Cobertura:** erro

### TC-011: WebSocket broadcast de nota
- **Pré-condições:** 2 usuários conectados no mesmo workspace
- **Passos:**
  1. User A atualiza nota via REST
- **Resultado esperado:** User B recebe `{ type: "note:updated", ... }`
- **Cobertura:** normal

### TC-012: WebSocket broadcast apenas para membros do workspace
- **Pré-condições:** User A no workspace X, User B no workspace Y
- **Passos:**
  1. User A atualiza nota
- **Resultado esperado:** User B NÃO recebe evento
- **Cobertura:** normal | borda

### TC-013: WebSocket note:select tracking
- **Pré-condições:** 2 usuários conectados
- **Passos:**
  1. User A envia `{ type: "note:select", noteId: "abc" }`
- **Resultado esperado:** User B recebe `{ type: "note:selected", noteId: "abc", userId: "A" }`
- **Cobertura:** normal

### TC-014: Soft delete com sync
- **Pré-condições:** Nota existe
- **Passos:**
  1. `DELETE /api/notes/:id` (soft delete)
  2. GET da nota retorna 404
  3. WebSocket envia `{ type: "note:deleted", noteId }`
- **Resultado esperado:** Delete syncronizado
- **Cobertura:** normal

### TC-015: Health check
- **Pré-condições:** Sync server rodando
- **Passos:**
  1. `GET /health`
- **Resultado esperado:** `{ status: "ok", uptime: ..., db: "connected" }`
- **Cobertura:** normal

### TC-016: WebSocket reconnect
- **Pré-condições:** Cliente conectado via WS
- **Passos:**
  1. Derrubar sync server
  2. Subir de novo
  3. Cliente reconecta automaticamente
- **Resultado esperado:** Reconexão automática com backoff exponencial
- **Cobertura:** borda | erro
