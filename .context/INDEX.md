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
| 001 | Fundacao do Projeto | 2026-06-03T10:54:00-03:00 | active | — | — | — |
| 002 | Estrutura do Novo Projeto | 2026-06-03T10:55:00-03:00 | active | — | — | — |
| 003 | UI Hibrida: C++ + React (WebEngine) | 2026-06-03T11:05:00-03:00 | active | 001, 002 | — | — |
| 004 | Catalogo de Modulos com SOLID | 2026-06-03T11:15:00-03:00 | active | — | — | — |
| 005 | Skills e Contexto Unificado | 2026-06-03T11:36:00-03:00 | active | — | — | context-generator |
| 006 | Módulo Conhecimento (Obsidian-like) | 2026-06-03T12:55:00-03:00 | active | — | — | context-generator |
| 007 | Módulo Persistência (SQLite) | 2026-06-03T15:30:00-03:00 | active | — | — | — |
| 008 | Sync Server Completo | 2026-06-03T16:30:00-03:00 | active | — | — | — |
| 009 | Testes Integrados (Vitest + C++) | 2026-06-03T13:50:00-03:00 | active | — | — | — |

> **Nota:** Ao adicionar novo contexto, insira uma nova linha na tabela acima e crie o arquivo correspondente em `.context/YYYY-MM-DD-NNN-titulo.md`.
>
> Se um novo contexto contradizer um existente, marque ambos como `conflicted` e pergunte ao usuario qual e a fonte de verdade.
