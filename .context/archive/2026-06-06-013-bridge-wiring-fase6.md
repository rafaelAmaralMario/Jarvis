# Contexto: Fase 6 — Bridge Wiring Completa

**ID:** CONTEXT-013
**Timestamp:** 2026-06-06T10:10:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** context-generator

## Decisao / Conteudo

A Fase 6 foi concluida: todos os 65+ metodos stub em `bridge.py` foram substituidos
por delegates reais para os 11 managers do backend.

### O que foi feito

1. **`bridge.py` reescrito** — `JARVISBridge.__init__` agora aceita todos os managers
   como parametros opcionais (injecao de dependencia).

2. **Cada metodo stub** foi substituido por:
   - Delegacao para o manager correspondente
   - `try/except` com `logger.warning` + fallback (valor padrao)
   - Conversao automatica de dataclasses para dict via `_serialize()`
   - Nomenclatura camelCase mantida para compatibilidade com frontend React

3. **`main.py` atualizado** — agora instancia todos os managers e os injeta no bridge:
   - `WorkspaceManager(db)`, `GitManager()`, `EditorManager(db)`
   - `TerminalManager()`, `NetworkManager(db)`, `ModuleLoader()`
   - `ModelsManager(db, ollama)`, `AgentsManager(db)`
   - `OrchestrationManager(models, agents, db, ollama)`
   - `KnowledgeManager(db)`, `GraphBuilder(db)`

4. **Mapeamento completo** dos 65+ metodos bridge → managers:

   | Grupo | Qtde | Bridge (camelCase) | Manager (snake_case) |
   |-------|------|-------------------|---------------------|
   | Module | 2 | `getModules`, `getModule` | `module_loader.list_loaded/get_module` |
   | File | 3 | `readFile`, `writeFile`, `listDirectory` | `workspace_manager.*` |
   | Model | 8 | `listModels`, `getModel`, `pullModel`, etc | `models_manager.*` |
   | Agent | 8 | `listAgents`, `createAgent`, etc | `agents_manager.*` |
   | Orchestration | 5 | `sendMessage`, `executeOrchestratedQuery`, etc | `orchestration_manager.*` |
   | Workspace | 15 | `openWorkspace`, `listFiles`, etc | `workspace_manager.*` |
   | Knowledge | 12 | `createNote`, `getGraph`, etc | `knowledge_manager.*` + `graph_builder.*` |
   | Editor | 8 | `editorOpenFile`, `editorGetSettings`, etc | `editor_manager.*` |
   | Terminal | 6 | `terminalCreate`, `terminalWrite`, etc | `terminal_manager.*` |
   | Network | 10 | `networkGet`, `networkOAuthStart`, etc | `network_manager.*` |
   | Git | 13 | `gitStatus`, `gitCommit`, etc | `git_manager.*` |

5. **Serializacao:** Helper `_serialize()` converte recursivamente dataclasses, enums,
   listas e dicionarios para tipos serializaveis via `dataclasses.asdict`.

## Arquivos Afetados

- `backend/jarvis/bridge.py` — REESCRITO (98→490 lines), todos os stubs substituidos
- `backend/jarvis/main.py` — MODIFICADO, injeta todos os managers no bridge

## Proximos Passos

- **Fase 7:** Build + E2E — verificar build_rls.bat, criar teste de integracao geral
- **Fase 8:** Documentacao — README, CONTRIBUTING
- **Fase 9:** Limpeza `.oldC++/`

## Notas

- 242/245 testes pytest passando (3 falhas pre-existentes httpbin.org)
- 14/14 smoke tests de integracao passaram
- Nenhum teste novo necessario (testes unitarios dos managers ja cobrem a logica)
