# Fluxo de Inicializacao

## Sequencia de Inicializacao

```
1. python backend/jarvis/main.py
   │
2. ArgumentParser: --dev (porta Vite dev) ou padrao (build)
   │
3. DatabaseFactory: sqlite3.connect(APPDATA/JARVIS/jarvis-ai.db)
   │   WAL mode ativado, RLock criado
   │
4. MigrationRunner.run_all()
   │   8 migrations executadas em ordem
   │   core_001 → permissions → extensions → models_agents
   │   → knowledge → workspace → editor → api_keys
   │
5. Managers instanciados (injecao de dependencias):
   │   ModuleLoader(db)
   │   WorkspaceManager, NetworkManager, KnowledgeManager
   │   GraphBuilder(KnowledgeManager)
   │   OllamaClient, ModelsManager(OllamaClient, db)
   │   AgentsManager(db), OrchestrationManager(db, ModelsManager, OllamaClient, AgentsManager)
   │   EditorManager(db), GitManager, TerminalManager
   │
6. JARVISBridge instanciado com todos os managers:
   │   bridge = JARVISBridge(module_loader, ..., terminal_manager)
   │   65+ metodos expostos via js_api
   │
7. pywebview.start():
   │   Janela criada (WebView2)
   │   js_api registrado automaticamente
   │   URL carregada (build/index.html ou dev server)
   │
8. React inicia no WebView2:
   │   main.tsx → App.tsx
   │   use-jarvis hook: window.pywebview.api.*
   │   Todos os 6 paineis carregam (ou mostram placeholder)
   │
9. App aguarda interacao do usuario
```

## Tempo de Inicializacao

| Etapa | Estimativa |
|-------|-----------|
| Python startup | ~500ms |
| SQLite + Migrations | ~100ms |
| Managers init | ~50ms |
| WebView2 + React load | ~1-3s |
| **Total** | **~2-4s** |

## Dependencias de Inicializacao

```
Database ─┬─ ModuleLoader
           ├─ WorkspaceManager
           ├─ KnowledgeManager ── GraphBuilder
           ├─ EditorManager
           ├─ NetworkManager
           ├─ GitManager
           └─ TerminalManager

OllamaClient ─┬─ ModelsManager ─┬─ AgentsManager
               │                  └─ OrchestrationManager
               └─────────────────────┘

Bridge ─── receives all managers ─── React (js_api)
```
