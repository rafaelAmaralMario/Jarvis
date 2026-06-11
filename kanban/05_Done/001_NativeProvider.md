# NativeProvider (llama-cpp-python)

## Descrição
Implementar `NativeProvider` como uma nova subclasse de `BaseLLMClient` no `LLMGateway`, usando `llama-cpp-python` para rodar modelos GGUF diretamente em processo (sem servidor externo). Incluir model cache para manter instância em memória entre chamadas, carregamento sob demanda, e suporte básico a chat completion.

## Análise Técnica

### Arquitetura

```
NativeLLMClient(BaseLLMClient)
├── __init__(config: LLMProviderConfig)
│   └── model_path = config.api_url (reuse field as directory path)
│   └── model_filename = config.default_model (GGUF filename)
│   └── _cache: dict[str, llama_cpp.Llama] (class-level dict)
│
├── generate(req: LLMRequest) -> LLMResponse
│   └── _get_model() → cache hit/load → llama.create_completion()
│
├── generate_stream(req, on_chunk)
│   └── same + stream=True → on_chunk each token
│
├── list_models() -> list[str]
│   └── glob *.gguf in configured directory
│
└── ping() -> bool
    └── try import llama_cpp, instantiate tiny model or just check import
```

Data flow:
1. User configures NativeProvider via UI: directory path + GGUF filename
2. `LLMGateway.get_llm_client()` returns `NativeLLMClient` via new LLMProvider.NATIVE branch
3. `ToolAgent.execute()` → `LLMGateway.generate()` → `NativeLLMClient.generate()` → `llama_cpp.Llama.create_completion()`
4. Model cached in memory by model path; subsequent calls reuse same instance

### Implementação Detalhada

- File: `backend/jarvis/llm_gateway.py:14` — Add `NATIVE = "native"` to `LLMProvider` enum
- File: `backend/jarvis/llm_gateway.py:49-57` — `LLMProviderConfig` remains unchanged; `api_url` holds GGUF directory path, `default_model` holds GGUF filename
- File: `backend/jarvis/llm_gateway.py:352-370` — Add branch in `get_llm_client()`:
  ```python
  elif config.provider == LLMProvider.NATIVE:
      client = NativeLLMClient(config)
  ```
- File: `backend/jarvis/llm_gateway.py` — New class `NativeLLMClient(BaseLLMClient)` after AnthropicClient (~line 350):
  - `_model_cache: ClassVar[dict[str, llama_cpp.Llama]] = {}`
  - `_lock: threading.Lock` for thread-safe cache access
  - `__init__`: store `model_dir` (from `api_url` or default `~/.jarvis/models/`), `model_filename` (from `default_model` or None)
  - `_get_model_path(model_name: str) -> str`: resolve full path
  - `_get_model(model_name: str) -> llama_cpp.Llama`: cache lookup, load on miss with `llama_cpp.Llama(model_path=path, n_ctx=4096, verbose=False)`
  - `generate()`: convert `LLMMessage` list to prompt via chat template or simple format, call `_get_model(req.model).create_completion(prompt, max_tokens=req.max_tokens, temperature=req.temperature, stop=["</s>", "<|eot_id|>"])`
  - `generate_stream()`: same with `stream=True`, yield tokens via `on_chunk`
  - `list_models()`: `glob.glob(os.path.join(self._model_dir, "*.gguf"))` return basenames
  - `ping()`: `try: import llama_cpp; return True; except ImportError: return False`
- File: `backend/jarvis/llm_gateway.py:380-411` — `_load_config()` should NOT auto-create default for native (user adds manually), but should handle `LLMProvider.NATIVE` when loading from DB
- File: `backend/pyproject.toml:21` — Add optional dependency group:
  ```toml
  native = ["llama-cpp-python>=0.3,<1"]
  ```
- File: `ui/src/components/Settings/LLMProvidersPanel.tsx:9` — Add icon entry:
  ```typescript
  native: '⚡',
  ```
- File: `ui/src/types/index.ts:416` — No change needed; LLMProviderInfo already generic
- File: `backend/jarvis/migration_runner.py:257` — Add INSERT for native provider with defaults (optional; created on first save via UI)

### Dependências
- `llama-cpp-python>=0.3,<1` (pip, optional `[native]` extra)
- `threading` (stdlib, already used)

### Riscos e Mitigações
| Risco | Mitigação |
|-------|-----------|
| `llama-cpp-python` não instalado | `ping()` retorna False; UI exibe "not available" |
| Modelo GGUF não encontrado | `_get_model()` levanta `LLMError` com path esperado |
| Modelo grande → OOM | Documentar requisitos de RAM; n_ctx configurável futuramente |
| Thread-safety no cache | `threading.Lock` no acesso ao `_model_cache` |
| Chat template incompatível | Começar com formato simples `"role: content\n"`; evoluir para `tokenizer.chat_template` |

## Use Cases
1. **Usuário sem GPU, sem Ollama**: Baixa GGUF de 3B params, configura NativeProvider, usa JARVIS sem servidor externo
2. **Offline/local crítico**: Desenvolvedor em ambiente air-gapped quer LLM local sem depender de Ollama
3. **Teste rápido de GGUF**: Usuário baixa GGUF experimental, aponta NativeProvider, testa sem configurar servidor

## Test Cases
1. [ ] `NativeLLMClient.ping()` returns `True` when `llama_cpp` is installed, `False` otherwise — mock import
2. [ ] `NativeLLMClient.list_models()` returns `.gguf` files from configured directory — create temp dir with dummy .gguf files
3. [ ] `NativeLLMClient.generate()` returns `LLMResponse` with content — mock `llama_cpp.Llama.create_completion()`
4. [ ] Model cache reuses same `Llama` instance for same model path — verify `id()` of cached objects
5. [ ] `LLMGateway.generate()` with `LLMProvider.NATIVE` routes to `NativeLLMClient` — integration test via gateway

## Critérios de Aceitação
- [ ] Adicionar `LLMProvider.NATIVE` ao enum
- [ ] Criar `NativeLLMClient(BaseLLMClient)` em `llm_gateway.py`
- [ ] Implementar `generate()` e `generate_stream()` usando `llama_cpp.Llama`
- [ ] Model cache (keep instance in memory por model path)
- [ ] Carregar modelo do path configurado (GGUF file)
- [ ] `list_models()` retorna modelos disponíveis em diretório configurado
- [ ] `ping()` verifica se lib está instalada e funcional
- [ ] Adicionar `llama-cpp-python` como dependência opcional em `pyproject.toml`
- [ ] Provider configurável via UI (LLMProvidersPanel)

## Dependências
- [ ] — (primeiro da fase)

## Fase
Fase 1 — LLM Dual Provider

## Prioridade
Alta

## Esforço Estimado
Grande
