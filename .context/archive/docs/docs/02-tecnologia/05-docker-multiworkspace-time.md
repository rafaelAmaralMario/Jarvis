# Docker, Multi-Workspace e Trabalho em Equipe

## Problema

Temos SQLite para dados locais (otimo para single-user), mas precisamos de:
- Ambiente de desenvolvimento padronizado para o time
- Sincronizacao de conhecimento entre maquinas
- Multiplos workspaces compartilhados
- CI/CD consistente

## Proposta: Arquitetura Hibrida (Local + Servidor)

```
┌──────────────────────────────────────────────────┐
│              Desktop App (C++ + React)            │
│  ┌─────────────┐  ┌─────────────┐                │
│  │ SQLite Local │  │ Sync Client │                │
│  │ (notas, cfg) │  │ (WebSocket) │                │
│  └─────────────┘  └──────┬──────┘                │
└──────────────────────────┼────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Internet   │
                    └──────┬──────┘
                           │
┌──────────────────────────┼────────────────────────┐
│              Docker Compose (Servidor)             │
│  ┌──────────────────┐  ┌──────────────────┐       │
│  │   PostgreSQL     │  │   Sync Server    │       │
│  │   (time/dados)   │  │   (WebSocket)    │       │
│  └──────────────────┘  └──────────────────┘       │
└──────────────────────────────────────────────────┘

💡 **Modelos de IA (Ollama) rodam nativos na maquina local**, nao em Docker.
    O AI Engine (C++) comunica com `http://localhost:11434` via Qt Network.
    Isso evita dependencia de Docker para funcionalidade principal e
    permite uso de GPU nativa sem complicacao.
```

### Por que dois bancos?

| Dado | Local (SQLite) | Servidor (PostgreSQL) |
|------|---------------|----------------------|
| Notas pessoais | ✅ | — |
| Configuracoes | ✅ | — |
| Historico chat local | ✅ | — |
| Notas compartilhadas | cache | ✅ fonte da verdade |
| Decisoes de time | cache | ✅ |
| Audit log central | — | ✅ |
| Usuarios/permissoes | — | ✅ |

---

## Docker Compose (Servidor)

```yaml
# docker-compose.yml na raiz do projeto
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: jarvis
      POSTGRES_PASSWORD: ${DB_PASSWORD:-jarvis}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./server/sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jarvis"]
      interval: 5s

  sync-server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
      - "8081:8081"
    environment:
      DATABASE_URL: postgres://jarvis:${DB_PASSWORD:-jarvis}@postgres:5432/jarvis
      JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
```

> **Nota:** Ollama roda nativo na maquina local (`localhost:11434`), fora do Docker.

---

## Dev Container (Ambiente de Desenvolvimento)

Para que TODO desenvolvedor tenha o mesmo ambiente:

```json
// .devcontainer/devcontainer.json
{
  "name": "JARVIS Dev",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "dev",
  "workspaceFolder": "/workspace",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-vscode.cpptools",
        "ms-vscode.cmake-tools",
        "qt-creator.qt-creator",
        "dbaeumer.vscode-eslint",
        "bradlc.vscode-tailwindcss"
      ]
    }
  }
}
```

```dockerfile
# Dockerfile.dev
FROM ubuntu:24.04

# C++ build tools
RUN apt-get update && apt-get install -y \
    cmake ninja-build g++-14 clang-18 \
    qt6-base-dev qt6-webengine-dev qt6-webchannel-dev \
    libqt6sql6-sqlite libqt6network6 \
    nodejs npm \
    git openssh-client \
    && rm -rf /var/lib/apt/lists/*

ENV CC=clang-18 CXX=clang++-18
WORKDIR /workspace
```

---

## Sync Server (Para Time)

Um servidor simples em Node.js ou Python para sincronizar conhecimento entre membros do time:

```typescript
// server/src/index.ts
// API REST + WebSocket para sync de notas do Conhecimento

interface SyncEvent {
  type: 'note.created' | 'note.updated' | 'note.deleted';
  noteId: string;
  userId: string;
  workspaceId: string;
  timestamp: string;
  data: any;
}

// WebSocket: broadcasting em tempo real
// REST: CRUD de notas compartilhadas
// Auth: JWT tokens
```

### Fluxo de Sync

```
Usuario A edita nota
  → SQLite local atualiza imediatamente
  → Sync Client envia diff via WebSocket
  → Sync Server persiste no PostgreSQL
  → Server broadcast para Usuario B
  → Usuario B recebe via WebSocket
  → B atualiza cache local (SQLite)
```

---

## Multi-Workspace

Cada workspace e isolado:

```
workspaces/
├── projeto-cliente-x/
│   ├── knowledge.db      ← SQLite local
│   └── config.json
├── projeto-interno/
│   ├── knowledge.db
│   └── config.json
└── pessoal/
    ├── knowledge.db
    └── config.json
```

No banco do servidor (PostgreSQL), workspaces sao identificados por `workspace_id`:

```sql
CREATE TABLE shared_notes (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE
);
```

---

## Como Comecar

### Fase 1 — Setup inicial (agora)
```bash
# 1. Dev container + servicos
docker compose up -d postgres ollama

# 2. UI React (local, sem Docker)
cd ui && npm install && npm run dev

# 3. Kernel C++ (local, precisa de Qt instalado)
cmake --preset default && cmake --build build/default
```

### Fase 2 — Sync server (quando implementar Conhecimento)
```bash
# Adicionar sync-server ao docker-compose
docker compose up -d

# App se conecta ao WebSocket do sync-server
```

### Fase 3 — CI/CD (GitHub Actions)
```yaml
# .github/workflows/build.yml
jobs:
  build:
    runs-on: ubuntu-24.04
    container:
      image: jarvis-dev:latest  # Mesma imagem do dev container
    steps:
      - uses: actions/checkout@v4
      - run: cmake --preset release && cmake --build build/release
      - run: cd ui && npm ci && npm run build
```

---

## Dependencias

| Servico | Quando usar | Docker? |
|---------|-----------|---------|
| PostgreSQL | Time > 1 pessoa, sync de conhecimento | ✅ docker-compose |
| Ollama | Modelos de IA locais (obrigatorio) | ❌ nativo (`localhost:11434`) |
| Sync Server | Multi-usuario, colaboracao | ✅ docker-compose |
| SQLite | Sempre (dados locais) | ❌ nativo |
| Build C++ | Sempre | Opcional (devcontainer) |
| UI React | Sempre | ❌ nativo (npm) |

---

## Conclusao

**Nao vamos colocar o JARVIS inteiro no Docker** — app desktop com GPU/display nao roda bem em container.

Mas vamos usar Docker **para os servicos de time**:
1. `docker compose up` sobe PostgreSQL + Ollama + Sync Server
2. O app desktop se conecta a esses servicos
3. Todo dev tem o mesmo ambiente com devcontainer

Quer que eu ja crie os arquivos (docker-compose.yml, Dockerfile.dev, devcontainer.json, server/) ou prefere ajustar algo na estrategia primeiro?
