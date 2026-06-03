# 📋 Kanban — JARVIS Project

> Gerenciamento de tarefas local em markdown.
> Cada tarefa contém especificação, critérios de aceitação e **test cases** para todas as ações possíveis.

## Quadro

### ✅ Concluídas (Até Fase 2)

| # | Tarefa | Fase |
|---|--------|------|
| 001 | Fundação do Projeto (docs, ADRs, estrutura) | Fundação |
| 002 | Estrutura C++ Kernel (CMake, ModuleLoader, ServiceLocator, PermissionManager) | Fundação |
| 003 | UI React Base (Vite, Tailwind, shadcn/ui, componentes) | Fundação |
| 004 | Docker & Multi-Workspace (docker-compose, devcontainer, sync server) | Fundação |
| 005 | Models & Agents C++ (headers, implementations, Ollama client) | Fundação |
| 006 | Models & Agents React (SettingsPage, painéis, tipos, hooks) | Fundação |
| 007 | Bridge WebChannel (registrar handlers C++ → React) | Fundação |
| 008 | Módulo Conhecimento (notas estilo Obsidian) | Fundação |
| 009 | Módulo Workspace (gerenciamento de arquivos) | Fundação |
| 010 | Módulo Persistência (SQLite repositories) | Fundação |
| 011 | AI Engine Integration (plug models/agents no chat) | Fundação |
| 012 | Sync Server completo (auth, sync, broadcast) | Fundação |
| 013 | Testes Integrados (Catch2 + React Testing Library) | Fundação |
| 014 | CI/CD (GitHub Actions, builds automatizados) | Fundação |
| 015 | Módulo Editor — Fase 1 (Monaco, abas, atalhos) | Editor |
| 016 | Módulo Editor — Fase 2 (Split, Quick Open, Settings) | Editor |

### 🔄 Em Andamento

| # | Tarefa | Fase |
|---|--------|------|
| — | *(nenhuma no momento)* | |

### ⬜ A Fazer

| # | Tarefa | Fase | Prio |
|---|--------|------|------|
| 017 | Editor Fase 3 (Search, Command Palette, Preview, Git Gutter) | Editor | 🔴 |
| 018 | Terminal Integrado (xterm.js, abas, shell) | Terminal | 🔴 |
| 019 | Automação (Workflows, Browser/Desktop Automation) | Automação | 🟡 |
| 020 | Git Integrado (diff, stage, commit, branches, push/pull) | Git | 🔴 |
| 021 | Voz (STT whisper.cpp, TTS) | Voz | 🟢 |
| 022 | Rede & OAuth (HTTP, OAuth GitHub, WebSocket, API Keys) | Rede | 🟡 |
| 023 | Segurança (Permission Center, Audit, Secrets) | Segurança | 🟡 |
| 024 | Plugins (Plugin API, Manager, Sandbox) | Plugins | 🟢 |
| 025 | Polimento & UX (Temas, Keybindings, Onboarding, Performance) | UX | 🟢 |

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
│   ├── 014-deploy-ci-cd.md
│   ├── 015-modulo-editor-fase1.md
│   └── 016-modulo-editor-fase2.md
├── 02-em-andamento/
│   └── (vazio)
└── 03-a-fazer/
    ├── 017-editor-fase3.md
    ├── 018-terminal-integrado.md
    ├── 019-automacao.md
    ├── 020-git-integrado.md
    ├── 021-voz.md
    ├── 022-rede-oauth.md
    ├── 023-seguranca.md
    ├── 024-plugins.md
    └── 025-polimento-ux.md
```
