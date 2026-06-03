# 004 — Docker & Multi-Workspace Infrastructure

## Metadados
- **Status:** ✅ Concluída
- **Prioridade:** 🟡 Média
- **Dependências:** 001 (Fundação do Projeto)

## Descrição
Criar a infraestrutura Docker para serviços de time (PostgreSQL + Sync Server)
e o devcontainer para desenvolvimento reproduzível. O sync server permite colaboração
multi-workspace entre usuários.

## Especificação Técnica

### Stack
- Docker Compose v3.8+
- PostgreSQL 16 (serviço de banco compartilhado)
- Sync Server: TypeScript + Express + WebSocket + pg
- Dev container: Ubuntu 24.04 + Qt6 + CMake + Node + Clang 18

### Arquivos Criados
```
docker-compose.yml         ← postgres + sync-server
Dockerfile.dev             ← Imagem dev completa
.devcontainer/
└── devcontainer.json      ← VS Code Remote Container
.env.example               ← Variáveis padrão
server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           ← Express + WebSocket server
│   ├── db/schema.ts       ← PostgreSQL schema
│   ├── routes/            ← API REST endpoints
│   └── ws/handler.ts      ← WebSocket handler
└── docker-compose.yml     ← Override local (apenas postgres)
```

### Services
- **postgres** (port 5432): Banco compartilhado para sync de time
- **sync-server** (port 3001): Sincronização em tempo real via WebSocket

## Critérios de Aceitação
- [x] `docker compose up` sobe postgres + sync-server sem erro
- [x] PostgreSQL acessível na porta 5432
- [x] Sync server responde em `localhost:3001` (REST + WebSocket)
- [x] Dev container instala Qt6, CMake, Node, Clang 18
- [x] `.env.example` com configurações padrão
- [x] Serviços isolados na rede `jarvis-network`

---

## Test Cases

### TC-001: docker compose up sobe ambos serviços
- **Pré-condições:** Docker + Docker Compose instalados
- **Passos:**
  1. `docker compose up -d`
  2. `docker compose ps`
- **Resultado esperado:** postgres (healthy) + sync-server (running)
- **Cobertura:** normal

### TC-002: PostgreSQL aceita conexão
- **Pré-condições:** Container postgres rodando
- **Passos:**
  1. `docker compose exec postgres pg_isready -U jarvis`
- **Resultado esperado:** `localhost:5432 - accepting connections`
- **Cobertura:** normal

### TC-003: Sync server responde HTTP
- **Pré-condições:** Container sync-server rodando
- **Passos:**
  1. `curl http://localhost:3001/health`
- **Resultado esperado:** `{"status":"ok","uptime":...}`
- **Cobertura:** normal

### TC-004: Sync server WebSocket aceita conexão
- **Pré-condições:** Container sync-server rodando
- **Passos:**
  1. `wscat -c ws://localhost:3001/ws`
  2. Enviar `{"type":"ping"}`
- **Resultado esperado:** Resposta `{"type":"pong"}`
- **Cobertura:** normal

### TC-005: docker compose down limpa tudo
- **Pré-condições:** Serviços rodando
- **Passos:**
  1. `docker compose down -v`
  2. `docker compose ps`
- **Resultado esperado:** Nenhum container ativo
- **Cobertura:** normal

### TC-006: Dev container builda sem erro
- **Pré-condições:** Docker instalado
- **Passos:**
  1. `docker build -f Dockerfile.dev -t jarvis-dev .`
- **Resultado esperado:** Build completo com Qt6, CMake, Node, Clang
- **Cobertura:** normal

### TC-007: .env.example contém todas as variáveis
- **Pré-condições:** Nenhuma
- **Passos:**
  1. Abrir `.env.example`
  2. Verificar: POSTGRES_*, SYNC_*, JARVIS_*
- **Resultado esperado:** 10+ variáveis documentadas com defaults
- **Cobertura:** normal

### TC-008: PostgreSQL init script roda schema
- **Pré-condições:** Postgres fresco (sem dados)
- **Passos:**
  1. `docker compose exec postgres psql -U jarvis -d jarvis -c "\dt"`
- **Resultado esperado:** Tabelas do schema aparecem
- **Cobertura:** normal

### TC-009: Rede isolada funciona
- **Pré-condições:** Serviços rodando
- **Passos:**
  1. `docker compose exec sync-server ping postgres`
- **Resultado esperado:** Ping sucede (rede interna)
- **Cobertura:** normal

### TC-010: Volume postgres persiste dados
- **Pré-condições:** Dados inseridos no postgres
- **Passos:**
  1. `docker compose down`
  2. `docker compose up -d`
  3. Verificar que dados anteriores ainda existem
- **Resultado esperado:** Dados persistentes
- **Cobertura:** normal | borda
