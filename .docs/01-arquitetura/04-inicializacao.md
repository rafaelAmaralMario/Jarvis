# Fluxo de Inicializacao

## Sequência de Inicialização

```
1. main() inicia
   │
2. QApplication app(argc, argv)
   │
3. QWebEngine::initialize()
   │
4. ServiceLocator::instance() ← singleton
   │
5. DatabaseFactory::createDatabase() ← SQLite WAL mode
   │
6. MigrationRunner::runPending() ← 8 migrations
   │   core_001 → permissions → extensions → models_agents
   │   → knowledge → workspace → editor → api_keys
   │
7. Managers são instanciados (todos que dependem de db):
   │   ModelsManager, AgentsManager, OrchestrationManager
   │   KnowledgeManager, WorkspaceManager, EditorManager
   │   TerminalManager, NetworkManager, GitManager
   │
8. Bridge é configurada:
   │   BridgeHandler registra 89 handlers
   │   WebEngineBridge conecta QWebChannel ao QWebEngineView
   │   Script adaptador injetado em DocumentCreation
   │
9. QWebEngineView carrega webui/index.html
   │
10. React inicia (Vite bundle) no WebEngine:
    │   main.tsx → App.tsx
    │   useJarvis() hook conecta ao QWebChannel
    │   useBridgeEvent() registra listeners
    │
11. ActivityBar renderiza 7 icones:
    │   Assistente | Conhecimento | Workspace | Editor | Git | Config | Terminal
    │
12. App aguarda interação do usuário
```

## Tempo de Inicialização

| Etapa | Estimativa |
|-------|-----------|
| QApplication + WebEngine | ~2s |
| SQLite + Migrations | ~100ms |
| Managers init | ~50ms |
| Bridge setup | ~10ms |
| WebEngine carregar React | ~1-3s |
| **Total** | **~3-5s** |

## Dependências de Inicialização

```
Database ─┬─ ModelsManager ─── OrchestrationManager
           ├─ AgentsManager ──┘
           ├─ KnowledgeManager
           ├─ WorkspaceManager
           ├─ EditorManager
           ├─ NetworkManager
           └─ GitManager

Bridge ──── QWebEngineView ─── React
```
