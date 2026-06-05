# Contexto: Migração Qt C++ → Python + pywebview

**ID:** CONTEXT-012
**Timestamp:** 2026-06-05T16:30:00-03:00
**Status:** `active`
**Supersedes:** 011
**Superseded by:** —
**Skill usada:** context-generator

## Decisao / Conteudo

### Motivação da Migração

O projeto JARVIS foi migrado de Qt 6.8 C++ + QWebEngine para **Python 3.11+ + pywebview 5.x + React** devido a um crash crítico no motor Blink do Qt em modo debug:

```
Check failed: g_null_atom == ComputeBaseComputedStyleDiff(...)
```

Este crash ocorre no CSS engine do Chromium embarcado (`QtWebEngine` debug mode) e não tem solução do lado do JARVIS. A migração elimina o Qt completamente.

### Nova Stack

| Camada | Antes | Depois |
|--------|-------|--------|
| Backend | C++17 (Qt 6.8) | Python 3.14 |
| UI Bridge | QWebChannel (C++ ↔ JS) | pywebview (Python ↔ JS) |
| HTTP | QNetworkAccessManager | httpx |
| WebSocket | QWebSocket | websockets |
| Database | QSqlDatabase + sqlite3 | sqlite3 nativo |
| File Watcher | QFileSystemWatcher | watchdog |
| Terminal | QProcess (PTY) | subprocess + pyte |
| Git | QProcess (git CLI) | subprocess (git CLI) |
| Encryption | QByteArray::toBase64 | cryptography.fernet |
| Build | CMake + MSVC | pip + setuptools |
| Frontend | React + Vite (inalterado) | React + Vite (inalterado) |

### Estrutura de Diretorios

```
jarvis/
├── backend/                     ← NOVO (Python)
│   ├── pyproject.toml
│   ├── jarvis/
│   │   ├── __init__.py
│   │   ├── main.py              ← Entry point (pywebview)
│   │   ├── bridge.py            ← ~95 métodos window.jarvis.*
│   │   ├── database.py          ← SQLite wrapper (WAL, thread-safe)
│   │   ├── migration_runner.py  ← 8 migrations SQLite
│   │   ├── ollama_client.py     ← HTTP client p/ Ollama
│   │   ├── models_manager.py    ← CRUD model_metadata
│   │   ├── agents_manager.py    ← CRUD agents + seed defaults
│   │   ├── orchestration_manager.py ← multi-agent routing
│   │   ├── knowledge_manager.py ← notes + FTS5 + wikilinks
│   │   ├── workspace_manager.py ← file I/O + watchdog
│   │   ├── editor_manager.py    ← editor open/save/settings
│   │   ├── git_manager.py       ← git CLI subprocess
│   │   ├── terminal_manager.py  ← PTY subprocess
│   │   ├── network_manager.py   ← HTTP + OAuth + API keys
│   │   └── module_loader.py     ← Python plugin loader
│   └── tests/
│       ├── test_database.py     ← 15 testes Database
│       └── test_migration_runner.py ← 11 testes Migrations
├── ui/                          ← INALTERADO (React 19 + TS + Vite)
│   ├── src/
│   ├── index.html               ← qwebchannel.js removido
│   ├── vite.config.ts           ← outDir: ./dist
│   └── package.json
├── .oldC++/                     ← CÓDIGO ORIGINAL ARQUIVADO
│   ├── kernel/                  ← 485 arquivos C++ (5.788 lines src)
│   └── tests/
├── .gitignore                   ← Python artifacts adicionados
├── build_rls.bat                ← Build script (React + Python)
└── MIGRACAO_PYTHON.md           ← Plano completo (~19.5 dias)
```

### Estado Atual (Fases 0-4b Concluídas)

**Python backend: 1.720 lines escritos, 80/80 testes passando (24s).**

- ✅ `database.py` — SQLite com WAL mode, thread-safe (RLock), row factory, checkpoint
- ✅ `migration_runner.py` — 8 migrations idênticas ao C++ (FTS5, CHECK constraints, default inserts)
- ✅ `bridge.py` — 95 métodos stub com assinaturas idênticas ao C++ original
- ✅ `main.py` — entry point pywebview com db init + migration runner
- ✅ `pyproject.toml` — dependências (pywebview, httpx, websockets, etc.)
- ✅ `build_rls.bat` — build React + pip install
- ✅ `ui/index.html` — linha `qwebchannel.js` removida
- ✅ `ui/vite.config.ts` — `outDir` mudado para `./dist`
- ✅ `.gitignore` — `__pycache__/`, `*.pyc`, `backend/dist/`
- ✅ **`ollama_client.py`** — httpx.Client para Ollama REST API (`/api/tags`, `/api/generate`, `/api/pull`, `/api/delete`). Suporta `generate()` síncrono e `generate_stream()` com callback. Dataclasses `OllamaModel`, `OllamaGenerateRequest`, `OllamaGenerateResponse`. Timeouts configurados (30s default, 120s generate, 300s pull). 11 testes (offline-safe).
- ✅ **`models_manager.py`** — CRUD completo sobre `model_metadata` table. `list_models()` mescla Ollama + DB metadata. `get_model()`, `pull_model()` (auto-registra metadata), `delete_model()`, `start_model()`/`stop_model()` (keep_alive), `update_model_metadata()`, `get_model_by_specialty()` com fallback hierarchy. `_infer_specialty()` por heurística de nome (code/coder/deepseek-coder → CODE, etc). Progress callback support. 25 testes (mock OllamaClient).
- ✅ **`agents_manager.py`** — CRUD completo sobre `agents` table com `CreateAgentDTO`/`Agent` dataclasses. `list_agents()` ordenado por priority DESC, name ASC. `create_agent()` gera UUID hex via `secrets.token_hex(16)`. `set_default_agent()` usa transação explícita (BEGIN/COMMIT/ROLLBACK). `get_default_agent()` fallback para primeiro agente. `get_orchestration_pool()` filtra `can_orchestrate=1`. Seed automático de 2 agents (Assistant Geral + Code Expert, português BR, mesmos do C++). 18 testes.
- ✅ **`database.py`** — `isolation_level = None` para gerenciamento explícito de transações

**C++ arquivado:** 5.788 lines de código fonte em `.oldC++/kernel/src/`

### Roadmap Restante (~1.650 lines Python + ~24 testes)

| # | Módulo | C++ (lines) | Est. Python | Testes | Status |
|---|--------|-------------|-------------|--------|--------|
| 1 | `ollama_client.py` | 191 | 91 | 11 | ✅ |
| 2 | `models_manager.py` | 298 | 200 | 25 | ✅ |
| 3 | `agents_manager.py` | 239 | 175 | 18 | ✅ |
| 4 | `orchestration_manager.py` | 333 | ~165 | 2 | ⬜ |
| 5 | `knowledge_manager.py` | 557 | ~280 | 3 | ⬜ |
| 6 | `graph_builder.py` | 120 | ~60 | 1 | ⬜ |
| 7 | `workspace_manager.py` | 307 | ~275 | 3 | ⬜ |
| 8 | `git_manager.py` | 261 | ~130 | 2 | ⬜ |
| 9 | `editor_manager.py` | 148 | ~75 | 1 | ⬜ |
| 10 | `terminal_manager.py` | 191 | ~95 | 2 | ⬜ |
| 11 | `network_manager.py` | 350 | ~175 | 2 | ⬜ |
| 12 | `module_loader.py` | 341 | ~170 | 1 | ⬜ |
| 13 | Permissions + Backup + Misc | 172 | ~85 | 1 | ⬜ |
| — | Bridge wiring + pywebview | — | ~150 | 0 | ⬜ |
| — | E2E integration tests | — | ~300 | 24+ | ⬜ |
| **Total** | | **5.788** | **~1.475** | **42+** | **14/16** |

### Padrões de Implementação

- **TDD:** cada módulo tem testes primeiro (pytest), depois implementação mínima
- **Bridge:** métodos expostos via `pywebview.api` → alias `window.jarvis` por inject script
- **Database:** `Database(db_path)` obtido via `%APPDATA%\JARVIS\jarvis-ai.db`
- **Ollama:** `http://localhost:11434` via httpx.Client
- **Git:** subprocess puro (mesma abordagem do C++) evitando gitpython
- **Terminal:** Windows PTY via `subprocess.Popen` + `pyte` para emulação
- **Module Loader:** `importlib` ao invés de `LoadLibrary`/`dlopen`
- **Streaming:** callbacks via pywebview events (terminal-output, modules-ready)

## Arquivos Afetados

- `backend/pyproject.toml` — NOVO, dependências Python
- `backend/jarvis/__init__.py` — NOVO
- `backend/jarvis/main.py` — NOVO, entry point
- `backend/jarvis/bridge.py` — NOVO, 95 stubs
- `backend/jarvis/database.py` — NOVO, SQLite wrapper
- `backend/jarvis/migration_runner.py` — NOVO, 8 migrations
- `backend/jarvis/*_manager.py` — NOVO, stubs (11 managers)
- `backend/jarvis/ollama_client.py` — NOVO, httpx client p/ Ollama API
- `backend/jarvis/models_manager.py` — NOVO, CRUD model_metadata + specialty inference
- `backend/tests/test_database.py` — NOVO, 15 testes
- `backend/tests/test_migration_runner.py` — NOVO, 11 testes
- `backend/tests/test_ollama_client.py` — NOVO, 11 testes
- `backend/tests/test_models_manager.py` — NOVO, 25 testes
- `backend/jarvis/agents_manager.py` — NOVO, CRUD agents + seed defaults (2 em PT-BR)
- `backend/tests/test_agents_manager.py` — NOVO, 18 testes
- `backend/jarvis/orchestration_manager.py` — NOVO, 227 lines, multi-agent routing + critic + streaming + trace
- `backend/tests/test_orchestration_manager.py` — NOVO, 15 testes
- `backend/jarvis/knowledge_manager.py` — REESCRITO (8→315 lines), 12 métodos: notes CRUD, FTS5, wikilinks, graph, import/export .md
- `backend/tests/test_knowledge_manager.py` — NOVO, 40 testes (13 helpers + 27 integração)
- `backend/jarvis/database.py` — `exec()` migrado de `split(";")` para `executescript()` (suporta triggers com `;` interno)
- `backend/jarvis/migration_runner.py` — Migration 5 agora inclui FTS5 triggers (notes_ai, notes_ad, notes_au)
- `ui/index.html` — removido `<script src="qrc:///qtwebchannel/qwebchannel.js">`
- `ui/vite.config.ts` — `outDir` alterado para `./dist`
- `.oldC++/` — NOVO, C++ original arquivado (485 arquivos)
- `.gitignore` — Python artifacts adicionados
- `build_rls.bat` — NOVO, build script

## Proximos Passos

1. ✅ ~~**Fase 4a/4b:** `ollama_client.py` + `models_manager.py`~~
2. ✅ ~~**Fase 4c:** `agents_manager.py`~~
3. ✅ ~~**Fase 4d:** `orchestration_manager.py` + 15 testes~~
4. ✅ ~~**Fase 5a:** `knowledge_manager.py` + 40 testes (graph_builder embutido em get_graph())~~
5. **Fase 5b:** `graph_builder.py` standalone (separado do knowledge_manager, com buildJson)
6. **Fase 3a-3f:** Workspace, Git, Editor, Terminal, Network, Module Loader
5. **Fase 3a-3f:** Workspace, Git, Editor, Terminal, Network, Module Loader
6. **Fase 6:** Bridge wiring + pywebview integração (inject script window.jarvis alias)
7. **Fase 7:** Build system + validação E2E
8. **Fase 8:** Documentação (README, CONTRIBUTING)
9. **Fase 9:** Limpeza `.oldC++/`

## Plano Detalhado: Fase 4d — Orchestration Manager

### Objetivo
Portar `orchestration_manager.cpp` (333 lines C++) para Python. Este é o módulo de orquestração multi-agente: roteia perguntas do usuário para agentes especialistas, coleta respostas, passa pelo critic agent, e consolida resultado final com streaming.

### Arquivos a criar/modificar

| Arquivo | Ação | Estimativa |
|---------|------|------------|
| `backend/jarvis/orchestration_manager.py` | **CRIAR** — implementação completa | ~165 lines |
| `backend/tests/test_orchestration_manager.py` | **CRIAR** — testes com mock | ~80 lines |

### Estrutura de Dados (dataclasses)

```python
@dataclass
class OrchestrationConfig:
    enabled: bool = True
    orchestrator_model: str = ""
    critic_enabled: bool = True
    critic_temperature: float = 0.1
    max_agents_per_query: int = 3
    show_trace: bool = True

@dataclass
class AgentResult:
    agent_name: str = ""
    specialty: str = ""
    model: str = ""
    response: str = ""
    tokens_used: int = 0
    latency_ms: int = 0

@dataclass
class AgentTrace:
    query_id: str = ""
    query: str = ""
    orchestrator_reasoning: str = ""
    agents_consulted: list[AgentResult] = field(default_factory=list)
    critic_review: str = ""
    final_response: str = ""
```

### Classe `OrchestrationManager`

**Construtor:** `__init__(self, models: ModelsManager, agents: AgentsManager, db: Database, ollama: OllamaClient | None = None)`

**Métodos públicos (4 — espelham os bridge handlers):**

| # | Método Python | Bridge handler | Descrição |
|---|--------------|----------------|-----------|
| 1 | `execute_query(query) -> str` | `sendMessage` / `executeOrchestratedQuery` | Se `config.enabled` e `stream_cb` definido → multi-agente. Senão → single agent. |
| 2 | `get_trace(query_id) -> AgentTrace \| None` | `getAgentTrace` | Busca trace salvo em memória |
| 3 | `get_config() -> OrchestrationConfig` | `getOrchestrationConfig` | Lê config atual (já carregada no construtor) |
| 4 | `update_config(config) -> bool` | `updateOrchestrationConfig` | Persiste na tabela `orchestration_config` |

**Método auxiliar de streaming:**
| # | Método Python | Descrição |
|---|--------------|-----------|
| 5 | `set_stream_callback(cb: Callable[[str], None])` | Registra callback para streaming de chunks |

**Métodos privados (6 — lógica interna):**

| # | Método | O que faz | C++ lines |
|---|--------|-----------|-----------|
| 6 | `_load_config()` | Carrega `orchestration_config` do DB | 10 |
| 7 | `_execute_single_agent(query) -> str` | Pega agente default, chama Ollama.generate() | 6 |
| 8 | `_execute_agent(agent, query) -> str` | Monta prompt com system_prompt, chama Ollama | 12 |
| 9 | `_orchestrator_plan(query) -> (str, list[str])` | Monta routing prompt, chama Ollama, parseia CSV de agentes | 60 |
| 10 | `_critic_review(query, trace) -> str` | Monta critic prompt, chama Ollama, retorna review | 30 |
| 11 | `_consolidate_response(trace) -> str` | Retorna última resposta dos agentes | 5 |
| 12 | `_find_agent(name) -> Agent` | Busca agente por nome ou id, fallback default | 8 |
| 13 | `_emit_chunk(chunk)` | Chama stream_cb se definido | 3 |

### Fluxo do `execute_query` (passo a passo)

```
execute_query("review this code")
  │
  ├─ config.enabled == True && stream_cb set?
  │   ├─ SIM → multi-agente
  │   │    ├─ 1. Gera query_id (uuid)
  │   │    ├─ 2. _emit_chunk("🧠 Orquestrador: Analisando...")
  │   │    ├─ 3. _orchestrator_plan(query)
  │   │    │    ├─ Monta lista de agentes do pool
  │   │    │    ├─ Chama Ollama com routing prompt
  │   │    │    ├─ Parseia resposta CSV → ["Code Expert", ...]
  │   │    │    └─ Retorna (reasoning, agent_names)
  │   │    ├─ 4. Para cada agent_name:
  │   │    │    ├─ _find_agent(name)
  │   │    │    ├─ _emit_chunk("**{agent.name}**: trabalhando...")
  │   │    │    ├─ _execute_agent(agent, query)  ← Ollama.generate()
  │   │    │    ├─ Monta AgentResult (com latency)
  │   │    │    └─ _emit_chunk(response)
  │   │    ├─ 5. critic_enabled?
  │   │    │   ├─ SIM → _critic_review(query, trace)
  │   │    │   │    ├─ Monta critic prompt com respostas
  │   │    │   │    ├─ Chama Ollama.generate()
  │   │    │   │    └─ _emit_chunk(review)
  │   │    │   └─ NÃO → pula
  │   │    ├─ 6. _consolidate_response(trace)
  │   │    ├─ 7. Salva trace em memória (dict[id] = trace)
  │   │    └─ 8. Retorna final_response
  │   └─ NÃO → single agent
  │        └─ _execute_single_agent(query)
  │             ├─ Pega agente default
  │             └─ Chama Ollama.generate()
  └─ Retorna string
```

### Testes a criar (2 testes principais + variações)

**Teste 1: `test_execute_single_agent`** — Mock OllamaClient, verifica que `execute_query` com orchestration desligado chama agente default e retorna resposta.

**Teste 2: `test_execute_orchestrated_query`** — Mock OllamaClient + AgentsManager, simula:
- `orchestrator_plan` retorna 2 agentes
- Cada agente retorna resposta
- Critic retorna "✅ Aprovado"
- Verifica trace completo (agentsConsulted, criticReview, finalResponse)

**Variações:**
- `test_get_config_loads_from_db` — Verifica config padrão carregada
- `test_update_config_persists` — Update + verify no DB
- `test_get_trace_returns_none_for_unknown` — QueryId inexistente
- `test_execute_query_orchestrator_fallback` — Quando Ollama cai no orchestrator, fallback pro agente default

### Dependências

- `OllamaClient` — para chamar `/api/generate`
- `ModelsManager` — para pegar modelos
- `AgentsManager` — para `get_orchestration_pool()`, `get_default_agent()`, `list_agents()`
- `Database` — para `orchestration_config` table (já criada na migration 4)

### Critério de sucesso

- `python -m pytest tests/test_orchestration_manager.py -v` → 6+ testes passando
- Mock cobre: single agent, multi-agent, critic, fallback, persistência
- Nenhum teste depende de Ollama rodando (tudo mockado)

---

## Notas

- Python 3.14.2 instalado (todas dependências compatíveis)
- Ollama roda em `localhost:11434`
- DB local: `%APPDATA%\JARVIS\jarvis-ai.db`
- React `use-jarvis.ts` já suporta `window.jarvis.method()` (bridge mock usa mesma interface)
- pywebview expõe objeto Python como `window.pywebview.api` → precisa de alias `window.jarvis`
- 34 Vitest tests (145/145) passam com `--maxWorkers=2`
- 80/80 testes pytest passando (24s)
- `httpx.Client.delete()` não suporta `json` nem `content` kwargs — usar `client.request("DELETE", ...)`
- Modelos com Ollama offline: `ping()` retorna False, `list_models()`/`generate()`/`pull_model()` levantam `httpx.ConnectError`, `delete_model()` levanta exceção
- ModelsManager aceita `OllamaClient` opcional via construtor para injeção de mock em testes
- `generate_stream()` usa `client.stream("POST", ...)` + `resp.iter_lines()` + `json.loads()`
- `database.py`: `isolation_level = None` obrigatório p/ transações explícitas (BEGIN/COMMIT/ROLLBACK)
- `agents_manager.create_agent()` gera UUID via `secrets.token_hex(16)` (compatível com `lower(hex(randomblob(16)))` do SQLite)
- `AgentsManager.__init__` faz seed automático se tabela vazia — `_seed_if_empty()`
