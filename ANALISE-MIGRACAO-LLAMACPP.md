# Análise de Migração: Ollama → llama-cpp-python

> Baseado no documento `migraçao-para-ollamacp.md` e na arquitetura atual do JARVIS
> Data: 10/06/2026

---

## 1. Situação Atual

O JARVIS usa **Ollama** como provedor LLM principal via `LLMGateway`:
- `OllamaClient` se comunica via REST API (`http://localhost:11434`)
- Modelos gerenciados via `ollama pull/list/delete`
- Suporte a chat, embeddings (parcial), visão (via API)

---

## 2. Proposta: Adicionar llama-cpp-python como Provedor

Não se trata de **substituir** o Ollama, mas de **adicionar** `llama-cpp-python` como um provedor alternativo no `LLMGateway`, permitindo escolha por modelo/uso.

---

## 3. Ganhos

### 3.1 Performance
| Aspecto | Ollama | llama-cpp-python |
|---|---|---|
| Overhead | ~200-300MB daemon rodando | Zero (in-process) |
| Latência (first token) | ~500ms-2s (HTTP + server) | ~100-500ms (direto) |
| Throughput (70B Q4) | ~8.2 t/s | ~10.1 t/s (+22%) |
| GPU utilization | Gerenciado pelo Ollama | Controle total (`n_gpu_layers`) |

### 3.2 Multimodal (VISÃO)
- Visão já funciona no Ollama (LLaVA, Gemma 3, Qwen-VL, Llama 3.2 Vision, Moondream)
- `llama-cpp-python` também suporta via `mmproj` + GGUF:
  - LLaVA 1.5/1.6, BakLLaVA, MiniCPM-V
  - Qwen2.5-VL, Gemma 3/4
  - Mesmo nível de suporte — **sem perdas**

### 3.3 Multimodal (ÁUDIO)
- **Ollama**: ❌ Não suporta áudio nativamente
- **llama-cpp-python**: ❌ Também não suporta áudio diretamente
- **Solução**: Integração com Whisper (já disponível via `openai-whisper` ou `faster-whisper`)
  - Transcrição → texto → LLM → independente do provedor

### 3.4 Multimodal (DOCUMENTOS)
- Ambos são LLMs de texto — precisam de parsing externo
- Já temos: `read_file` lê texto, `web_fetch` busca URLs
- Solução: adicionar parsing de PDF (.pdf), DOCX, XLSX, imagens (OCR via Tesseract/docling)
- **Independente do provedor** — benefício igual para ambos

### 3.5 Embeddings
- **Ollama**: Suporta `/api/embeddings` com modelos específicos (nomic-embed-text, etc.)
- **llama-cpp-python**: `llm.create_embedding()` — mesma API OpenAI-compatible
- Pode carregar modelos dedicados (snowflake-arctic-embed, BGE, etc.)
- **Ganho**: Controle fino sobre pooling mode, normalização

### 3.6 Tool Calling / Function Calling
| Modelo | Ollama | llama-cpp-python |
|---|---|---|
| Llama 3.1/3.3 | ✅ via JSON mode | ✅ grammar-constrained |
| Qwen 2.5 | ✅ | ✅ |
| Functionary v3 | ❌ | ✅ |
| Hermes 2/3 | ✅ | ✅ |
| Mistral Nemo | ✅ | ✅ |
| Genérico | ❌ | ✅ (grammar fallback) |

**Ganho crítico**: `llama-cpp-python` usa **grammar-constrained decoding** para garantir JSON válido na saída — o LLM **não consegue** gerar JSON inválido. Isso resolve o problema do `_extract_tool_call` falhar.

### 3.7 Embedding + RAG
- Geração de embeddings in-process (sem chamada HTTP)
- Ideal para pipeline de RAG: chunk → embed → search → generate
- Mais rápido que Ollama para operações em lote

### 3.8 Controle de Memória/Contexto
- Controle direto sobre `n_ctx` (tamanho do contexto)
- `n_gpu_layers` (quantas camadas na GPU)
- `batch_size`, `threads`, `use_mlock`
- Essencial para modelos grandes (70B, 90B, 120B+)

---

## 4. Perdas

### 4.1 Gerenciamento de Modelos
| Funcionalidade | Ollama | llama-cpp-python |
|---|---|---|
| `ollama pull nome:tag` | ✅ automático | ❌ manual (baixar .gguf) |
| `ollama list` | ✅ | ❌ |
| `ollama delete` | ✅ | ❌ |
| `ollama show` (detalhes) | ✅ | ❌ |
| Biblioteca de modelos | ✅ 100k+ | ❌ qualquer GGUF |

**Mitigação**: criar script `model_manager.py` que baixa GGUFs de Hugging Face + cache local.

### 4.2 API REST / Debug
- **Ollama**: `http://localhost:11434` — dá pra testar com curl, Postman, etc.
- **llama-cpp-python**: API REST opcional (roda servidor com `--api`), mas não é o foco

### 4.3 Concorrência
- **Ollama**: Gerencia fila de requisições concorrentes
- **llama-cpp-python**: Single-threaded por padrão — precisa gerenciar manualmente

### 4.4 Model Warm-up
- **Ollama**: Mantém modelo em memória entre chamadas
- **llama-cpp-python**: Descarrega se não usado — precisa manter referência

### 4.5 GPU Detection Automática
- **Ollama**: Detecta GPU NVIDIA/AMD e aloca automaticamente
- **llama-cpp-python**: Manual (`n_gpu_layers=-1` para tudo, ou valor específico)

---

## 5. Tabela Comparativa de Funcionalidades

| Funcionalidade | Ollama | llama-cpp-python | Impacto |
|---|---|---|---|
| Chat | ✅ | ✅ | Neutro |
| Streaming | ✅ | ✅ | Neutro |
| Tool Calling | ✅ (limitado) | ✅ (grammar) | **Ganho** |
| Embeddings | ✅ | ✅ | **Ganho** (mais rápido) |
| Visão (imagem) | ✅ | ✅ | Neutro |
| Áudio | ❌ | ❌ | Neutro (precisa Whisper) |
| Vídeo | ❌ (frames→imagem) | ❌ (frames→imagem) | Neutro |
| Documentos | ❌ (só texto) | ❌ (só texto) | Neutro |
| Câmera real-time | ❌ | ❌ | Neutro |
| Gerenciamento modelos | ✅ excelente | ❌ manual | **Perda** |
| API REST | ✅ | ✅ (opcional) | Neutro |
| Performance | Bom | **Melhor** (+10-22%) | **Ganho** |
| Debug fácil | ✅ (curl) | ⚠️ (via código) | **Perda leve** |
| Concorrência | ✅ built-in | ❌ manual | **Perda** |
| GPU automática | ✅ | ❌ manual | **Perda leve** |
| Flexibilidade | Limitado | **Total** | **Ganho** |
| Gramática JSON | ❌ | ✅ | **Ganho** |
| Modelos GGUF soltos | ❌ | ✅ | **Ganho** |

---

## 6. Plano de Implementação Recomendado

### Fase 1: Provedor Paralelo (1-2 dias)
1. Adicionar `LlamaCppProvider` no `LLMGateway` (seguindo padrão de `OllamaClient`)
2. Configurar cache de modelos (manter instância em memória)
3. Adicionar `set_model()` para trocar entre Ollama e llama-cpp

### Fase 2: Multimodal (3-5 dias)
4. Integrar **Whisper** para áudio → transcrição
5. Adicionar ferramenta `extract_text` para PDF, DOCX, XLSX (via unstructured.io / docling)
6. Adicionar ferramenta `capture_camera` para capturar frames de câmera
7. Adicionar ferramenta `analyze_image` para enviar imagem ao modelo vision

### Fase 3: RAG + Embeddings (2-3 dias)
8. Usar llama-cpp-python para embeddings (ou modelo dedicado BGE/snowflake)
9. Pipeline: documento → chunk → embed → vector store → search → contexto

### Fase 4: Remoção Gradual do Ollama (opcional)
10. Substituir `ollama pull` por download de GGUF do Hugging Face
11. Manter compatibilidade com ambos os provedores
12. Descontinuar Ollama apenas quando todos os fluxos estiverem cobertos

---

## 7. Recomendação Final

**Adicionar `llama-cpp-python` como provedor complementar — não substituir o Ollama.**

| Situação | Provedor Recomendado |
|---|---|
| Uso diário, chat rápido | llama-cpp-python (mais rápido) |
| Testar modelo novo | Ollama (`ollama pull`) |
| Tool calling complexo | llama-cpp-python (grammar) |
| Embeddings em lote | llama-cpp-python |
| Debug/desenvolvimento | Ollama (curl, testes) |
| Visão (imagem) | Ambos |
| Produção / server | Ollama (concorrência) |

**Ganhos líquidos**: +performance, +tool calling confiável, +controle, +flexibilidade
**Perdas líquidas**: -gerenciamento de modelos, -concorrência built-in, -facilidade de debug

---

## 8. Input Types Roadmap

```
Entrada                    Processamento                    Saída
─────────────────────────────────────────────────────────────────
⌨️  Texto                → LLM (qualquer)                 → Texto
📷  Imagem/Câmera       → LLM Vision                     → Descrição, análise
🎤  Áudio/Mic          → Whisper → texto                → Transcrição
🎬  Vídeo              → FFmpeg frames → LLM Vision     → Resumo, análise
📄  PDF/DOCX/XLSX      → docling/unstructured → texto   → Extração
🌐  URL/Web            → web_fetch → texto              → Resumo
📦  Arquivos           → read_file → texto              → Análise

Todos convergem para → LLM (Ollama OU llama-cpp-python) → Resultado
```

A LLMGateway já abstrai o provedor — a migração é **transparente** para o resto do sistema.
