# JARVIS — AI Assistant with Integrated IDE

JARVIS is an AI-powered desktop assistant with a fully integrated IDE (editor, terminal, git), knowledge management system (Obsidian-like notes with graph), and multi-agent orchestration.

**Stack:** Python 3.14 + pywebview 5 (WebView2) + React 19 + TypeScript + Vite

## Quick Start

```powershell
# Install Python backend
cd backend && pip install -e .

# Build React frontend
cd ui && npm install && npm run build

# Run
python backend/jarvis/main.py

# Dev mode (Vite hot reload)
cd ui && npm run dev    # Terminal 1
python backend/jarvis/main.py --dev   # Terminal 2
```

## Project Structure

```
├── backend/          # Python backend (pywebview)
│   ├── jarvis/       # Core modules (bridge, managers, db)
│   │   ├── main.py, bridge.py, database.py
│   │   ├── managers: knowledge, models, agents, orchestration
│   │   ├── workspace, editor, terminal, git, network
│   │   └── migration_runner, module_loader, graph_builder
│   ├── tests/        # pytest tests (260+)
│   └── pyproject.toml
├── ui/               # React frontend (Vite + TypeScript)
│   ├── src/          # Components, hooks, pages
│   ├── index.html
│   └── package.json
├── .docs/            # Live documentation (Python stack)
├── .context/         # Project context registry (16 entries)
├── .old/             # Legacy C++ artifacts (preserved)
└── build_rls.bat     # Full build script (npm + pip)
```

## Modules

| Module | File | Tests | Status |
|--------|------|-------|--------|
| **Bridge** | `bridge.py` | E2E | ✅ 65+ `window.jarvis.*` methods |
| **Database** | `database.py` | 15 | ✅ SQLite WAL, thread-safe |
| **Migration Runner** | `migration_runner.py` | 11 | ✅ 8 migrations |
| **Knowledge** | `knowledge_manager.py` | 40 | ✅ Notes, FTS5, wikilinks, graph |
| **Graph Builder** | `graph_builder.py` | 11 | ✅ Graph viz data |
| **Ollama Client** | `ollama_client.py` | 11 | ✅ HTTP/2 client |
| **Models Manager** | `models_manager.py` | 18 | ✅ CRUD + specialties |
| **Agents Manager** | `agents_manager.py` | 18 | ✅ CRUD + defaults |
| **Orchestration** | `orchestration_manager.py` | 15 | ✅ Multi-agent + critic |
| **Workspace** | `workspace_manager.py` | 28 | ✅ File I/O, watcher |
| **Editor** | `editor_manager.py` | 12 | ✅ Monaco state |
| **Terminal** | `terminal_manager.py` | 11 | ✅ PTY subprocess |
| **Git** | `git_manager.py` | 18 | ✅ CLI subprocess |
| **Network** | `network_manager.py` | 15 | ✅ HTTP, OAuth, API keys |
| **Module Loader** | `module_loader.py` | 9 | ✅ Python plugin discovery |
| **Integration** | `test_integration.py` | 15 | ✅ E2E bridge tests |

## Tests

```powershell
cd backend && python -m pytest    # 260+ tests
cd ui && npm test                 # 145 Vitest tests
```

## Next Steps

1. **Plugin Ecosystem** — Activate `ModuleLoader` to load Python plugins from `modules/`
2. **Multi-Provider LLM Gateway** — Add OpenAI, Anthropic, AWS Bedrock providers
3. **Knowledge Graph Visualization** — Interactive graph viewer
4. **MCP Server Integration** — Model Context Protocol support
5. **Workflow Automation** — Step-based engine (run command, API call, wait)
6. **Security** — Permission center UI, audit log, secret storage
7. **Voice** — STT/TTS integration
8. **Installer** — NSIS/PyInstaller for distribution
9. **Multi-User Sync** — Collaboration server
10. **Mobile Companion** — Companion app

## Documentation

- `.docs/` — Architecture, stack, API reference (Python stack)
- `.docs/02-tecnologia/04-convencoes-cpp.md` — Historical C++ conventions
- `.context/` — Design decisions and session state
