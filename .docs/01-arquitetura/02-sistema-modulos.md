# Sistema de Modulos

## Arquitetura de Módulos

O JARVIS usa um sistema modular em camadas (L0–L4). Cada módulo é uma `.dll`/`.so` independente que se registra no Service Locator do Kernel.

## Módulos Implementados (10 de 14)

| # | Módulo | Camada | Arquivos | Componentes UI | Status |
|---|--------|--------|----------|----------------|--------|
| 1 | Kernel | L0 | 5 src + main.cpp + 5 headers | — | ✅ |
| 2 | Bridge | L0 | web_channel.cpp/.h | use-jarvis.ts | ✅ |
| 3 | Persistência | L1 | 5 src + 5 headers | — | ✅ |
| 4 | Workspace | L1 | 3 src + 4 headers | WorkspacePanel, FileTree, FileTabs | ✅ |
| 5 | Rede/OAuth | L1 | 1 src + 1 header | ApiKeyManager, OAuthDialog | ✅ |
| 6 | Conhecimento | L2 | 3 src + 4 headers | KnowledgePanel, GraphView, NoteEditor, SearchBar, BacklinkPanel | ✅ |
| 7 | AI Engine | L2 | 4 src + 4 headers | ModelsPanel, AgentsPanel, OrchestrationPanel, AgentCard, AgentFormDialog | ✅ |
| 8 | Editor | L3 | 1 src + 1 header | 9 componentes (Monaco, Tabs, CommandPalette, QuickOpen, Breadcrumb, etc) | ✅ |
| 9 | Terminal | L3 | 1 src + 1 header | TerminalPanel, TerminalInstance | ✅ |
| 10 | Git | L3 | 1 src + 1 header | 5 componentes (GitPanel, GitStatusList, GitCommitBox, GitBranchManager, GitHistoryView) | ✅ |

## Módulos Não Iniciados (4 de 14)

| # | Módulo | Camada | Depende de | Task |
|---|--------|--------|-----------|------|
| 11 | Segurança | L1 | L0 | 023 |
| 12 | Automação | L2 | L0–L2 | 019 |
| 13 | Voz | L2 | L0–L2 | 021 |
| 14 | Plugins | L4 | L0–L3 | 024 |

## SOLID na Implementação

| Princípio | Aplicação |
|-----------|-----------|
| **SRP** | Editor separado em Editor + Git + Terminal |
| **OCP** | Novos módulos = novas DLLs. Kernel nunca muda |
| **LSP** | `IModelProvider` intercambiável (Ollama ↔ OpenAI ↔ Mock) |
| **ISP** | Interfaces segregadas: `IInitializable`, `IActivatable`, `IServiceProvider` |
| **DIP** | `IServiceRegistry::getService<T>()` tipado vs `void*` |
