---
name: project-context
description: "Use to load full project context at session start. Reads .context/ and .context/CONTEXTO-COMPLETO.md for architecture, stack, modules, and decisions."
---

# Project Context — JARVIS

Carrega o contexto completo do projeto JARVIS para a sessao atual.

## Instrucoes Obrigatorias

Ao carregar esta skill, voce DEVE:

1. **Ler `.context/CONTEXTO-COMPLETO.md`** — contem snapshot completo do projeto (arquitetura, stack, modulos, decisoes)

2. **Ler `.context/INDEX.md`** — tabela central com todos os contextos registrados, seus status e cadeia de substituicao

3. **Identificar contextos ativos** — leia apenas os arquivos marcados como `active` no INDEX.md (pule `superseded` e `conflicted`)

4. **Verificar skills disponiveis** em `.agents/skills/` — use `skill-finder` para encontrar a skill ideal para a tarefa atual

5. **Identificar modulos implementados** — verifique `kernel/`, `modules/`, `ui/` para saber o que ja existe

## Diretorios Chave

```
.agents/skills/          — Skills da IA (40+ skills)
.context/                — Contexto do projeto (ativo, superseded, conflicted)
kernel/                  — Codigo fonte C++ (kernel + bridge)
ui/                      — Codigo fonte React (frontend WebEngine)
docs/                    — Documentacao do projeto
modules/                 — Modulos .dll (futuro)
.old/                    — Projeto anterior (Tauri + Rust + React)
```

## Stack Atual

| Tecnologia | Detalhe |
|-----------|---------|
| Desktop | Qt 6.8+ (WebEngine) |
| UI | React 19 + TypeScript + Tailwind + shadcn/ui |
| Animacoes | Framer Motion 12 |
| Backend Nativo | C++20 (kernel + modulos .dll) |
| Bridge | Qt WebChannel (JSON-RPC) |
| Banco | SQLite |
| Build | CMake 3.30+ / Vite 7 |
| Testes | Catch2 (C++) / Vitest (React) |

## Arquitetura (Resumo)

```
5 camadas:
  L4: Plugins — API publica terceiros
  L3: Editor · Git · Terminal · Voz · Perifericos
  L2: Conhecimento ★ · AI Engine · Automacao
  L1: Workspace · Seguranca · Rede · Persistencia
  L0: Kernel ⚙️ (module loader, service locator, bridge WebEngine)
```

## Proximas Tarefas

1. Instalar Qt 6.8+ com WebEngine
2. `cd ui && npm install && npm run build`
3. `cmake --preset default && cmake --build build/default`
4. Implementar modulo Conhecimento (feature principal)
5. Implementar modulo Workspace (dependencia)

## Handoff entre Sessoes

Ao finalizar uma sessao:
1. Use `context-generator` para criar entrada de contexto com o que foi feito
2. Atualize `.context/INDEX.md` se necessario
3. Atualize `.context/CONTEXTO-COMPLETO.md` se houver mudancas arquiteturais
