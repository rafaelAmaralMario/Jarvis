# Visao Geral da Arquitetura

## Conceito

O JARVIS é um **assistente de IA completo e modular** com IDE integrada.
Diferente de IDEs tradicionais que têm funcionalidades de IA, o JARVIS é um sistema de IA que possui módulos especializados — incluindo um módulo de IDE completo.

## Princípios Arquiteturais

1. **Modularidade total** — Cada funcionalidade é um módulo independente
2. **Kernel mínimo** — Kernel só carrega módulos e gerencia lifecycle
3. **Comunicação por serviços** — Módulos se comunicam via Service Locator tipado
4. **Segurança por design** — Permissões verificadas em cada operação
5. **Dados locais primeiro** — SQLite como storage principal, processamento local
6. **Bridge bidirecional** — React ↔ C++ via QWebChannel com JSON-RPC adaptado

## Pilha de Camadas (Estado Atual em Junho/2026)

```
┌──────────────────────────────────────────────────────────┐
│  L4: Plugins                                [NÃO INICIADO]│
│     Python plugins via ModuleLoader                      │
├──────────────────────────────────────────────────────────┤
│  L3: Editor · Git · Terminal                  [✓ 3/3]    │
│     Monaco Editor, xterm.js, Git CLI subprocess          │
├──────────────────────────────────────────────────────────┤
│  L2: Conhecimento · AI Engine                  [✓ 2/2]    │
│     Notes, Graph, FTS5 Search, Models, Agents, Critic    │
├──────────────────────────────────────────────────────────┤
│  L1: Workspace · Rede · Persistência           [✓ 3/3]   │
│     File I/O, Watcher, HTTP, OAuth, SQLite (WAL)        │
├──────────────────────────────────────────────────────────┤
│  L0: Bridge ⚙️                               [✓ COMPLETO]│
│     pywebview JSON-RPC, 65+ window.jarvis.* handlers     │
│     14 Python modules, 260+ pytest tests                 │
├──────────────────────────────────────────────────────────┤
│  OS: Windows (primary)                                   │
└──────────────────────────────────────────────────────────┘
```

## Diferenciais

- **Conhecimento como feature principal** — Sistema de notas Obsidian-like nativo (Markdown, grafos, backlinks, busca full-text FTS5)
- **AI Engine integrado** — Suporte Ollama, agentes configuráveis, orquestração multi-agente com critic agent
- **IDE completa** — Monaco Editor, terminal xterm.js, Git integrado via CLI
- **Bridge em tempo real** — Comunicação React↔Python via pywebview JSON-RPC com 65+ handlers
- **Persistência local** — SQLite com WAL mode, 8 migrations versionadas
