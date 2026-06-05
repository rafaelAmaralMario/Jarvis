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
│     API pública C estável para extensões de terceiros    │
├──────────────────────────────────────────────────────────┤
│  L3: Editor · Git · Terminal                  [✓ 3/3]    │
│     Monaco Editor, xterm.js, Git commands nativos        │
├──────────────────────────────────────────────────────────┤
│  L2: Conhecimento · AI Engine · Autom · Voz  [✓ 2/4]    │
│     Notes, Graph, Search, Models, Agents, Orchestration  │
├──────────────────────────────────────────────────────────┤
│  L1: Workspace · Segurança · Rede · Persist [✓ 3/4]     │
│     FileTree, FileWatcher, HTTP, OAuth, WS, SQLite       │
├──────────────────────────────────────────────────────────┤
│  L0: Kernel ⚙️                               [✓ COMPLETO]│
│     ModuleLoader, ServiceLocator, PermManager, Bridge    │
│     25 .cpp / 26 .h / 89 bridge handlers                 │
├──────────────────────────────────────────────────────────┤
│  OS: Windows (primary), Linux (Docker dev container)     │
└──────────────────────────────────────────────────────────┘
```

## Diferenciais

- **Conhecimento como feature principal** — Sistema de notas Obsidian-like nativo (Markdown, grafos, backlinks, busca full-text)
- **AI Engine integrado** — Suporte a múltiplos provedores (Ollama), agentes configuráveis, orquestração
- **IDE completa** — Monaco Editor, terminal xterm.js, Git integrado
- **Bridge em tempo real** — Comunicação React↔C++ via QWebChannel com 89 handlers registrados
- **Persistência local** — SQLite com WAL mode, migrations versionadas, backup nativo
