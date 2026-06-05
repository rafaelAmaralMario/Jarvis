# AI Engine — Modelos, Agentes e Orquestração

## O que faz
Gerencia modelos de IA (Ollama), agentes configuráveis e orquestração de execução.

## Arquivos
```
kernel/src/ai/models_manager.cpp        — CRUD de modelos
kernel/src/ai/agents_manager.cpp        — CRUD de agentes
kernel/src/ai/orchestration_manager.cpp — Execução e orquestração
kernel/src/ai/ollama_client.cpp         — Cliente HTTP para Ollama API

ui/src/components/Settings/ModelsPanel.tsx
ui/src/components/Settings/ModelCard.tsx
ui/src/components/Settings/AgentsPanel.tsx
ui/src/components/Settings/AgentCard.tsx
ui/src/components/Settings/AgentFormDialog.tsx
ui/src/components/Settings/OrchestrationPanel.tsx
```

## Funcionalidades

### Modelos
- Listar modelos disponíveis (Ollama local)
- Testar conectividade (latência)
- Criar/editar entradas de modelo
- Remover modelos
- Pull de modelos do Ollama Hub

### Agentes
- Criar agente com nome, modelo, system prompt, temperatura
- Editar parâmetros do agente
- Ativar/desativar agente
- Listar agentes disponíveis
- Remover agentes

### Orquestração
- Estratégia: sequencial ou paralela
- Limite de iterações configurável
- Timeout por execução
- Traces de execução (histórico)
- Execução manual de agente com input

## Integração com Frontend
- `ModelsPanel` — grid de cards de modelos
- `AgentsPanel` — lista de agentes com drag para reordenar
- `AgentFormDialog` — formulário de criação/edição
- `OrchestrationPanel` — configuração de orquestração

## Dependências
- Banco de dados (tabelas: models, agents, orchestration_config, agent_traces)
- Rede (OllamaClient faz HTTP para localhost:11434)
