import json
from dataclasses import dataclass, field
from typing import Callable

import httpx


@dataclass
class OllamaGenerateRequest:
    model: str
    prompt: str
    system: str = ""
    temperature: float = 0.7
    max_tokens: int = 2048
    stream: bool = False


@dataclass
class OllamaGenerateResponse:
    response: str = ""
    done: bool = False
    prompt_eval_count: int = 0
    eval_count: int = 0
    latency_ms: int = 0


@dataclass
class OllamaModel:
    name: str = ""
    modified_at: str = ""
    size_bytes: int = 0
    digest: str = ""
    details: str = ""


class OllamaError(Exception):
    pass


class OllamaClient:
    def __init__(self, base_url: str = "http://localhost:11434"):
        base_url = base_url or "http://localhost:11434"
        if base_url.endswith("/"):
            base_url = base_url[:-1]
        self._base_url = base_url
        self._client = httpx.Client(base_url=base_url, timeout=30.0)

    def close(self) -> None:
        self._client.close()

    def ping(self) -> bool:
        try:
            resp = self._client.get("/api/tags")
            return resp.status_code == 200
        except Exception:
            return False

    def list_models(self) -> list[OllamaModel]:
        try:
            resp = self._client.get("/api/tags")
            resp.raise_for_status()
        except httpx.ConnectError:
            raise OllamaError(
                "Não foi possível conectar ao servidor Ollama em "
                f"{self._base_url}. Execute 'ollama serve' ou inicie "
                "pela interface Settings → Models."
            )
        except httpx.HTTPStatusError:
            raise OllamaError(
                f"Ollama retornou erro HTTP {resp.status_code}. "
                "Verifique se o servidor está funcionando."
            )
        data = resp.json()
        models: list[OllamaModel] = []
        for m in data.get("models", []):
            model = OllamaModel(
                name=m.get("name", ""),
                modified_at=m.get("modified_at", ""),
                size_bytes=m.get("size", 0),
                digest=m.get("digest", ""),
            )
            details = m.get("details", {})
            families = details.get("families", [])
            if families:
                model.details = families[0]
            models.append(model)
        return models

    def pull_model(self, name: str) -> bool:
        try:
            body = {"name": name, "stream": False}
            resp = self._client.post("/api/pull", json=body, timeout=300.0)
            resp.raise_for_status()
            data = resp.json()
            return data.get("status") == "success"
        except httpx.ConnectError:
            raise OllamaError(
                f"Não foi possível conectar ao servidor Ollama em {self._base_url} "
                "para baixar o modelo."
            )

    def delete_model(self, name: str) -> bool:
        try:
            body = json.dumps({"name": name})
            resp = self._client.request("DELETE", "/api/delete", content=body)
            return resp.status_code == 200
        except httpx.ConnectError:
            raise OllamaError(
                f"Não foi possível conectar ao servidor Ollama em {self._base_url} "
                "para excluir o modelo."
            )

    def generate(self, req: OllamaGenerateRequest) -> OllamaGenerateResponse:
        import time
        body: dict = {
            "model": req.model,
            "prompt": req.prompt,
            "stream": False,
            "options": {
                "temperature": req.temperature,
                "num_predict": req.max_tokens,
            },
        }
        if req.system:
            body["system"] = req.system

        t1 = time.monotonic()
        resp = self._client.post("/api/generate", json=body, timeout=120.0)
        t2 = time.monotonic()

        resp.raise_for_status()
        data = resp.json()

        return OllamaGenerateResponse(
            response=data.get("response", ""),
            done=data.get("done", False),
            prompt_eval_count=data.get("prompt_eval_count", 0),
            eval_count=data.get("eval_count", 0),
            latency_ms=int((t2 - t1) * 1000),
        )

    def generate_stream(
        self,
        req: OllamaGenerateRequest,
        on_chunk: Callable[[str], None],
    ) -> bool:
        body: dict = {
            "model": req.model,
            "prompt": req.prompt,
            "stream": True,
            "options": {
                "temperature": req.temperature,
                "num_predict": req.max_tokens,
            },
        }
        if req.system:
            body["system"] = req.system

        with self._client.stream("POST", "/api/generate", json=body, timeout=120.0) as resp:
            resp.raise_for_status()
            for line in resp.iter_lines():
                if not line:
                    continue
                data = json.loads(line)
                if isinstance(data, dict) and "response" in data:
                    on_chunk(data["response"])
            return True
