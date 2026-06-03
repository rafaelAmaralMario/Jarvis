# Roadmap — JARVIS Project

Visão geral das fases de desenvolvimento. Cada fase contém uma ou mais tasks no Kanban `tarefas/`.

## Fase 1 — Fundação ✅ (Tasks 001–014)
Kernel, UI base, módulos core (Knowledge, Workspace, AI Engine, Persistence), Bridge, testes, CI/CD, Sync Server.

## Fase 2 — Editor ✅ (Tasks 015–016)
Monaco Editor com abas, syntax highlighting, split view, quick open, breadcrumb, auto-save, settings persistentes.

---

## Fase 3 — Produtividade Imediata ⬅️ (Tasks 017, 018, 022)
**Paralelizável** — as 3 tasks podem ser implementadas simultaneamente.

| Task | Feature | Descrição |
|------|---------|-----------|
| 017 | Editor Fase 3 | Search/Replace (Ctrl+F/H), Command Palette (Ctrl+Shift+P), Markdown Preview, Format on Save |
| 018 | Terminal | xterm.js no painel inferior, QProcess shell, múltiplas abas, Ctrl+` toggle |
| 022 | Rede & OAuth | HTTP client, OAuth GitHub/Google, WebSocket, API keys storage |

## Fase 4 — Controle de Versão (Task 020)
| Task | Feature | Descrição |
|------|---------|-----------|
| 020 | Git | libgit2, diff side-by-side, stage/unstage, commit, branches, push/pull, Git Gutter no editor |

**Dependência:** 022 (OAuth para push)

## Fase 5 — Automação & Voz (Tasks 019, 021)
**Paralelizável** — as 2 tasks podem ser feitas em paralelo.

| Task | Feature | Descrição |
|------|---------|-----------|
| 019 | Automação | Workflow Engine, painel ⚡, steps sequenciais (RunCommand, OpenFile, ApiCall, Wait) |
| 021 | Voz | STT via whisper.cpp, TTS, push-to-talk Ctrl+Shift+M |

## Fase 6 — Extensibilidade (Tasks 023, 024)
**Sequencial** — 024 depende de 023.

| Task | Feature | Descrição |
|------|---------|-----------|
| 023 | Segurança | Permission Center UI, Audit Log Viewer, Secret Storage criptografado |
| 024 | Plugins | API pública C estável, Plugin Manager, sandbox de permissões |

## Fase 7 — Polimento (Tasks 025, 026)
**Paralelizável** — as 2 tasks podem ser feitas simultaneamente.

| Task | Feature | Descrição |
|------|---------|-----------|
| 025 | Temas + Keybindings | Tema customizável (dark/light/nord/dracula), remapeamento de atalhos |
| 026 | UX + Performance | Onboarding tour, empty states, lazy loading, virtualização, telemetria opt-in |

## Fase 8 — Distribuição (Task 027)
| Task | Feature | Descrição |
|------|---------|-----------|
| 027 | Instalador + Auto-update | NSIS (Windows), AppImage (Linux), DMG (macOS), GitHub Releases, auto-update |

---

## Mapa de Dependências

```
Fase 3 ─┬─ 017 ───┐
         ├─ 018 ───┤ (paralelo)
         └─ 022 ───┘
                    │
Fase 4 ─────────── 020 (precisa 022)
                    
Fase 5 ─┬─ 019 ───┐ (paralelo)
         └─ 021 ───┘

Fase 6 ─┬─ 023 ───┐ (sequencial)
         └─ 024 ←──┘ (precisa 023)

Fase 7 ─┬─ 025 ───┐ (paralelo)
         └─ 026 ───┘

Fase 8 ─── 027 (independente)
```

## Progresso Geral

| Fase | Tasks | Status |
|------|-------|--------|
| 1 — Fundação | 001–014 | ✅ 14/14 |
| 2 — Editor | 015–016 | ✅ 2/2 |
| 3 — Produtividade | 017, 018, 022 | ⬜ 0/3 |
| 4 — Controle de Versão | 020 | ⬜ 0/1 |
| 5 — Automação & Voz | 019, 021 | ⬜ 0/2 |
| 6 — Extensibilidade | 023, 024 | ⬜ 0/2 |
| 7 — Polimento | 025, 026 | ⬜ 0/2 |
| 8 — Distribuição | 027 | ⬜ 0/1 |
| **Total** | **001–027** | **16/27** |
