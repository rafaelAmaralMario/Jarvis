# 007 — Bridge WebChannel (C++ ↔ React)

## Metadados
- **Status:** ✅ Concluída
- **Prioridade:** 🔴 Alta
- **Dependências:** 002 (Estrutura C++ Kernel), 003 (UI React Base), 005 (Models & Agents C++), 006 (Models & Agents React)

## Descrição
Implementar os handlers C++ no WebChannel bridge para todos os métodos de Models,
Agents e Orchestration, conectando a UI React ao kernel C++. Atualmente a bridge
em `web_channel.cpp` existe mas sem os handlers específicos de AI registrados.

## Especificação Técnica

### Arquivo Principal
```
kernel/src/bridge/web_channel.cpp ← Adicionar handlers
```

### Handlers a Registrar

| Método | Classe C++ | Descrição |
|--------|-----------|-----------|
| `listModels` | ModelsManager | Lista modelos do Ollama |
| `pullModel` | ModelsManager | Pull modelo com progress |
| `deleteModel` | ModelsManager | Deleta modelo |
| `startModel` | ModelsManager | Inicia modelo |
| `stopModel` | ModelsManager | Para modelo |
| `getModelDetails` | ModelsManager | Detalhes de um modelo |
| `listAgents` | AgentsManager | Lista agents |
| `createAgent` | AgentsManager | Cria agent |
| `updateAgent` | AgentsManager | Atualiza agent |
| `deleteAgent` | AgentsManager | Deleta agent |
| `getDefaultAgent` | AgentsManager | Agent padrão |
| `setDefaultAgent` | AgentsManager | Define agent padrão |
| `getOrchestrationConfig` | OrchestrationManager | Config atual |
| `updateOrchestrationConfig` | OrchestrationManager | Atualiza config |
| `sendMessage` | OrchestrationManager | Query multi-agent |
| `getAgentTraces` | OrchestrationManager | Histórico de traces |

### Formato JSON-RPC
```json
// Request
{"id":"1","method":"listModels","args":[]}
{"id":"2","method":"createAgent","args":[{"name":"AgentX","modelId":"llama3",...}]}
{"id":"3","method":"sendMessage","args":["explique SOLID","agent-id"]}

// Success Response
{"id":"1","result":[...modelos...]}

// Error Response
{"id":"3","error":{"code":-1,"message":"Ollama offline"}}
```

### Fluxo de Dados
```
React (use-jarvis.ts) → window.jarvis.method() → QWebChannel
  → WebChannel C++ (web_channel.cpp)
    → Service Locator getService<IModelsManager>()
    → retorno serializado como JSON → React
```

## Critérios de Aceitação
- [x] `web_channel.cpp` registra 24 handlers (Models, Agents, Orchestration, Módulos, Arquivos)
- [x] Cada método deserializa args do JSON-RPC corretamente
- [x] Respostas seguem formato JSON padronizado
- [x] Erros retornam mensagens descritivas via try/catch
- [x] Handler de pullModel delega para ModelsManager
- [x] Handler de sendMessage delega para OrchestrationManager com fallback single-agent
- [x] Timeout tratado (Ollama offline retorna erro em vez de crash)
- [x] AI managers criados como singletons no ServiceLocator
- [x] Seed data insere 2 agents padrão se tabela vazia

---

## Test Cases

### TC-001: listModels retorna array via bridge
- **Pré-condições:** Kernel compilado e rodando, Ollama online
- **Passos:**
  1. Enviar `{"id":"1","method":"listModels","args":[]}`
  2. Aguardar resposta
- **Resultado esperado:** `{"id":"1","result":[{"id":"llama3",...}, ...]}`
- **Cobertura:** normal

### TC-002: listModels retorna erro quando Ollama offline
- **Pré-condições:** Ollama NÃO rodando
- **Passos:**
  1. Enviar `{"id":"1","method":"listModels","args":[]}`
- **Resultado esperado:** `{"id":"1","error":{"code":-1,"message":"Failed to connect to Ollama"}}`
- **Cobertura:** erro

### TC-003: createAgent com args válidos
- **Pré-condições:** Bridge operacional
- **Passos:**
  1. Enviar `{"id":"1","method":"createAgent","args":[{"name":"Test","modelId":"llama3","systemPrompt":"Ajude o usuário.","temperature":0.7,"maxTokens":2048,"canOrchestrate":true,"priority":5}]}`
- **Resultado esperado:** `{"id":"1","result":{"id":"<uuid>","name":"Test",...}}`
- **Cobertura:** normal

### TC-004: createAgent com args inválidos
- **Pré-condições:** Bridge operacional
- **Passos:**
  1. Enviar `{"id":"1","method":"createAgent","args":[{}]}` (vazio)
  2. Enviar `{"id":"2","method":"createAgent","args":[]}` (sem args)
- **Resultado esperado:** `{"id":"1","error":{"code":-2,"message":"Missing required field: name"}}`
- **Cobertura:** borda | erro

### TC-005: sendMessage streaming
- **Pré-condições:** Bridge operacional, Ollama online
- **Passos:**
  1. Enviar `{"id":"1","method":"sendMessage","args":["Explique SOLID","default-agent-id"]}`
- **Resultado esperado:** Múltiplos eventos `{"id":"1","result":{"type":"chunk","data":"..."}}` seguidos de `{"id":"1","result":{"type":"done","trace":[...]}}`
- **Cobertura:** normal

### TC-006: sendMessage com agent inexistente
- **Pré-condições:** Bridge operacional
- **Passos:**
  1. Enviar `{"id":"1","method":"sendMessage","args":["teste","id-invalido"]}`
- **Resultado esperado:** `{"id":"1","error":{"code":-3,"message":"Agent not found"}}`
- **Cobertura:** erro

### TC-007: Método desconhecido retorna erro
- **Pré-condições:** Bridge operacional
- **Passos:**
  1. Enviar `{"id":"1","method":"metodoInvalido","args":[]}`
- **Resultado esperado:** `{"id":"1","error":{"code":-4,"message":"Unknown method"}}`
- **Cobertura:** erro

### TC-008: JSON malformado retorna erro
- **Pré-condições:** Bridge operacional
- **Passos:**
  1. Enviar string inválida: `{"id":"1" method:"teste"}`
- **Resultado esperado:** Erro de parsing retornado
- **Cobertura:** erro

### TC-009: Todos os 16 métodos respondem
- **Pré-condições:** Bridge operacional, Ollama online
- **Passos:**
  1. Chamar cada um dos 16 métodos
  2. Verificar que cada um retorna no formato esperado
- **Resultado esperado:** 100% dos métodos respondem sem crash
- **Cobertura:** normal

### TC-010: PullModel progress streaming
- **Pré-condições:** Bridge operacional, Ollama online
- **Passos:**
  1. Enviar `{"id":"1","method":"pullModel","args":["tinyllama"]}`
- **Resultado esperado:** Eventos `{"id":"1","result":{"type":"progress","status":"downloading","percent":50}}`
- **Cobertura:** normal

### TC-011: StartModel/StopModel alterna estado
- **Pré-condições:** Bridge operacional, 1 modelo parado
- **Passos:**
  1. `{"method":"startModel","args":["llama3"]}` → running
  2. `{"method":"stopModel","args":["llama3"]}` → stopped
- **Resultado esperado:** Estado alterna corretamente
- **Cobertura:** normal

### TC-012: Bridge não trava em shutdown
- **Pré-condições:** Kernel rodando
- **Passos:**
  1. Iniciar chamada longa (pullModel grande)
  2. Fechar aplicação
- **Resultado esperado:** Shutdown limpo sem crash
- **Cobertura:** borda | erro
