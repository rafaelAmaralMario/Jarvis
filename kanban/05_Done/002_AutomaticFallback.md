# Automatic Fallback entre Provedores

## Descrição
Implementar fallback automático no LLMGateway: se o provedor primário falhar (timeout, erro, modelo não carregado), tentar automaticamente o próximo provedor configurado. Configurável por modelo ou por tarefa.

## Análise Técnica

### Arquitetura

**Data Flow:**
```
LLMGateway.generate(req)
  → Try provider A (e.g., ollama)
    → On LLMError/timeout → try provider B (e.g., openai)
      → On success → return LLMResponse with `provider` set to B
      → On all fail → raise LLMFallbackError
  → generate_stream() follows same pattern
```

**Fallback Chain Source:**
- Config stored in new DB table `llm_fallback_config`:
  - `provider TEXT PRIMARY KEY` — which provider this rule applies to
  - `fallback_order TEXT NOT NULL` — JSON array of provider names (e.g., `["openai", "anthropic"]`)
  - `timeout_seconds INTEGER NOT NULL DEFAULT 30` — max wait per provider
  - `model_overrides TEXT NOT NULL DEFAULT '[]'` — JSON array of model-specific overrides
- If no explicit config, use implicit order: Ollama → OpenAI → Anthropic (all configured enabled providers)

**Key files modified:**
- `backend/jarvis/llm_gateway.py` — core fallback loop
- `backend/jarvis/llm_gateway.py` — new `LLMFallbackError` and `generate_with_fallback()` method
- `backend/jarvis/migration_runner.py` — new migration for `llm_fallback_config` table
- `backend/jarvis/bridge.py` — new bridge methods: `llmGetFallbackConfig`, `llmSaveFallbackConfig`
- `ui/src/types/index.ts` — new types: `LLMFallbackConfig`, `LLMFallbackRule`
- `ui/src/components/Settings/LLMProvidersPanel.tsx` — fallback config UI section

### Implementação Detalhada

1. **File:** `backend/jarvis/llm_gateway.py` — Add fallback infrastructure:

   a. Add `LLMFallbackError` exception class (subclass of `LLMError`).

   b. Add `@dataclass LLMFallbackConfig`:
      ```python
      @dataclass
      class LLMFallbackConfig:
          provider: str              # primary provider
          fallback_order: list[str]  # ordered fallback providers
          timeout_seconds: int = 30
          model_overrides: list[dict] = field(default_factory=list)
      ```

   c. Add to `LLMGateway.__init__`:
      - `self._fallback_configs: dict[str, LLMFallbackConfig] = {}`
      - Call `self._load_fallback_config()` in constructor

   d. Add `_load_fallback_config()` method:
      ```python
      def _load_fallback_config(self):
          rows = self._db.fetchall(
              "SELECT provider, fallback_order, timeout_seconds, model_overrides"
              " FROM llm_fallback_config"
          )
          for row in rows:
              self._fallback_configs[row["provider"]] = LLMFallbackConfig(
                  provider=row["provider"],
                  fallback_order=json.loads(row["fallback_order"]) if row["fallback_order"] else [],
                  timeout_seconds=row["timeout_seconds"] or 30,
                  model_overrides=json.loads(row["model_overrides"]) if row["model_overrides"] else [],
              )
      ```

   e. Modify `LLMGateway.generate()` (line 488-502) — Replace single-provider call with fallback loop:
      ```python
      def generate(self, req: LLMRequest) -> LLMResponse:
          provider_str = req.provider.value if isinstance(req.provider, LLMProvider) else req.provider
          errors: list[str] = []
          
          # Build ordered list: [primary] + fallback_order
          fallback_cfg = self._fallback_configs.get(provider_str)
          ordered_providers = [provider_str]
          if fallback_cfg:
              ordered_providers.extend(fallback_cfg.fallback_order)
          else:
              # Implicit: try all other enabled providers in order
              for p in [LLMProvider.OPENAI, LLMProvider.ANTHROPIC]:
                  p_str = p.value
                  if p_str != provider_str and p_str in self._providers and self._providers[p_str].enabled:
                      ordered_providers.append(p_str)
          
          last_error = None
          for attempt_provider in ordered_providers:
              try:
                  cfg = self._providers.get(attempt_provider)
                  if not cfg or not cfg.enabled:
                      continue
                  
                  # Clone request with new provider
                  attempt_req = copy_request(req)
                  attempt_req.provider = LLMProvider(attempt_provider)
                  if not attempt_req.model and cfg.default_model:
                      attempt_req.model = cfg.default_model
                  
                  timeout = fallback_cfg.timeout_seconds if fallback_cfg else 30
                  
                  client = get_llm_client(cfg)
                  resp = client.generate(attempt_req)
                  resp.provider = LLMProvider(attempt_provider)
                  
                  if attempt_provider != provider_str:
                      logger.info(f"Fallback ativo: {provider_str} -> {attempt_provider} para modelo {req.model}")
                  
                  return resp
              except (LLMError, httpx.TimeoutException, httpx.ConnectError) as e:
                  last_error = e
                  errors.append(f"{attempt_provider}: {e}")
                  logger.warning(f"Provedor {attempt_provider} falhou: {e}")
                  continue
          
          raise LLMError(
              f"Todos os provedores falharam para modelo '{req.model}'. Erros: {'; '.join(errors)}"
          )
      ```

   f. Apply same pattern to `generate_stream()` (line 504-518).

   g. Add helper `copy_request()` (shallow copy):
      ```python
      def copy_request(req: LLMRequest) -> LLMRequest:
          return LLMRequest(
              provider=req.provider,
              model=req.model,
              messages=list(req.messages),
              system=req.system,
              temperature=req.temperature,
              max_tokens=req.max_tokens,
              stream=req.stream,
          )
      ```

   h. Add `save_fallback_config()` and `get_fallback_configs()` methods to `LLMGateway`.

2. **File:** `backend/jarvis/migration_runner.py` — Add migration 12:
   ```python
   Migration(12, "llm-fallback-config", """
       CREATE TABLE IF NOT EXISTS llm_fallback_config (
           provider TEXT PRIMARY KEY,
           fallback_order TEXT NOT NULL DEFAULT '[]',
           timeout_seconds INTEGER NOT NULL DEFAULT 30,
           model_overrides TEXT NOT NULL DEFAULT '[]',
           updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       );
   """)
   ```

3. **File:** `backend/jarvis/bridge.py` — Add new bridge handlers:
   - `llmGetFallbackConfig(provider)` → dict
   - `llmSaveFallbackConfig(config)` → bool

4. **File:** `ui/src/types/index.ts` — Add types:
   ```typescript
   export interface LLMFallbackConfig {
     provider: string;
     fallbackOrder: string[];
     timeoutSeconds: number;
     modelOverrides: { model: string; fallbackOrder: string[] }[];
   }
   ```

5. **File:** `ui/src/components/Settings/LLMProvidersPanel.tsx` — Add fallback config section to each provider card:
   - When expanded, show "Fallback" sub-section
   - Multi-select for fallback order (reorderable list of other enabled providers)
   - Timeout slider/input (5-120 seconds)
   - Model-specific overrides section (optional)

### Dependências
- `001_NativeProvider` — Native provider must exist to be a valid fallback target
- `002_ProviderSelectorUI` — Provider selector must exist so user can see which provider is active vs fallback
- New DB migration (v12)

### Riscos e Mitigações
- **Risco:** Fallback loop causes cascading delays (each provider times out sequentially). **Mitigação:** Per-provider configurable timeout (default 30s), configurable max total fallback time.
- **Risco:** User not notified about fallback leading to unexpected costs (e.g., fallback to paid OpenAI). **Mitigação:** Log warning + optional UI toast notification via event system.
- **Risco:** Circular fallback (A → B → A). **Mitigação:** Validate config on save — reject cycles. Track used providers in set during fallback loop.

## Use Cases
1. **Scenario 1 — Ollama server restart**: User runs `ollama serve` restart in background. AiPanel sends request → Ollama not responding (httpx.ConnectError) → falls back to OpenAI → user gets response seamlessly. When Ollama comes back, next request uses primary again.
2. **Scenario 2 — Model not loaded**: User requests model "mixtral:8x7b" which isn't loaded in Ollama. Ollama returns 404 → fallback to OpenAI gpt-4 (configured as fallback for that model) → response delivered with provider badge showing "openai" as active.
3. **Scenario 3 — Cost-aware fallback**: User configures Ollama (free) as primary, OpenAI (paid) as fallback, with timeout 30s. During peak usage, Ollama is slow (>30s) → falls to OpenAI. User sees a warning chip: "⚠️ Fallback ativo: OpenAI (Ollama lento)".

## Test Cases
1. [ ] **Primary provider failing**: Mock `OllamaLLMClient.generate()` to raise `httpx.ConnectError`. Verify fallback to OpenAI returns correct response with `provider=openai`.
2. [ ] **All providers failing**: Mock all clients to fail. Verify `LLMError` raised with combined error messages. No unhandled exceptions.
3. [ ] **Per-model fallback override**: Configure `model_overrides` for "llama3.2" → fallback to Anthropic. Request "llama3.2" → Ollama fails → falls to Anthropic (skipping OpenAI). Request "other-model" → falls to OpenAI (default order). Verify both paths.
4. [ ] **Fallback config persistence**: Save fallback config via bridge → restart LLMGateway → load config → verify order preserved.
5. [ ] **Timeout hit exactly**: Set timeout to 1s, mock client to sleep 2s. Verify it moves to next provider within reasonable time (< 3s total).

## Critérios de Aceitação
- [x] Lógica de fallback no LLMGateway.generate()
- [x] Configuração de ordem de fallback (ex: Native → Ollama → OpenAI)
- [x] Tempo máximo de tentativa por provedor
- [x] Notificação ao usuário sobre fallback ativo
- [x] Log de falhas de provedor

## Fase
Fase 1 — LLM Dual Provider

## Prioridade
Média

## Esforço Estimado
Pequeno

