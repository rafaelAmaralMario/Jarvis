# Contexto: Chat Persistence e Tool System

**ID:** CONTEXT-001
**Timestamp:** 2026-06-10T06:50:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** —

## Decisao / Conteudo

Implementados os sistemas de persistencia de conversas (ChatManager) e ferramentas autonomas (ToolManager/ToolAgent) para o Computer Use Agent.

### ChatManager
- Usa as tabelas SQLite existentes (`agent_conversations`, `conversation_messages`) sem nova migracao
- CRUD completo: criar conversa, salvar mensagens, listar, deletar, auto-titulo via LLM
- Bridge methods: `chatListConversations`, `chatGetMessages`, `chatCreateConversation`, `chatSaveMessage`, `chatDeleteConversation`, `chatAutoTitle`

### ToolManager + ToolAgent
- 12 ferramentas com 3 niveis de risco: `safe`, `ask`, `danger`
- Agente autonomo que pensa → escolhe ferramenta → executa → observa → repete
- Formato de chamada: JSON em code blocks (```json {"tool": "name", "args": {...}} ```)
- ToolAgent agente embutido `computer-use` com system prompt especializado

### AiPanel (Frontend)
- Reescreito para usar persistencia no backend
- Visualizacao de ferramentas (tool calls) com estados pending/success/error
- Estado da sessao preservado em `sessionStorage`
- Menu de contexto para exportar/copiar

## Arquivos Afetados

- `backend/jarvis/chat_manager.py` — novo: ChatManager com SQLite CRUD
- `backend/jarvis/tool_manager.py` — novo: 12 ferramentas com risk levels
- `backend/jarvis/tool_agent.py` — novo: loop autonomo de tool calling
- `backend/jarvis/bridge.py` — adicionados 15 novos metodos chat+tools
- `backend/jarvis/agents_manager.py` — ComputerUseAgent built-in
- `backend/jarvis/main.py` — WorkspaceManager root para ToolManager
- `ui/src/types/index.ts` — novos tipos: ConversationSummary, ChatMessage, ToolDefinition, ToolCallResult, ToolAgentCall, ToolAgentResult, ToolAgentResponse
- `ui/src/hooks/use-jarvis.ts` — novos metodos bridge
- `ui/src/components/AiPanel.tsx` — reescrito com persistencia + tool visualization
- `ui/src/__mocks__/bridge.ts` — mocks atualizados
- `ui/src/__tests__/AiPanel.test.tsx` — mocks atualizados
- `ui/src/__tests__/MainArea.test.tsx` — mocks atualizados
- `ui/src/__tests__/Settings/AgentsPanel.test.tsx` — mocks atualizados
- `ui/src/__tests__/Workspace/WorkspacePanel.test.tsx` — mocks atualizados

## Proximos Passos

- Testar backend com JARVIS rodando
- Persistir conversas no backend (chatSaveMessage apos cada troca)

## Notas

Clipboard fix: substituido PowerShell Set-Clipboard por pyperclip.
