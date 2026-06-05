# Handoff: JARVIS Python Migration

> Peça para o Claude: "analise o documento HANDOFF.md e continue de onde paramos"
> Ou apenas: "leia o HANDOFF.md e continue o desenvolvimento"

---

## Estado Atual

**Build:** React compilado em `ui/dist/`, Python instalado via `pip install -e .`
**Testes:** 146/146 pytest passando (24s), 145/145 Vitest passando
**App:** Roda com `python backend/jarvis/main.py` — janela WebView2 com React

## O que foi entregue (Fases 1-5b)

| Módulo | Arquivo | Tests |
|--------|---------|-------|
| Database | `backend/jarvis/database.py` | 13 |
| Migration Runner | `backend/jarvis/migration_runner.py` | 11 |
| Bridge (stubs) | `backend/jarvis/bridge.py` | — |
| Ollama Client | `backend/jarvis/ollama_client.py` | 11 |
| Models Manager | `backend/jarvis/models_manager.py` | 18 |
| Agents Manager | `backend/jarvis/agents_manager.py` | 18 |
| Orchestration Manager | `backend/jarvis/orchestration_manager.py` | 15 |
| Knowledge Manager | `backend/jarvis/knowledge_manager.py` | 40 |
| Graph Builder | `backend/jarvis/graph_builder.py` | 11 |

## Proxima Fase: Fase 3a-3f — Workspace, Git, Editor, Terminal, Network, Module Loader

### Arquivos a criar

#### `backend/jarvis/workspace_manager.py`
Monitora diretorios de trabalho com watchdog + CRUD de workspaces.
- `__init__(self, db: Database)`
- `list_workspaces() -> list[Workspace]`
- `create_workspace(name: str, folders: list[str]) -> Workspace`
- `delete_workspace(id: str) -> bool`
- `get_recent_files(limit=20) -> list[RecentFile]`
- `add_recent_file(path: str)`
- `start_watching(path: str, callback: Callable)` — watchdog.observer

Testes: `backend/tests/test_workspace_manager.py` (~10 tests, mock watchdog)

#### `backend/jarvis/git_manager.py`
Wrapper subprocess para git CLI.
- `__init__(self, repo_path: str = "")`
- `status() -> dict` (branch, changes, ahead/behind)
- `log(max_count=50) -> list[dict]`
- `diff(file: str = "") -> str`
- `add(files: list[str])`
- `commit(message: str) -> bool`
- `push(remote="origin", branch="") -> bool`
- `pull(remote="origin", branch="") -> bool`
- `checkout(branch: str) -> bool`
- `branches() -> list[str]`
- `_run(*args) -> str` — subprocess.run com timeout 30s

Testes: `backend/tests/test_git_manager.py` (~8 tests, git init em temp dir)

#### `backend/jarvis/editor_manager.py`
Gerenciamento de arquivos abertos + language detection.
- `open_file(path: str) -> FileBuffer`
- `save_file(id: str, content: str)`
- `close_file(id: str)`
- `get_open_files() -> list[FileBuffer]`
- `_detect_language(path: str) -> str` — extensao → Monaco language id
- `list_recent(limit=20)` — delega para WorkspaceManager

Testes: `backend/tests/test_editor_manager.py` (~6 tests)

#### `backend/jarvis/terminal_manager.py`
PTY subprocess com output streaming (usando `pyte` para terminal parsing).
- `__init__(self, cwd: str = "")`
- `start()` — spawn `cmd.exe` (Windows) ou `bash` (Linux)
- `write(input: str)` — escreve no PTY
- `resize(rows, cols)` — redimensiona PTY
- `kill()` — termina o processo
- `on_output(callback: Callable)` — registra callback para output streaming

Testes: `backend/tests/test_terminal_manager.py` (~4 tests com mock subprocess)

#### `backend/jarvis/network_manager.py`
HTTP client + OAuth + API key storage.
- `__init__(self, db: Database)`
- `get(url, headers) -> dict`
- `post(url, json, headers) -> dict`
- `save_api_key(service: str, key: str)`
- `get_api_key(service: str) -> str | None`
- `save_oauth_token(provider: str, token: str, refresh: str, expires: str)`
- `get_oauth_token(provider: str) -> dict | None`
- Usa httpx.Client internamente (reaproveita de ollama_client)

Testes: `backend/tests/test_network_manager.py` (~8 tests com mock httpx)

#### `backend/jarvis/module_loader.py`
Plugin discovery via importlib.
- `discover(path: str) -> list[ModuleInfo]`
- `load(module_name: str) -> ModuleType`
- `reload(module_name: str)` — importlib.reload

Testes: `backend/tests/test_module_loader.py` (~4 tests)

### Apos Fase 3a-3f

- **Fase 6:** Bridge wiring — injetar todos os managers no `JARVISBridge`, alias `window.jarvis`
- **Fase 7:** Build + E2E
- **Fase 8:** Documentacao
- **Fase 9:** Limpeza `.oldC++/`

## Convencoes do Projeto

- Database: `isolation_level = None`, transacoes explicitas (BEGIN/COMMIT/ROLLBACK)
- Testes: pytest com fixtures, sem dependencia externa (Ollama mockado)
- Bridge: JSON-RPC via `window.pywebview.api` → alias `window.jarvis` na Fase 6
- ID generation: `secrets.token_hex(16)` ou `uuid.uuid4().hex`
- Sem comentarios no codigo
- Tipagem: type hints em todos os metodos publicos

## Comandos uteis

```powershell
# Rodar testes
cd backend && python -m pytest -v

# Rodar app
python backend/jarvis/main.py

# Build completo
.\build_rls.bat

# Frontend sozinho
cd ui && npm run dev
```
