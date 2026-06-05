# CONTEXTO COMPLETO — JARVIS v1 (Junho 2026)

> **Ultima atualizacao:** 2026-06-05T10:30:00-03:00
> **Branch:** `main`
> **Commit:** `723e0cee` — "feat: Rede & OAuth - HTTP client, OAuth GitHub, WebSocket, API Keys"
> **Status:** Kernel compila, linka, roda. Bridge frontend↔backend funcional com 89 handlers.

---

## Identidade do Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | JARVIS |
| **Descricao** | Assistente de IA completo e modular com IDE integrada |
| **Stack** | C++20 + Qt 6.8 (WebEngine) + React 19 + Tailwind v4 + TypeScript + Vite |
| **Bridge** | Qt WebChannel com adaptador JSON-RPC injetado em DocumentCreation |
| **Banco** | SQLite 3.x com WAL mode, 8 migrations, 26 tabelas |
| **Build** | CMake 3.30+ / Ninja / MSVC 19.41 (Windows), GCC/Clang (Linux) |
| **Sistema** | Windows 11, VS2022 Community; Linux via Docker dev container |

---

## Stack Tecnologica (Implementada)

| Camada | Tecnologia | Versao | Uso |
|--------|-----------|--------|-----|
| Desktop Framework | Qt | 6.8.0 (LGPL) | Janela principal, WebEngine, WebChannel, SQL, Network, WebSockets |
| Linguagem Nativa | C++ | 20 | Todo o backend |
| UI Web | React + TypeScript | 19 + 5.9 | Interface completa |
| Build Web | Vite | 7 | Bundle da UI |
| Estilos | Tailwind CSS + Radix UI | 4 | Design system |
| Animacoes | Framer Motion | 12 | Transicoes de paineis |
| Editor Codigo | Monaco Editor | 0.55 | Editor de codigo profissional |
| Terminal | xterm.js + QProcess | 5.x | Terminal integrado |
| Bridge | Qt WebChannel | 6.8 | JSON-RPC adaptado |
| Banco | SQLite | 3.x (via Qt) | Persistencia local |
| Build Nativo | CMake + Ninja | 3.30+ | Build do C++ |
| Testes C++ | Catch2 | 3.x | Testes unitarios kernel |
| Testes Web | Vitest | 4.x | Testes React |
| JSON | nlohmann_json | 3.11+ | Parsing JSON no C++ |

---

## Arquitetura de Camadas (Estado Atual)

```
┌──────────────────────────────────────────────────────────┐
│  L4: Plugins (API publica)                              │
│     — Nao implementado (planejado para Task 024)        │
├──────────────────────────────────────────────────────────┤
│  L3: Editor · Git · Terminal                            │
│     Editor: Monaco com 9 componentes (implementado)     │
│     Git: 5 componentes + git_manager.cpp (implementado) │
│     Terminal: xterm.js + QProcess (implementado)        │
├──────────────────────────────────────────────────────────┤
│  L2: Conhecimento · AI Engine · Automacao · Voz         │
│     Conhecimento: 4 componentes (implementado)          │
│     AI: Models, Agents, Orchestration (implementado)    │
│     Automacao: Nao iniciado (Task 019)                  │
│     Voz: Nao iniciado (Task 021)                        │
├──────────────────────────────────────────────────────────┤
│  L1: Workspace · Seguranca · Rede · Persistencia        │
│     Workspace: FileTree, FileWatcher (implementado)     │
│     Rede: HTTP, OAuth, WebSocket (implementado)         │
│     Persistencia: SQLite, Migrations (implementado)     │
│     Seguranca: Nao iniciado (Task 023)                  │
├──────────────────────────────────────────────────────────┤
│  L0: Kernel ⚙️                                         │
│     ModuleLoader, ServiceLocator, PermissionManager     │
│     Bridge (89 handlers), Lifecycle, main.cpp           │
│     ✅ Compila e linka                                 │
└──────────────────────────────────────────────────────────┘
```

---

## Estrutura de Pastas (Real)

```
C:\Users\Rafae\Documents\Jarvis\
├── .agents/skills/           # 40+ skills da IA
├── .context/                 # Contexto do projeto (13 entradas)
├── .docs/                    # Documentacao atualizada (este diretorio)
├── .old/                     # Projeto anterior Tauri + Rust + React
├── kernel/                   # Kernel C++ Qt (25 .cpp, 26 .h)
│   ├── CMakeLists.txt        # Build com Qt6 + nlohmann_json
│   ├── include/jarvis/
│   │   ├── api/              # module_api.h (ABI publica)
│   │   ├── core/             # module_loader.h, service_locator.h, permission_manager.h
│   │   ├── bridge/           # web_channel.h
│   │   ├── ai/               # models_manager.h, agents_manager.h, orchestration_manager.h, ollama_client.h
│   │   ├── knowledge/        # knowledge_manager.h, search_engine.h, graph_builder.h, note.h
│   │   ├── workspace/        # workspace_manager.h, file_watcher.h, file_utils.h, project.h
│   │   ├── editor/           # editor_manager.h
│   │   ├── terminal/         # terminal_manager.h
│   │   ├── network/          # network_manager.h
│   │   ├── git/              # git_manager.h
│   │   └── persistence/      # database.h, migration_runner.h, repository.h, query_builder.h, backup_manager.h
│   ├── src/
│   │   ├── main.cpp          # ~1553 linhas — entry point + bridges + migrations
│   │   ├── module_loader.cpp
│   │   ├── lifecycle.cpp
│   │   ├── service_locator.cpp
│   │   ├── permission_manager.cpp
│   │   ├── bridge/web_channel.cpp
│   │   ├── ai/               # 4 arquivos
│   │   ├── knowledge/        # 3 arquivos
│   │   ├── workspace/        # 3 arquivos
│   │   ├── editor/           # 1 arquivo
│   │   ├── terminal/         # 1 arquivo
│   │   ├── network/          # 1 arquivo
│   │   ├── git/              # 1 arquivo
│   │   └── persistence/      # 5 arquivos
│   ├── tests/                # Testes Catch2
│   └── resources/webui/      # React build output (Vite)
├── ui/                       # React source (56 arquivos em src/)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx           # Layout com 6 paineis
│       ├── components/       # 30+ componentes React
│       ├── hooks/            # use-jarvis.ts, useAutoSave.ts
│       ├── lib/utils.ts
│       ├── types/index.ts    # Interfaces TypeScript
│       └── styles/globals.css
├── modules/                  # .dll modules (futuro)
├── docs/                     # Documentacao historica (26 arquivos)
├── server/                   # Sync server Node.js
├── tests/                    # Testes de integracao
├── libs/                     # Bibliotecas compartilhadas
├── .github/                  # GitHub Actions CI/CD
├── CMakeLists.txt            # Root CMake
├── CMakePresets.json         # 3 presets (default, release, debug)
├── build.bat                 # Script build Windows
├── docker-compose.yml        # PostgreSQL + Sync + Dev container
├── Dockerfile.dev            # Ubuntu 24.04 dev container
└── .env.example
```

---

## Modulos — Estado Real de Implementacao

| Modulo | ID | Arquivos C++ | Componentes React | Status |
|--------|----|-------------|-------------------|--------|
| Kernel | `jarvis.kernel` | 5 src + main.cpp | — | ✅ Compila, linka, roda |
| Bridge | `jarvis.bridge` | web_channel.cpp/h | use-jarvis.ts (bridge hook) | ✅ Funcional (89 handlers) |
| Persistencia | `jarvis.persistence` | 5 src, 5 headers | — | ✅ SQLite + 8 migrations |
| Workspace | `jarvis.workspace` | 3 src, 4 headers | WorkspacePanel, FileTree, FileTabs | ✅ Implementado |
| Conhecimento | `jarvis.knowledge` | 3 src, 4 headers | KnowledgePanel, NoteEditor, GraphView, SearchBar, BacklinkPanel | ✅ Implementado |
| AI Engine | `jarvis.ai-engine` | 4 src, 4 headers | ModelsPanel, AgentCard, AgentFormDialog, AgentsPanel, OrchestrationPanel | ✅ Implementado |
| Rede/OAuth | `jarvis.network` | 1 src, 1 header | ApiKeyManager, OAuthDialog | ✅ Implementado |
| Editor | `jarvis.editor` | 1 src, 1 header | 9 componentes (MonacoWrapper, EditorTabs, CommandPalette, etc) | ✅ Implementado |
| Terminal | `jarvis.terminal` | 1 src, 1 header | TerminalPanel, TerminalInstance | ✅ Implementado |
| Git | `jarvis.git` | 1 src, 1 header | 5 componentes (GitPanel, GitStatusList, GitCommitBox, etc) | ✅ Implementado |
| Seguranca | `jarvis.security` | — | — | ⬜ Nao iniciado |
| Automacao | `jarvis.automation` | — | — | ⬜ Nao iniciado |
| Voz | `jarvis.voice` | — | — | ⬜ Nao iniciado |
| Plugins | `jarvis.plugins` | — | — | ⬜ Nao iniciado |

---

## Banco de Dados (SQLite)

| Item | Detalhe |
|------|---------|
| **Engine** | SQLite 3.x via Qt QSqlDatabase |
| **Driver** | QSQLITE |
| **Modo WAL** | Sim (para concorrencia leitura/escrita) |
| **Mutex** | Recursivo (QMutex) |
| **Localizacao** | `%APPDATA%\JARVIS\JARVIS\jarvis-ai.db` |
| **Schema version** | 8 |
| **Tabelas** | ~26 (core, permissions, extensions, models, agents, orchestration_config, agent_traces, knowledge_notes, knowledge_links, workspace_projects, workspace_files, editor_settings, api_keys, webhook_configs, sessions, backup_registry + sistema) |
| **Migrations** | 8 scripts executados em sequencia (split por `;` no `exec()`) |

### Migrations
1. `core_001_core.sql` — tabelas base (modules, service_registry, config)
2. `core_002_permissions.sql` — permissoes e roles
3. `core_003_extensions.sql` — extensoes
4. `models_agents_001.sql` — modelos, agentes, orquestracao
5. `knowledge_001.sql` — notas, links, tags
6. `workspace_001.sql` — projetos, arquivos
7. `editor_001.sql` — configuracoes do editor
8. `api_keys_001.sql` — chaves de API

---

## Bridge C++ ↔ React (QWebChannel)

### Como funciona
1. React chama `bridge.sendMessage("method", args)` → retorna `Promise<result>`
2. O adaptador JS (injetado em `QWebEngineScript::DocumentCreation`) empacota como JSON-RPC tipo 2/3 do QWebChannel
3. `BridgeHandler::handleMessage(QString)` desempacota, roteia para o handler registrado
4. Handler executa logica C++, retorna `QString` (JSON)
5. Resposta volta como pacote type-3 para o JS
6. Promise resolve com o resultado

### Handlers registrados: 89
- **kernel/** — get_version, get_build_info, get_system_info, get_uptime (4)
- **module/** — get_modules, load_module, unload_module, get_module_info (4)
- **knowledge/** — search_notes, create_note, get_note, update_note, delete_note, get_graph, get_backlinks, get_folders, create_folder, rename_folder (10)
- **ai/models/** — list, get, create, update, delete, test, pull (7)
- **ai/agents/** — list, get, create, update, delete, set_active (6)
- **ai/orchestration/** — get_config, update_config, get_traces, get_active_agent_id, set_active_agent, run_agent, stop_agent (7)
- **workspace/** — list_projects, get_project, create_project, update_project, delete_project, get_files, get_file, create_file, delete_file, rename_file, watch_directory, unwatch_directory, get_file_tree, open_folder (14)
- **editor/** — open_file, close_file, get_open_files, set_active_tab, modify_file, save_file, get_settings, update_settings, get_breadcrumb (9)
- **terminal/** — create_terminal, write, resize, kill, list, get_output (6)
- **net/** — http_get, http_post, oauth_start, oauth_complete, oauth_get_token, ws_connect, ws_send, ws_close, get_api_keys, save_api_key, delete_api_key (11)
- **git/** — status, diff, stage, unstage, commit, log, branches, create_branch, checkout, push, pull, fetch, stash, stash_pop, merge (15)
- **db/** — execute_raw, get_backup_list, create_backup, restore_backup (4)
- **logs/** (placeholders) (2)

### Eventos C++ → React
- `file-changed` — arquivo alterado no disco
- `terminal-output` — nova saida do terminal
- `ai-model-status` — mudanca de status do modelo
- `git-operation-complete` — operacao git finalizada
- `ws-message` — mensagem WebSocket recebida
- `backup-complete` — backup finalizado

---

## Proximos Passos Imediatos

### Prioridade Alta — Correcoes pendentes
1. Ajustar formato `args` no bridge (frontend envia array, alguns handlers no backend esperam objeto nomeado — warnings no console)
2. Ativar `BUILD_TESTING=ON` e reestruturar `kernel/tests/` para linkar contra os sources do kernel como biblioteca estatica
3. Fazer commit do estado atual (Task 020 — Git Integrado)
4. Pipeline CI/CD no GitHub Actions (ja configurado, pode precisar de ajustes)

### Prioridade Media — Tasks do Roadmap
5. **Task 019** — Automacao: Workflow Engine, painel, steps (RunCommand, OpenFile, ApiCall, Wait)
6. **Task 021** — Voz: STT via whisper.cpp, TTS, push-to-talk
7. **Task 023** — Seguranca: Permission Center UI, Audit Log, Secret Storage
8. **Task 024** — Plugins: API publica C estavel, Plugin Manager, sandbox permissoes

### Prioridade Baixa — Polimento
9. **Task 025** — Temas + Keybindings customizaveis
10. **Task 026** — UX: onboarding, empty states, lazy loading, telemetria
11. **Task 027** — Instalador + Auto-update (NSIS/AppImage/DMG)

---

## Decisoes Arquiteturais Importantes

| Decisao | Alternativa Rejeitada | Motivo |
|---------|----------------------|--------|
| Qt WebEngine (Chromium) em vez de QML puro | QML Quick Controls | Ecossistema npm, Monaco Editor, time-to-market |
| Bridge adapter em DocumentCreation | `runJavaScript()` tardio | Evita race conditions com scripts da pagina |
| `_origSend.call(t, pkt)` em vez de `.bind()` | `.bind()` | Mais confiavel com V8 |
| Split por `;` no `exec()` do SQLite | Refatorar todas as migrations | Solucao mais simples, funciona |
| `subsystem:console` | `subsystem:windows` | Pode ver `qCritical()` no stderr durante dev |
| Banco em `%APPDATA%` (Roaming) | Local ou AppData\Local | Sincronizacao entre maquinas via Roaming |

---

## Arquivos Criticos

| Arquivo | Descricao | Linhas |
|---------|-----------|--------|
| `kernel/src/main.cpp` | Entry point + 89 bridge handlers + 8 migrations | 1553 |
| `kernel/src/bridge/web_channel.cpp` | Adaptador JS injetado em DocumentCreation | 139 |
| `kernel/src/persistence/database.cpp` | Wrapper SQLite com WAL, split multi-statement | 128 |
| `kernel/src/network/network_manager.cpp` | HTTP, OAuth GitHub, WebSocket, API keys | 350 |
| `kernel/CMakeLists.txt` | Build config (Qt6 modulos + nlohmann_json) | 108 |
| `ui/src/hooks/use-jarvis.ts` | Bridge hook com 100+ metodos tipados | 203 |
| `ui/src/types/index.ts` | Todas as interfaces TypeScript do projeto | 339 |
| `ui/src/App.tsx` | Layout principal com 6 paineis | 82 |
