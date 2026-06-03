# Fluxo de Comunicacao entre Modulos

## Principio

Modulos nao se importam diretamente. Toda comunicacao passa pelo **Service Locator** ou por **Signals/Slots do Qt**.

## Service Locator

O Service Locator e um mapa `string -> void*` no kernel. Cada modulo que oferece um servico o registra durante `init()`. Outros modulos o descobrem pelo nome.

```
Modulo A                Kernel/ServiceLocator         Modulo B
   │                           │                         │
   │ registerService("foo")    │                         │
   │──────────────────────────>│                         │
   │                           │                         │
   │                           │    getService("foo")    │
   │                           │<────────────────────────│
   │                           │──────────void*─────────>│
   │                           │                         │
```

## Signals/Slots (Qt)

Para eventos em tempo real (arquivo mudou, nota criada, mensagem recebida), modulos usam QObject::connect:

```cpp
// Modulo Workspace emite:
emit fileChanged("/path/to/file");

// Modulo IDE escuta:
connect(workspaceService, &WorkspaceService::fileChanged,
        editorService,    &EditorService::onFileChanged);
```

## IPC com Processos Externos

Para modulos que precisam de processos separados (ex: AI Engine com llama.cpp):

- **Pipe stdout/stderr** para output do processo filho
- **WebSocket localhost** para comunicacao bidirecional
- **Arquivos temporarios** para dados grandes

## Fluxo de Dados: Chat do Usuario

```
Usuario digita pergunta
  → QML TextField
  → C++ slot: AIEngineService::sendMessage()
    → Busca notas relevantes no KnowledgeService (RAG)
    → Monta prompt com contexto
    → Envia para LLM (OllamaProvider / OpenAIProvider)
    → Stream de tokens via signal onToken(QString)
  → QML atualiza ChatBubble em tempo real
```
