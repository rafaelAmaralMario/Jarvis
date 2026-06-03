# 005 — Models & Agents C++ AI Kernel

## Metadados
- **Status:** ✅ Concluída
- **Prioridade:** 🔴 Alta
- **Dependências:** 002 (Estrutura C++ Kernel)

## Descrição
Implementar o kernel de IA em C++: gerenciamento de modelos (Ollama), agents CRUD,
e o orquestrador multi-agent. Inclui cliente HTTP para comunicação com Ollama API
e armazenamento SQLite.

## Especificação Técnica

### Interfaces (headers)
```
kernel/include/jarvis/ai/
├── models_manager.h          ← IModelsManager
├── agents_manager.h          ← IAgentsManager
├── orchestration_manager.h   ← IOrchestrationManager
└── ollama_client.h           ← IOllamaClient
```

### Implementações
```
kernel/src/ai/
├── models_manager.cpp         ← CRUD modelos, pull, start/stop, inferSpecialty
├── agents_manager.cpp         ← CRUD agents SQLite, default, orchestration pool
├── orchestration_manager.cpp  ← Multi-agent: orchestrator → specialists → critic
└── ollama_client.cpp          ← HTTP client (QNetworkAccessManager)
```

### SQL Schema
```
kernel/resources/sql/
└── 004-models-agents.sql      ← model_metadata, agents, orchestration_config,
                                  agent_conversations, conversation_messages
```

### Fluxo Multi-Agent
```
Usuário → OrchestrationManager
              ↓
         Router (escolhe specialists baseado na query)
              ↓
    ┌─────────────────┐
    │  Expert Agent 1  │──┐
    │  Expert Agent 2  │──┤→ Consolidator
    │  Expert Agent 3  │──┘
    └─────────────────┘
              ↓
         Critic Agent (revisa, aprova/rejeita)
              ↓
         Resposta final
```

## Critérios de Aceitação
- [x] ModelsManager: list, pull, delete, start/stop modelo, inferir especialidade
- [x] AgentsManager: CRUD completo, setDefaultAgent, orchestration pool
- [x] OrchestrationManager: query multi-agent, trace, config, consolidate
- [x] OllamaClient: GET/POST/DELETE, streaming via QHttpMultiPart
- [x] SQLite schema com seed data (2 agents padrão)
- [x] Integração via CMake adicionando 4 novos .cpp

---

## Test Cases

### TC-001: ModelsManager lista modelos do Ollama
- **Pré-condições:** Ollama rodando em localhost:11434, modelo llama3 puxado
- **Passos:**
  1. `auto models = modelsManager.listModels()`
  2. Verificar que models contém "llama3"
  3. Verificar metadata (size, modified_at, digest)
- **Resultado esperado:** Lista de modelos com metadados
- **Cobertura:** normal

### TC-002: ModelsManager lista vazio quando Ollama offline
- **Pré-condições:** Ollama NÃO rodando
- **Passos:**
  1. `auto models = modelsManager.listModels()`
- **Resultado esperado:** Lista vazia ou erro tratado
- **Cobertura:** erro

### TC-003: ModelsManager puxa modelo
- **Pré-condições:** Ollama rodando, modelo tinyllama não existe
- **Passos:**
  1. `modelsManager.pullModel("tinyllama", callback)`
  2. Aguardar progress (0-100%)
  3. `modelsManager.listModels()` contém "tinyllama"
- **Resultado esperado:** Modelo baixado com sucesso
- **Cobertura:** normal

### TC-004: ModelsManager deleta modelo
- **Pré-condições:** Ollama rodando, modelo tinyllama existe
- **Passos:**
  1. `modelsManager.deleteModel("tinyllama")`
  2. `modelsManager.listModels()` NÃO contém "tinyllama"
- **Resultado esperado:** Modelo removido
- **Cobertura:** normal

### TC-005: ModelsManager deleta modelo inexistente
- **Pré-condições:** Ollama rodando
- **Passos:**
  1. `modelsManager.deleteModel("modelo_inexistente")`
- **Resultado esperado:** Erro ou false (não crash)
- **Cobertura:** erro

### TC-006: inferSpecialty categoriza corretamente
- **Pré-condições:** ModelsManager inicializado
- **Passos:**
  1. `auto spec = modelsManager.inferSpecialty("codellama:7b")` → Code
  2. `auto spec = modelsManager.inferSpecialty("mixtral:8x7b")` → Reasoning
  3. `auto spec = modelsManager.inferSpecialty("llava:7b")` → Vision
  4. `auto spec = modelsManager.inferSpecialty("nomic-embed-text")` → Embedding
  5. `auto spec = modelsManager.inferSpecialty("llama3")` → Chat
- **Resultado esperado:** Especialidade correta por padrão de nome
- **Cobertura:** normal | borda (nome desconhecido → Chat)

### TC-007: AgentsManager CRUD completo
- **Pré-condições:** AgentsManager initDB chamado (SQLite)
- **Passos:**
  1. Criar agent: `agentsManager.createAgent({name:"Test", model:"llama3", ...})`
  2. Listar: `agentsManager.listAgents()` contém o novo
  3. Get: `agentsManager.getAgent(id)` retorna dados
  4. Update: `agentsManager.updateAgent({name:"Test2", ...})`
  5. Delete: `agentsManager.deleteAgent(id)`
  6. Listar: não contém mais
- **Resultado esperado:** CRUD funcional, persistência SQLite
- **Cobertura:** normal

### TC-008: AgentsManager setDefaultAgent
- **Pré-condições:** 3 agents no banco
- **Passos:**
  1. `agentsManager.setDefaultAgent(id_1)` → true
  2. `agentsManager.getDefaultAgent().id == id_1`
  3. `agentsManager.setDefaultAgent(id_2)` → true
  4. `agentsManager.getDefaultAgent().id == id_2`
- **Resultado esperado:** Default agent trocado corretamente
- **Cobertura:** normal

### TC-009: AgentsManager delete default agent fallback
- **Pré-condições:** 2 agents, agent_1 é default
- **Passos:**
  1. `agentsManager.deleteAgent(agent_1.id)`
  2. `agentsManager.getDefaultAgent().id == agent_2.id`
- **Resultado esperado:** Fallback para próximo agent disponível
- **Cobertura:** borda

### TC-010: OrchestrationManager query multi-agent
- **Pré-condições:** 2 agents no pool de orquestração, Ollama rodando
- **Passos:**
  1. `auto result = orchestrationManager.query("explique SOLID", config)`
  2. Verificar que result.trace contém agents consultados
  3. Verificar que result.response não é vazio
- **Resultado esperado:** Multi-agent query com trace
- **Cobertura:** normal

### TC-011: OrchestrationManager com orquestração desligada
- **Pré-condições:** Orchestration config com enabled=false
- **Passos:**
  1. `auto result = orchestrationManager.query("explique SOLID", config)`
  2. Verificar que result.trace tem apenas 1 entry (default agent)
- **Resultado esperado:** Query direta sem multi-agent
- **Cobertura:** normal | borda

### TC-012: OllamaClient streaming callback
- **Pré-condições:** Ollama rodando
- **Passos:**
  1. `ollamaClient.generate("llama3", "Olá!", callback)`
  2. Callback é chamado múltiplas vezes com chunks
  3. Callback final com done=true
- **Resultado esperado:** Streaming funciona, chunks chegam em ordem
- **Cobertura:** normal

### TC-013: OllamaClient timeout
- **Pré-condições:** Ollama rodando
- **Passos:**
  1. `ollamaClient.setTimeout(1)` (1ms)
  2. `ollamaClient.generate("llama3", "texto longo", callback)`
- **Resultado esperado:** Timeout dispara, callback de erro
- **Cobertura:** borda | erro

### TC-014: Seed data carregado
- **Pré-condições:** SQLite vazio, 004-models-agents.sql executado
- **Passos:**
  1. `agentsManager.listAgents()` → 2 agents
  2. Verificar "Assistant Geral" existe
  3. Verificar "Code Expert" existe
- **Resultado esperado:** Seed data presente
- **Cobertura:** normal
