# Contexto: Streaming por Polling

**ID:** CONTEXT-003
**Timestamp:** 2026-06-10T07:00:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** —

## Decisao / Conteudo

Implementado sistema de streaming por polling para exibir tokens do agente em tempo real no frontend.

### Arquitetura
- `toolAgentExecuteStream` inicia uma thread que executa o ToolAgent em background
- O metodo retorna imediatamente com um `taskId` (UUID)
- O stream state é armazenado em `JARVISBridge._streams[task_id]`
- `toolAgentGetStream(taskId)` retorna o estado acumulado: content, toolCalls, toolResults, pendingQuestion, done, cancelled, error
- Callbacks `on_token`, `on_tool_call`, `on_tool_result` escrevem no stream a medida que o agente executa

### Frontend
- AiPanel chama `toolAgentExecuteStream` em vez de `toolAgentExecute`
- Placeholder message é inserida e atualizada a cada 100ms com polling
- Tool calls aparecem progressivamente durante a execucao
- Ao encontrar pending question, para de pollear e exibe o dialogo de resposta

## Arquivos Afetados

- `backend/jarvis/bridge.py` — toolAgentExecuteStream, toolAgentGetStream, dict _streams
- `ui/src/types/index.ts` — StreamTask, StreamState, interfaces toolAgentExecuteStream/toolAgentGetStream
- `ui/src/hooks/use-jarvis.ts` — fallbacks e metodos bridge para streaming
- `ui/src/components/AiPanel.tsx` — handleSend usa streaming, polling loop com setTimeout 100ms

## Proximos Passos

- Nenhum

## Notas

Pywebview nao suporta streaming nativo (request-response). Polling é a abordagem mais pratica.
