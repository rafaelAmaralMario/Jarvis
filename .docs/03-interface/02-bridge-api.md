# API Completa do Bridge

O bridge expõe todos os métodos como `window.jarvis.<metodo>()` via pywebview.

## Uso no Frontend

```typescript
import { useJarvis } from '../hooks/use-jarvis';

function MyComponent() {
    const jarvis = useJarvis();

    useEffect(() => {
        jarvis.listNotes().then(setNotes);
        jarvis.listModels().then(setModels);
    }, []);
}
```

## API Completa (65+ métodos, flat namespace)

### Module
```
getModules()           → ModuleInfo[]
getModule(id)          → ModuleInfo | null
```

### File (legacy — delegado ao Workspace)
```
readFile(path)                        → string
writeFile(path, content)              → bool
listDirectory()                        → FileEntry[]
```

### Model
```
listModels()                          → ModelInfo[]
getModel(name)                        → ModelInfo | null
pullModel(name)                       → bool
deleteModel(name)                     → bool
startModel(name)                      → bool
stopModel(name)                       → bool
updateModelMetadata(name, metadata)   → bool
getModelBySpecialty(specialty)        → ModelInfo | null
```

### Agent
```
listAgents()                          → Agent[]
getAgent(id)                          → Agent | null
createAgent(data)                     → Agent
updateAgent(id, data)                 → Agent
deleteAgent(id)                       → bool
setDefaultAgent(id)                   → bool
getDefaultAgent()                     → Agent | null
getOrchestrationPool()                → Agent[]
```

### Orchestration
```
getOrchestrationConfig()              → OrchestrationConfig
updateOrchestrationConfig(config)     → bool
sendMessage(query)                    → string
executeOrchestratedQuery(query)       → string
getAgentTrace(queryId)                → AgentTrace | null
```

### Workspace
```
openWorkspace(path)                   → bool
addRoot(path)                         → bool
removeRoot(path)                      → bool
getRoots()                            → string[]
listFiles(path?)                      → FileEntry[]
createFile(name, parentDir)           → bool
createFileWithPath(fullPath)          → bool
createDirectory(name, parentDir)      → bool
deletePath(path)                      → bool
renamePath(oldPath, newPath)          → bool
movePath(src, dest)                   → bool
getRecentFiles(limit?)                → RecentFile[]
getProjectInfo(path)                  → ProjectInfo | null
cancelGeneration()                    → bool
```

### Knowledge
```
createNote(data)                      → Note
getNote(id)                           → Note | null
listNotes(folder?)                    → Note[]
updateNote(id, data)                  → Note
deleteNote(id)                        → bool
searchNotes(query)                    → SearchResult[]
getBacklinks(noteId)                  → Backlink[]
getGraph()                            → { nodes, edges }
getFolders()                          → FolderEntry[]
moveNote(id, targetFolder)            → bool
importNote(filePath)                  → Note | null
exportNote(noteId, outputPath)        → bool
```

### Editor
```
editorOpenFile(path)                  → FileBuffer | null
editorSaveFile(path, content)         → bool
editorCloseFile(path)                 → bool
editorGetOpenFiles()                  → FileBuffer[]
editorDetectLanguage(path)            → string
editorSearchFiles(query)              → { path, language }[]
editorGetSettings()                   → dict
editorUpdateSettings(key, value)      → bool
```

### Terminal
```
terminalCreate()                      → string (id)
terminalWrite(id, data)               → bool
terminalResize(id, cols, rows)        → bool
terminalClose(id)                     → bool
terminalList()                        → string[]
terminalCloseAll()                    → bool
```

### Network
```
networkGet(url, headers?)             → { statusCode, body, headers }
networkPost(url, body, contentType?, headers?) → { statusCode, body, headers }
networkOAuthStart(provider)           → string (URL)
networkOAuthComplete(provider, code)  → string (token)
networkGetStoredToken(provider)       → string
networkClearToken(provider)           → bool
networkStoreApiKey(service, key)      → bool
networkGetApiKey(service)             → string
networkDeleteApiKey(service)          → bool
networkListApiKeys()                  → { service, key }[]
```

### Git
```
gitStatus(repoPath)                   → GitStatus[]
gitDiff(repoPath, filePath?)          → string
gitDiffGutter(repoPath, filePath)     → GitGutterLine[]
gitStage(repoPath, filePath)          → bool
gitUnstage(repoPath, filePath)        → bool
gitStageAll(repoPath)                 → bool
gitCommit(repoPath, message)          → bool
gitBranches(repoPath)                 → GitBranch[]
gitCheckout(repoPath, branch)         → bool
gitCreateBranch(repoPath, branch)     → bool
gitDeleteBranch(repoPath, branch)     → bool
gitPush(repoPath, remote?, branch?)   → bool
gitPull(repoPath, remote?, branch?)   → bool
gitLog(repoPath, count?)              → GitLogEntry[]
gitIsRepo(repoPath)                   → bool
gitCurrentBranch(repoPath)            → string
gitSetCredentials(repoPath, user, token) → bool
```

## Eventos (Bridge → React)

Eventos são disparados via pywebview `window.pywebview.api` callbacks:
- `terminal-output(terminalId, data)` — output do terminal
- `terminal-exit(terminalId, exitCode)` — terminal fechou
- `file-changed({ type, path })` — arquivo criado/deletado no watcher
