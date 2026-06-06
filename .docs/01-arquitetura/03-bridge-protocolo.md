# Protocolo Bridge Python ↔ React

## Visao Geral

A comunicacao entre React (UI) e Python (backend) e feita via **pywebview js_api** — um mecanismo nativo do WebView2 que serializa/deserializa JSON automaticamente.

## Arquitetura

```
React (renderer process)
    │ window.pywebview.api.jarvisMethod(args)
    ▼
pywebview (WebView2 IPC bridge)
    │ Serializa args como JSON, envia via IPC nativo
    ▼
JARVISBridge.metodo_correspondente(args)
    │ Executa logica, retorna dict/list
    ▼
pywebview serializa resultado como JSON
    ▼
Promise<result> resolve no React
```

### Fluxo Detalhado

```
React Component
    │ onSearch("machine learning")
    ▼
use-jarvis hook: window.pywebview.api.jarvisSearchNotes("machine learning", 10)
    │ pywebview 5.x serializa args → JSON IPC
    ▼
bridge.py: search_notes(self, query, limit) → self.knowledge.search_notes(query, limit)
    │ Executa SQL FTS5, retorna list[dict]
    ▼
pywebview serializa resultado → JSON → IPC
    │ Promise<Note[]> resolve
    ▼
React atualiza estado → renderiza SearchResults
```

## Formato das Mensagens

pywebview gerencia a serializacao automaticamente. Nao ha formato manual — chamadas sao funcoes assincronas diretas:

### Requisicao (React → Python)
```typescript
// React
const results = await window.pywebview.api.jarvisSearchNotes("machine learning", 10);
```

### Resposta (Python → React)
```python
# Python
def search_notes(self, query: str, limit: int) -> list[dict]: ...
```

### Evento (Python → React)
```python
# Python envia evento via pywebview
self._window.evaluate_js(f"window.onTerminalOutput('{terminal_id}', '{escaped_data}')")
```

## Metodos Expostos: 65+

| Grupo | Metodos |
|-------|---------|
| **Module (2)** | `getModules`, `getModule` |
| **File (3)** | `readFile`, `writeFile`, `listDirectory` |
| **Model (8)** | `listModels`, `getModel`, `pullModel`, `deleteModel`, `startModel`, `stopModel`, `updateModelMetadata`, `getModelBySpecialty` |
| **Agent (8)** | `listAgents`, `getAgent`, `createAgent`, `updateAgent`, `deleteAgent`, `setDefaultAgent`, `getDefaultAgent`, `getOrchestrationPool` |
| **Orchestration (5)** | `getOrchestrationConfig`, `updateOrchestrationConfig`, `sendMessage`, `executeOrchestratedQuery`, `getAgentTrace` |
| **Workspace (15)** | `openWorkspace`, `addRoot`, `removeRoot`, `getRoots`, `listFiles`, `createFile`, `createFileWithPath`, `createDirectory`, `deletePath`, `renamePath`, `movePath`, `getRecentFiles`, `getProjectInfo`, `cancelGeneration` |
| **Knowledge (12)** | `createNote`, `getNote`, `listNotes`, `updateNote`, `deleteNote`, `searchNotes`, `getBacklinks`, `getGraph`, `getFolders`, `moveNote`, `importNote`, `exportNote` |
| **Editor (8)** | `editorOpenFile`, `editorSaveFile`, `editorCloseFile`, `editorGetOpenFiles`, `editorDetectLanguage`, `editorSearchFiles`, `editorGetSettings`, `editorUpdateSettings` |
| **Terminal (6)** | `terminalCreate`, `terminalWrite`, `terminalResize`, `terminalClose`, `terminalList`, `terminalCloseAll` |
| **Network (10)** | `networkGet`, `networkPost`, `networkOAuthStart`, `networkOAuthComplete`, `networkGetStoredToken`, `networkClearToken`, `networkStoreApiKey`, `networkGetApiKey`, `networkDeleteApiKey`, `networkListApiKeys` |
| **Git (17)** | `gitStatus`, `gitDiff`, `gitDiffGutter`, `gitStage`, `gitUnstage`, `gitStageAll`, `gitCommit`, `gitBranches`, `gitCheckout`, `gitCreateBranch`, `gitDeleteBranch`, `gitPush`, `gitPull`, `gitLog`, `gitIsRepo`, `gitCurrentBranch`, `gitSetCredentials` |

## Eventos Python → React

| Evento | Disparado quando | Implementacao |
|--------|-----------------|---------------|
| `terminal-output` | Nova saida do terminal | `window.onTerminalOutput(id, data)` |
| `terminal-exit` | Terminal fechou | `window.onTerminalExit(id, code)` |
| `file-changed` | Arquivo criado/deletado no disco | `window.onFileChanged(type, path)` |

## Diferencas do Protocolo C++ Anterior

| Aspecto | Qt WebChannel (C++) | pywebview (Python) |
|---------|--------------------|--------------------|
| Serializacao | JSON-RPC manual | Automatica (pywebview) |
| Roteamento | BridgeHandler com registro | Reflexao Python (`getattr`) |
| Assincrono | Callbacks via Signal/Slot | await/async nativo |
| Eventos (C++→React) | Qt Signals | `evaluate_js()` |
| Numero de metodos | 89 | 65+ (consolidados) |
