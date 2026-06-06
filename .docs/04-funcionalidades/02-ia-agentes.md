# AI Engine — Modelos, Agentes e Orquestracao

## O que faz
Gerencia modelos de IA (Ollama), agentes configurativeis e orquestracao de execucao.

## Arquivos
```
backend/jarvis/ollama_client.py          — Cliente HTTP para Ollama API
backend/jarvis/models_manager.py         — CRUD de modelos
backend/jarvis/agents_manager.py         — CRUD de agentes
backend/jarvis/orchestration_manager.py  — Execucao e orquestracao multi-agente

ui/src/components/Settings/ModelsPanel.tsx
ui/src/components/Settings/ModelCard.tsx
ui/src/components/Settings/AgentsPanel.tsx
ui/src/components/Settings/AgentCard.tsx
ui/src/components/Settings/AgentFormDialog.tsx
ui/src/components/Settings/OrchestrationPanel.tsx
```

## Funcionalidades

### Modelos
- Listar modelos disponiveis (Ollama local)
- Testar conectividade (latencia)
- Criar/editar entradas de modelo
- Remover modelos
- Pull de modelos do Ollama Hub
- Modelos com especialidade (code, chat, vision, default)

### Agentes
- Criar/editar/deletar agentes
- Prompt do sistema configuravel
- Modelo associado (cada agente pode usar modelo diferente)
- Temperatura e parametros ajustaveis
- Agente padrao
- Pool de orquestracao (selecao de agentes)

### Orquestracao
- Estrategias: sequencial, paralelo
- Maximo de iteracoes
- Timeout configuravel
- Modo Critic (revisao de respostas entre agentes/ferramentas)
- Traces de execucao (log detalhado)

### Bridge API
- 8 metodos de agente: `listAgents`, `getAgent`, `createAgent`, `updateAgent`, `deleteAgent`, `setDefaultAgent`, `getDefaultAgent`, `getOrchestrationPool`
- 8 metodos de modelo: `listModels`, `getModel`, `pullModel`, `deleteModel`, `startModel`, `stopModel`, `updateModelMetadata`, `getModelBySpecialty`
- 5 metodos de orquestracao: `getOrchestrationConfig`, `updateOrchestrationConfig`, `sendMessage`, `executeOrchestratedQuery`, `getAgentTrace`
