# INDICE DE CONTEXTO — JARVIS

> Use a skill `context-generator` para criar novos contextos.
> Templates disponiveis em `.context/TEMPLATE.md`.

## Regras

1. **Timestamp ISO 8601** — cada contexto tem timestamp preciso
2. **Status** — `active` (vigente), `superseded` (substituido), `conflicted` (conflito detectado)
3. **Supersedes/Superseded by** — cadeia de substituicao para rastrear versoes
4. **Conflitos** — quando duas informacoes contraditorias existem, ambas ficam como `conflicted` ate resolucao
5. **Skill usada** — registrar qual skill foi usada para gerar o contexto

## Entradas

| ID | Contexto | Timestamp | Status | Supersedes | Superseded by | Skill |
|----|----------|-----------|--------|------------|---------------|-------|
| 001 | Fundacao do Projeto | 2026-06-03T10:54:00-03:00 | superseded | — | 003 | — |
| 002 | Estrutura do Novo Projeto | 2026-06-03T10:55:00-03:00 | superseded | — | 003 | — |
| 003 | UI Hibrida: C++ + React (WebEngine) | 2026-06-03T11:05:00-03:00 | active | 001, 002 | — | — |
| 004 | Catalogo de Modulos com SOLID | 2026-06-03T11:15:00-03:00 | active | — | — | — |
| 005 | Skills e Contexto Unificado | 2026-06-03T11:36:00-03:00 | active | — | — | context-generator |
| 006 | Modulo Conhecimento (Obsidian-like) | 2026-06-03T12:55:00-03:00 | active | — | — | context-generator |
| 007 | Modulo Persistencia (SQLite) | 2026-06-03T15:30:00-03:00 | active | — | — | — |
| 008 | Sync Server Completo | 2026-06-03T16:30:00-03:00 | active | — | — | — |
| 009 | Testes Integrados (Vitest + C++) | 2026-06-03T13:50:00-03:00 | active | — | — | — |
| 010 | CI/CD — GitHub Actions | 2026-06-03T14:00:00-03:00 | active | — | — | — |
| 011 | Build bem-sucedido + Bridge funcional | 2026-06-05T10:30:00-03:00 | superseded | 007, 009 | 012 | customize-opencode |
| 012 | Migração Qt C++ → Python + pywebview | 2026-06-05T13:50:00-03:00 | active | 011 | — | context-generator |
| 013 | Fase 6 — Bridge Wiring Completa | 2026-06-06T10:10:00-03:00 | active | — | — | context-generator |
| 014 | Fase 7 — Build + E2E | 2026-06-06T10:30:00-03:00 | active | — | — | context-generator |
| 015 | Fase 8 — Documentacao | 2026-06-06T10:40:00-03:00 | active | — | — | context-generator |
| 016 | Fase 9 — Limpeza .oldC++/ | 2026-06-06T10:50:00-03:00 | active | — | — | context-generator |
| 017 | LLM Gateway Multi-Provider + MCP Server | 2026-06-08T07:00:00-03:00 | active | — | — | context-generator |
| 018 | Workflow Engine + Security Manager | 2026-06-08T07:10:00-03:00 | active | — | — | context-generator |
| 019 | Frontend Types/Hooks/Components | 2026-06-08T07:20:00-03:00 | active | — | — | context-generator |
| 020 | CI/CD + E2E + Server Tests | 2026-06-08T07:30:00-03:00 | active | 010 | — | context-generator |
| 021 | Context Menu Componente + Bridge Utilities | 2026-06-08T08:00:00-03:00 | active | — | — | context-generator |
| 022 | Agent Panel Context Menu | 2026-06-08T08:15:00-03:00 | active | — | — | context-generator |
| 023 | Model Server Status Detection | 2026-06-08T08:30:00-03:00 | active | — | — | context-generator |
| 024 | Native Folder Picker | 2026-06-08T08:35:00-03:00 | active | — | — | context-generator |

> **Nota:** Ao adicionar novo contexto, insira uma nova linha na tabela acima e crie o arquivo correspondente em `.context/YYYY-MM-DD-NNN-titulo.md`.
>
> Se um novo contexto contradizer um existente, marque ambos como `conflicted` e pergunte ao usuario qual e a fonte de verdade.
