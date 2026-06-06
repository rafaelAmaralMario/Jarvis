# CONTEXTO COMPLETO — JARVIS Python (Junho 2026)

> **Ultima atualizacao:** 2026-06-06T11:00:00-03:00
> **Branch:** `main`
> **Status:** Migracao Qt C++ → Python concluida. 9 fases entregues.

---

## Identidade do Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | JARVIS |
| **Descricao** | Assistente de IA completo e modular com IDE integrada |
| **Stack** | Python 3.14 + pywebview 5.x (WebView2) + React 19 + TypeScript + Vite |
| **Bridge** | pywebview js_api com 65+ metodos em `window.jarvis.*` |
| **Banco** | SQLite 3.x nativo com WAL mode, 8 migrations, ~26 tabelas, FTS5 |
| **Build** | pip install + npm run build |
| **Sistema** | Windows 11 primario |

---

## Stack Tecnologica (Implementada)

| Camada | Tecnologia | Versao | Uso |
|--------|-----------|--------|-----|
| Backend | Python | 3.14 | Todo o backend (14 modulos) |
| Desktop Framework | pywebview | 5.x | WebView2 window, Python↔JS bridge |
| HTTP Client | httpx | 0.28+ | Ollama API, requisicoes HTTP |
| Criptografia | cryptography | 44+ | API key storage |
| Terminal PTY | subprocess + pyte | — | Emulacao de terminal |
| Plugin Loader | importlib | — | Descoberta e carga de modulos Python |
| UI Web | React + TypeScript | 19 + 5.9 | Interface completa |
| Build Web | Vite | 7 | Bundle da UI |
| Estilos | Tailwind CSS + Radix UI | 4 | Design system |
| Animacoes | Framer Motion | 12 | Transicoes de paineis |
| Editor Codigo | Monaco Editor | 0.55 | Editor de codigo profissional |
| Terminal UI | xterm.js | 5.x | Terminal integrado |
| Bridge | pywebview js_api | 5.x | JSON-RPC nativo |
| Banco | SQLite3 (nativo) | 3.x | Persistencia local (WAL, FTS5) |
| Build Python | pip + setuptools | — | Instalacao do backend |
| Testes Python | pytest | 8.x | 260+ testes (unitarios + integracao) |
| Testes Web | Vitest | 4.x | 145 testes React |

---

## Arquitetura de Camadas

```
┌──────────────────────────────────────────────────────────┐
│  L4: Plugins                                [NÃO INICIADO]│
│     Python plugins via ModuleLoader (importlib)          │
├──────────────────────────────────────────────────────────┤
│  L3: Editor · Git · Terminal                  [✓ 3/3]    │
│     Monaco Editor, xterm.js, Git CLI subprocess          │
├──────────────────────────────────────────────────────────┤
│  L2: Conhecimento · AI Engine                  [✓ 2/2]    │
│     Notes, FTS5 Search, Graph, Models, Agents, Critic    │
├──────────────────────────────────────────────────────────┤
│  L1: Workspace · Rede · Persistência           [✓ 3/3]   │
│     File I/O, HTTP, OAuth, SQLite (WAL mode)            │
├──────────────────────────────────────────────────────────┤
│  L0: Bridge ⚙️                               [✓ COMPLETO]│
│     pywebview JSON-RPC, 65+ window.jarvis.* methods      │
│     14 Python modules, 260+ pytest tests                 │
├──────────────────────────────────────────────────────────┤
│  OS: Windows (primary)                                   │
└──────────────────────────────────────────────────────────┘
```

---

## Estrutura de Pastas (Real)

```
C:\Users\Rafae\Documents\Jarvis\
├── backend/                       # Python backend
│   ├── pyproject.toml             # Dependencias Python
│   ├── jarvis/
│   │   ├── __init__.py
│   │   ├── main.py                # Entry point pywebview
│   │   ├── bridge.py              # 65+ metodos window.jarvis.*
│   │   ├── database.py            # SQLite WAL, thread-safe
│   │   ├── migration_runner.py    # 8 migrations SQL
│   │   ├── ollama_client.py       # HTTP client p/ Ollama
│   │   ├── models_manager.py      # CRUD model_metadata
│   │   ├── agents_manager.py      # CRUD agents + seed defaults
│   │   ├── orchestration_manager.py # Multi-agent routing + critic
│   │   ├── knowledge_manager.py   # Notes + FTS5 + wikilinks
│   │   ├── graph_builder.py       # Knowledge graph viz
│   │   ├── workspace_manager.py   # File I/O + watcher
│   │   ├── editor_manager.py      # Open/save/settings
│   │   ├── git_manager.py         # Git CLI subprocess
│   │   ├── terminal_manager.py    # PTY subprocess
│   │   ├── network_manager.py     # HTTP + OAuth + API keys
│   │   └── module_loader.py       # Python plugin loader
│   └── tests/                     # 16 arquivos de teste
│       ├── test_database.py
│       ├── test_migration_runner.py
│       ├── test_ollama_client.py
│       ├── test_models_manager.py
│       ├── test_agents_manager.py
│       ├── test_orchestration_manager.py
│       ├── test_knowledge_manager.py
│       ├── test_graph_builder.py
│       ├── test_workspace_manager.py
│       ├── test_editor_manager.py
│       ├── test_git_manager.py
│       ├── test_terminal_manager.py
│       ├── test_network_manager.py
│       ├── test_module_loader.py
│       └── test_integration.py    # E2E integration (15 testes)
├── ui/                            # React frontend (56 arquivos src/)
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/            # 30+ componentes
│       ├── hooks/                 # use-jarvis.ts, useAutoSave.ts
│       ├── types/index.ts
│       └── styles/globals.css
├── .docs/                         # Documentacao ativa
├── .context/                      # Registro de contexto (16 entradas)
├── .old/                          # Artefatos legados
│   ├── old-cpp/                   # Codigo C++ original (migrado)
│   ├── tarefas/                   # Tasks historicas
│   └── docs/                      # Docs historicas C++
├── docs/                          # Documentacao C++ historica
├── build_rls.bat                  # Script build (React + pip)
└── README.md                      # Root README
```

---

## Modulos — Estado Real de Implementacao

| Modulo | Python | Tests | Status |
|--------|--------|-------|--------|
| Bridge (65+ metodos) | `bridge.py` | — (E2E via test_integration) | ✅ Completo |
| Database (SQLite WAL) | `database.py` | 15 | ✅ Completo |
| Migration Runner | `migration_runner.py` | 11 | ✅ Completo |
| Ollama Client | `ollama_client.py` | 11 | ✅ Completo |
| Models Manager | `models_manager.py` | 18 | ✅ Completo |
| Agents Manager | `agents_manager.py` | 18 | ✅ Completo |
| Orchestration Manager | `orchestration_manager.py` | 15 | ✅ Completo |
| Knowledge Manager | `knowledge_manager.py` | 40 | ✅ Completo |
| Graph Builder | `graph_builder.py` | 11 | ✅ Completo |
| Workspace Manager | `workspace_manager.py` | 28 | ✅ Completo |
| Editor Manager | `editor_manager.py` | 12 | ✅ Completo |
| Git Manager | `git_manager.py` | 18 | ✅ Completo |
| Terminal Manager | `terminal_manager.py` | 11 | ✅ Completo |
| Network Manager | `network_manager.py` | 15 | ✅ Completo |
| Module Loader | `module_loader.py` | 9 | ✅ Completo |
| **E2E Integration** | `test_integration.py` | 15 | ✅ Completo |

---

## Banco de Dados (SQLite)

| Item | Detalhe |
|------|---------|
| **Engine** | SQLite 3.x nativo (sqlite3 module) |
| **Modo WAL** | Sim (PRAGMA journal_mode=WAL) |
| **Thread safety** | RLock (recursive lock) |
| **Localizacao** | `%APPDATA%\JARVIS\jarvis-ai.db` |
| **Schema version** | 8 |
| **Tabelas** | ~26 |
| **Migrations** | 8 scripts em `migration_runner.py` |
| **FTS5** | Notas com full-text search |
| **Transacoes** | Explicitas (BEGIN/COMMIT/ROLLBACK) com `isolation_level = None` |

### Migrations
1. `core_001_core.sql` — tabelas base (modules, service_registry, config)
2. `core_002_permissions.sql` — permissoes e roles
3. `core_003_extensions.sql` — extensoes
4. `models_agents_001.sql` — modelos, agentes, orquestracao
5. `knowledge_001.sql` — notas, links, tags, FTS5
6. `workspace_001.sql` — projetos, arquivos
7. `editor_001.sql` — configuracoes do editor
8. `api_keys_001.sql` — chaves de API, OAuth tokens

---

## Bridge Python ↔ React (pywebview)

### Como funciona
1. React chama `window.pywebview.api.<method>(args)` → retorna `Promise<result>`
2. pywebview serializa args como JSON, envia via WebView2 IPC
3. Metodo Python correspondente em `JARVISBridge` executa a logica
4. Resultado (dict/list) e serializado como JSON de volta
5. Promise resolve no React

### Metodos expostos: 65+
- **Module (2):** `getModules`, `getModule`
- **File (3):** `readFile`, `writeFile`, `listDirectory`
- **Model (8):** `listModels`, `getModel`, `pullModel`, `deleteModel`, `startModel`, `stopModel`, `updateModelMetadata`, `getModelBySpecialty`
- **Agent (8):** `listAgents`, `getAgent`, `createAgent`, `updateAgent`, `deleteAgent`, `setDefaultAgent`, `getDefaultAgent`, `getOrchestrationPool`
- **Orchestration (5):** `getOrchestrationConfig`, `updateOrchestrationConfig`, `sendMessage`, `executeOrchestratedQuery`, `getAgentTrace`
- **Workspace (15):** `openWorkspace`, `addRoot`, `removeRoot`, `getRoots`, `listFiles`, `createFile`, `createFileWithPath`, `createDirectory`, `deletePath`, `renamePath`, `movePath`, `getRecentFiles`, `getProjectInfo`, `cancelGeneration`
- **Knowledge (12):** `createNote`, `getNote`, `listNotes`, `updateNote`, `deleteNote`, `searchNotes`, `getBacklinks`, `getGraph`, `getFolders`, `moveNote`, `importNote`, `exportNote`
- **Editor (8):** `editorOpenFile`, `editorSaveFile`, `editorCloseFile`, `editorGetOpenFiles`, `editorDetectLanguage`, `editorSearchFiles`, `editorGetSettings`, `editorUpdateSettings`
- **Terminal (6):** `terminalCreate`, `terminalWrite`, `terminalResize`, `terminalClose`, `terminalList`, `terminalCloseAll`
- **Network (10):** `networkGet`, `networkPost`, `networkOAuthStart`, `networkOAuthComplete`, `networkGetStoredToken`, `networkClearToken`, `networkStoreApiKey`, `networkGetApiKey`, `networkDeleteApiKey`, `networkListApiKeys`
- **Git (17):** `gitStatus`, `gitDiff`, `gitDiffGutter`, `gitStage`, `gitUnstage`, `gitStageAll`, `gitCommit`, `gitBranches`, `gitCheckout`, `gitCreateBranch`, `gitDeleteBranch`, `gitPush`, `gitPull`, `gitLog`, `gitIsRepo`, `gitCurrentBranch`, `gitSetCredentials`

### Eventos (Bridge → React)
- `terminal-output(terminalId, data)` — saida do terminal
- `terminal-exit(terminalId, exitCode)` — terminal fechou
- `file-changed({ type, path })` — arquivo criado/deletado

---

## Proximos Passos

### Curto Prazo (Proximo Ciclo)
1. **Plugin Ecosystem** — Ativar ModuleLoader para carregar plugins Python de `modules/`
2. **Gateway Multi-Provedor LLM** — Suporte a OpenAI, Anthropic, AWS Bedrock
3. **Knowledge Graph Viz** — Visualizacao interativa do grafo de conhecimento
4. **MCP Server Integration** — Integracao com Model Context Protocol

### Medio Prazo
5. **Automatizacao** — Workflow engine com steps (run command, api call, wait)
6. **Seguranca** — Permission center UI, audit log, secret storage
7. **Voz** — STT/TTS integrado

### Longo Prazo
8. **Instalador** — NSIS/AppImage para distribuicao
9. **Multi-Usuario** — Sync server com colaboracao
10. **Mobile Companion** — App mobile

---

## Decisoes Arquiteturais Importantes

| Decisao | Alternativa Rejeitada | Motivo |
|---------|----------------------|--------|
| Python + pywebview em vez de Qt C++ | Qt 6.8 + QWebEngine | Crash Blink em debug, desenvolvimento mais rapido |
| sqlite3 nativo em vez de SQLAlchemy | ORM pesado | Controle fino sobre WAL, FTS5, transacoes |
| httpx em vez de requests | requests (sync) | httpx suporta HTTP/2, streaming nativo |
| subprocess (git CLI) em vez de gitpython | gitpython | Evita dependencia, mesma UX do C++ original |
| camelCase no bridge | snake_case | Compatibilidade com frontend React legado |
| Managers injetados no construtor | Service locator global | Testabilidade, dependencias explicitas |

---

## Convencoes de Codigo

- **Python:** type hints em todos os metodos publicos
- **Testes:** pytest com fixtures, sem dependencia externa (Ollama mockado)
- **Database:** `isolation_level = None`, transacoes explicitas
- **ID generation:** `secrets.token_hex(16)` ou `uuid.uuid4().hex`
- **Sem comentarios no codigo** (auto-documentado)
- **Bridge:** camelCase para compatibilidade React
- **Managers:** snake_case nos metodos internos

## Arquivos Criticos

| Arquivo | Descricao | Linhas |
|---------|-----------|--------|
| `backend/jarvis/bridge.py` | 65+ metodos `window.jarvis.*` | ~490 |
| `backend/jarvis/main.py` | Entry point + injecao de dependencias | ~70 |
| `backend/jarvis/knowledge_manager.py` | Notes CRUD + FTS5 + wikilinks + import/export | ~409 |
| `backend/jarvis/workspace_manager.py` | File I/O + watcher + project detection | ~486 |
| `backend/jarvis/orchestration_manager.py` | Multi-agent routing + critic | ~306 |
| `backend/jarvis/database.py` | SQLite WAL + thread-safe | ~64 |
| `ui/src/hooks/use-jarvis.ts` | Bridge hook com metodos tipados | ~203 |
| `ui/src/types/index.ts` | Interfaces TypeScript | ~339 |
| `ui/src/App.tsx` | Layout principal com 6 paineis | ~82 |
