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

from jarvis.llm_gateway import LLMError, LLMGateway, LLMProvider, LLMRequest, LLMResponse

logger = logging.getLogger(__name__)

CAPABILITY_CHAT = "chat"
CAPABILITY_VISION = "vision"
CAPABILITY_EMBEDDING = "embedding"
CAPABILITY_CODE = "code"
CAPABILITY_REASONING = "reasoning"

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
    by_model: list[str] = field(default_factory=list)
    by_capability: list[str] = field(default_factory=list)
    by_provider: list[str] = field(default_factory=list)
    max_cost_per_1k: float = 0.0


@dataclass
class RouterRule:
    name: str = ""
    match: RouterMatch = field(default_factory=RouterMatch)
    providers: list[str] = field(default_factory=list)
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
        self._cache_ttl_seconds: int = 300
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

        if m.by_model:
            model = req.model or ""
            if not any(re.search(pat, model) for pat in m.by_model):
                return False

        if m.by_capability:
            caps = self._get_capabilities(req.model or "")
            if not any(c in caps for c in m.by_capability):
                return False

        if m.by_provider:
            req_provider = req.provider.value if isinstance(req.provider, LLMProvider) else str(req.provider)
            if req_provider not in m.by_provider:
                return False

        return True

    def _resolve_providers(self, req: LLMRequest) -> list[str]:
        for rule in sorted(self._rules, key=lambda r: r.priority, reverse=True):
            if self._match_rule(req, rule):
                return list(rule.providers)
        provider = req.provider.value if isinstance(req.provider, LLMProvider) else str(req.provider)
        return [provider]

    def generate(self, req: LLMRequest) -> LLMResponse:
        ckey = self._cache_key(req)
        cached = self._cache_get(ckey)
        if cached is not None:
            logger.debug("Cache HIT for %s (%s...)", req.model, ckey[:8])
            return cached

        providers = self._resolve_providers(req)
        last_error = None
        for i, p in enumerate(providers):
            try:
                req.provider = LLMProvider(p)
                t1 = time.monotonic()
                resp = self._gateway.generate(req)
                t2 = time.monotonic()
                latency_ms = int((t2 - t1) * 1000)
                self._record_metrics(p, True, latency_ms)
                if not req.stream:
                    self._cache_set(ckey, resp)
                return resp
            except LLMError as e:
                self._record_metrics(p, False, 0, str(e))
                last_error = e
                logger.warning("Router: provider %s failed, trying next... (%s)", p, e)
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
                logger.warning("Router stream: provider %s failed, trying next...", p)
                continue
        return False
