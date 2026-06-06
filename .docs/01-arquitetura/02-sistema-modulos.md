# Sistema de Modulos

## Arquitetura de Modulos

O JARVIS usa um sistema modular em camadas (L0–L4). Cada modulo e um pacote Python em `backend/jarvis/` que e instanciado por injecao de dependencias em `main.py`.

## Modulos Implementados (14 de 14)

| # | Modulo | Camada | Arquivo Python | Componentes UI | Status |
|---|--------|--------|----------------|----------------|--------|
| 1 | Bridge | L0 | `bridge.py` | `use-jarvis.ts` | ✅ |
| 2 | Database | L1 | `database.py` | — | ✅ |
| 3 | Workspace | L1 | `workspace_manager.py` | WorkspacePanel, FileTree, FileTabs | ✅ |
| 4 | Network/OAuth | L1 | `network_manager.py` | ApiKeyManager, OAuthDialog | ✅ |
| 5 | Knowledge | L2 | `knowledge_manager.py`, `graph_builder.py` | KnowledgePanel, GraphView, NoteEditor, SearchBar, BacklinkPanel | ✅ |
| 6 | AI Engine | L2 | `models_manager.py`, `agents_manager.py`, `orchestration_manager.py`, `ollama_client.py` | ModelsPanel, AgentsPanel, OrchestrationPanel | ✅ |
| 7 | Editor | L3 | `editor_manager.py` | 9 componentes (Monaco, Tabs, CommandPalette, QuickOpen, Breadcrumb, etc) | ✅ |
| 8 | Terminal | L3 | `terminal_manager.py` | TerminalPanel, TerminalInstance | ✅ |
| 9 | Git | L3 | `git_manager.py` | 5 componentes (GitPanel, GitStatusList, GitCommitBox, GitBranchManager, GitHistoryView) | ✅ |
| 10 | Module Loader | L4 | `module_loader.py` | — | ✅ |
| 11 | Migration Runner | L0 | `migration_runner.py` | — | ✅ |
| 12 | Orchestration | L2 | `orchestration_manager.py` | OrchestrationPanel | ✅ |
| 13 | Graph Builder | L2 | `graph_builder.py` | GraphView | ✅ |
| 14 | Permissions | L1 | (embutido no bridge) | Settings | ✅ |

## SOLID na Implementacao

| Principio | Aplicacao |
|-----------|-----------|
| **SRP** | Cada manager tem uma unica responsabilidade |
| **OCP** | Novos modulos = novas classes. Bridge nunca muda |
| **LSP** | `OllamaClient` intercambiavel (Ollama ↔ OpenAI ↔ Mock via httpx) |
| **ISP** | Interfaces segregadas via type hints e Protocols |
| **DIP** | Managers recebem dependencias no construtor (injecao explicita) |
