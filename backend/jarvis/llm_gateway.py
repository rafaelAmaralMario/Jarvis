"""Multi-provider LLM Gateway — OpenAI, Anthropic, AWS Bedrock, Ollama."""

import atexit
import glob
import json
import logging
import os
import threading
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable

import httpx

logger = logging.getLogger(__name__)


class LLMProvider(Enum):
    OLLAMA = "ollama"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    BEDROCK = "bedrock"
    NATIVE = "native"


@dataclass
class LLMMessage:
    role: str = "user"
    content: str = ""


@dataclass
class LLMRequest:
    provider: LLMProvider = LLMProvider.OLLAMA
    model: str = ""
    messages: list[LLMMessage] = field(default_factory=list)
    system: str = ""
    temperature: float = 0.7
    max_tokens: int = 2048
    stream: bool = False
    grammar: str = ""
    images: list[str] = field(default_factory=list)


@dataclass
class LLMResponse:
    content: str = ""
    model: str = ""
    provider: LLMProvider = LLMProvider.OLLAMA
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: int = 0
    done: bool = False


@dataclass
class LLMProviderConfig:
    provider: LLMProvider = LLMProvider.OLLAMA
    api_key: str = ""
    api_url: str = ""
    default_model: str = ""
    enabled: bool = True
    models: list[str] = field(default_factory=list)


class LLMError(Exception):
    pass


class LLMFallbackError(LLMError):
    pass


@dataclass
class LLMFallbackConfig:
    provider: str = ""
    fallback_order: list[str] = field(default_factory=list)
    timeout_seconds: int = 30
    model_overrides: list[dict] = field(default_factory=list)


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


class BaseLLMClient(ABC):
    @abstractmethod
    def generate(self, req: LLMRequest) -> LLMResponse:
        ...

    @abstractmethod
    def generate_stream(self, req: LLMRequest, on_chunk: Callable[[str], None]) -> bool:
        ...

    @abstractmethod
    def list_models(self) -> list[str]:
        ...

    @abstractmethod
    def ping(self) -> bool:
        ...


class OllamaLLMClient(BaseLLMClient):
    def __init__(self, config: LLMProviderConfig):
        base_url = config.api_url or "http://localhost:11434"
        if base_url.endswith("/"):
            base_url = base_url[:-1]
        self._base_url = base_url
        self._client = httpx.Client(base_url=base_url, timeout=30.0)

    def _build_request_body(self, req: LLMRequest) -> dict:
        prompt_parts = []
        for msg in req.messages:
            prompt_parts.append(f"{msg.role}: {msg.content}")
        prompt = "\n".join(prompt_parts)
        body: dict = {
            "model": req.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": req.temperature,
                "num_predict": req.max_tokens,
            },
        }
        if req.system:
            body["system"] = req.system
        if req.images:
            body["images"] = req.images
        return body

    def generate(self, req: LLMRequest) -> LLMResponse:
        body = self._build_request_body(req)
        body["stream"] = False
        t1 = time.monotonic()
        resp = self._client.post("/api/generate", json=body, timeout=120.0)
        t2 = time.monotonic()
        if resp.status_code == 404:
            try:
                err_data = resp.json()
                err_msg = err_data.get("error", "")
            except Exception:
                err_msg = resp.text
            raise LLMError(
                f"Modelo '{req.model}' não encontrado no Ollama. "
                f"Detalhe: {err_msg}"
            )
        resp.raise_for_status()
        data = resp.json()
        return LLMResponse(
            content=data.get("response", ""),
            model=req.model,
            provider=LLMProvider.OLLAMA,
            prompt_tokens=data.get("prompt_eval_count", 0),
            completion_tokens=data.get("eval_count", 0),
            latency_ms=int((t2 - t1) * 1000),
            done=data.get("done", False),
        )

    def generate_stream(self, req: LLMRequest, on_chunk: Callable[[str], None]) -> bool:
        body = self._build_request_body(req)
        body["stream"] = True
        with self._client.stream("POST", "/api/generate", json=body, timeout=120.0) as resp:
            if resp.status_code == 404:
                try:
                    err_data = resp.json()
                    err_msg = err_data.get("error", "")
                except Exception:
                    err_msg = ""
                raise LLMError(
                    f"Modelo '{req.model}' não encontrado no Ollama. "
                    f"Disponíveis: {[m.get('name') for m in self._client.get('/api/tags').json().get('models', [])]}. "
                    f"Detalhe: {err_msg}"
                )
            resp.raise_for_status()
            for line in resp.iter_lines():
                if not line:
                    continue
                data = json.loads(line)
                if isinstance(data, dict) and "response" in data:
                    on_chunk(data["response"])
        return True

    def list_models(self) -> list[str]:
        resp = self._client.get("/api/tags")
        resp.raise_for_status()
        data = resp.json()
        return [m.get("name", "") for m in data.get("models", [])]

    def ping(self) -> bool:
        try:
            resp = self._client.get("/api/tags")
            return resp.status_code == 200
        except Exception:
            return False


class OpenAIClient(BaseLLMClient):
    def __init__(self, config: LLMProviderConfig):
        self._api_key = config.api_key or os.environ.get("OPENAI_API_KEY", "")
        base_url = config.api_url or "https://api.openai.com/v1"
        if base_url.endswith("/"):
            base_url = base_url[:-1]
        self._base_url = base_url
        self._client = httpx.Client(
            base_url=base_url,
            timeout=60.0,
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
        )

    def _build_messages(self, req: LLMRequest) -> list[dict]:
        messages = []
        if req.system:
            messages.append({"role": "system", "content": req.system})
        for msg in req.messages:
            messages.append({"role": msg.role, "content": msg.content})
        return messages

    def generate(self, req: LLMRequest) -> LLMResponse:
        body = {
            "model": req.model,
            "messages": self._build_messages(req),
            "temperature": req.temperature,
            "max_tokens": req.max_tokens,
            "stream": False,
        }
        t1 = time.monotonic()
        resp = self._client.post("/chat/completions", json=body, timeout=120.0)
        t2 = time.monotonic()
        if resp.status_code != 200:
            raise LLMError(f"OpenAI API error: {resp.status_code} - {resp.text}")
        data = resp.json()
        choice = data.get("choices", [{}])[0]
        usage = data.get("usage", {})
        return LLMResponse(
            content=choice.get("message", {}).get("content", ""),
            model=data.get("model", req.model),
            provider=LLMProvider.OPENAI,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            latency_ms=int((t2 - t1) * 1000),
            done=True,
        )

    def generate_stream(self, req: LLMRequest, on_chunk: Callable[[str], None]) -> bool:
        body = {
            "model": req.model,
            "messages": self._build_messages(req),
            "temperature": req.temperature,
            "max_tokens": req.max_tokens,
            "stream": True,
        }
        with self._client.stream("POST", "/chat/completions", json=body, timeout=120.0) as resp:
            if resp.status_code != 200:
                raise LLMError(f"OpenAI API error: {resp.status_code}")
            for line in resp.iter_lines():
                if not line or line == "data: [DONE]":
                    continue
                if line.startswith("data: "):
                    try:
                        data = json.loads(line[6:])
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            on_chunk(content)
                    except json.JSONDecodeError:
                        pass
        return True

    def list_models(self) -> list[str]:
        resp = self._client.get("/models")
        resp.raise_for_status()
        data = resp.json()
        return [m["id"] for m in data.get("data", [])]

    def ping(self) -> bool:
        try:
            resp = self._client.get("/models")
            return resp.status_code == 200
        except Exception:
            return False


class AnthropicClient(BaseLLMClient):
    def __init__(self, config: LLMProviderConfig):
        self._api_key = config.api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        base_url = config.api_url or "https://api.anthropic.com/v1"
        if base_url.endswith("/"):
            base_url = base_url[:-1]
        self._base_url = base_url
        self._client = httpx.Client(
            base_url=base_url,
            timeout=60.0,
            headers={
                "x-api-key": self._api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
        )

    def _build_messages(self, req: LLMRequest) -> list[dict]:
        return [{"role": msg.role, "content": msg.content} for msg in req.messages]

    def generate(self, req: LLMRequest) -> LLMResponse:
        body = {
            "model": req.model,
            "messages": self._build_messages(req),
            "max_tokens": req.max_tokens,
            "temperature": req.temperature,
        }
        if req.system:
            body["system"] = req.system
        t1 = time.monotonic()
        resp = self._client.post("/messages", json=body, timeout=120.0)
        t2 = time.monotonic()
        if resp.status_code != 200:
            raise LLMError(f"Anthropic API error: {resp.status_code} - {resp.text}")
        data = resp.json()
        content = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                content += block.get("text", "")
        usage = data.get("usage", {})
        return LLMResponse(
            content=content,
            model=data.get("model", req.model),
            provider=LLMProvider.ANTHROPIC,
            prompt_tokens=usage.get("input_tokens", 0),
            completion_tokens=usage.get("output_tokens", 0),
            latency_ms=int((t2 - t1) * 1000),
            done=True,
        )

    def generate_stream(self, req: LLMRequest, on_chunk: Callable[[str], None]) -> bool:
        body = {
            "model": req.model,
            "messages": self._build_messages(req),
            "max_tokens": req.max_tokens,
            "temperature": req.temperature,
            "stream": True,
        }
        if req.system:
            body["system"] = req.system
        with self._client.stream("POST", "/messages", json=body, timeout=120.0) as resp:
            if resp.status_code != 200:
                raise LLMError(f"Anthropic API error: {resp.status_code}")
            for line in resp.iter_lines():
                if not line or not line.startswith("data: "):
                    continue
                try:
                    data = json.loads(line[6:])
                    if data.get("type") == "content_block_delta":
                        delta = data.get("delta", {})
                        if delta.get("type") == "text_delta":
                            on_chunk(delta.get("text", ""))
                except json.JSONDecodeError:
                    pass
        return True

    def list_models(self) -> list[str]:
        resp = self._client.get("/models")
        resp.raise_for_status()
        data = resp.json()
        return [m["id"] for m in data.get("data", [])]

    def ping(self) -> bool:
        try:
            resp = self._client.get("/models")
            return resp.status_code == 200
        except Exception:
            return False


class NativeLLMClient(BaseLLMClient):
    """LLM client using llama-cpp-python to run GGUF models natively (in-process)."""

    _model_cache: dict[str, Any] = {}
    _lock = threading.Lock()

    def __init__(self, config: LLMProviderConfig):
        self._model_dir = config.api_url or os.path.expanduser("~/.jarvis/models")
        self._model_filename = config.default_model or ""
        self._tool_grammar: str | None = self._load_grammar()

    @staticmethod
    def _load_grammar() -> str | None:
        grammar_path = os.path.join(os.path.dirname(__file__), "grammars", "tool_call.gbnf")
        if os.path.isfile(grammar_path):
            with open(grammar_path, encoding="utf-8") as f:
                return f.read()
        return None

    def _get_model_path(self, model_name: str = "") -> str:
        name = model_name or self._model_filename
        if os.path.isabs(name):
            return name
        return os.path.join(self._model_dir, name)

    def _get_model(self, model_name: str = ""):
        path = self._get_model_path(model_name)
        if not os.path.isfile(path):
            raise LLMError(f"GGUF model not found at: {path}")
        with NativeLLMClient._lock:
            if path not in NativeLLMClient._model_cache:
                try:
                    from llama_cpp import Llama
                except ImportError:
                    raise LLMError(
                        "llama-cpp-python not installed. "
                        "Run: pip install jarvis-backend[native]"
                    )
                NativeLLMClient._model_cache[path] = Llama(
                    model_path=path, n_ctx=4096, verbose=False
                )
            return NativeLLMClient._model_cache[path]

    def _build_prompt(self, req: LLMRequest) -> str:
        parts = []
        if req.system:
            parts.append(f"system: {req.system}")
        for msg in req.messages:
            parts.append(f"{msg.role}: {msg.content}")
        parts.append("assistant:")
        return "\n".join(parts)

    def generate(self, req: LLMRequest) -> LLMResponse:
        model = self._get_model(req.model)
        prompt = self._build_prompt(req)
        kwargs: dict[str, Any] = dict(
            max_tokens=req.max_tokens,
            temperature=req.temperature,
            stop=["</s>", "<|eot_id|>"],
        )
        # Apply GBNF grammar for tool calling when explicitly requested
        if req.grammar:
            kwargs["grammar"] = req.grammar
        t1 = time.monotonic()
        result = model.create_completion(prompt, **kwargs)
        t2 = time.monotonic()
        content = result.get("choices", [{}])[0].get("text", "")
        usage = result.get("usage", {})
        return LLMResponse(
            content=content,
            model=req.model or self._model_filename,
            provider=LLMProvider.NATIVE,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            latency_ms=int((t2 - t1) * 1000),
            done=True,
        )

    def generate_stream(self, req: LLMRequest, on_chunk: Callable[[str], None]) -> bool:
        model = self._get_model(req.model)
        prompt = self._build_prompt(req)
        kwargs: dict[str, Any] = dict(
            max_tokens=req.max_tokens,
            temperature=req.temperature,
            stop=["</s>", "<|eot_id|>"],
            stream=True,
        )
        if req.grammar:
            kwargs["grammar"] = req.grammar
        for result in model.create_completion(prompt, **kwargs):
            choice = result.get("choices", [{}])[0]
            text = choice.get("text", "")
            if text:
                on_chunk(text)
        return True

    def list_models(self) -> list[str]:
        pattern = os.path.join(self._model_dir, "*.gguf")
        return sorted(os.path.basename(p) for p in glob.glob(pattern))

    def ping(self) -> bool:
        try:
            import llama_cpp  # noqa: F401
            return True
        except ImportError:
            return False


_CLIENT_CACHE: dict[str, BaseLLMClient] = {}


def _close_all_clients():
    for key, client in list(_CLIENT_CACHE.items()):
        c = getattr(client, "_client", None)
        if isinstance(c, httpx.Client):
            try:
                c.close()
            except Exception:
                pass
        del _CLIENT_CACHE[key]


atexit.register(_close_all_clients)


def get_llm_client(config: LLMProviderConfig) -> BaseLLMClient:
    key = f"{config.provider.value}:{config.api_url}"
    if key in _CLIENT_CACHE:
        return _CLIENT_CACHE[key]
    if config.provider == LLMProvider.OLLAMA:
        client = OllamaLLMClient(config)
    elif config.provider == LLMProvider.OPENAI:
        client = OpenAIClient(config)
    elif config.provider == LLMProvider.ANTHROPIC:
        client = AnthropicClient(config)
    elif config.provider == LLMProvider.BEDROCK:
        raise LLMError("AWS Bedrock provider not yet implemented")
    elif config.provider == LLMProvider.NATIVE:
        client = NativeLLMClient(config)
    else:
        raise LLMError(f"Unknown provider: {config.provider}")
    _CLIENT_CACHE[key] = client
    return client


class LLMGateway:
    def __init__(self, db):
        self._db = db
        self._providers: dict[str, LLMProviderConfig] = {}
        self._default_provider = LLMProvider.OLLAMA
        self._fallback_configs: dict[str, LLMFallbackConfig] = {}
        self._load_config()

    def _load_config(self):
        rows = self._db.fetchall(
            "SELECT provider, api_key, api_url, default_model, enabled, models"
            " FROM llm_providers ORDER BY provider"
        )
        for row in rows:
            cfg = LLMProviderConfig(
                provider=LLMProvider(row["provider"]),
                api_key=row["api_key"] or "",
                api_url=row["api_url"] or "",
                default_model=row["default_model"] or "",
                enabled=bool(row["enabled"]),
                models=json.loads(row["models"]) if row["models"] else [],
            )
            self._providers[row["provider"]] = cfg

        default_row = self._db.fetchone(
            "SELECT value FROM system_config WHERE key = 'llm_default_provider'"
        )
        if default_row and default_row["value"]:
            try:
                self._default_provider = LLMProvider(default_row["value"])
            except ValueError:
                pass

        if "ollama" not in self._providers:
            self._providers["ollama"] = LLMProviderConfig(
                provider=LLMProvider.OLLAMA,
                api_url="http://localhost:11434",
                default_model="llama3.2",
                enabled=True,
            )

        if "native" not in self._providers:
            models_dir = os.path.expanduser("~/.jarvis/models")
            gguf_files = glob.glob(os.path.join(models_dir, "*.gguf"))
            if gguf_files:
                first_model = os.path.basename(gguf_files[0])
                self._providers["native"] = LLMProviderConfig(
                    provider=LLMProvider.NATIVE,
                    api_url=models_dir,
                    default_model=first_model,
                    enabled=True,
                    models=[os.path.basename(f) for f in gguf_files],
                )
                logger.info(
                    "NATIVE provider auto-registrado com %d modelo(s) GGUF em %s",
                    len(gguf_files), models_dir,
                )

        self._load_fallback_config()

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

    def get_fallback_configs(self) -> list[dict]:
        return [
            {
                "provider": cfg.provider,
                "fallbackOrder": cfg.fallback_order,
                "timeoutSeconds": cfg.timeout_seconds,
                "modelOverrides": cfg.model_overrides,
            }
            for cfg in self._fallback_configs.values()
        ]

    def save_fallback_config(self, config: dict) -> bool:
        self._db.execute(
            """INSERT OR REPLACE INTO llm_fallback_config
               (provider, fallback_order, timeout_seconds, model_overrides)
               VALUES (?, ?, ?, ?)""",
            (
                config["provider"],
                json.dumps(config.get("fallbackOrder", [])),
                config.get("timeoutSeconds", 30),
                json.dumps(config.get("modelOverrides", [])),
            ),
        )
        self._fallback_configs[config["provider"]] = LLMFallbackConfig(
            provider=config["provider"],
            fallback_order=config.get("fallbackOrder", []),
            timeout_seconds=config.get("timeoutSeconds", 30),
            model_overrides=config.get("modelOverrides", []),
        )
        return True

    def save_provider(self, config: LLMProviderConfig) -> bool:
        self._db.execute(
            """INSERT OR REPLACE INTO llm_providers
               (provider, api_key, api_url, default_model, enabled, models)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                config.provider.value,
                config.api_key,
                config.api_url,
                config.default_model,
                1 if config.enabled else 0,
                json.dumps(config.models),
            ),
        )
        self._providers[config.provider.value] = config
        _CLIENT_CACHE.pop(f"{config.provider.value}:{config.api_url}", None)
        return True

    def get_providers(self) -> list[dict]:
        return [
            {
                "provider": cfg.provider.value,
                "apiUrl": cfg.api_url,
                "defaultModel": cfg.default_model,
                "enabled": cfg.enabled,
                "models": cfg.models,
                "hasKey": bool(cfg.api_key),
            }
            for cfg in self._providers.values()
        ]

    def get_provider(self, provider: str) -> dict | None:
        cfg = self._providers.get(provider)
        if not cfg:
            return None
        return {
            "provider": cfg.provider.value,
            "apiUrl": cfg.api_url,
            "defaultModel": cfg.default_model,
            "enabled": cfg.enabled,
            "models": cfg.models,
            "hasKey": bool(cfg.api_key),
        }

    def set_default_provider(self, provider: str) -> bool:
        try:
            p = LLMProvider(provider)
        except ValueError:
            return False
        self._default_provider = p
        self._db.execute(
            "INSERT OR REPLACE INTO system_config (key, value) VALUES ('llm_default_provider', ?)",
            (provider,),
        )
        return True

    def get_default_provider(self) -> str:
        return self._default_provider.value

    def test_connection(self, provider: str) -> dict:
        cfg = self._providers.get(provider)
        if not cfg:
            return {"success": False, "error": "Provider not configured"}
        try:
            client = get_llm_client(cfg)
            ok = client.ping()
            models = client.list_models() if ok else []
            return {
                "success": ok,
                "models": models,
                "error": "" if ok else "Connection failed",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _build_fallback_order(self, provider_str: str) -> list[str]:
        fallback_cfg = self._fallback_configs.get(provider_str)
        if fallback_cfg:
            return [provider_str] + fallback_cfg.fallback_order
        ordered = [provider_str]
        for p in [LLMProvider.OPENAI, LLMProvider.ANTHROPIC, LLMProvider.NATIVE]:
            p_str = p.value
            if p_str != provider_str and p_str in self._providers and self._providers[p_str].enabled:
                ordered.append(p_str)
        return ordered

    def _try_provider(self, provider_str: str, req: LLMRequest, timeout: int) -> LLMResponse:
        cfg = self._providers.get(provider_str)
        if not cfg or not cfg.enabled:
            raise LLMError(f"Provider '{provider_str}' not configured or disabled")
        attempt_req = copy_request(req)
        attempt_req.provider = LLMProvider(provider_str)
        if not attempt_req.model and cfg.default_model:
            attempt_req.model = cfg.default_model
        client = get_llm_client(cfg)
        if isinstance(client, (OllamaLLMClient, OpenAIClient, AnthropicClient)):
            import httpx
            client._client.timeout = httpx.Timeout(timeout)
        resp = client.generate(attempt_req)
        resp.provider = LLMProvider(provider_str)
        return resp

    def _try_provider_stream(self, provider_str: str, req: LLMRequest, timeout: int, on_chunk: Callable[[str], None]) -> bool:
        cfg = self._providers.get(provider_str)
        if not cfg or not cfg.enabled:
            raise LLMError(f"Provider '{provider_str}' not configured or disabled")
        attempt_req = copy_request(req)
        attempt_req.provider = LLMProvider(provider_str)
        if not attempt_req.model and cfg.default_model:
            attempt_req.model = cfg.default_model
        client = get_llm_client(cfg)
        if isinstance(client, (OllamaLLMClient, OpenAIClient, AnthropicClient)):
            import httpx
            client._client.timeout = httpx.Timeout(timeout)
        return client.generate_stream(attempt_req, on_chunk)

    def generate(self, req: LLMRequest) -> LLMResponse:
        provider_str = req.provider.value if isinstance(req.provider, LLMProvider) else req.provider
        cfg = self._providers.get(provider_str)
        if not cfg:
            cfg = self._providers.get(self._default_provider.value)
        if not cfg:
            raise LLMError(f"No configuration for provider: {provider_str}")

        if not req.model and cfg.default_model:
            req.model = cfg.default_model
        if isinstance(req.provider, str):
            req.provider = LLMProvider(provider_str)

        primary = cfg.provider.value
        ordered = self._build_fallback_order(primary)
        fallback_cfg = self._fallback_configs.get(primary)
        timeout = fallback_cfg.timeout_seconds if fallback_cfg else 30
        errors: list[str] = []

        for attempt_provider in ordered:
            try:
                resp = self._try_provider(attempt_provider, req, timeout)
                if attempt_provider != primary:
                    logger.info("Fallback ativo: %s -> %s para modelo %s", primary, attempt_provider, req.model)
                return resp
            except Exception as e:
                errors.append(f"{attempt_provider}: {e}")
                logger.warning("Provedor %s falhou: %s", attempt_provider, e)
                continue

        raise LLMError(
            f"Todos os provedores falharam para modelo '{req.model}'. "
            f"Erros: {'; '.join(errors)}"
        )

    def generate_stream(self, req: LLMRequest, on_chunk: Callable[[str], None]) -> bool:
        provider_str = req.provider.value if isinstance(req.provider, LLMProvider) else req.provider
        cfg = self._providers.get(provider_str)
        if not cfg:
            cfg = self._providers.get(self._default_provider.value)
        if not cfg:
            raise LLMError(f"No configuration for provider: {provider_str}")

        if not req.model and cfg.default_model:
            req.model = cfg.default_model
        if isinstance(req.provider, str):
            req.provider = LLMProvider(provider_str)

        primary = cfg.provider.value
        ordered = self._build_fallback_order(primary)
        fallback_cfg = self._fallback_configs.get(primary)
        timeout = fallback_cfg.timeout_seconds if fallback_cfg else 30
        errors: list[str] = []

        for attempt_provider in ordered:
            try:
                result = self._try_provider_stream(attempt_provider, req, timeout, on_chunk)
                if attempt_provider != primary:
                    logger.info("Fallback ativo (stream): %s -> %s para modelo %s", primary, attempt_provider, req.model)
                return result
            except Exception as e:
                errors.append(f"{attempt_provider}: {e}")
                logger.warning("Provedor %s falhou: %s", attempt_provider, e)
                continue

        raise LLMError(
            f"Todos os provedores falharam para modelo '{req.model}'. "
            f"Erros: {'; '.join(errors)}"
        )
