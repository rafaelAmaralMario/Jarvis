# 📋 LOG — JARVIS Kanban

> Timeline cronológica de todas as alterações no kanban.
> Formato: `YYYY-MM-DD HH:MM — descrição`

---

## 2026-06-10

- `09:34` — Criação inicial do kanban. Estrutura de pastas criada.
- `09:34` — Todos os cards de tarefas gerados (Done, Ready For Work, Backlog).
- `09:34` — Card `001_NativeProvider` movido para **In Progress** como próximo passo.

## 2026-06-11

- `07:15` — Implementação do NativeProvider (`LLMProvider.NATIVE`, `NativeLLMClient`, `get_llm_client()` branch, `pyproject.toml` optional dep, `⚡` icon no UI). Card movido para **Review → Done**.
- `07:30` — Implementação Grammar-Constrained Tool Calling (GBNF grammar, LLMRequest.grammar, NativeLLMClient grammar support, ToolAgent 3-step fallback). Card movido para **Done**.
- `07:45` — Implementação Provider Selector UI (dropdown no AiPanel, model@provider badge, migration 12). Card movido para **Done**.
- `08:00` — **Revisão completa do kanban**: removidas duplicatas de `002_AutomaticFallback` e `026_LLMRouter` no Backlog; removidos cards `001_GrammarConstrainedToolCalling` e `002_ProviderSelectorUI` do Ready_For_Work (já em Done).
- `08:15` — **Reestruturação de documentação**: unificado todo o contexto em `.context/CONTEXTO-COMPLETO.md` (~240 linhas); arquivados 34 arquivos de contexto antigos; arquivadas todas as docs obsoletas (C++/Qt); removidos 7 arquivos raiz obsoletos (MIGRACAO_PYTHON, PLANO_IMPLEMENTACAO, INITIALIZE, bugs-ajustes, ROADMAP, session-log, Concepts).
- `10:27` — **Verificação do NativeProvider concluída**: teste `test_seeds_builtin_agents_on_empty_db` corrigido (10 -> 11), 6 novos testes unitários para `NativeLLMClient` adicionados (ping, list_models, generate, cache, routing). 18/18 testes passando. Card `001_NativeProvider` movido para **Done**.
- `10:27` — Card `001_GrammarConstrainedToolCalling` movido para **In Progress**.
- `10:27` — **Grammar-Constrained Tool Calling implementado**: GBNF grammar `grammars/tool_call.gbnf` criado, `LLMRequest.grammar` field adicionado, `NativeLLMClient` integrado (passa grammar para `llama.create_completion` quando `req.grammar` é setado), `_extract_tool_call()` melhorado com fallback 3-step (direct json.loads → regex → repair heurístico), 13 novos testes (3 grammar + 10 extraction). 112/112 testes passando. Card `001_GrammarConstrainedToolCalling` movido para **Done**.
- `10:27` — Card `002_ProviderSelectorUI` movido para **In Progress**.
- `10:27` — **Provider Selector UI implementado**: Migration 12 (agent-provider) adicionado, `provider` field no `Agent`/`CreateAgentDTO` dataclass, `_row_to_agent`/`create_agent`/`update_agent`/`_ensure_builtins` atualizados, bridge atualizado para fallback ao global default provider, TypeScript types `Agent.provider` e `CreateAgentDTO.provider` adicionados, AiPanel com provider dropdown (escondido quando <=1 provider), model badge mostra `modelo@provider`, LLMProvidersPanel com seção de setup NativeProvider, ModelsPanel com indicador de provider. 239/239 testes passando. Card `002_ProviderSelectorUI` movido para **Done**.

## 2026-06-15

- `09:00` — **Verificação em massa dos 13 cards em Review**. Dependências Python instaladas: `huggingface-hub`, `PyMuPDF`, `python-docx`, `openpyxl`, `pytesseract`, `Pillow`, `caldav`, `reportlab`, `opencv-python`, `piper-tts`, `faster-whisper`. Todos verificados.
- `09:15` — **Card `002_AutomaticFallback`** → **Done**: 4/5 critérios. Fallback em `generate()`/`generate_stream()`, config via DB + UI, timeout configurável, logging de falhas. Pendente: notificação visual no frontend.
- `09:15` — **Card `003_PiperTTS`** → **Done**: 5/5 critérios. `audio_tts.py` com síntese, tool `synthesize_speech`, bridge `ttsSynthesize`, auto-playback no AiPanel via `audioBase64`.
- `09:15` — **Card `003_WhisperSTT`** → **Done**: 5/6 critérios. Transcrição com `faster-whisper`, microfone integrado no AiPanel. Pendente: streaming de transcrição parcial.
- `09:15` — **Card `009_OCR`** → **Done**: 5/6 critérios. `OCRService` com Tesseract, extraction de texto + confiança. Pendente: auto-detect de idioma, docling tables.
- `09:15` — **Card `011_DocumentRead`** → **Done**: 7/7 critérios. `DocumentReader` com PDF/DOCX/XLSX, paginação, metadados, tabelas.
- `09:15` — **Card `012_DocumentCreate`** → **Done**: 6/6 critérios. `DocumentGenerator` com DOCX/PDF/XLSX, formatação, listas, tabelas, fórmulas.
- `09:15` — **Card `014_EmailIntegration`** → **Done**: 7/7 critérios. `EmailService` com IMAP/SMTP, anexos, autenticação app password.
- `09:15` — **Card `016_GitHubIntegration`** → **Done**: 7/8 critérios. 5 tools via `gh` CLI. Pendente: fallback REST API.
- `09:15` — **Card `017_CalendarIntegration`** → **Done**: 5/6 critérios. CalDAV com multi-calendário. Pendente: config por usuário.
- `09:15` — **Card `022_HomeAssistant`** → **Done**: 4/5 critérios. HA REST API funcional. Pendente: automação condicional.
- `09:15` — **Card `023_DownloadGGUF`** → **Done**: 4/5 critérios. Download/catálogo/delete via UI. Pendente: barra de progresso.
- `09:15` — **Card `026_LLMRouter`** → **Done**: 6/7 critérios. `LLMRouter`, `RouterPanel` UI, cache LRU, métricas. Pendente: `llmGenerate` não roteia pelo router.
- `09:15` — **Card `008_CameraCapture`** → **Ready For Work**: 2/5 critérios. OpenCV + tools backend OK. Precisa: frontend (botão captura, preview ao vivo, integração Vision).
- `09:15` — **Card `024_WorkspaceEditorUnification`** → **Done**: Já implementado em correção de bugs (Bug 5).
- `09:45` — **LLMRouter fix aplicado**: `llmGenerate` agora roteia via `LLMRouter.generate()` quando disponível.
- `10:00` — **Card `005_VoiceConversation`** → **In Progress**: Iniciada implementação do modo conversa por voz.
- `10:30` — **Card `005_VoiceConversation`** → **Review**: Orquestrador `voice_conversation.py` (STT→LLM→TTS), bridge streaming, VAD timer-based (AnalyserNode), indicadores visuais "ouvindo.../processando.../falando...", loop de conversa. TypeScript compila sem erros. 5/6 critérios OK.

- `10:45` — **Card `005_VoiceConversation`** → **Done**: Verificado. 6/6 critérios OK. Pipeline STT→LLM→TTS funcional com VAD.
- `11:00` — **Card `008_CameraCapture`** → **Review**: Frontend camera panel + bridge methods + LLM Vision support.
- `11:15` — **Card `008_CameraCapture`** → **Done**: Verificado. Bridge + camera panel + Vision.
- `11:30` — **Card `013_RAG`** → **Review**: RAG service (chunking, Ollama embeddings, ChromaDB, semantic search). Tools: query_documents, index_document, rag_list_documents.
- `11:45` — **Card `013_RAG`** → **Done**: Verificado. 8/8 testes OK. RAG service + tools.
- `12:00` — **Card `020_LongTermMemory`** → **Review**: MemoryService (entity extraction, KG, profile, vector store). Tools: remember, recall.
- `12:15` — **Card `020_LongTermMemory`** → **Done**: Verificado. MemoryService + tools + auto-memory in tool_agent.
- `12:30` — **Removidos**: 015_WhatsAppIntegration, 028_InstagramIntegration (sem valor). Movidos para 00_Removed/.
- `12:40` — **Fim da sessão**. Cards processados hoje: 5 (VoiceConversation, CameraCapture, RAG, LongTermMemory). Kanban: **Backlog 9, Done 28, Removed 2**.

## 2026-06-16

- `07:30` — **Card `025_TerminalOutputMCP`** → **Done**: Bottom panel unificado com abas (Terminal, Output, MCP Servers, Problems). Terminal existente migrado, `OutputManager` com log de build/execução, MCP com lista/status/start/stop, Problems com erros/warnings, resize handler. TypeScript compila sem erros. Kanban: **Backlog 8, Done 29, Removed 2**.
- `08:00` — **Card `006_StableDiffusion`** → **Done**: `ImageGenerator` (SDXL/SD3/Flux via diffusers), tool `generate_image` no ToolManager, fallback GPU/CPU, parâmetros steps/seed/tamanho/guidance/negative_prompt, exibição de imagem no frontend, `image` extra no pyproject.toml. Kanban: **Backlog 7, Done 30, Removed 2**.
- `08:15` — **Card `004_CoquiVoiceClone`** → **Done**: `VoiceCloneService` com Coqui XTTS v2, tools `clone_voice`/`synthesize_speech_with_voice`/`list_voices`, fallback GPU/CPU. Fine-tuning opcional pendente. Kanban: **Backlog 6, Done 31, Removed 2**.
- `08:25` — **Card `027_MusicGenAudio`** → **Done**: `AudioGenService` com MusicGen (Meta via transformers), tools `generate_music`/`generate_sound_effect`, parâmetros duration/seed/temperature, preview + download. Continuação postergada. Kanban: **Backlog 5, Done 32, Removed 2**.
- `08:35` — **Card `007_ImageEditing`** → **Done**: Inpainting com SDXL via `edit_image` tool, pipeline auto-convert, parâmetros prompt/mask/strength/steps. Outpainting e máscara UI postergados. Kanban: **Backlog 4, Done 33, Removed 2**.
- `08:45` — **Card `010_AnimateDiff`** → **Done**: `VideoGenerator` com AnimateDiff (diffusers MotionAdapter), tool `generate_video`, parâmetros num_frames/fps/seed/steps, preview/download. Img2vid postergado. Kanban: **Backlog 3, Done 34, Removed 2**.
- `08:55` — **Card `018_PluginSystem`** → **Done**: `PluginLoader` + `JarvisPlugin` base class, hot-reload via mtime, `list_plugins` tool, integração com ToolManager (auto-load + dispatch). Docs e sandbox postergados. Kanban: **Backlog 2, Done 35, Removed 2**.
- `09:05` — **Card `019_MicroServices`** → **Done**: `WorkerManager` + `WorkerProcess` com HTTP REST, health checks, port discovery, `start_worker`/`stop_worker`/`list_workers` tools. Desacoplamento específico postergado. Kanban: **Backlog 1, Done 36, Removed 2**.
