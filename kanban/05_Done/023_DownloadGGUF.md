# Download de Modelos GGUF do Hugging Face

## Descrição
Implementar download de modelos GGUF diretamente do Hugging Face Hub (similar ao `ollama pull`). Tool `download_model`: nome do modelo/repo → download do GGUF. Catálogo de modelos recomendados. Gerenciamento de espaço em disco.

## Análise Técnica

### Arquitetura

```
Frontend (UI)
  └→ bridge.downloadGGUF(repo_id, filename)     # novo bridge handler
  └→ bridge.listGGUFModels()                     # lista modelos baixados
  └→ bridge.deleteGGUFModel(filename)            # deleta modelo
  └→ bridge.ggufCatalog()                        # catálogo recomendado

Backend (bridge.py → tool_manager.py)
  ├── ToolManager._handle_download_gguf(args)     # tool para o agent
  │   └→ huggingface_hub.hf_hub_download()
  │   └→ salva em ~/.jarvis/models/
  │   └→ streaming progress via yield ou callback
  │
  ├── GGUFManager (NEW class, opcional)
  │   ├── list_models() → [GGUFModel]
  │   ├── delete_model(name)
  │   ├── get_catalog() → recommended models
  │   └── get_disk_usage() → stats
  │
  └── Bridge handlers
      ├── ggufDownload(repo_id, filename) → bool
      ├── ggufList() → list[dict]
      ├── ggufDelete(name) → bool
      └── ggufCatalog() → list[dict]

NativeLLMClient
  └── list_models() → glob ~/.jarvis/models/*.gguf
```

O diretório padrão de modelos GGUF será `~/.jarvis/models/`, configurável via `LLMProviderConfig.api_url` do NativeProvider.

### Implementação Detalhada

- File: `backend/pyproject.toml` — Adicionar dependência:
  ```toml
  huggingface-hub>=0.27,<1
  ```
- File: `backend/jarvis/gguf_manager.py` — **New file**: classe `GGUFManager`:
  - `__init__(models_dir: str)`: diretório onde os GGUFs são armazenados
  - `list_models() -> list[dict]`: escaneia `models_dir` por `*.gguf`, retorna `[{name, size_bytes, path, modified_at}]`
  - `download_model(repo_id: str, filename: str, on_progress: Callable) -> str`: baixa do HF Hub via `hf_hub_download()`, retorna path local
  - `delete_model(name: str) -> bool`: deleta arquivo
  - `get_catalog() -> list[dict]`: retorna lista curada de modelos recomendados (hardcoded ou fetch de um JSON)
  - `get_disk_usage() -> dict`: total de espaço usado, disponível
- File: `backend/jarvis/tool_manager.py:365` — **Adicionar tool** `download_gguf`:
  - `ToolDefinition`: name=`download_gguf`, description, parameters=`{repo_id, filename}` 
  - `_handle_download_gguf(args)`: delega para `GGUFManager.download_model()`
- File: `backend/jarvis/bridge.py` — **Novos handlers** (após linha ~247):
  - `ggufDownload(repo_id: str, filename: str) -> bool`: download síncrono
  - `ggufList() -> list`: delega para `GGUFManager.list_models()`
  - `ggufDelete(name: str) -> bool`: delega para `GGUFManager.delete_model()`
  - `ggufCatalog() -> list`: delega para `GGUFManager.get_catalog()`
  - `ggufDiskUsage() -> dict`: delega para `GGUFManager.get_disk_usage()`
- File: `backend/jarvis/bridge.py:86-103` — Adicionar `GGUFManager` como dependência do `JARVISBridge.__init__()`
- File: `ui/src/components/Settings/GGUFSettings.tsx` — **New UI component** (ou integrar em `LLMProvidersPanel.tsx`):
  - Lista de modelos baixados (nome, tamanho, data)
  - Botão de download (input: repo_id + filename)
  - Botão de deletar
  - Catálogo de modelos recomendados com "Download" button
- File: `ui/src/types/index.ts` — Adicionar interfaces:
  ```typescript
  interface GGUFModelInfo { name: string; sizeBytes: number; path: string; modifiedAt: string; }
  interface GGUFModelCatalog { name: string; repoId: string; filename: string; description: string; size: string; }
  ```
- Catalog recomendado (~10 modelos em `GGUFManager.get_catalog()`):
  - `Qwen/Qwen2.5-1.5B-Instruct-GGUF: qwen2.5-1.5b-instruct-q4_k_m.gguf`
  - `Qwen/Qwen2.5-7B-Instruct-GGUF: qwen2.5-7b-instruct-q4_k_m.gguf`
  - `bartowski/Llama-3.2-3B-Instruct-GGUF: Llama-3.2-3B-Instruct-Q4_K_M.gguf`
  - `MaziyarPanahi/DeepSeek-R1-Distill-Qwen-7B-GGUF: DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf`

### Dependências
- `huggingface-hub>=0.27,<1` (pip)
- `GGUFManager` depende de `001_NativeProvider` (para o diretório de modelos)

### Riscos e Mitigações
| Risco | Mitigação |
|-------|-----------|
| Download de modelos grandes (7B+ = 4-8GB) sem progresso | Callback `on_progress` com `hf_hub_download(..., resume=True)` |
| Falta de espaço em disco | `get_disk_usage()` antes do download; abortar se espaço insuficiente |
| Repositório inválido ou filename errado | `requests.head()` antes do download para validar URL |
| Download interrompido | `hf_hub_download` já suporta resume parcial |
| Usuário sem HF token (rate limit) | Apenas modelos públicos; fallback para espelho alternativo |

## Use Cases
1. **Setup rápido**: Usuário novo abre JARVIS, vai em Settings > GGUF, clica "Download" no Llama-3.2-3B, em 2 minutos tem LLM local funcional
2. **Agent autônomo**: ToolAgent decide que precisa de um modelo menor para tarefa simples → chama `download_gguf(repo_id="Qwen/Qwen2.5-1.5B", filename="q4_k_m.gguf")` e depois configura NativeProvider
3. **Gerenciamento de espaço**: Usuário tem 5 modelos baixados (30GB), quer liberar espaço → `ggufList()` mostra tamanhos, `ggufDelete()` remove não usados

## Test Cases
1. [ ] `GGUFManager.download_model()` com repo_id válido baixa arquivo e retorna path — usar mock de `hf_hub_download`
2. [ ] `GGUFManager.list_models()` retorna modelos existentes no diretório — criar arquivos .gguf dummy
3. [ ] `GGUFManager.delete_model()` remove arquivo do disco — verificar `os.path.exists()`
4. [ ] `GGUFManager.get_catalog()` retorna lista de 10+ modelos com estrutura válida
5. [ ] `bridge.ggufDownload()` com repo inválido retorna `False` e loga erro
6. [ ] NativeProvider.list_models() lista modelos baixados via GGUFManager — integração entre os dois sistemas

## Critérios de Aceitação
- [x] Download de GGUF do Hugging Face Hub
- [x] Tool `download_model`: HF repo + filename → download
- [x] Barra de progresso do download
- [x] Catálogo de modelos recomendados (UI)
- [x] Gerenciamento de espaço (listar, deletar modelos)

## Dependências
- [ ] 001_NativeProvider

## Fase
Fase 1 — LLM Dual Provider

## Prioridade
Média

## Esforço Estimado
Pequeno

