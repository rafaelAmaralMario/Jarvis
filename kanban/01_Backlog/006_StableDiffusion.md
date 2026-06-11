# Stable Diffusion / Flux — Geração de Imagem

## Descrição
Integrar Stable Diffusion (SDXL, SD3) ou Flux para geração de imagem a partir de texto. Criar tool `generate_image` no ToolManager. Suporte a modelos locais via diffusers, configuração de steps, seed, tamanho, negativo prompt. Qualidade comparável a serviços cloud.

## Análise Técnica

### Arquitetura

```
User → Bridge.toolsExecute("generate_image", args) → ToolManager._handle_generate_image()
  → ImageGeneratorService (new module)
    → diffusers pipeline (GPU se disponível, CPU fallback)
    → PIL → bytes → salva em workspace/images/
  → ToolResult com path + base64 thumbnail
  → Frontend exibe via <img src="data:image/png;base64,...">
```

Novo módulo `backend/jarvis/image_service.py` encapsula carregamento de pipeline, cache de modelos, e scheduling de GPU. ToolManager recebe uma nova tool `generate_image` no `_register_tools()` com handler `_handle_generate_image`.

### Implementação Detalhada

1. File: `backend/jarvis/image_service.py` — classe `ImageGenerator`
   - `__init__(self, model_id: str = "stabilityai/stable-diffusion-xl-base-1.0")`: carrega pipeline com `torch.float16` se CUDA disponível, senão `torch.float32` CPU
   - `generate(prompt, negative_prompt, steps, seed, width, height, guidance_scale) → dict{path, base64, format}`
   - Usa `diffusers.StableDiffusionXLPipeline` para SDXL, `FluxPipeline` para Flux
   - Cache de pipeline por model_id (evita recarregar)
   - Gera seed com `random.randint(0, 2**32-1)` se seed=0
   - Output salvo em `workspace/images/jarvis_gen_{timestamp}.png`
   - Retorna base64 para preview inline + path para download

2. File: `backend/jarvis/tool_manager.py`
   - Em `_register_tools()` adicionar:
     ```python
     "generate_image": ToolDefinition(
         name="generate_image",
         description="Generate an image from a text prompt using Stable Diffusion or Flux.",
         parameters={
             "type": "object",
             "properties": {
                 "prompt": {"type": "string", "description": "Text description of the image"},
                 "negative_prompt": {"type": "string", "description": "Things to avoid in the image"},
                 "steps": {"type": "number", "description": "Inference steps (default: 30)", "default": 30},
                 "seed": {"type": "number", "description": "Random seed for reproducibility (0 = random)", "default": 0},
                 "width": {"type": "number", "description": "Image width (default: 1024)", "default": 1024},
                 "height": {"type": "number", "description": "Image height (default: 1024)", "default": 1024},
                 "guidance_scale": {"type": "number", "description": "CFG scale (default: 7.5)", "default": 7.5},
                 "model": {"type": "string", "description": "Model: sdxl, sd3, flux-schnell (default: sdxl)", "default": "sdxl"},
             },
             "required": ["prompt"],
         },
         risk=RiskLevel.SAFE,
         examples=["generate_image prompt='a cat wearing a top hat' steps=50"],
     )
     ```
   - Adicionar `_handle_generate_image(self, args) → ToolResult`
     - Instancia `ImageGenerator` se não existir em `self._image_generator`
     - Chama generate, retorna base64 + path
     - Trata `torch.cuda.OutOfMemoryError` com fallback para CPU

3. File: `backend/jarvis/bridge.py`
   - Nenhuma alteração necessária — `toolsExecute` já encaminha para `ToolManager.execute()`

4. File: `backend/pyproject.toml`
   - Adicionar `torch>=2.5,<3` (opcional, sinalizado como extra) e `diffusers>=0.32,<1`

5. File: `ui/src/types/index.ts`
   - Nenhuma alteração necessária — `ToolCallResult` já carrega `data` com `{base64, path}`

### Dependências
- pip: `torch>=2.5,<3` (size: ~2.5GB CUDA / ~800MB CPU — maior dependência do projeto)
- pip: `diffusers>=0.32,<1` (size: ~5MB, framework oficial HuggingFace para diffusion models)
- pip: `transformers>=4.47,<5` (size: ~8MB, necessário para text encoders dos pipelines)
- pip: `accelerate>=1.3,<2` (size: ~1MB, device map automático e offloading)

### Riscos e Mitigações
- **GPU Memory**: SDXL requer ~8GB VRAM. Mitigação: `torch.float16`, `device_map="auto"`, `enable_model_cpu_offload()`. Detectar VRAM com `torch.cuda.get_device_properties()` e emitir aviso se <8GB.
- **CPU-only**: Sequeência completa em CPU leva minutos. Mitigação: reduzir steps default para 20, habilitar `enable_attention_slicing()`.
- **Model Download**: Modelos pesados (~7GB SDXL). Mitigação: cache do HuggingFace, barra de progresso, usar `FluxPipeline` que é mais leve.
- **OOM Recovery**: Capturar `torch.cuda.OutOfMemoryError`, limpar cache com `torch.cuda.empty_cache()`, tentar CPU fallback.

## Use Cases
1. **Geração de ilustração técnica**: Usuário descreve "diagrama de arquitetura com 3 microserviços conectados por setas" → gera imagem conceitual para documentação
2. **Variação de logo/marca**: Prompt com descrição de logotipo + variações de cor → gera 4 variações com seeds diferentes
3. **Storyboard conceitual**: Gerar múltiplas cenas para um vídeo tutorial, cada cena com prompt descritivo

## Test Cases
1. [ ] Geração básica: `generate_image(prompt="um gato laranja")` → retorna ToolResult com `success=True`, `data["base64"]` string não vazia, imagem PNG válida
2. [ ] Reprodutibilidade: mesma seed produz mesma imagem — comparar hash SHA256 dos PNGs gerados com seed fixa
3. [ ] OOM recovery: simular falta de GPU (ou mock) → verificar fallback para CPU sem crash
4. [ ] Validação de parâmetros: `steps=-1` ou `width=0` → retorna erro sem crash do pipeline

## Critérios de Aceitação
- [ ] Instalar torch + diffusers
- [ ] Tool `generate_image`: prompt → imagem
- [ ] Suporte a SDXL, SD3, Flux schnell
- [ ] Parâmetros: steps, seed, tamanho, guidance_scale, negative_prompt
- [ ] Exibição da imagem no frontend
- [ ] Download da imagem gerada

## Dependências
- [ ] — (independente)

## Fase
Fase 3 — Visão & Imagem

## Prioridade
Média

## Esforço Estimado
Grande
