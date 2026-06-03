# Indice de Modulos

> **Documento principal:** [`00-catalogo-completo-solid.md`](./00-catalogo-completo-solid.md) — contem analise SOLID completa, interfaces segregadas e arquitetura em camadas.

## Resumo

| # | Modulo | Camada | ID | Status |
|---|--------|--------|----|--------|
| 1 | Kernel | L0 | `jarvis.kernel` | Em andamento |
| 2 | Workspace | L1 | `jarvis.workspace` | Nao iniciado |
| 3 | Seguranca | L1 | `jarvis.security` | Nao iniciado |
| 4 | Rede | L1 | `jarvis.network` | Nao iniciado |
| 5 | Persistencia | L1 | `jarvis.persistence` | Nao iniciado |
| 6 | Conhecimento | L2 | `jarvis.knowledge` | Nao iniciado |
| 7 | AI Engine | L2 | `jarvis.ai-engine` | Nao iniciado |
| 8 | Automacao | L2 | `jarvis.automation` | Nao iniciado |
| 9 | Editor | L3 | `jarvis.editor` | Nao iniciado |
| 10 | Git | L3 | `jarvis.git` | Nao iniciado |
| 11 | Terminal | L3 | `jarvis.terminal` | Nao iniciado |
| 12 | Voz | L3 | `jarvis.voice` | Nao iniciado |
| 13 | Perifericos | L3 | `jarvis.peripherals` | Nao iniciado |
| 14 | Plugins | L4 | `jarvis.plugins` | Nao iniciado |

## Ordem de Implementacao

### Fase 1 — Fundacao
1. **Kernel** — module loader, service locator, permission manager
2. **Conhecimento** — sistema de notas, grafos, busca (feature principal)
3. **Workspace** — acesso a sistema de arquivos

### Fase 2 — IA
4. **AI Engine** — LLM orchestration, agentes, tool calling
5. **Seguranca** — permissoes granulares, criptografia
6. **Rede** — HTTP client, WebSocket server

### Fase 3 — Produtividade
7. **IDE** — editor de codigo (CodeEditor + LSP), git, terminal
8. **Plugins** — API publica para extensoes third-party

### Fase 4 — Automacao
9. **Voz** — STT (whisper.cpp), TTS
10. **Automacao** — browser (Playwright-like), desktop (mouse/keyboard)
11. **Perifericos** — mic, webcam, clipboard, notificacoes

## Estrutura de Pastas

```
modules/
├── conhecimento/
│   ├── CMakeLists.txt
│   ├── include/jarvis/knowledge/
│   │   ├── note.h
│   │   ├── vault.h
│   │   ├── graph.h
│   │   └── search.h
│   ├── src/
│   │   ├── module.cpp        # create_module entry
│   │   ├── note.cpp
│   │   ├── vault.cpp
│   │   ├── graph.cpp
│   │   └── search.cpp
│   └── qml/                  # UI do modulo
│       └── KnowledgePanel.qml
├── workspace/
├── ai-engine/
├── ide/
└── ...
```
