# Plano de Implementação — JARVIS v0.3.0

## Visão Geral

Este plano divide a evolução do JARVIS em **3 fases**, cada uma com entregáveis concretos que você vai testar e aprovar antes de avançarmos. O foco principal é transformar o JARVIS em uma ferramenta **autônoma** similar ao OpenCode/Claude Code, capaz de trabalhar em projetos E2E.

---

## FASE 1: Chat Evolution + Computer Use Foundation

**Objetivo:** Corrigir bugs críticos do chat, adicionar streaming, persistir conversas, e criar o sistema de **ferramentas (tools)** que permite o AI agir no computador.

### 1.1 — Correção de Bugs Críticos

| Item | Descrição | Entregável |
|------|-----------|------------|
| 1.1.1 | **copyToClipboard** — Substituir PowerShell `Set-Clipboard` por `pyperclip` (biblioteca Python pura, mais estável) | Copiar texto funciona sem erros |
| 1.1.2 | **Session Loss** — Chat perde estado ao navegar entre abas. Solução: estado global via React Context + preservar `activeConvId` no `sessionStorage` | Mudar de aba não perde a conversa atual |
| 1.1.3 | **Timeout de 120s** — Tornar configurável e mostrar feedback visual durante loading | Timeout adaptável + indicador de progresso |

### 1.2 — Streaming de Respostas

| Item | Descrição | Entregável |
|------|-----------|------------|
| 1.2.1 | Modificar `bridge.sendMessage()` para aceitar `onToken` callback | Frontend recebe tokens em tempo real |
| 1.2.2 | Modificar `OrchestrationManager.execute_query()` para fazer streaming via Ollama `stream=True` | Backend envia tokens conforme gera |
| 1.2.3 | UI: substituir "Pensando..." por texto sendo renderizado token a token | Usuário vê a resposta sendo construída |

### 1.3 — Persistência de Conversas no Backend (SQLite)

| Item | Descrição | Entregável |
|------|-----------|------------|
| 1.3.1 | Criar migration `V9` com tabela `conversations` e `messages` | Schema no banco |
| 1.3.2 | Criar `ChatManager` no backend (CRUD de conversas/mensagens) | API de chat persistente |
| 1.3.3 | Adicionar métodos no bridge: `chatListConversations`, `chatGetMessages`, `chatCreateConversation`, `chatSaveMessage`, `chatDeleteConversation` | Bridge exposto |
| 1.3.4 | Modificar `AiPanel.tsx` para usar backend em vez de `localStorage` | Conversas sobrevivem a restart |

### 1.4 — Sistema de Tools (Computer Use)

**Core da fase.** Permite o AI executar ações no computador do usuário.

| Item | Descrição | Entregável |
|------|-----------|------------|
| 1.4.1 | **Tool interface** — Definir schema `ToolDefinition` e `ToolResult` no backend | Contrato claro |
| 1.4.2 | **Tool: `read_file`** — Lê arquivo do disco | AI pode ler código |
| 1.4.3 | **Tool: `write_file`** — Escreve/conteúdo em arquivo | AI pode criar/modificar arquivos |
| 1.4.4 | **Tool: `create_file`** — Cria novo arquivo | AI pode criar estrutura |
| 1.4.5 | **Tool: `delete_file`** — Exclui arquivo/pasta | AI pode limpar |
| 1.4.6 | **Tool: `list_directory`** — Lista diretório | AI pode navegar |
| 1.4.7 | **Tool: `execute_command`** — Executa comando no terminal (PowerShell/cmd/bash) | AI pode rodar scripts, npm, git, etc. |
| 1.4.8 | **Tool: `grep_search`** — Busca texto em arquivos (ripgrep/grep) | AI pode encontrar padrões |
| 1.4.9 | **Tool: `glob_files`** — Busca arquivos por padrão glob | AI pode achar arquivos |
| 1.4.10 | **Tool: `git_status`** — Status do git | AI sabe o estado do repositório |
| 1.4.11 | **Tool: `git_commit`** — Commit com mensagem | AI pode commitar |
| 1.4.12 | **Tool: `git_diff`** — Mostra diff | AI pode revisar mudanças |
| 1.4.13 | **Tool: `web_search`** — Busca na web (via API/duckduckgo) | AI pode pesquisar |
| 1.4.14 | **Tool: `web_fetch`** — Baixa conteúdo de URL | AI pode ler docs online |
| 1.4.15 | **Tool: `ask_user`** — Pergunta ao usuário para aprovação/input | Segurança + interação |

### 1.5 — Agente ComputerUse

| Item | Descrição | Entregável |
|------|-----------|------------|
| 1.5.1 | Criar agente nativo `computer-use` com system prompt especializado | Agente expert em tarefas de código |
| 1.5.2 | Implementar `ToolLoop`: AI pensa → escolhe ferramenta → executa → observa resultado → repete | Loop autônomo |
| 1.5.3 | Adicionar `max_tool_rounds` (ex: 25) para evitar loops infinitos | Segurança |
| 1.5.4 | UI: renderizar chamadas de ferramenta (tool name + args + resultado) no chat | Transparência |
| 1.5.5 | UI: botão "Cancelar" durante execução de ferramentas | Usuário pode interromper |

### 1.6 — Sistema de Permissões para Tools

| Item | Descrição | Entregável |
|------|-----------|------------|
| 1.6.1 | Classificar tools por nível de risco (safe/ask/danger) | `read_file`=safe, `execute_command`=ask, `delete_file`=danger |
| 1.6.2 | Tools perigosas exigem confirmação do usuário antes de executar | Proteção |
| 1.6.3 | Audit log de todas as tools executadas | Rastreabilidade |

### 📦 Entregável FASE 1

> **Teste:** Abrir o chat, conversar com o agente "computer-use", pedir para ele criar um arquivo, modificar código, executar um comando git, pesquisar algo na web. A conversa deve sobreviver a restart do app.

---

## FASE 2: Workspace + Editor Unification (VS Code-like)

**Objetivo:** Unificar WorkspacePanel e EditorPanel numa experiência VS Code completa, com chat integrado ao contexto do arquivo/projeto.

### 2.1 — Unificação Workspace/Editor

| Item | Descrição |
|------|-----------|
| 2.1.1 | Mesclar `WorkspacePanel.tsx` e `EditorPanel.tsx` num único `WorkspaceView.tsx` |
| 2.1.2 | File tree com ícones VS Code (uso de `vscode-icons` ou similar) |
| 2.1.3 | Arrastar arquivos entre pastas (drag & drop) |
| 2.1.4 | Múltiplos roots com separação visual |
| 2.1.5 | Barra de busca no workspace (Ctrl+Shift+F) |

### 2.2 — Context Menu Inteligente

| Item | Descrição |
|------|-----------|
| 2.2.1 | Botão direito em arquivo → "Enviar para o Chat" com contexto |
| 2.2.2 | Botão direito em pasta → "Revisar projeto", "Criar documentação", "Criar testes", "Refatorar" |
| 2.2.3 | Botão direito em espaço vazio → "Analisar projeto", "Suggest features", "Criar .env.example" |
| 2.2.4 | Ações do chat com o arquivo selecionado como contexto |

### 2.3 — Sidebar Inteligente

| Item | Descrição |
|------|-----------|
| 2.3.1 | Mostrar atalhos para ações comuns do AI no workspace |
| 2.3.2 | Indicador visual de arquivos sendo editados pelo AI |
| 2.3.3 | Preview de mudanças antes de aplicar (diff view) |

### 📦 Entregável FASE 2

> **Teste:** Navegar pelo workspace como VS Code, clicar com direito em arquivo → "Enviar para o Chat", pedir explicação do código. Clicar em pasta → "Criar testes". Ver o AI trabalhando nos arquivos.

---

## FASE 3: Autonomous Agent System (Full E2E Automation)

**Objetivo:** JARVIS executa tarefas complexas de forma autônoma: planeja, executa, verifica, corrige.

### 3.1 — Task Planner

| Item | Descrição |
|------|-----------|
| 3.1.1 | AI recebe task → quebra em sub-tasks → sequencia |
| 3.1.2 | Cada sub-task é executada com ferramentas apropriadas |
| 3.1.3 | Verificação de resultados antes de passar para próxima sub-task |

### 3.2 — Auto-Healing

| Item | Descrição |
|------|-----------|
| 3.2.1 | Se uma ferramenta falha, AI tenta abordagem alternativa |
| 3.2.2 | Se o código tem erro de compilação, AI tenta corrigir |
| 3.2.3 | Máximo de retries configurável |

### 3.3 — Modo Background

| Item | Descrição |
|------|-----------|
| 3.3.1 | Tarefas podem rodar em background enquanto usuário faz outras coisas |
| 3.3.2 | Notificação quando tarefa completa |
| 3.3.3 | Painel de progresso com logs em tempo real |

### 3.4 — Memory & Context

| Item | Descrição |
|------|-----------|
| 3.4.1 | AI lembra de decisões anteriores no mesmo projeto |
| 3.4.2 | Contexto do projeto (estrutura, config, dependências) é passado automaticamente |
| 3.4.3 | Histórico de ações tomadas no projeto |

### 3.5 — Multi-Agent Collaboration

| Item | Descrição |
|------|-----------|
| 3.5.1 | Agente especialista em código + agente revisor + agente testador |
| 3.5.2 | Handoff entre agentes com contexto |
| 3.5.3 | Decisões por consenso ou voto |

### 📦 Entregável FASE 3

> **Teste:** Pedir "Implemente uma API REST de tarefas com CRUD completo em TypeScript, incluindo testes e documentação". JARVIS deve planejar, executar, testar e entregar tudo sem intervenção.

---

## Cronograma Estimado

| Fase | Tamanho | Dependências |
|------|---------|--------------|
| **FASE 1** | ~25 itens | Nenhuma — começamos agora |
| **FASE 2** | ~10 itens | FASE 1 (precisa do tool system) |
| **FASE 3** | ~12 itens | FASE 1 + 2 |

---

## Decisões Técnicas

| Decisão | Opção Escolhida | Motivo |
|---------|----------------|--------|
| Clipboard | `pyperclip` | Biblioteca Python pura, cross-platform, sem subprocess |
| Streaming | SSE-style via callback `onToken` | Frontend já tem suporte, só não era usado |
| Persistência | SQLite (existente) | Já temos migrations, schema, database.py |
| Tools | Backend Python com schema JSON | Mesmo padrão do MCP, fácil de estender |
| Tool Loop | `while` no backend com max_rounds | Simples, controlável, testável |
| Permissões | 3 níveis: safe / ask / danger | Balance entre segurança e fluidez |
