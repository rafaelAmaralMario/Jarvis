# Visao Geral da Arquitetura

## Conceito

O JARVIS e um **assistente de IA completo e modular**. Diferente de uma IDE tradicional que tem funcionalidades de IA, o JARVIS e um sistema de IA que tem modulos especializados — incluindo um modulo de IDE.

## Principios Arquiteturais

1. **Modularidade total** — cada funcionalidade e um modulo independente (.dll/.so)
2. **Kernel minimo** — o kernel so carrega modulos e gerencia o lifecycle
3. **Comunicacao por servicos** — modulos se comunicam via Service Locator
4. **Seguranca por design** — permissoes sao verificadas em cada operacao
5. **Dados locais primeiro** — SQLite como storage principal, processamento local

## Camadas

```
┌─────────────────────────────────────────────────────────┐
│                 Interface (Qt WebEngine)                 │
│  React 19 + Tailwind + shadcn/ui + Framer Motion        │
│  Monaco Editor · Grafos Interativos · Chat Animado     │
├─────────────────────────────────────────────────────────┤
│           Bridge (Qt WebChannel JSON-RPC)               │
│  React ↔ C++ via WebChannel (bidirecional, tipado)     │
├─────────────────────────────────────────────────────────┤
│                   Modulos de Aplicacao                  │
│  Conhecimento │ IDE │ AI Engine │ Automacao │ Voz       │
├─────────────────────────────────────────────────────────┤
│                     Kernel                              │
│  Module Loader (.dll/.so) · Service Locator · Permissoes │
├─────────────────────────────────────────────────────────┤
│                   Sistema Operacional                   │
│  Windows/Linux/Mac — DLL/SO loading, FS, rede, GPU     │
└─────────────────────────────────────────────────────────┘
```

## Fluxo de Inicializacao

1. `main()` no kernel inicia QApplication + Qt WebEngine
2. Kernel carrega `ModuleLoader`, descobre modulos em `modules/`
3. Para cada modulo: `create_module(host)` → registra servicos no Service Locator
4. Apos todos carregados, kernel chama `init()` em ordem de dependencia
5. Kernel configura `WebEngineBridge` com handlers para cada metodo
6. `QWebEngineView` carrega `webui/index.html` (React build)
7. React inicia, conecta ao `QWebChannel`, invoca handlers registrados
8. Comunicacao bidirecional: React → WebChannel JSON-RPC → C++

## Modulo de Conhecimento como Feature Central

Diferente de outras ferramentas, o JARVIS tem o **modulo de Conhecimento** como sua feature principal e nativa. Este modulo e inspirado no Obsidian e oferece:

- Armazenamento de conhecimento em Markdown
- Busca full-text e semantica
- Grafos de conhecimento (backlinks)
- Memoria de longo prazo para o AI Engine
- Contexto enriquecido para prompts de IA

Todos os outros modulos (AI Engine, IDE, Automacao) se beneficiam do Conhecimento para ter contexto sobre o projeto e o usuario.
