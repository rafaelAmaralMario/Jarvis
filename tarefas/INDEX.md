# 📋 Kanban — JARVIS Project

> Gerenciamento de tarefas local em markdown.
> Cada tarefa contém especificação, critérios de aceitação e **test cases** para todas as ações possíveis.

## Quadro

### ✅ Concluídas

| # | Tarefa | Status |
|---|--------|--------|
| 001 | Fundação do Projeto (docs, ADRs, estrutura) | ✅ |
| 002 | Estrutura C++ Kernel (CMake, ModuleLoader, ServiceLocator, PermissionManager) | ✅ |
| 003 | UI React Base (Vite, Tailwind, shadcn/ui, componentes) | ✅ |
| 004 | Docker & Multi-Workspace (docker-compose, devcontainer, sync server) | ✅ |
| 005 | Models & Agents C++ (headers, implementations, Ollama client) | ✅ |
| 006 | Models & Agents React (SettingsPage, painéis, tipos, hooks) | ✅ |
| 007 | Bridge WebChannel (registrar handlers C++ → React) | ✅ |
| 011 | AI Engine Integration (plug models/agents no chat) | ✅ |
| 008 | Módulo Conhecimento (notas estilo Obsidian) | ✅ |
| 009 | Módulo Workspace (gerenciamento de arquivos) | ✅ |
| 010 | Módulo Persistência (SQLite repositories) | ✅ |
| 012 | Sync Server completo (auth, sync, broadcast) | ✅ |

| 013 | Testes Integrados (Catch2 + React Testing Library) | ✅ |
| 014 | CI/CD (GitHub Actions, builds automatizados) | ✅ |

### 🔄 Em Andamento

| # | Tarefa | Status |
|---|--------|--------|
| 015 | Módulo Editor — Fase 1 (Monaco, abas, atalhos) | 🔄 |

---

## Como Usar

1. Cada tarefa é um arquivo `.md` dentro da pasta correspondente
2. Ao iniciar uma tarefa, mova o arquivo para `02-em-andamento/`
3. Ao concluir, mova para `01-concluidas/`
4. Atualize o `INDEX.md` refletindo o novo status
5. Cada tarefa contém seção de **test cases** — execute antes de marcar como concluída

## Estrutura

```
tarefas/
├── INDEX.md                  ← Este arquivo
├── README.md                 ← Guia de uso
├── 01-concluidas/
│   ├── 001-fundacao-projeto.md
│   ├── 002-estrutura-cpp-kernel.md
│   ├── 003-ui-react-base.md
│   ├── 004-docker-infra.md
│   ├── 005-models-agents-cpp.md
│   ├── 006-models-agents-react.md
│   ├── 007-bridge-webchannel.md
│   ├── 008-modulo-conhecimento.md
│   ├── 009-modulo-workspace.md
│   ├── 010-modulo-persistencia.md
│   ├── 011-ai-engine-integracao.md
│   ├── 012-sync-server.md
│   ├── 013-testes-integrados.md
│   └── 014-deploy-ci-cd.md
├── 02-em-andamento/
│   └── 015-modulo-editor-fase1.md
└── 03-a-fazer/
    └── (nenhuma — todas concluídas)
```
