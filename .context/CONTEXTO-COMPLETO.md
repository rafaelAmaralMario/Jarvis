# CONTEXTO COMPLETO — JARVIS v0.2.0

> **Atualizado:** 2026-06-11
> **Stack:** Python 3.14 + pywebview 5 (WebView2) + React 19 + TypeScript + Vite + SQLite3

---

## 1. Identidade

JARVIS é um assistente de IA pessoal **100% local, gratuito, sem assinatura**. Semelhante ao Claude Code/Cursor mas com IDE integrada (editor Monaco, terminal xterm.js, git) e sem depender de cloud.

**Filosofia:** Tudo local. Zero dados enviados para servidores externos.

---

## 2. Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.14 (18 módulos) |
| Desktop | pywebview 5 (WebView2) |
| Frontend | React 19 + TypeScript + Vite 7 |
| Estilos | Tailwind CSS 4 + Radix UI + Framer Motion |
| Editor | Monaco Editor 0.55 |
| Terminal | xterm.js 5 |
| Banco | SQLite3 WAL + FTS5 (8 migrations, ~26 tabelas) |
| LLM | Ollama (primário) + llama-cpp-python (alternativo) |
| Testes | pytest (260+) + Vitest (179) + Playwright E2E |

---

## 3. Arquitetura

```
Frontend (React + Vite) ─── pywebview IPC ───→ Bridge (JARVISBridge)
                                                    │
                     ┌──────────────────────────────────┐
                     │  LLMGateway (multi-provedor)      │
                     │    ├─ OllamaLLMClient             │
                     │    ├─ NativeLLMClient (llama-cpp) │
                     │    ├─ OpenAIClient                │
                     │    └─ AnthropicClient             │
                     │                                  │
                     │  ToolManager (14 ferramentas)     │
                     │  ToolAgent (loop autônomo)        │
                     │  TaskPlanner (DAG decomposição)   │
                     │  SelfImprovement (ciclo melhoria) │
                     │  KnowledgeManager (notas + FTS5)  │
                     │  AgentsManager (built-in + custom)│
                     │  OrchestrationManager (multi-agente)│
                     │  WorkflowEngine (steps sequenciais)│
                     │  GitManager + TerminalManager     │
                     │  WorkspaceManager + EditorManager │
                     │  SecurityManager + MCPManager     │
                     └──────────────────────────────────┘
```

### Fluxo principal
1. Usuário envia mensagem no chat (AiPanel)
2. `bridge.toolAgentExecuteStream(query, history, agentId, unattended)`
3. Bridge cria `ToolAgent` com callbacks de streaming
4. Loop: LLM decide → executa ferramenta → observa resultado → repete
5. Frontend polling 100ms atualiza UI (tokens + tool calls + resultados)
6. Se modo assistido: pausa para permissão em tools ASK/DANGER

---

## 4. Estado Atual

### ✅ Fase 0 — Estabilização (COMPLETA)
- ModelServerStatus com ping timeout, PATH detection, auto-start
- Context Menu inteligente (arquivo/pasta/vazio com ações AI)
- Task Planner UI (PlannerPanel com progresso, checkpoints, resume)
- Self-Improvement Module (analisar → propor → executar)
- Modo Não Assistido (unattended: pula todas as permissões)
- Knowledge Tools (create_note, list_notes, search_notes)
- Conversation History + Agent System Prompt (contexto total)
- General Settings (theme, language, font size, auto-save)

### ✅ Fase 1 — LLM Dual Provider (COMPLETA)
- `NativeProvider` com llama-cpp-python (NativeLLMClient, model cache, generate/stream)
- `Grammar-Constrained Tool Calling` (GBNF grammar p/ JSON 100% válido)
- `Provider Selector UI` (dropdown provedor + model@provider badge)
- Dependência opcional `[native]` no pyproject.toml

### 🟡 Ready For Work (4 cards)
| Card | Descrição | Prioridade |
|------|-----------|-----------|
| 002_AutomaticFallback | Fallback em cascata entre provedores | Média |
| 003_WhisperSTT | Whisper speech-to-text (tool + microfone) | Média |
| 023_DownloadGGUF | Download de modelos GGUF do Hugging Face | Média |
| 026_LLMRouter | Roteamento inteligente + cache de respostas | Média |

### 🔵 Backlog (24 cards)
Áudio: PiperTTS, CoquiVoiceClone, VoiceConversation, MusicGenAudio
Visão: StableDiffusion, ImageEditing, CameraCapture, OCR, AnimateDiff
Documentos: DocumentRead, DocumentCreate, RAG
Integrações: Email, WhatsApp, GitHub, Calendar, Instagram, HomeAssistant, PluginSystem
Avançado: LongTermMemory, BackgroundAgents, MicroServices
UI: WorkspaceEditorUnification, TerminalOutputMCP

---

## 5. Estrutura do Projeto

```
C:\Users\Rafae\Documents\Jarvis\
├── backend/jarvis/        # 18 módulos Python
│   ├── main.py            # Entry point
│   ├── bridge.py           # 65+ métodos window.jarvis.*
│   ├── database.py         # SQLite WAL thread-safe
│   ├── llm_gateway.py      # Multi-provedor (Ollama, Native, OpenAI, Anthropic)
│   ├── tool_agent.py       # ToolAgent + TaskPlanner
│   ├── tool_manager.py     # 14 ferramentas com risk levels
│   ├── self_improvement.py # Análise → proposta → execução
│   ├── grammars/           # GBNF grammars
│   └── tests/              # 260+ testes pytest
├── ui/src/                 # React + TypeScript + Vite
│   ├── components/         # AiPanel, PlannerPanel, Settings, etc.
│   ├── hooks/use-jarvis.ts # Bridge hook tipado
│   ├── types/index.ts      # Interfaces completas (bridge, models, etc.)
│   └── App.tsx
├── kanban/                 # Sistema visual de tarefas (LEIA AQUI)
│   ├── 01_Backlog/         # Ideias não refinadas
│   ├── 02_Ready_For_Work/  # Pronto para implementar
│   ├── 04_Review/          # Aguardando verificação
│   ├── 05_Done/            # Completamente finalizada
│   └── README.md           # Como usar o kanban
├── .context/               # Contexto unificado do projeto (este arquivo)
└── HOW-TO-START.md         # Setup instruction
```

---

## 6. Bridge API (métodos principais)

Bridge expõe métodos via `window.jarvis.*`:
- **Chat:** chatListConversations, chatGetMessages, chatCreateConversation, chatSaveMessage, chatDeleteConversation, chatAutoTitle
- **LLM:** llmGetProviders, llmSaveProvider, llmGetDefaultProvider, llmSetDefaultProvider, llmTestConnection
- **Tools:** toolsList, toolsGetRisk, toolsExecute, toolsSetWorkspace
- **Agent:** toolAgentExecute, toolAgentExecuteStream (query, convId, history, agentId, unattended, providerOverride, modelOverride), toolAgentGetStream, toolAgentAnswer
- **Planner:** plannerExecuteStream, plannerGetProgress, plannerCancel, plannerListCheckpoints, plannerResumeCheckpoint
- **Self-Improvement:** selfImprovementStream, selfImprovementGetStream, selfImprovementAnswer, selfImprovementCancel
- **Knowledge:** createNote, getNote, listNotes, updateNote, deleteNote, searchNotes, getNoteGraph, getBacklinks
- **Workspace:** openWorkspace, listFiles, readFile, writeFile, createFile, deleteFile, createDirectory, getRoots
- **Editor:** editorOpenFile, editorGetContent, editorUpdateSettings
- **Git:** gitStatus, gitDiff, gitStage, gitCommit, gitLog, gitBranches, gitPull, gitPush
- **Terminal:** terminalCreate, terminalWrite, terminalResize, terminalKill, terminalList
- **MCP:** mcpListServers, mcpStartServer, mcpStopServer, mcpCallTool
- **System:** copyToClipboard, showFolderPicker, getAppVersion, getModelServerStatus, startModelServer, getLogPath

---

## 7. Decisões Técnicas Importantes

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Streaming | Polling (não WebSocket) | pywebview bridge é síncrona request-response |
| LLM primário | Ollama + llama-cpp-python (dual) | Gratuito, privado, sem cloud |
| Tools risk | safe / ask / danger | Balance entre segurança e fluidez |
| Task Planner | Checkpoint JSON em `.jarvis/plans/` | Simples, sem depender de banco |
| Clipboard | pyperclip | Estável, cross-platform |
| Comunicação | pywebview js_api (JSON-RPC) | Nativo do framework |
| Model Selectors | Styled dropdown (appearance-none) | Moderno, sem dependências |
| Prioridade de modelo | agente → especialidade → chat | Flexível, fallback progressivo |
| Chat overrides | Provider + Model passados no toolAgentExecuteStream | Usuário escolhe, backend respeita |

---

## 8. Para Agentes — Como Trabalhar Neste Projeto

### Ao receber uma tarefa:
1. Leia este `.context/CONTEXTO-COMPLETO.md` para entender o projeto
2. Veja `kanban/02_Ready_For_Work/` ou `kanban/01_Backlog/` para tarefas disponíveis
3. Leia o card da tarefa para escopo e critérios de aceitação
4. Explore o código relacionado antes de implementar
5. Após implementar: mova o card para `04_Review/` e crie log em `kanban/logs/`

### Regras de implementação:
- **Leia antes de escrever** — sempre entenda o arquivo existente antes de modificar
- **TypeScript check:** `cd ui && npx tsc --noEmit` (0 erros)
- **Testes backend:** `cd backend && python -m pytest tests/`
- **Testes frontend:** `cd ui && npx vitest run`
- **Python lint:** `cd backend && ruff check .`
- **Dependências:** verifique `pyproject.toml` (Python) ou `package.json` (JS) antes de adicionar libs novas
- **Um card por vez:** só trabalhe em um card por sessão
- **Crie logs:** sempre registre o que foi feito em `kanban/logs/`

### Convenções de código:
- Python: type hints obrigatórios, snake_case, 100 chars linha
- TypeScript/React: interfaces exportadas, camelCase, Tailwind classes
- Bridge methods: camelCase (expostos ao JS)
- Mova cards: Backlog → Ready → Review → Done
