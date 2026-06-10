# Project JARVIS

> Assistente de IA completo com IDE integrada — versão atual: `v0.2.0`

---

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Backend | Python | 3.14 |
| Desktop | pywebview 5 (WebView2) | 5.x |
| Frontend | React + TypeScript + Vite | 19 / 5.9 / 7 |
| Banco | SQLite3 (WAL, FTS5) | — |
| LLM | Ollama (local) | — |
| Estilos | Tailwind CSS 4 + Radix UI | — |
| Editor | Monaco Editor | 0.55 |
| Terminal | xterm.js | 5.x |
| Testes Backend | pytest | 260+ |
| Testes Frontend | Vitest | 179 |

---

## Arquitetura

```
┌────────────────────────────────────────────────────────┐
│  L4: Plugins                              [NÃO INICIADO]│
├────────────────────────────────────────────────────────┤
│  L3: Editor · Git · Terminal                 [✓ 3/3]   │
├────────────────────────────────────────────────────────┤
│  L2: Conhecimento · AI Engine                [✓ 2/2]   │
├────────────────────────────────────────────────────────┤
│  L1: Workspace · Rede · Persistência         [✓ 3/3]   │
├────────────────────────────────────────────────────────┤
│  L0: Bridge (pywebview JSON-RPC)          [✓ COMPLETO] │
│      14 módulos Python, 65+ métodos window.jarvis.*    │
├────────────────────────────────────────────────────────┤
│  OS: Windows 11 (primary)                              │
└────────────────────────────────────────────────────────┘
```

### Módulos do Backend (14)

| Módulo | Arquivo | Função |
|--------|---------|--------|
| Bridge | `bridge.py` | 65+ métodos `window.jarvis.*` — ponto de entrada único |
| Database | `database.py` | SQLite WAL thread-safe, transactions explícitas |
| Migration Runner | `migration_runner.py` | 8 migrations SQL (~26 tabelas) |
| Chat Manager | `chat_manager.py` | SQLite CRUD conversas + mensagens |
| Tool Manager | `tool_manager.py` | 14 tools (read, write, exec, git, web, etc.) |
| Tool Agent | `tool_agent.py` | Loop autônomo LLM → tools → resultado |
| Task Planner | `tool_agent.py` | Decompõe tasks → executa steps → verifica |
| LLM Gateway | `llm_gateway.py` | Multi-provedor (Ollama, OpenAI, Anthropic, Bedrock) |
| Ollama Client | `ollama_client.py` | HTTP/2 client para Ollama |
| Models Manager | `models_manager.py` | CRUD modelos + specialties |
| Agents Manager | `agents_manager.py` | CRUD agentes + seed defaults |
| Orchestration Manager | `orchestration_manager.py` | Roteamento multi-agente + critic |
| Knowledge Manager | `knowledge_manager.py` | Notes CRUD + FTS5 + wikilinks + graph |
| Workflow Engine | `workflow_engine.py` | Steps sequenciais (RunCommand, ApiCall, Wait) |
| Workspace Manager | `workspace_manager.py` | File I/O + watcher + project detection |
| Editor Manager | `editor_manager.py` | Open/save/settings Monaco |
| Terminal Manager | `terminal_manager.py` | PTY subprocess + xterm.js |
| Git Manager | `git_manager.py` | Git CLI subprocess |
| Network Manager | `network_manager.py` | HTTP + OAuth + API keys |
| Security Manager | `security_manager.py` | Secrets storage, permission checks |
| MCP Manager | `mcp_manager.py` | Model Context Protocol server |
| Module Loader | `module_loader.py` | Plugin discovery via importlib |

---

## Status Atual (v0.2.0 — Junho 2026)

### ✅ Concluído (Implementação Principal)
- [x] Migração completa Qt C++ → Python + pywebview (9 fases, 14 módulos)
- [x] Bridge com 65+ métodos, 179 testes Vitest, 260+ testes pytest
- [x] Chat com persistência SQLite (histórico sobrevive a restart)
- [x] Sistema de Tools: 14 ferramentas (ler/escrever arquivos, executar comandos, git, web search/fetch, ask_user)
- [x] ToolAgent: loop autônomo LLM→tools→resultado com streaming, cancel, answer questions
- [x] TaskPlanner: decomposição de tasks, checkpoint/resume, steps paralelos, contexto entre steps, abort em falhas
- [x] Sistema de permissões: 3 níveis (safe/ask/danger)
- [x] Streaming de respostas por polling (toolAgentExecuteStream / plannerExecuteStream)
- [x] Confirmação do usuário para tools perigosas (ask/danger)
- [x] Editor Monaco com abas, split, quick open, settings
- [x] Terminal xterm.js integrado
- [x] Sistema de conhecimento (notes FTS5, wikilinks, grafo)
- [x] Git integrado (status, diff, stage, commit, branches, push/pull)
- [x] Multi-agente com orchestrator + critic
- [x] Auto-update runtime
- [x] Build PyInstaller + Inno Setup + CI/CD GitHub Actions
- [x] MCP Server integrado

### 🟡 Implementado Recentemente (últimas sessões)
- [x] **clipboard fix**: pyperclip substitui PowerShell Set-Clipboard
- [x] **ChatManager**: SQLite CRUD conversas + mensagens
- [x] **ToolManager**: 14 tools com risk levels
- [x] **ToolAgent**: loop autônomo, threading.Event para answer/cancel, streaming
- [x] **web_search + web_fetch**: DuckDuckGo scraping + fetch de URLs
- [x] **TaskPlanner**: decomposição, checkpoint/resume, steps paralelos, contexto, abort
- [x] **Streaming polling**: toolAgentExecuteStream + plannerExecuteStream
- [x] **Permission confirmation**: ask/danger tools pedem confirmação antes de executar
- [x] **Redesign AiPanel**: streaming, tool calls, cancel, pending question dialog, conversation persistence
- [x] **Context documents**: 6 docs em `.context/` documentando todas as decisões

---

## 🔴 Próximas Tasks (Priorizadas)

### Prioridade 0: Phase 1 Loose Ends (bugs críticos)

Antes de avançar para novas features, estes bugs da Fase 1 precisam ser corrigidos:

---

### T1: ModelServerStatus — falso positivo quando offline

**Descrição:** `getModelServerStatus()` retorna `running: true` quando o processo Ollama existe mas o servidor não responde (inicializando ou travado). Frontend mostra modelo como disponível mas chats falham.

**Análise Técnica:**
- **Complexidade:** 🟢 Baixa (~30min)
- **Arquivo:** `backend/jarvis/bridge.py:1407-1460`
- **Abordagem:** Adicionar `OllamaClient.ping()` real (GET `/api/tags` timeout 3s), retornar `running: true` só se processo existe **E** ping sucede
- **Risco:** Mínimo — ping é idempotente
- **Testes:** Adicionar ao `test_bridge_integration.py`

---

### T2: Chat fica travado — sendMessage sem timeout

**Descrição:** Se Ollama cai durante `sendMessage`, a Promise nunca resolve e o chat fica em "Pensando..." para sempre.

**Análise Técnica:**
- **Complexidade:** 🟡 Média (~1h)
- **Arquivos:** `bridge.py:363-370`, `orchestration_manager.py:189-201`, `ui/src/hooks/use-jarvis.ts`, `ui/src/components/AiPanel.tsx`
- **Abordagem:**
  1. Adicionar timeout na chamada Ollama dentro do `orchestration_manager`
  2. Propagar exceções corretamente pelo bridge
  3. No frontend: fallback timeout (30s) que mostra "Ollama não respondeu" com botão retry
- **Risco:** Baixo — timeout é padrão de mercado
- **Dependências:** T1 (status correto evita falsas tentativas)

---

### T3: Models não listando + botão Start Ollama quebrado

**Descrição:** Se Ollama não está rodando, `listModels` retorna vazio silenciosamente. Botão "Start Ollama" não encontra o executável.

**Análise Técnica:**
- **Complexidade:** 🟢 Baixa (~30min)
- **Arquivos:** `bridge.py:1462-1478`, `ModelsPanel.tsx`, `StatusBar.tsx`
- **Abordagem:**
  1. `listModels`: tentar conectar, se falhar chamar `startModelServer()` automaticamente
  2. `startModelServer`: detectar ollama.exe via `where.exe`, `%LOCALAPPDATA%`, PATH
  3. Adicionar status na StatusBar (icone verde/vermelho)
- **Risco:** Baixo — detecção de PATH é padrão

---

### T4: Unificação Workspace/Editor (VS Code-like)

**Descrição:** WorkspacePanel e EditorPanel são separados. O usuário quer uma experiência VS Code: file tree com ícones, drag & drop, busca, criação simplificada.

**Análise Técnica:**
- **Complexidade:** 🔴 Alta (~4-6h)
- **Arquivos:** `WorkspacePanel.tsx`, `EditorPanel.tsx`, `FileTree.tsx`, `EditorTabs.tsx` + novos
- **Abordagem:**
  1. Mesclar num único `WorkspaceView.tsx`
  2. File tree com ícones (lucide-react ou react-icons)
  3. Drag & drop entre pastas (HTML5 DnD API)
  4. Barra de busca Ctrl+Shift+F
  5. Múltiplos roots com separação visual
- **Risco:** Médio — refatoração grande de UI, pode quebrar funcionalidades existentes
- **Dependências:** Precisa dos context menus funcionando (T5)

---

### T5: Context Menu Inteligente

**Descrição:** Botão direito em arquivos/pastas/área vazia deve oferecer ações contextuais como VS Code e opções do AI.

**Análise Técnica:**
- **Complexidade:** 🟡 Média (~2-3h)
- **Arquivos:** `App.tsx:25-34`, `FileTree.tsx`, `EditorTabs.tsx`, novo `ContextMenu.tsx`
- **Abordagem:**
  1. Consertar `data-context-menu-enabled` para funcionar na FileTree e abas
  2. Menu em arquivo: "Enviar para o Chat", "Revelar no Explorer", "Copiar path"
  3. Menu em pasta: "Revisar projeto", "Criar testes", "Criar documentação", "Refatorar"
  4. Menu vazio: "Analisar projeto", "Suggest features", "Criar .env.example"
  5. Ações do AI disparam `toolAgentExecuteStream` com contexto do item
- **Risco:** Médio — interação com context menu existente do VS Code pode conflitar
- **Testes:** E2E com Playwright verificando menu aparece e ações disparam

---

### T6: Task Planner UI

**Descrição:** TaskPlanner backend está completo mas sem interface. Usuário precisa de um painel para iniciar tasks, ver progresso, cancelar, e resumir checkpoints.

**Análise Técnica:**
- **Complexidade:** 🟡 Média (~3-4h)
- **Arquivos:** Novo `TaskPlannerPanel.tsx`, modificar `AiPanel.tsx` ou `App.tsx`
- **Abordagem:**
  1. Novo botão "Planner" no chat (ou ícone na barra lateral)
  2. Modal/área de input para descrever a task complexa
  3. Ao iniciar, chamar `plannerExecuteStream()` e mostrar progresso em tempo real
  4. Cards de step: index, goal, status (pending/executing/success/fail), retries
  5. Botão Cancel, botão Resume se houver checkpoint
  6. Lista de checkpoints disponíveis para resumir
- **Risco:** Baixo — backend já está pronto, é só UI

---

### T7: General Settings Panel

**Descrição:** Settings está vazio para aba "General". Precisa de language selector, theme toggle, font size, auto-save, etc.

**Análise Técnica:**
- **Complexidade:** 🟢 Baixa (~1-2h)
- **Arquivos:** Novo `GeneralPanel.tsx`, modificar `SettingsPage.tsx`
- **Abordagem:**
  1. Criar GeneralPanel com: language (pt-BR/en), theme (dark/light), font size (slider), auto-save toggle, terminal font size
  2. Settings salvas via `editorUpdateSettings` no backend
  3. Aplicar tema via CSS variables + Tailwind `dark:` class
- **Risco:** Baixo

---

### T8: Completar Phase 3 — Auto-Healing + Memory + Background Mode

**Descrição:** O TaskPlanner executa steps mas não tenta alternativas quando uma ferramenta falha, não lembra de decisões anteriores, e não roda em background.

**Análise Técnica:**
- **Complexidade:** 🔴 Alta (~6-8h total, dividido em sub-tasks)
- **Sub-tasks:**
  1. **Auto-Healing** (3.2): Modificar `_execute_step` para quando falhar, chamar LLM com "a abordagem X falhou, sugira alternativa" e re-tentar. Adicionar `_repair_strategy` que analisa o erro, sugere caminho diferente.
  2. **Memory & Context** (3.4): Salvar decisões por projeto em SQLite (nova tabela `project_memory`). Ao iniciar task, carregar histórico de ações e decisões anteriores.
  3. **Background Mode** (3.3): `plannerExecuteStream` já roda em background thread. Falta: notificação toast quando completa, painel de tasks ativas com progresso, logs em tempo real.
- **Risco:** Alto — auto-healing pode causar loops, memory precisa de schema novo
- **Dependências:** T6 (Task Planner UI) para ter onde mostrar progresso

---

### T9: Plugin Ecosystem

**Descrição:** Ativar o `ModuleLoader` para carregar plugins Python de `modules/`. API pública para terceiros estenderem o JARVIS.

**Análise Técnica:**
- **Complexidade:** 🟡 Média (~3-4h)
- **Arquivos:** `module_loader.py`, `bridge.py`, novo `PluginManager.tsx`
- **Abordagem:**
  1. Definir interface Plugin (init, hooks, cleanup)
  2. ModuleLoader escaneia `modules/` por pacotes Python
  3. Plugin pode registrar tools, comandos, listeners de eventos
  4. UI: painel de Plugins em Settings com enable/disable
  5. Segurança: sandbox de permissões (plugin só acessa o que foi autorizado)
- **Risco:** Médio — segurança de plugins é complexa, pode introduzir vulnerabilidades
- **Dependências:** T8 (Security) para permission system

---

### T10: Terminal Integrado (Task 018 do roadmap original)

**Descrição:** Terminal já funciona mas falta polimento: múltiplas abas, Ctrl+` toggle, split terminal.

**Análise Técnica:**
- **Complexidade:** 🟡 Média (~3-5h)
- **Arquivos:** `TerminalPanel.tsx`, `terminal_manager.py`
- **Abordagem:**
  1. Abas de terminal com nome customizável
  2. Ctrl+` para toggle (já existe? verificar)
  3. Split vertical/horizontal (xterm.js + fit addon)
  4. Dropdown de sessões ativas
  5. Persistir sessões abertas entre restart
- **Risco:** Baixo — xterm.js já integrado

---

### T11: Editor Fase 3 (Task 017)

**Descrição:** Search/Replace (Ctrl+F/H), Command Palette (Ctrl+Shift+P), Markdown Preview, Format on Save.

**Análise Técnica:**
- **Complexidade:** 🟡 Média (~4-6h)
- **Arquivos:** `EditorPanel.tsx`, `editor_manager.py`, novo `CommandPalette.tsx`, novo `SearchPanel.tsx`
- **Abordagem:**
  1. Search/Replace: Monaco Editor já tem `findController` nativo
  2. Command Palette: overlay com fuzzy search de comandos
  3. Markdown Preview: `react-markdown` + `remark-gfm`
  4. Format on Save: detectar linguagem, executar prettier/linters
- **Risco:** Médio — Command Palette pode conflitar com Monaco shortcuts

---

### T12: Git Integrado (Task 020)

**Descrição:** Git Gutter no editor, diff side-by-side, branch explorer, rebase/merge UI.

**Análise Técnica:**
- **Complexidade:** 🔴 Alta (~6-10h)
- **Arquivos:** `GitPanel.tsx`, `git_manager.py`, `editor_manager.py`
- **Abordagem:**
  1. Git Gutter: Monaco Editor has `glyphMargin` + `lineDecorations`
  2. Diff side-by-side: Monaco diff editor
  3. Branch explorer: graph visualization
  4. Commit UI: staged/unstaged split com checkboxes
  5. Rebase/merge: wizard com confirmação
- **Risco:** Alto — git operations podem corromper repositório se mal implementadas
- **Dependências:** T4 (Workspace unificado), T5 (Context menu)

---

## 🎯 Ordem Recomendada de Implementação

### Bloco 1 — Bugs Críticos (2h)
*Antes de qualquer feature nova, estes bugs precisam ser corrigidos — eles afetam a experiência central do chat e models.*

| # | Task | Esforço | Por que nesta ordem |
|---|------|---------|-------------------|
| 1 | **T1: ModelServerStatus** | 30min | Base para todas as outras: se o status do Ollama é fake, nada de IA funciona |
| 2 | **T2: Chat timeout** | 1h | Chat travando é o bug mais visível para o usuário. Precisa do status correto (T1) |
| 3 | **T3: Models list/Start** | 30min | Se `listModels` falha silenciosamente, o usuário não sabe que precisa iniciar o Ollama. Depende de T1 |

**Resultado:** Chat + Models funcionando de forma confiável. Base sólida para features.

### Bloco 2 — Features Rápidas (4h)
*Features de baixo esforço e alto impacto na experiência do usuário. Não dependem de nada e podem ser feitas em paralelo.*

| # | Task | Esforço | Por que nesta ordem |
|---|------|---------|-------------------|
| 4 | **T7: General Settings** | 1-2h | Settings atual está vazio — dá impressão de app incompleto. Sem dependências |
| 5 | **T5: Context Menu** | 2-3h | Pré-requisito para T4 (Workspace). Menos de 3h de implementação |

### Bloco 3 — Task Planner UI (4h)
*Backend do TaskPlanner já está 100% pronto e funcional. Só falta a interface.*

| # | Task | Esforço | Por que nesta ordem |
|---|------|---------|-------------------|
| 6 | **T6: Task Planner UI** | 3-4h | Backend já feito (checkpoint/resume, streaming, parallel steps). Falta só o frontend. Sem dependências |

**Resultado:** Usuário pode usar o TaskPlanner pelo chat para tarefas complexas.

### Bloco 4 — Unificação Workspace/Editor (6h)
*Feature mais impactante visualmente. Transforma a experiência de navegação no projeto.*

| # | Task | Esforço | Por que nesta ordem |
|---|------|---------|-------------------|
| 7 | **T4: Workspace Unification** | 4-6h | Requer T5 (Context Menu) funcionando. É a maior mudança visual do projeto |

**Resultado:** Experiência VS Code completa — file tree, ícones, drag & drop, busca.

### Bloco 5 — Pós-Unificação (tasks paralelizáveis)
*Com o workspace unificado e o task planner funcional, podemos escalar em várias frentes.*

| # | Task | Esforço | Por que nesta ordem |
|---|------|---------|-------------------|
| 8 | **T8: Auto-Healing + Memory** | 6-8h | Requer T6 (Task Planner UI) para mostrar progresso do auto-healing |
| 9 | **T9: Plugins** | 3-4h | Requer sistema de segurança (T8 inclui permission system) |
| 10 | **T11: Editor Fase 3** | 4-6h | Search/Replace, Command Palette, Markdown Preview. Independe de outras tasks |
| 11 | **T10: Terminal Polish** | 3-5h | Abas, split, Ctrl+`. Pode ser feito paralelo ao T8/T9/T11 |
| 12 | **T12: Git Integration** | 6-10h | Git Gutter, diff UI, branch explorer. Requer T4 + T5 |

**Estimativa total:** ~40-60h de desenvolvimento para completar todos os 12 blocos.

### Diagrama de Dependências

```
Bloco 1 (Bugs)
  ├─ T1 ─→ T2
  └─ T1 ─→ T3
               Bloco 2 (Rápidas)
               ├─ T7 (independente)
               └─ T5 ─────────────────────────┐
                    Bloco 3                     │
                    └─ T6 ──→ T8               │
                                               ▼
                                        Bloco 4
                                        └─ T4 ←─┘
                                               │
                                   Bloco 5 (Paralelo)
                                   ├─ T8 ←── T6
                                   ├─ T9 ←── T8
                                   ├─ T11 (indep)
                                   ├─ T10 (indep)
                                   └─ T12 ←── T4 + T5
```

### Critério de Parada por Bloco

| Bloco | Critério para avançar |
|-------|----------------------|
| 1 — Bugs | chat não trava mais + models listam corretamente + start Ollama funciona |
| 2 — Rápidas | settings populados + context menu funcional em arquivos/pastas |
| 3 — Planner | usuário pode iniciar task, ver progresso, cancelar, resumir checkpoint |
| 4 — Unificação | workspace parece VS Code (tree, ícones, busca, drag) |
| 5 — Escalar | auto-healing recupera falhas, plugins carregam, editor busca, terminal split

---

## Decisões Técnicas Importantes

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Streaming | Polling (não WebSocket/SSE) | pywebview bridge é síncrona request-response |
| LLM primário | Ollama (local) | Gratuito, privado, sem dependência externa |
| Tools risk levels | safe/ask/danger | Balance entre segurança e fluidez |
| Task Planner checkpoint | JSON em `.jarvis/plans/` | Simples, sem depender de banco |
| Clipboard | pyperclip (não PowerShell) | Estável, cross-platform, sem subprocess |
| Comunicação bridge | pywebview js_api (JSON-RPC) | Nativo do framework, sem custom protocol |

---

## Links Úteis

- **README:** `README.md`
- **Plano de Implementação:** `PLANO_IMPLEMENTACAO.md`
- **Roadmap:** `ROADMAP.md` (root) e `docs/ROADMAP.md`
- **Bug tracker:** `bugs-ajustes-e-novas-features.md`
- **Bugfix plan:** `docs/plans/2026-06-09-bugfixes-features.md`
- **Task Kanban:** `tarefas/INDEX.md` (27 tasks, 16 concluídas)
- **Contexto:** `.context/CONTEXTO-COMPLETO.md`
- **Handoff migração:** `.context/HANDOFF.md`
- **Backend entry:** `backend/jarvis/main.py`
- **Bridge (65+ métodos):** `backend/jarvis/bridge.py`
- **Tool Agent:** `backend/jarvis/tool_agent.py`
- **Tool Manager:** `backend/jarvis/tool_manager.py`
- **Chat Manager:** `backend/jarvis/chat_manager.py`
- **Frontend root:** `ui/src/App.tsx`
- **Bridge hook:** `ui/src/hooks/use-jarvis.ts`
- **Types:** `ui/src/types/index.ts`
- **Chat component:** `ui/src/components/AiPanel.tsx`
