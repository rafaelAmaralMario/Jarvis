# Provider Selector UI

## Descrição
Criar interface na UI para selecionar qual provedor (Ollama vs Native) usar por modelo ou por tarefa. Adicionar seletor de provedor no AiPanel (junto do seletor de agente) e no ModelsPanel. Permitir configurar fallback automático entre provedores.

## Análise Técnica

### Arquitetura

**Data Flow:**
```
User selects provider in AiPanel dropdown
  → bridge.llmSetDefaultProvider(provider)      (persists to system_config)
  → ToolAgent reads provider from Agent or default
  → LLMGateway.generate() uses cfg for that provider
```

**Component Hierarchy:**
```
AiPanel
 ├── Agent selector <select>          (existing, line 504-513)
 ├── [NEW] Provider selector <select>  (alongside agent selector)
 ├── Provider indicator badge          (enhance existing badge at line 524-529)
 └── ...

ModelsPanel
 ├── [NEW] Provider filter tabs        (Ollama | Native | All)
 └── ModelCard (existing)

LLMProvidersPanel (existing, modify)
 ├── [NEW] NativeProvider card row
 └── Provider edit form (existing)
```

**Bridge API (already exists):**
- `llmGetProviders()` → `LLMProviderInfo[]` — already implemented in `bridge.py:1642`
- `llmGetDefaultProvider()` → string — already in `bridge.py:1687`
- `llmSetDefaultProvider(provider)` → bool — already in `bridge.py:1678`

### Implementação Detalhada

1. **File:** `ui/src/types/index.ts` — Add `provider: string` to `Agent` interface (line ~324):
   - Currently Agent has `model: string` but no `provider`. Add `provider: string` field.
   - Also add `provider?: string` to `CreateAgentDTO` (line ~342)

2. **File:** `backend/jarvis/bridge.py` — Update `toolAgentExecute` (line 722) and `toolAgentExecuteStream` (line 785):
   - Currently reads `agent_provider = getattr(default, "provider", "ollama")` — this works if Agent has `provider` field.
   - Add provider override: if `selectedAgent` has `provider`, use it; else fall back to `llmGetDefaultProvider()`.

3. **File:** `ui/src/components/AiPanel.tsx` — Add provider selector dropdown:
   - Add state: `const [providers, setProviders] = useState<LLMProviderInfo[]>([])` and `const [selectedProvider, setSelectedProvider] = useState<string>('ollama')`
   - In the header (line 493-531), after the agent `<select>` (line 504-513), add a provider `<select>`:
     ```tsx
     <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}>
       {providers.filter(p => p.enabled).map(p => (
         <option key={p.provider} value={p.provider}>{p.provider}</option>
       ))}
     </select>
     ```
   - Update the model badge (line 524-529) to also show provider name: `{selectedAgent.model.split(':')[0]} @ {selectedProvider}`
   - Load providers on init: `bridge.llmGetProviders().then(setProviders)`
   - Handle provider change: `bridge.llmSetDefaultProvider(provider)` to persist

4. **File:** `ui/src/components/Settings/LLMProvidersPanel.tsx` — Add NativeProvider support:
   - Add `native: '🧠'` to `PROVIDER_ICONS` (line 6-11)
   - The existing panel already enumerates all providers from `bridge.llmGetProviders()`, so if the backend returns a `native` provider config, it will render automatically.
   - Add a section explaining NativeProvider and link to its setup docs.

5. **File:** `ui/src/components/Settings/ModelsPanel.tsx` — Add provider filter:
   - Add state for active provider filter alongside specialty filter
   - Tabs: "Ollama Models" / "OpenAI Models" / "Anthropic Models" (when NativeProvider card 001 is done)
   - Group models by provider in the card list

6. **File:** `backend/jarvis/agents_manager.py` — Add provider support to agent schema:
   - Currently agents have `model` but no `provider` field in the agents table.
   - Need DB migration to add `provider TEXT NOT NULL DEFAULT 'ollama'` to agents table.

### Dependências
- `001_NativeProvider` card — must exist for Native provider to be selectable
- New DB migration: add `provider` column to `agents` table

### Riscos e Mitigações
- **Risco:** Agent without `provider` field breaks existing agents. **Mitigação:** Default to `'ollama'` in migration.
- **Risco:** Provider selector adds visual noise when only 1 provider configured. **Mitigação:** Hide selector when providers.length <= 1.
- **Risco:** User selects a provider that has no configured models. **Mitigação:** Disable provider option if `models.length === 0`.

## Use Cases
1. **Scenario 1 — Dual-provider power user**: User configures Ollama (local) for simple chat models and OpenAI (cloud) for code/reasoning. They switch between providers per conversation via the dropdown, selecting which provider to use for each agent.
2. **Scenario 2 — Multi-agent with different providers**: User creates an agent "Code Expert" using OpenAI GPT-4 and another "Quick Chat" using Ollama llama3. The provider selector per agent lets each use its designated provider.
3. **Scenario 3 — Cloud fallback for local failure**: When Ollama server is down, user switches the provider dropdown to OpenAI to keep working, without losing context.

## Test Cases
1. [ ] **Visual validation**: Provider dropdown renders next to agent selector in AiPanel — both when single provider and multiple providers configured
2. [ ] **Persistence**: Selecting a provider in AiPanel persists via `bridge.llmSetDefaultProvider()` and survives page refresh
3. [ ] **Agent provider binding**: Agent created with `provider: "openai"` actually routes requests to OpenAI via `ToolAgent`
4. [ ] **Provider indicator**: Badge shows "model @ provider" format correctly, updating on provider switch
5. [ ] **Empty provider state**: When only Ollama is configured, provider dropdown is hidden automatically

## Critérios de Aceitação
- [ ] Seletor de provedor no AiPanel (dropdown ao lado do seletor de agente)
- [ ] Seletor de provedor no ModelsPanel (qual provedor gerencia quais modelos)
- [ ] LLMProvidersPanel atualizado com suporte a NativeProvider
- [ ] Configuração de fallback (se provedor A falha, tenta B)
- [ ] Indicador visual de qual provedor está ativo

## Fase
Fase 1 — LLM Dual Provider

## Prioridade
Alta

## Esforço Estimado
Médio
