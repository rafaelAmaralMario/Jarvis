# API Completa do Bridge

## Uso no Frontend

```typescript
import { useJarvis, useBridgeEvent } from '../hooks/use-jarvis';

function MyComponent() {
    const jarvis = useJarvis();
    
    useEffect(() => {
        jarvis.kernel.getVersion().then(console.log);
        jarvis.knowledge.searchNotes({ query: 'machine learning' }).then(setResults);
    }, []);
    
    useBridgeEvent('file-changed', (data) => {
        console.log('Arquivo alterado:', data.path);
    });
}
```

## API Completa por Grupo

### kernel/
```
getVersion()           → { version, build, commit }
getBuildInfo()         → { compiler, qtVersion, buildType }
getSystemInfo()        → { os, cpu, memory, uptime }
getUptime()            → { uptimeMs }
```

### module/
```
getModules()           → ModuleInfo[]
loadModule(path)       → { success, moduleId }
unloadModule(id)       → { success }
getModuleInfo(id)      → ModuleInfo
```

### knowledge/
```
searchNotes({ query, limit?, folder? })   → Note[]
createNote({ title, content, folder? })   → Note
getNote(id)                                → Note
updateNote(id, { title?, content? })       → Note
deleteNote(id)                             → { success }
getGraph({ rootId?, depth? })              → GraphData
getBacklinks(id)                           → Backlink[]
getFolders()                               → FolderEntry[]
createFolder({ name, parent? })            → FolderEntry
renameFolder(id, { name })                 → FolderEntry
```

### ai/models/
```
list()                                     → ModelInfo[]
get(id)                                    → ModelDetail
create(data)                               → ModelDetail
update(id, data)                           → ModelDetail
delete(id)                                 → { success }
test(id)                                   → { status, latencyMs }
pull({ name, source? })                    → { success }
```

### ai/agents/
```
list()                                     → Agent[]
get(id)                                    → Agent
create(data)                               → Agent
update(id, data)                           → Agent
delete(id)                                 → { success }
setActive(id)                              → { success }
```

### ai/orchestration/
```
getConfig()                                → OrchestrationConfig
updateConfig(data)                         → OrchestrationConfig
getTraces({ limit? })                      → AgentTrace[]
getActiveAgentId()                         → { agentId }
setActiveAgent(id)                         → { success }
runAgent({ input, agentId })               → { output, traceId }
stopAgent(traceId)                         → { success }
```

### workspace/
```
listProjects()                             → Project[]
getProject(id)                             → Project
createProject(data)                        → Project
updateProject(id, data)                    → Project
deleteProject(id)                          → { success }
getFiles(projectId)                        → FileEntry[]
getFile({ projectId, path })               → FileEntry
createFile({ projectId, path, content })   → FileEntry
deleteFile({ projectId, path })            → { success }
renameFile({ projectId, oldPath, newPath })→ { success }
watchDirectory({ projectId, path })        → { success }
unwatchDirectory({ projectId, path })      → { success }
getFileTree({ projectId, path? })          → FileTreeEntry[]
openFolder(path)                           → Project
```

### editor/
```
openFile({ projectId, path })              → { success }
closeFile({ projectId, path })             → { success }
getOpenFiles()                             → EditorTabInfo[]
setActiveTab(tabId)                        → { success }
modifyFile({ path, content })              → { success }
saveFile(path)                             → { success }
getSettings()                              → EditorSettings
updateSettings(data)                       → EditorSettings
getBreadcrumb(path)                        → BreadcrumbEntry[]
```

### terminal/
```
createTerminal({ id, shell? })             → { success }
write({ id, data })                        → { success }
resize({ id, cols, rows })                 → { success }
kill(id)                                   → { success }
list()                                     → TerminalInfo[]
getOutput(id)                              → { output }
```

### net/
```
httpGet({ url, headers? })                 → { status, body, headers }
httpPost({ url, body, headers? })          → { status, body, headers }
oauthStart({ provider })                   → { url, state }
oauthComplete({ provider, code, state })   → { token, expiresIn }
oauthGetToken(provider)                    → { token?, expiresIn? }
wsConnect({ url, protocols? })             → { connectionId }
wsSend({ connectionId, data })             → { success }
wsClose(connectionId)                      → { success }
getApiKeys()                               → ApiKey[]
saveApiKey(key)                            → { success }
deleteApiKey(id)                           → { success }
```

### git/
```
status()                                   → GitStatusEntry[]
diff({ file? })                            → { diff }
stage({ files, all? })                     → { success }
unstage({ files, all? })                   → { success }
commit({ message, files? })                → { success, commitId }
log({ maxCount? })                         → GitLogEntry[]
branches()                                 → GitBranch[]
createBranch({ name, from? })              → { success }
checkout({ branch, create? })              → { success }
push({ remote?, branch? })                 → { success }
pull({ remote?, branch? })                 → { success }
fetch({ remote? })                         → { success }
stash({ message? })                        → { success }
stashPop()                                 → { success }
merge({ branch })                          → { success }
```

### db/
```
executeRaw({ sql, params? })               → { rows, columns }
getBackupList()                            → BackupEntry[]
createBackup({ name? })                    → { success, path }
restoreBackup(id)                          → { success }
```
