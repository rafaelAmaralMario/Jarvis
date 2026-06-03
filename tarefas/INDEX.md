# 📋 Kanban — JARVIS Project

> Gerenciamento de tarefas local em markdown.
> Cada tarefa contém especificação, critérios de aceitação e **test cases** para todas as ações possíveis.

## Quadro

### ✅ Concluídas (3 fases)

| # | Tarefa | Fase |
|---|--------|------|
| 001 | Fundação do Projeto (docs, ADRs, estrutura) | 1 — Fundação |
| 002 | Estrutura C++ Kernel | 1 — Fundação |
| 003 | UI React Base | 1 — Fundação |
| 004 | Docker & Multi-Workspace | 1 — Fundação |
| 005 | Models & Agents C++ | 1 — Fundação |
| 006 | Models & Agents React | 1 — Fundação |
| 007 | Bridge WebChannel | 1 — Fundação |
| 008 | Módulo Conhecimento | 1 — Fundação |
| 009 | Módulo Workspace | 1 — Fundação |
| 010 | Módulo Persistência | 1 — Fundação |
| 011 | AI Engine Integration | 1 — Fundação |
| 012 | Sync Server | 1 — Fundação |
| 013 | Testes Integrados | 1 — Fundação |
| 014 | CI/CD | 1 — Fundação |
| 015 | Editor Fase 1 (Monaco, abas, atalhos) | 2 — Editor |
| 016 | Editor Fase 2 (Split, Quick Open, Settings) | 2 — Editor |

### 🔄 Em Andamento

*(nenhuma)*

### ⬜ A Fazer

| # | Tarefa | Fase | Prio | Paralelizável |
|---|--------|------|------|---------------|
| 017 | Editor Fase 3 (Search, Cmd Palette, Preview, Format) | 3 — Produtividade | 🔴 | 018, 022 |
| 018 | Terminal Integrado (xterm.js, QProcess, abas) | 3 — Produtividade | 🔴 | 017, 022 |
| 022 | Rede & OAuth (HTTP, OAuth, WebSocket, API Keys) | 3 — Produtividade | 🟡 | 017, 018 |
| 020 | Git Integrado (libgit2, diff, stage, commit, push/pull) | 4 — Controle de Versão | 🔴 | — (após 022) |
| 019 | Automação (Workflow Engine + Painel UI) | 5 — Automação | 🟡 | 021 |
| 021 | Voz (STT whisper.cpp + TTS) | 5 — Automação | 🟢 | 019 |
| 023 | Segurança (Permission UI, Audit, Secrets) | 6 — Extensibilidade | 🟡 | — |
| 024 | Plugins (API pública L4, Manager, Sandbox) | 6 — Extensibilidade | 🟢 | — (após 023) |
| 025 | Temas Customizáveis + Keybindings | 7 — Polimento | 🟢 | 026 |
| 026 | Onboarding + Empty States + Performance + Telemetria | 7 — Polimento | 🟢 | 025 |
| 027 | Instalador + Auto-update | 8 — Distribuição | 🟡 | — |

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
│   ├── 001-fundacao-projeto.md  ...  014-deploy-ci-cd.md
│   └── 015-modulo-editor-fase1.md ... 016-modulo-editor-fase2.md
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
    ├── 025-temas-keybindings.md
    ├── 026-onboarding-perf-telemetria.md
    └── 027-instalador-auto-update.md
```
