# Models & Agents — Gerenciamento de IA

## Visão Geral

Feature de configuracao onde o usuario gerencia modelos de IA e agents.
Todo modulo que usa IA consome os models/agents daqui (Service Locator).

```
┌──────────────────────────────────────────────────────────────┐
│                    Settings (React UI)                        │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │    Models Panel      │  │    Agents Panel      │           │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │           │
│  │  │llama3.2 │ ▶    │  │  │  │Assistant Geral│  │           │
│  │  │chat     │online │  │  │  │llama3.2, 0.7 │  │           │
│  │  ├───────────────┤  │  │  ├───────────────┤  │           │
│  │  │codellama│ ▶    │  │  │  │Code Expert   │  │           │
│  │  │code     │online │  │  │  │codellama, 0.2│  │           │
│  │  ├───────────────┤  │  │  ├───────────────┤  │           │
│  │  │nomic-text│ ▶   │  │  │  │Revisor PT-BR │  │           │
│  │  │embed    │online │  │  │  │llama3.2, 0.1│  │           │
│  │  └───────────────┘  │  │  └───────────────┘  │           │
│  └─────────────────────┘  └─────────────────────┘           │
└──────────────────────────────┬───────────────────────────────┘
                               │ WebChannel JSON-RPC
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       C++ Kernel                             │
│  ┌────────────────────┐  ┌────────────────────┐             │
│  │  ModelsManager     │  │  AgentsManager     │             │
│  │  ► Ollama HTTP API │  │  ► SQLite CRUD     │             │
│  │  ► localhost:11434 │  │  ► agents table    │             │
│  │  ► model_metadata  │  │  ► agent_runs log  │             │
│  └────────────────────┘  └────────────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

---

## Models Manager

### Responsabilidade
Gerenciar modelos Ollama na maquina local: listar instalados, puxar novos, definir especialidades, iniciar/parar.

### API (Bridge → React)

```typescript
interface ModelsAPI {
  // Lista modelos instalados no Ollama + metadados locais
  listModels(): Promise<ModelInfo[]>;

  // Puxar modelo do registro Ollama
  pullModel(name: string): Promise<void>;

  // Deletar modelo do disco
  deleteModel(name: string): Promise<void>;

  // "Iniciar" modelo (preload via keep-alive)
  startModel(name: string): Promise<void>;

  // "Parar" modelo (libertar memoria)
  stopModel(name: string): Promise<void>;

  // Status de um modelo especifico
  getModelStatus(name: string): Promise<ModelStatus>;

  // Atualizar especialidade/tags do modelo (metadata local)
  updateModelMetadata(name: string, meta: Partial<ModelMetadata>): Promise<void>;
}

interface ModelInfo {
  name: string;            // "llama3.2:3b"
  specialty: string;       // "chat" | "code" | "reasoning" | "embedding" | "vision" | "general"
  status: ModelStatus;     // "downloaded" | "running" | "stopped" | "error"
  size: string;            // "2.0 GB"
  modified: string;        // ISO date
  description?: string;    // do Ollama modelfile
}

type ModelStatus = 'downloaded' | 'running' | 'stopped' | 'error' | 'not_downloaded';

interface ModelMetadata {
  specialty: string;
  notes: string;
  color: string;     // cor UI pra identificar specialty
  icon: string;      // icone por specialty
}
```

### Especialidades (Cores/icons)

| Specialty    | Cor     | Icon          | Exemplo modelo        |
|-------------|---------|---------------|----------------------|
| chat        | blue    | 💬            | llama3.2, mistral    |
| code        | green   | 💻            | codellama, deepseek-coder |
| reasoning   | purple  | 🧠            | deepseek-r1, qwen    |
| embedding   | orange  | 📐            | nomic-embed-text, mxbai |
| vision      | pink    | 👁️            | llava, moondream     |
| general     | gray    | 🤖            | fallback             |

### Fluxo "Iniciar Modelo"

Ollama nao tem "start/stop" explicito, mas podemos:
- **Start**: enviar request `POST /api/generate` com `keep_alive: 5m` para preload na GPU
- **Stop**: enviar `POST /api/generate` com `keep_alive: 0` para descarregar
- Mostrar status "running" se o modelo respondeu com keep_alive ativo

---

## Agents Manager

### Responsabilidade
CRUD de agents: cada agent e uma config (modelo + system prompt + parametros) para uma tarefa especifica.

### API (Bridge → React)

```typescript
interface AgentsAPI {
  listAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent>;
  createAgent(data: CreateAgentDTO): Promise<Agent>;
  updateAgent(id: string, data: Partial<CreateAgentDTO>): Promise<Agent>;
  deleteAgent(id: string): Promise<void>;
  setDefaultAgent(id: string): Promise<void>;
  getDefaultAgent(): Promise<Agent | null>;
}

interface Agent {
  id: string;               // UUID
  name: string;             // "Code Reviewer"
  description: string;      // "Revisa codigo e sugere melhorias"
  model: string;            // "codellama:7b"
  systemPrompt: string;     // "Voce e um revisor de codigo senior..."
  temperature: number;      // 0.0 - 2.0
  maxTokens: number;        // 4096
  specialty: string;        // herda do modelo ou custom
  tools: string[];          // ["read_file", "git_diff", "search"]
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateAgentDTO {
  name: string;
  description?: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
}
```

### SQL Schema

```sql
CREATE TABLE agents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL,
    system_prompt TEXT NOT NULL DEFAULT '',
    temperature REAL NOT NULL DEFAULT 0.7,
    max_tokens INTEGER NOT NULL DEFAULT 2048,
    specialty TEXT NOT NULL DEFAULT 'general',
    tools TEXT NOT NULL DEFAULT '[]',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE model_metadata (
    model_name TEXT PRIMARY KEY,
    specialty TEXT NOT NULL DEFAULT 'general',
    notes TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6b7280',
    icon TEXT NOT NULL DEFAULT '🤖',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

---

## UI Components

### Caminho: `ui/src/components/Settings/`

```
Settings/
├── SettingsPage.tsx       ← Tabs: Models | Agents | Geral
│   └── SettingsPage.test.tsx
├── ModelsPanel.tsx        ← Lista modelos + start/stop + edit specialty
│   ├── ModelCard.tsx      ← Card individual com status, botao, badge
│   ├── ModelPullDialog.tsx ← Dialog para puxar modelo novo
│   └── ModelBadge.tsx     ← Badge colorido por specialty
├── AgentsPanel.tsx        ← Lista agents + CRUD
│   ├── AgentCard.tsx      ← Card do agent
│   ├── AgentFormDialog.tsx ← Criar/editar agent (form)
│   └── AgentDeleteDialog.tsx ← Confirmacao
└── index.ts
```

### Layout ModelsPanel

```
┌──────────────────────────────────────────────┐
│  🔧 Settings                          [tab]  │
│  ┌──────┬──────────┬──────────┐              │
│  │ Geral │ 📦 Models │ 🤖 Agents │              │
│  └──────┴──────────┴──────────┘              │
│                                               │
│  ┌─ + Pull New Model ──────────────────────┐  │
│  │                                          │  │
│  │  ┌──────────────────────────────────────┐│  │
│  │  │ 💬 llama3.2:3b          ● Running  ▶■││  │
│  │  │ Chat assistant          2.0 GB       ││  │
│  │  └──────────────────────────────────────┘│  │
│  │  ┌──────────────────────────────────────┐│  │
│  │  │ 💻 codellama:7b         ○ Stopped   ▶ ││  │
│  │  │ Code generation         3.8 GB       ││  │
│  │  └──────────────────────────────────────┘│  │
│  │  ┌──────────────────────────────────────┐│  │
│  │  │ 📐 nomic-embed-text     ● Running  ▶■││  │
│  │  │ Embeddings              274 MB       ││  │
│  │  └──────────────────────────────────────┘│  │
│  └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Layout AgentsPanel

```
┌──────────────────────────────────────────────┐
│  🤖 Agents                          [+ New] │
│                                               │
│  ┌──────────────────────────────────────────┐ │
│  │ 🤖 Assistant Geral              ★ Default│ │
│  │ ┌──────────────────────────────────────┐ │ │
│  │ │ Model: llama3.2:3b       Temp: 0.7  │ │ │
│  │ │ Tools: read, search                 │ │ │
│  │ │ "Voce e um assistente util..."      │ │ │
│  │ └──────────────────────────────────────┘ │ │
│  │ [Edit] [Delete]                          │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │ 💻 Code Expert                           │ │
│  │ ┌──────────────────────────────────────┐ │ │
│  │ │ Model: codellama:7b     Temp: 0.2  │ │ │
│  │ │ Tools: read, write, git_diff       │ │ │
│  │ │ "Voce e um engenheiro senior..."   │ │ │
│  │ └──────────────────────────────────────┘ │ │
│  │ [Edit] [Delete]                          │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## Integracao com Modulos

Todo modulo que usa IA faz assim:

```cpp
// Exemplo: modulo Conhecimento busca embedding
auto* registry = ServiceLocator::instance()->getService<IServiceRegistry>();
auto* agents = registry->getService<IAgentsManager>();
auto* models = registry->getService<IModelsManager>();

// Pega o modelo de embedding ativo
auto embedModel = models->getModelBySpecialty("embedding");

// Ou usa o agent default para gerar resposta
auto agent = agents->getDefaultAgent();
auto response = models->generate(agent.model, agent.systemPrompt, userInput);
```

React consome via bridge:

```typescript
// Exemplo: chat panel usa o agent default
const { callBridge } = useJarvis();
const agent = await callBridge('getDefaultAgent');
const response = await callBridge('chatComplete', {
  model: agent.model,
  systemPrompt: agent.systemPrompt,
  messages: [...]
});
```

---

## Multi-Agent Orchestration

Em vez de usar um unico agent, o JARVIS pode **orquestrar multiplos agents** para produzir a melhor resposta final.

### Arquitetura

```
User Query
    │
    ▼
┌──────────────────────────────────┐
│         Orchestrator              │
│  (router + planner, usa LLM)     │
│  ► Analisa a query               │
│  ► Decide quais agents consultar │
│  ► Monta o plano de execucao     │
└──────────┬───────────────────────┘
           │
     ┌─────┼─────┬──────┬──────┐
     ▼     ▼     ▼      ▼      ▼
   Code  Chat  Reason Embed  Writer
   (Agents especialistas respondem)
     │     │     │      │      │
     └─────┼─────┼──────┼──────┘
           ▼
┌──────────────────────────────────┐
│         Critic Agent              │
│  ► Revisa a resposta consolidada │
│  ► Sugere melhorias              │
│  ► Aprova ou pede refinamento    │
└──────────┬───────────────────────┘
           ▼
    Final Response
```

### Fluxo Detalhado

```
1. User envia: "Explique o bug nesse codigo e sugira correcao"
2. Orchestrator analisa: query envolve code review + explicacao
3. Orchestrator ativa: Code Expert + Writer Agent
4. Code Expert analisa o codigo, encontra o bug
5. Writer Agent formata a explicacao em markdown claro
6. Critic Agent revisa: "A resposta explica a causa raiz? Sim. A sugestao de correcao funciona? Sim."
7. Critic Agent aprova → resposta final e enviada ao usuario
```

### Orquestrador

O orchestrador nao e um agent configurado pelo usuario — e um **meta-agent** do sistema que:

- Usa o mesmo modelo configurado como default (ex: llama3.2)
- Tem um system prompt especial de roteamento
- Nao aparece na lista de agents (e interno)
- Pode ser desabilitado (modo single-agent)

### Critic Agent

Similar ao orchestrador, e interno:
- Usa temperatura baixa (0.1) para revisao objetiva
- Verifica: relevancia, clareza, corretude, formato
- Pode pedir para um agent refinar a resposta

### UI do Multi-Agent

No chat, o usuario ve **transparencia** de quais agents foram usados:

```
┌─────────────────────────────────────────┐
│ 🧠 Assistant Geral  [🔀 Multi-Agent ▼] │  ← seletor no header
└─────────────────────────────────────────┘

Resposta do JARVIS:

[O codigo tem um bug de race condition...]
                                    ───────
                                    💻 Code Expert consultado
                                    🧠 Reasoning usado como critico
                                    ✍️ Writer formatou a resposta
```

Clicando nos badges, o usuario pode ver o "rastro" da orquestracao.

### Configuracao (Settings → Orquestracao)

```
┌─ Orquestração ──────────────────────────┐
│                                          │
│  🔀 Multi-Agent Mode              [ON]  │  ← toggle
│                                          │
│  🎯 Orchestrator: [llama3.2:3b     ▼]   │  ← modelo do router
│  ✅ Critic Agent:              [ON]  │
│  🌡️  Critic Temperature:   [0.1]      │
│                                          │
│  Agents Disponiveis para Orquestracao:   │
│  ┌────────────────────────────────────┐  │
│  │ ✅ 💻 Code Expert                 │  │
│  │ ✅ ✍️  Writer                      │  │
│  │ ☐ 🧠 Reasoning Expert             │  │
│  │ ✅ 💬 Assistant Geral (fallback)  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### SQL Schema (extensao)

```sql
ALTER TABLE agents ADD COLUMN can_orchestrate INTEGER NOT NULL DEFAULT 1;
ALTER TABLE agents ADD COLUMN priority INTEGER NOT NULL DEFAULT 5;

CREATE TABLE orchestration_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    enabled INTEGER NOT NULL DEFAULT 1,
    orchestrator_model TEXT NOT NULL DEFAULT '',
    critic_enabled INTEGER NOT NULL DEFAULT 1,
    critic_temperature REAL NOT NULL DEFAULT 0.1,
    max_agents_per_query INTEGER NOT NULL DEFAULT 3,
    show_trace INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO orchestration_config (id, enabled) VALUES (1, 1);
```

### API (Bridge)

```typescript
interface OrchestrationAPI {
  getConfig(): Promise<OrchestrationConfig>;
  updateConfig(config: Partial<OrchestrationConfig>): Promise<void>;
  getAgentTrace(queryId: string): Promise<AgentTrace>;
}

interface OrchestrationConfig {
  enabled: boolean;
  orchestratorModel: string;
  criticEnabled: boolean;
  criticTemperature: number;
  maxAgentsPerQuery: number;
  showTrace: boolean;
}

interface AgentTrace {
  queryId: string;
  query: string;
  orchestratorReasoning: string;    // "Query envolve codigo → roteando para Code Expert"
  agentsConsulted: AgentResult[];
  criticReview: string;             // "Resposta revisada e aprovada"
  finalResponse: string;
}

interface AgentResult {
  agentName: string;
  specialty: string;
  model: string;
  response: string;
  tokensUsed: number;
  latencyMs: number;
}
```

---

## Proximos Passos de Implementacao

1. **C++ Kernel**
   - `models_manager.h/.cpp` — HTTP client p/ Ollama API + metadata SQLite
   - `agents_manager.h/.cpp` — CRUD agents SQLite
   - `web_channel.cpp` — registrar novos handlers

2. **React UI**
   - `SettingsPage.tsx` — container com tabs
   - `ModelsPanel.tsx` + `ModelCard.tsx` + `ModelPullDialog.tsx`
   - `AgentsPanel.tsx` + `AgentCard.tsx` + `AgentFormDialog.tsx`
   - Tipos no `types/index.ts`, hooks em `use-jarvis.ts`

3. **Schema**
   - Migracao SQLite: criar tabelas `agents` e `model_metadata`
   - Seed data: agent default "Assistant Geral"
