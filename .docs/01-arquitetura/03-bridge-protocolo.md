# Protocolo Bridge C++ ↔ React

## Visão Geral

A comunicação entre React (UI) e C++ (backend) é feita via **Qt WebChannel** com um adaptador JSON-RPC injetado em `QWebEngineScript::DocumentCreation`.

## Arquitetura

```
React (renderer process)
    │ bridge.sendMessage("method", args)
    ▼
Adaptador JS (DocumentCreation)
    │ Empacota como JSON-RPC type-2/3
    ▼
Qt WebChannel (C++/JS bridge nativo)
    │ Serializa/Deserializa
    ▼
BridgeHandler::handleMessage(QString)
    │ Roteia para handler registrado
    ▼
Handler especifico (ex: knowledge::searchNotes)
    │ Executa logica, retorna resultado JSON
    ▼
BridgeHandler → WebChannel → Adaptador JS → Promise resolve
```

## Formato das Mensagens

### Requisição (React → C++)
```json
{
  "method": "knowledge/search_notes",
  "args": { "query": "machine learning", "limit": 10 },
  "id": 1
}
```

### Resposta (C++ → React)
```json
{
  "result": [ { "id": 1, "title": "...", "content": "..." } ],
  "id": 1
}
```

### Evento (C++ → React)
```json
{
  "event": "file-changed",
  "data": { "path": "/home/project/main.cpp" }
}
```

## Handlers Registrados (89 total)

| Grupo | Métodos |
|-------|---------|
| **kernel/** (4) | get_version, get_build_info, get_system_info, get_uptime |
| **module/** (4) | get_modules, load_module, unload_module, get_module_info |
| **knowledge/** (10) | search_notes, create_note, get_note, update_note, delete_note, get_graph, get_backlinks, get_folders, create_folder, rename_folder |
| **ai/models/** (7) | list, get, create, update, delete, test, pull |
| **ai/agents/** (6) | list, get, create, update, delete, set_active |
| **ai/orchestration/** (7) | get_config, update_config, get_traces, get_active_agent_id, set_active_agent, run_agent, stop_agent |
| **workspace/** (14) | list_projects, get_project, create_project, update_project, delete_project, get_files, get_file, create_file, delete_file, rename_file, watch_directory, unwatch_directory, get_file_tree, open_folder |
| **editor/** (9) | open_file, close_file, get_open_files, set_active_tab, modify_file, save_file, get_settings, update_settings, get_breadcrumb |
| **terminal/** (6) | create_terminal, write, resize, kill, list, get_output |
| **net/** (11) | http_get, http_post, oauth_start, oauth_complete, oauth_get_token, ws_connect, ws_send, ws_close, get_api_keys, save_api_key, delete_api_key |
| **git/** (15) | status, diff, stage, unstage, commit, log, branches, create_branch, checkout, push, pull, fetch, stash, stash_pop, merge |
| **db/** (4) | execute_raw, get_backup_list, create_backup, restore_backup |

## Eventos C++ → React

| Evento | Disparado quando |
|--------|-----------------|
| `file-changed` | Arquivo alterado no disco |
| `terminal-output` | Nova saída do terminal |
| `ai-model-status` | Status do modelo mudou |
| `git-operation-complete` | Operação git finalizou |
| `ws-message` | Mensagem WebSocket recebida |
| `backup-complete` | Backup finalizado |

## Adaptador JS (Injetado em DocumentCreation)

O adaptador intercepta `window.qt.webChannelTransport.send()` e `onmessage` para:

1. **Envio (React → C++)**: Empacota `{type: 2, data: {method, args, id}}` antes de chamar o send nativo
2. **Recepção (C++ → React)**: Desempacota mensagens type-3 (respostas) e type-0/1 (eventos), chamando os callbacks corretos

```javascript
// Conceitualmente:
function send(pkt) {
    const wrapped = { type: 2, data: { method: pkt.method, args: pkt.args, id: pkt.id } };
    _origSend.call(transport, wrapped);
}
```
