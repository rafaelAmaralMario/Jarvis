# T9: LLM Router (Provider Proxy)

## Descrição
Camada de roteamento inteligente entre todos os provedores (Ollama, Native, OpenAI, Anthropic). Roteia requisições baseado em: disponibilidade, modelo requisitado, custo (para APIs), latência, capacidade (visão/embedding/chat). Fallback automático em cascata. Cache de respostas para prompts idênticos.

## Análise Técnica

### Arquitetura

**Data Flow:**
```
Legacy: caller → LLMGateway.generate() → single provider client

New:    caller → LLMRouter(LLMGateway).generate(req)
                  ├── 1. Check cache (hash of messages + model) → return cached if hit
                  ├── 2. Resolve capability: determine needed capability (chat/vision/embedding)
                  ├── 3. Router rules: match req against routing_rules (model pattern, capability, max_cost)
                  ├── 4. Build provider chain: ordered list of candidates based on rules
                  ├── 5. Execute with fallback: try each in order (reuses AutomaticFallback logic)
                  ├── 6. On success: update latency metrics, cache response
                  └── 7. Return LLMResponse
```

**New class hierarchy:**
```
LLMRouter
 ├── _gateway: LLMGateway           # delegate for actual provider calls
 ├── _rules: list[RouterRule]        # ordered routing rules
 ├── _cache: LRUCache[prompt_hash, LLMResponse]
 ├── _metrics: dict[str, ProviderMetrics]  # latency tracking
 ├── generate(req) → LLMResponse     # main entry point
 ├── generate_stream(req, on_chunk) → bool
 └── resolve_providers(req) → list[str]  # returns ordered provider candidates

RouterRule
 ├── name: str
 ├── match: RouterMatch  # matcher for requests
 ├── providers: list[str]  # ordered providers for matches
 └── priority: int

RouterMatch
 ├── by_model: list[str]          # regex patterns for model
 ├── by_capability: list[str]     # vision, embedding, chat
 ├── by_provider: list[str]       # specific source provider
 └── max_cost_per_1k: float       # max cost in USD
```

**Cache:**
- LRU cache keyed by hash of (model, messages, system, temperature)
- Configurable max size (default 1000 entries)
- Optional TTL per entry (default 5 min)
- Stored in-memory (dict + collections.OrderedDict for LRU)

**Metrics:**
```python
@dataclass
class ProviderMetrics:
    provider: str
    total_calls: int = 0
    success_calls: int = 0
    total_latency_ms: int = 0
    avg_latency_ms: float = 0.0
    last_error: str = ""
    last_success_at: str = ""
```

**Files to create/modify:**
- CREATE: `backend/jarvis/llm_router.py` — `LLMRouter`, `RouterRule`, `RouterMatch`, `ProviderMetrics`
- MODIFY: `backend/jarvis/llm_gateway.py` — no changes needed (router wraps it)
- MODIFY: `backend/jarvis/bridge.py` — new handlers: `llmRouterGetRules`, `llmRouterSaveRule`, `llmRouterGetMetrics`, `llmRouterClearCache`
- MODIFY: `ui/src/types/index.ts` — new types: `RouterRule`, `RouterMatch`, `ProviderMetrics`, `RouterCacheInfo`
- CREATE: `ui/src/components/Settings/RouterPanel.tsx` — new Settings tab for router configuration
- MODIFY: `ui/src/components/Settings/index.tsx` — add RouterPanel tab
- MODIFY: `backend/jarvis/migration_runner.py` — new migration for `llm_router_rules` table

### Implementação Detalhada

1. **File: `backend/jarvis/llm_router.py`** (CREATE)

   ```python
   """Intelligent LLM Router — capability-based, cache, metrics, cascading fallback."""

   import hashlib
   import json
   import logging
   import re
   import time
   from collections import OrderedDict
   from dataclasses import dataclass, field
   from datetime import datetime, timezone
   from typing import Callable

   from jarvis.llm_gateway import (
       LLMGateway, LLMRequest, LLMResponse, LLMProvider, LLMError
   )

   logger = logging.getLogger(__name__)

   CAPABILITY_CHAT = "chat"
   CAPABILITY_VISION = "vision"
   CAPABILITY_EMBEDDING = "embedding"
   CAPABILITY_CODE = "code"
   CAPABILITY_REASONING = "reasoning"

   # Model → capability map (extend as needed)
   _MODEL_CAPABILITIES: dict[str, list[str]] = {
       "llama3.2": [CAPABILITY_CHAT],
       "llama3.2-vision": [CAPABILITY_CHAT, CAPABILITY_VISION],
       "llama3.1": [CAPABILITY_CHAT, CAPABILITY_CODE],
       "deepseek-r1:*": [CAPABILITY_CHAT, CAPABILITY_REASONING, CAPABILITY_CODE],
       "qwen2.5:*": [CAPABILITY_CHAT, CAPABILITY_CODE],
       "qwen2.5-vl:*": [CAPABILITY_CHAT, CAPABILITY_VISION],
       "phi4:*": [CAPABILITY_CHAT, CAPABILITY_CODE, CAPABILITY_REASONING],
       "mistral:*": [CAPABILITY_CHAT, CAPABILITY_CODE],
       "gemma3:*": [CAPABILITY_CHAT, CAPABILITY_VISION],
       "gpt-4*": [CAPABILITY_CHAT, CAPABILITY_CODE, CAPABILITY_VISION],
       "gpt-4o*": [CAPABILITY_CHAT, CAPABILITY_VISION, CAPABILITY_CODE],
       "gpt-4o-mini*": [CAPABILITY_CHAT, CAPABILITY_VISION],
       "claude-3-5-sonnet*": [CAPABILITY_CHAT, CAPABILITY_CODE, CAPABILITY_VISION],
       "claude-3-haiku*": [CAPABILITY_CHAT, CAPABILITY_CODE],
       "text-embedding*": [CAPABILITY_EMBEDDING],
   }


   @dataclass
   class RouterMatch:
       by_model: list[str] = field(default_factory=list)        # regex patterns
       by_capability: list[str] = field(default_factory=list)   # vision, embedding, chat, code, reasoning
       by_provider: list[str] = field(default_factory=list)     # source provider
       max_cost_per_1k: float = 0.0                             # 0 = no limit


   @dataclass
   class RouterRule:
       name: str = ""
       match: RouterMatch = field(default_factory=RouterMatch)
       providers: list[str] = field(default_factory=list)    # ordered fallback chain
       priority: int = 0
       enabled: bool = True


   @dataclass
   class ProviderMetrics:
       provider: str = ""
       total_calls: int = 0
       success_calls: int = 0
       total_latency_ms: int = 0
       avg_latency_ms: float = 0.0
       last_error: str = ""
       last_success_at: str = ""


   class LLMRouter:
       def __init__(self, gateway: LLMGateway, db=None):
           self._gateway = gateway
           self._db = db
           self._rules: list[RouterRule] = []
           self._metrics: dict[str, ProviderMetrics] = {}
           self._cache: OrderedDict[str, LLMResponse] = OrderedDict()
           self._cache_max_size: int = 1000
           self._cache_ttl_seconds: int = 300  # 5 min
           self._load_rules()

       def _load_rules(self):
           if not self._db:
               return
           rows = self._db.fetchall(
               "SELECT name, match_json, providers, priority, enabled"
               " FROM llm_router_rules ORDER BY priority DESC"
           )
           for row in rows:
               match_data = json.loads(row["match_json"]) if row["match_json"] else {}
               self._rules.append(RouterRule(
                   name=row["name"],
                   match=RouterMatch(**match_data),
                   providers=json.loads(row["providers"]) if row["providers"] else [],
                   priority=row["priority"],
                   enabled=bool(row["enabled"]),
               ))

       def save_rule(self, rule: RouterRule) -> bool:
           if not self._db:
               return False
           self._db.execute(
               """INSERT OR REPLACE INTO llm_router_rules
                  (name, match_json, providers, priority, enabled)
                  VALUES (?, ?, ?, ?, ?)""",
               (
                   rule.name,
                   json.dumps({
                       "by_model": rule.match.by_model,
                       "by_capability": rule.match.by_capability,
                       "by_provider": rule.match.by_provider,
                       "max_cost_per_1k": rule.match.max_cost_per_1k,
                   }),
                   json.dumps(rule.providers),
                   rule.priority,
                   1 if rule.enabled else 0,
               ),
           )
           self._load_rules()
           return True

       def delete_rule(self, name: str) -> bool:
           if not self._db:
               return False
           self._db.execute("DELETE FROM llm_router_rules WHERE name = ?", (name,))
           self._load_rules()
           return True

       def get_rules(self) -> list[dict]:
           return [
               {
                   "name": r.name,
                   "match": {
                       "byModel": r.match.by_model,
                       "byCapability": r.match.by_capability,
                       "byProvider": r.match.by_provider,
                       "maxCostPer1k": r.match.max_cost_per_1k,
                   },
                   "providers": r.providers,
                   "priority": r.priority,
                   "enabled": r.enabled,
               }
               for r in self._rules
           ]

       # ── Cache ──────────────────────────────────────────────────────────

       def _cache_key(self, req: LLMRequest) -> str:
           raw = f"{req.model}|{req.system}|{req.temperature}|{req.max_tokens}|{json.dumps([{'role': m.role, 'content': m.content} for m in req.messages])}"
           return hashlib.sha256(raw.encode()).hexdigest()

       def _cache_get(self, key: str) -> LLMResponse | None:
           if key in self._cache:
               self._cache.move_to_end(key)
               return self._cache[key]
           return None

       def _cache_set(self, key: str, resp: LLMResponse):
           self._cache[key] = resp
           if len(self._cache) > self._cache_max_size:
               self._cache.popitem(last=False)

       def clear_cache(self) -> int:
           count = len(self._cache)
           self._cache.clear()
           return count

       def get_cache_info(self) -> dict:
           return {"size": len(self._cache), "maxSize": self._cache_max_size}

       # ── Metrics ────────────────────────────────────────────────────────

       def _record_metrics(self, provider: str, success: bool, latency_ms: int, error: str = ""):
           if provider not in self._metrics:
               self._metrics[provider] = ProviderMetrics(provider=provider)
           m = self._metrics[provider]
           m.total_calls += 1
           if success:
               m.success_calls += 1
               m.total_latency_ms += latency_ms
               m.avg_latency_ms = m.total_latency_ms / m.success_calls
               m.last_success_at = datetime.now(timezone.utc).isoformat()
           else:
               m.last_error = error[:200]

       def get_metrics(self) -> list[dict]:
           return [
               {
                   "provider": m.provider,
                   "totalCalls": m.total_calls,
                   "successCalls": m.success_calls,
                   "avgLatencyMs": m.avg_latency_ms,
                   "lastError": m.last_error,
                   "lastSuccessAt": m.last_success_at,
               }
               for m in self._metrics.values()
           ]

       # ── Model capabilities ─────────────────────────────────────────────

       def _get_capabilities(self, model: str) -> list[str]:
           for pattern, caps in _MODEL_CAPABILITIES.items():
               if pattern.endswith(":*"):
                   prefix = pattern[:-2]
                   if model.startswith(prefix):
                       return caps
               elif re.fullmatch(pattern, model):
                   return caps
           return [CAPABILITY_CHAT]

       def _match_rule(self, req: LLMRequest, rule: RouterRule) -> bool:
           if not rule.enabled:
               return False
           m = rule.match
           
           # By model pattern
           if m.by_model:
               model = req.model or ""
               if not any(re.search(pat, model) for pat in m.by_model):
                   return False
           
           # By capability
           if m.by_capability:
               caps = self._get_capabilities(req.model or "")
               if not any(c in caps for c in m.by_capability):
                   return False
           
           # By provider
           if m.by_provider:
               req_provider = req.provider.value if isinstance(req.provider, LLMProvider) else str(req.provider)
               if req_provider not in m.by_provider:
                   return False
           
           return True

       def _resolve_providers(self, req: LLMRequest) -> list[str]:
           """Returns ordered list of provider strings for this request."""
           # 1. Check explicit rules (highest priority first)
           for rule in sorted(self._rules, key=lambda r: r.priority, reverse=True):
               if self._match_rule(req, rule):
                   return list(rule.providers)
           
           # 2. Default: use the request's provider or default
           provider = req.provider.value if isinstance(req.provider, LLMProvider) else str(req.provider)
           return [provider]

       # ── Main API ───────────────────────────────────────────────────────

       def generate(self, req: LLMRequest) -> LLMResponse:
           # 1. Check cache first
           ckey = self._cache_key(req)
           cached = self._cache_get(ckey)
           if cached is not None:
               logger.debug(f"Cache HIT for {req.model} ({ckey[:8]}...)")
               return cached
           
           # 2. Resolve provider chain
           providers = self._resolve_providers(req)
           
           # 3. Try each provider with fallback
           last_error = None
           for i, p in enumerate(providers):
               try:
                   req.provider = LLMProvider(p)
                   t1 = time.monotonic()
                   resp = self._gateway.generate(req)
                   t2 = time.monotonic()
                   latency_ms = int((t2 - t1) * 1000)
                   
                   self._record_metrics(p, True, latency_ms)
                   
                   # 4. Cache successful response
                   if not req.stream:
                       self._cache_set(ckey, resp)
                   
                   return resp
               except LLMError as e:
                   latency_ms = 0
                   self._record_metrics(p, False, 0, str(e))
                   last_error = e
                   logger.warning(f"Router: provider {p} failed, trying next... ({e})")
                   continue
           
           raise LLMError(
               f"LLMRouter: all {len(providers)} provider(s) failed for "
               f"model '{req.model}'. Last error: {last_error}"
           )

       def generate_stream(self, req: LLMRequest, on_chunk: Callable[[str], None]) -> bool:
           providers = self._resolve_providers(req)
           
           for p in providers:
               try:
                   req.provider = LLMProvider(p)
                   t1 = time.monotonic()
                   success = self._gateway.generate_stream(req, on_chunk)
                   t2 = time.monotonic()
                   latency_ms = int((t2 - t1) * 1000)
                   self._record_metrics(p, success, latency_ms)
                   return success
               except LLMError as e:
                   self._record_metrics(p, False, 0, str(e))
                   logger.warning(f"Router stream: provider {p} failed, trying next...")
                   continue
           
           return False
   ```

2. **File:** `backend/jarvis/migration_runner.py` — Add migration 13:
   ```python
   Migration(13, "llm-router-rules", """
       CREATE TABLE IF NOT EXISTS llm_router_rules (
           name TEXT PRIMARY KEY,
           match_json TEXT NOT NULL DEFAULT '{}',
           providers TEXT NOT NULL DEFAULT '[]',
           priority INTEGER NOT NULL DEFAULT 0,
           enabled INTEGER NOT NULL DEFAULT 1,
           created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
           updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       );
   """)
   ```

3. **File:** `backend/jarvis/bridge.py` — Add new bridge handlers:
   - `llmRouterGetRules()` → calls `self._llm_router.get_rules()`
   - `llmRouterSaveRule(data: dict)` → constructs `RouterRule` from dict, calls `self._llm_router.save_rule()`
   - `llmRouterDeleteRule(name: str)` → `self._llm_router.delete_rule(name)`
   - `llmRouterGetMetrics()` → `self._llm_router.get_metrics()`
   - `llmRouterClearCache()` → `self._llm_router.clear_cache()`
   - `llmRouterGetCacheInfo()` → `self._llm_router.get_cache_info()`

   Add `LLMRouter` to `JARVISBridge.__init__`:
   ```python
   from jarvis.llm_router import LLMRouter
   self._llm_router = LLMRouter(gateway=llm_gateway, db=db) if llm_gateway else None
   ```

4. **File:** `ui/src/types/index.ts` — Add types:
   ```typescript
   export interface RouterRule {
     name: string;
     match: {
       byModel: string[];
       byCapability: string[];
       byProvider: string[];
       maxCostPer1k: number;
     };
     providers: string[];
     priority: number;
     enabled: boolean;
   }

   export interface ProviderMetrics {
     provider: string;
     totalCalls: number;
     successCalls: number;
     avgLatencyMs: number;
     lastError: string;
     lastSuccessAt: string;
   }

   export interface RouterCacheInfo {
     size: number;
     maxSize: number;
   }
   ```

5. **File:** `ui/src/components/Settings/RouterPanel.tsx` (CREATE) — Full settings UI:
   - Tab with rule list (name, priority, match criteria, provider chain)
   - Add/edit rule form (modal or inline):
     - Rule name input
     - Match by model (comma-separated regex patterns)
     - Match by capability (checkboxes: chat, vision, embedding, code, reasoning)
     - Match by provider (checkboxes: ollama, openai, anthropic, native)
     - Max cost per 1k tokens (input)
     - Provider chain (reorderable list of providers)
     - Priority slider (0-100)
   - Metrics section: table showing per-provider stats
   - Cache section: size display + "Clear Cache" button
   - Uses `framer-motion` for animations (consistent with existing panels)

6. **File:** `ui/src/components/Settings/index.tsx` — Add `RouterPanel` to tab routing:
   - Add `'llm-router'` to `SettingsTab` union type (line 745)
   - Add case in settings content renderer

7. **File:** `ui/src/hooks/use-jarvis.ts` — Add bridge methods to `JarvisBridge` interface:
   ```typescript
   llmRouterGetRules(): Promise<RouterRule[]>;
   llmRouterSaveRule(rule: RouterRule): Promise<boolean>;
   llmRouterDeleteRule(name: string): Promise<boolean>;
   llmRouterGetMetrics(): Promise<ProviderMetrics[]>;
   llmRouterClearCache(): Promise<number>;
   llmRouterGetCacheInfo(): Promise<RouterCacheInfo>;
   ```

8. **Integration:** Replace direct `gateway.generate()` calls in `ToolAgent._run_loop()` (line 135-146) and `TaskPlanner` with `router.generate()`. The `bridge.py` `llmGenerate` method should also route through `LLMRouter`.

### Dependências
- `001_NativeProvider` — Native provider for full provider set
- `002_AutomaticFallback` — Fallback logic reused by router's cascading fallback
- `002_ProviderSelectorUI` — Provider awareness in UI (RouterPanel extends this)
- New DB migration (v13)

### Riscos e Mitigações
- **Risco:** Cache serves stale responses for identical prompts that should produce fresh output. **Mitigação:** Cache only non-streaming requests, respect `temperature=0` assumption. Add `no-cache` header/flag in request.
- **Risco:** Router rules become complex and hard to debug. **Mitigação:** Add rule testing UI ("Test this rule against a sample request"), priority-based ordering, and per-request routing explanation logging.
- **Risco:** Latency overhead from cache key hashing + rule matching. **Mitigação:** Cache key computed once per request; rule matching uses short-circuit eval; metrics collection uses simple counters. Profile with 1000+ concurrent requests.
- **Risco:** Model capability map falls out of sync with real models. **Mitigação:** Allow capability overrides per model via UI; auto-populate from `list_models()` results when available; fall back to `[chat]` if unknown.

## Use Cases
1. **Scenario 1 — Vision model routing**: User uploads an image in chat. `LLMRouter` detects image content (capability `vision` required), routes to first provider that offers a vision-capable model (e.g., `llama3.2-vision` on Ollama, or `gpt-4o` on OpenAI). Non-vision models are skipped entirely.
2. **Scenario 2 — Cost-aware code generation**: User has rule: if model matches `codellama|deepseek-coder`, use `ollama` (free). For `gpt-4*`, enforce `maxCostPer1k < 0.01`. The router checks each provider's cost before attempting, avoiding expensive API calls for trivial prompts.
3. **Scenario 3 — Burst traffic offload**: Ollama is primary for all chat. During high traffic, rule detects increased latency on Ollama (>5s avg). Router's built-in metrics trigger automatic reordering, pushing new requests to OpenAI temporarily. Metrics auto-reset after 5 min of normal latency.

## Test Cases
1. [ ] **Rule matching by model pattern**: Create rule with `byModel: ["llama.*"]` → route to `["openai"]`. Request model "llama3.2" → routes to OpenAI. Request "gpt-4" → no match, uses default provider.
2. [ ] **Capability-based routing**: Create rule `byCapability: ["vision"]` → `providers: ["ollama", "openai"]`. Request with vision model → uses rule. Request with chat model → skips rule.
3. [ ] **Cache hit/miss behavior**: Send request A → response stored. Send identical request B → response from cache (same content, different object reference). Verify `latency_ms ≈ 0` for cache hit. Verify B's content equals A's content.
4. [ ] **Cascading fallback through router**: Configure router with `providers: ["ollama", "openai"]`. Mock Ollama to fail. Verify response comes from OpenAI. Verify metrics show `ollama: success=false, openai: success=true`.
5. [ ] **Metrics accumulation**: Send 10 requests (7 success, 3 fail) across 2 providers. Verify `get_metrics()` returns `totalCalls=10, successCalls=7, avgLatencyMs` = meaningful average. Verify per-provider breakdown correct.
6. [ ] **Router as drop-in replacement**: Create `LLMRouter(gateway)` and call `router.generate(req)`. Compare response format with `gateway.generate(req)` — must be identical `LLMResponse` shape. No breaking changes to existing callers.

## Critérios de Aceitação
- [ ] Roteamento por modelo: qual provedor tem o modelo
- [ ] Roteamento por capacidade: chat vs visão vs embedding
- [ ] Fallback em cascata: Native → Ollama → OpenAI
- [ ] Cache de respostas (hash do prompt → resposta)
- [ ] Métricas de latência por provedor
- [ ] UI de configuração de regras de roteamento
- [ ] Provider proxy substitui chamadas diretas a provedores

## Fase
Fase 0 — Estabilização

## Prioridade
Média

## Esforço Estimado
Grande
