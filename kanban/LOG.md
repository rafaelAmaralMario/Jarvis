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
