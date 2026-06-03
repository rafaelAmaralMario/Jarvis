# CONTEXTO — Projeto JARVIS

Este arquivo contem o contexto completo do projeto para que a IA entenda o estado atual, decisoes tomadas e arquitetura definida.

---

## Identidade do Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | JARVIS |
| **Descricao** | Assistente de IA completo e modular |
| **Stack** | C++20 + Qt 6.8 (WebEngine) + React 19 + Tailwind + SQLite |
| **Arquitetura** | Modular (.dll/.so) em 5 camadas (L0-L4) |
| **Modulos** | 14 modulos planejados, kernel em andamento |

---

## Stack Tecnologica (Decidida)

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Desktop Framework | Qt | 6.8+ (LGPL) |
| Linguagem Nativa | C++ | 20 |
| UI Web | React + TypeScript | 19 + 5.9 |
| Build Web | Vite | 7 |
| Estilos | Tailwind CSS + shadcn/ui | 4 |
| Animacoes | Framer Motion | 12 |
| Editor Codigo | Monaco Editor | 0.55 |
| Bridge C++ ↔ Web | Qt WebChannel | 6.8 |
| Banco de Dados | SQLite | 3.x |
| Build Nativo | CMake + Ninja | 3.30+ |
| Testes C++ | Catch2 | 3.x |
| Testes Web | Vitest | 4.x |

---

## Arquitetura de Camadas

```
L4: Plugins (API publica terceiros)
L3: Editor · Git · Terminal · Voz · Perifericos
L2: Conhecimento ★ · AI Engine · Automacao
L1: Workspace · Seguranca · Rede · Persistencia
L0: Kernel ⚙️ (module loader, service locator, bridge)
```

---

## Modulos (14 total)

| # | Modulo | Camada | ID | Depende de | Status |
|---|--------|--------|----|-----------|--------|
| 1 | Kernel | L0 | `jarvis.kernel` | — | Em andamento |
| 2 | Workspace | L1 | `jarvis.workspace` | L0 | Nao iniciado |
| 3 | Seguranca | L1 | `jarvis.security` | L0 | Nao iniciado |
| 4 | Rede | L1 | `jarvis.network` | L0, L1 | Nao iniciado |
| 5 | Persistencia | L1 | `jarvis.persistence` | L0, L1 | Nao iniciado |
| 6 | Conhecimento | L2 | `jarvis.knowledge` | L0, L1 | Nao iniciado |
| 7 | AI Engine | L2 | `jarvis.ai-engine` | L0-L2 | Nao iniciado |
| 8 | Automacao | L2 | `jarvis.automation` | L0-L2 | Nao iniciado |
| 9 | Editor | L3 | `jarvis.editor` | L0, L1 | Nao iniciado |
| 10 | Git | L3 | `jarvis.git` | L0, L1 | Nao iniciado |
| 11 | Terminal | L3 | `jarvis.terminal` | L0 | Nao iniciado |
| 12 | Voz | L3 | `jarvis.voice` | L0-L2 | Nao iniciado |
| 13 | Perifericos | L3 | `jarvis.peripherals` | L0, L1 | Nao iniciado |
| 14 | Plugins | L4 | `jarvis.plugins` | L0-L3 | Nao iniciado |

---

## SOLID na Arquitetura

| Principio | Como aplicado |
|-----------|---------------|
| **SRP** | Cada modulo tem 1 responsabilidade. IDE foi separado em Editor + Git + Terminal |
| **OCP** | Novo modulo = nova .dll. Kernel nunca muda para adicionar features |
| **LSP** | `IModelProvider`: Ollama ↔ OpenAI ↔ Mock sao intercambiaveis |
| **ISP** | `ModuleAPI` separado em `IInitializable`, `IActivatable`, `IServiceProvider` |
| **DIP** | `IServiceRegistry::getService<T>()` tipado em vez de `void*` |

---

## Estrutura de Pastas

```
/
├── .agents/skills/         # Skills da IA (40 skills)
├── .context/               # Contexto do projeto
│   ├── INDEX.md
│   ├── TEMPLATE.md
│   └── NNN-*.md
├── .old/                   # Projeto anterior (Tauri + Rust + React)
├── CMakeLists.txt          # Build C++
├── CMakePresets.json       # Presets CMake
├── kernel/                 # Kernel C++ Qt
│   ├── CMakeLists.txt
│   ├── include/jarvis/
│   │   ├── api/            # ABI publica
│   │   ├── core/           # Module loader, service locator
│   │   └── bridge/         # WebChannel bridge
│   ├── src/                # main.cpp + modulos internos
│   ├── tests/              # Testes Catch2
│   └── resources/webui/    # React build output
├── ui/                     # React source
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── styles/
│   └── index.html
├── modules/                # .dll modules (futuro)
├── docs/                   # Documentacao
│   ├── 01-arquitetura/
│   ├── 02-tecnologia/
│   ├── 03-interface/
│   ├── 04-modulos/
│   ├── 05-funcional/
│   └── 06-decisoes/adr/
└── libs/                   # Bibliotecas compartilhadas
```

---

## Comunicacao C++ ↔ React

```
React (UI) ──QWebChannel JSON-RPC──> C++ (backend)
  - bridge.sendMessage("method", args) → Promise<result>
  - bridge.onEvent("event", callback)

C++ (backend) ──QWebEnginePage::runJavaScript──> React (UI)
  - emitEvent("file-changed", {path: "/x"})
```

---

## Skills Disponiveis

```bash
ls .agents/skills/
```

Sempre antes de comecar uma tarefa, verifique se existe uma skill relevante usando a skill `skill-finder`.

---

## Proximos Passos Imediatos

1. Instalar Qt 6.8+ com WebEngine
2. `cd ui && npm install && npm run build` (gerar UI React)
3. `cmake --preset default && cmake --build build/default` (compilar kernel)
4. Implementar modulo Conhecimento (feature principal)
5. Implementar modulo Workspace (dependencia do Conhecimento)
