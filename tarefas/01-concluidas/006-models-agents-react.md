# 006 — Models & Agents React UI

## Metadados
- **Status:** ✅ Concluída
- **Prioridade:** 🔴 Alta
- **Dependências:** 003 (UI React Base), 005 (Models & Agents C++)

## Descrição
Implementar a interface React para gerenciamento de modelos, agents e orquestração
multi-agent. Inclui SettingsPage com sidebar, painéis de modelos/agents/orquestração,
e integração com os hooks da bridge.

## Especificação Técnica

### Componentes Criados
```
ui/src/components/Settings/
├── SettingsPage.tsx           ← Container com sidebar vertical
├── ModelsPanel.tsx            ← Abas de especialidade, pull bar, listagem
├── ModelCard.tsx              ← Card com glow, start/stop animado
├── AgentsPanel.tsx            ← Lista de agents com CRUD
├── AgentCard.tsx              ← Card de agent detalhado
├── AgentFormDialog.tsx        ← Modal de criação/edição
└── OrchestrationPanel.tsx     ← Multi-agent toggle, config, agent pool
```

### Outros Arquivos Modificados
```
ui/src/
├── App.tsx                    ← Default view = 'ai' (AI Assistant como home)
├── components/MainArea.tsx    ← Renderiza SettingsPage quando activeView='settings'
├── components/AiPanel.tsx     ← Multi-agent trace badges, seletor de agent
├── components/ActivityBar.tsx ← 🧠 AI Assistant como primeiro ícone
├── types/index.ts             ← ModelDetail, Agent, AgentTrace, etc.
└── hooks/use-jarvis.ts        ← 10 novos métodos bridge
```

### Tipos (types/index.ts)
```typescript
interface ModelDetail {
  id: string; name: string; specialty: Specialty;
  size: number; modifiedAt: string; digest: string;
  running: boolean; quantization?: string;
}

interface Agent {
  id: string; name: string; modelId: string;
  systemPrompt: string; temperature: number;
  maxTokens: number; canOrchestrate: boolean;
  priority: number; isDefault: boolean;
}

interface OrchestrationConfig {
  enabled: boolean; orchestratorModel: string;
  criticModel: string; maxSpecialists: number;
  requireCriticApproval: boolean;
  showTrace: boolean;
}

interface AgentTrace {
  agentName: string; modelUsed: string;
  tokensUsed: number; timeMs: number;
  response: string; approved: boolean;
}
```

## Critérios de Aceitação
- [x] SettingsPage com 5 abas: Geral, Models, Assistente, Orquestração, Agents
- [x] ModelsPanel com specialty tabs (All/Chat/Code/Reasoning/Embedding/Vision)
- [x] ModelCard com glow running, hover scale, start/stop morphing button
- [x] AgentsPanel com CRUD completo (create/edit/delete)
- [x] AgentFormDialog com todos os campos do Agent
- [x] OrchestrationPanel com toggle, config, critic, agent pool, show trace
- [x] AiPanel com seletor de agent, trace badges
- [x] ActivityBar com 🧠 como primeiro ícone
- [x] App.tsx default view = 'ai'
- [x] Bridge hook com 10+ métodos bridge

---

## Test Cases

### TC-001: SettingsPage navega entre abas
- **Pré-condições:** UI rodando, clicar em ⚙️ Settings
- **Passos:**
  1. Abrir Settings
  2. Clicar em "Models"
  3. Clicar em "Assistente"
  4. Clicar em "Agents"
  5. Clicar em "Orquestração"
- **Resultado esperado:** Cada aba mostra seu conteúdo com animação
- **Cobertura:** normal

### TC-002: ModelsPanel especialidade tabs
- **Pré-condições:** Settings → Models
- **Passos:**
  1. Clicar "💬 Chat" → mostra só modelos Chat
  2. Clicar "💻 Code" → mostra só modelos Code
  3. Clicar "🧠 Reasoning" → mostra só Reasoning
  4. Clicar "All" → mostra todos
- **Resultado esperado:** Filtragem correta por especialidade
- **Cobertura:** normal | borda (aba sem modelos → empty state)

### TC-003: ModelCard start/stop animation
- **Pré-condições:** Pelo menos 1 modelo listado
- **Passos:**
  1. Clicar "Start" em modelo parado
  2. Verificar botão morph para "Stop" com ícone
  3. Clicar "Stop"
  4. Verificar botão volta para "Start"
- **Resultado esperado:** Botão anima e alterna estado
- **Cobertura:** normal

### TC-004: ModelCard glow effect
- **Pré-condições:** Modelo running
- **Passos:**
  1. Observar card do modelo running
  2. Observar card do modelo stopped
- **Resultado esperado:** Card running tem glow verde, stopped tem cinza
- **Cobertura:** normal

### TC-005: Pull model progress
- **Pré-condições:** Settings → Models, input "tinyllama"
- **Passos:**
  1. Digitar "tinyllama" no pull input
  2. Pressionar Enter
  3. Verificar barra de progresso aparece
  4. Verificar progresso de 0 → 100%
- **Resultado esperado:** Pull funciona com feedback visual
- **Cobertura:** normal

### TC-006: Pull model cancela
- **Pré-condições:** Pull em andamento
- **Passos:**
  1. Clicar "Cancelar" durante pull
- **Resultado esperado:** Pull cancela, modelo não aparece na lista
- **Cobertura:** borda

### TC-007: AgentsPanel CRUD
- **Pré-condições:** Settings → Agents
- **Passos:**
  1. Clicar "Novo Agent"
  2. Preencher formulário: nome, modelo, system prompt, temperatura
  3. Clicar "Salvar"
  4. Verificar card aparece na lista
  5. Editar: clicar "Editar", mudar nome, salvar
  6. Excluir: clicar "Excluir", confirmar
- **Resultado esperado:** CRUD completo com feedback
- **Cobertura:** normal

### TC-008: AgentFormDialog valida campos
- **Pré-condições:** Modal de novo agent aberto
- **Passos:**
  1. Clicar "Salvar" com campos vazios
  2. Inserir nome > 100 caracteres
  3. Inserir temperatura < 0
  4. Inserir maxTokens = 0
- **Resultado esperado:** Erros de validação exibidos, não salva
- **Cobertura:** borda | erro

### TC-009: AgentFormDialog cancela sem salvar
- **Pré-condições:** Modal aberto com campos preenchidos
- **Passos:**
  1. Preencher campos
  2. Clicar "Cancelar"
- **Resultado esperado:** Modal fecha sem criar agent
- **Cobertura:** borda

### TC-010: OrchestrationPanel toggle
- **Pré-condições:** Settings → Orquestração
- **Passos:**
  1. Desligar toggle "Multi-Agent Orchestration"
  2. Verificar que configs ficam disabled
  3. Ligar toggle
  4. Verificar que configs ficam enabled
- **Resultado esperado:** Toggle controla estado das configs
- **Cobertura:** normal

### TC-011: OrchestrationPanel agent pool
- **Pré-condições:** 3+ agents com canOrchestrate=true
- **Passos:**
  1. Arrastar agent para pool
  2. Arrastar outro agent
  3. Remover agent do pool
- **Resultado esperado:** Pool de orquestração configurável
- **Cobertura:** normal

### TC-012: AiPanel seletor de agent
- **Pré-condições:** AiPanel aberto
- **Passos:**
  1. Clicar no seletor de agent
  2. Escolher "Code Expert"
  3. Enviar mensagem
  4. Verificar badge "Code Expert" no trace
- **Resultado esperado:** Agent troca e aparece nos badges
- **Cobertura:** normal

### TC-013: AiPanel trace badges multi-agent
- **Pré-condições:** Orchestration ligada, 2 agents no pool
- **Passos:**
  1. Enviar mensagem
  2. Verificar badges com nomes dos agents consultados
  3. Badge "Critic" aparece se crítico aprovou
- **Resultado esperado:** Badges visíveis e informativos
- **Cobertura:** normal

### TC-014: AI Assistant como home (default view)
- **Pré-condições:** App carrega
- **Passos:**
  1. Recarregar página
  2. Verificar que AiPanel está aberto
  3. Verificar ActivityBar destaca 🧠
- **Resultado esperado:** AI Assistant é a view inicial
- **Cobertura:** normal

### TC-015: Bridge hook métodos funcionam
- **Pré-condições:** UI rodando com bridge mock/real
- **Passos:**
  1. `bridge.listModels()` → array
  2. `bridge.listAgents()` → array
  3. `bridge.getOrchestrationConfig()` → config
  4. `bridge.createAgent(dto)` → agent
  5. `bridge.deleteAgent(id)` → void
  6. `bridge.startModel(id)` → void
  7. `bridge.stopModel(id)` → void
  8. `bridge.pullModel(name, callback)` → progress
  9. `bridge.sendMessage(text, agentId)` → response
  10. `bridge.getAgentTraces()` → traces
- **Resultado esperado:** Todos os métodos respondem sem erro
- **Cobertura:** normal | borda (métodos com parâmetros inválidos)
