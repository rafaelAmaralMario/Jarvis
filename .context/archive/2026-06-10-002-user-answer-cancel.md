# Contexto: Resposta do Usuario e Cancelamento

**ID:** CONTEXT-002
**Timestamp:** 2026-06-10T06:55:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** —

## Decisao / Conteudo

Implementado o mecanismo para o usuario responder a perguntas do agente durante execucao e cancelar execucoes em andamento.

### Resposta do Usuario (toolAgentAnswer)
- ToolAgent agora usa `threading.Event` para bloquear aguardando resposta do usuario
- `answer_question(question_id, answer)` define o evento e armazena a resposta
- O loop principal (`_run_loop`) continua apos receber a resposta
- Bridge method `toolAgentAnswer` roteia para o `ToolAgent` armazenado em `self._tool_agent`

### Cancelamento (cancelGeneration)
- ToolAgent possui flag `_cancelled` e metodo `cancel()`
- Bridge `cancelGeneration()` chama `self._tool_agent.cancel()`
- Cancelamento define o evento de espera para desbloquear o loop
- Frontend: botao "Cancelar" aparece durante loading, estilizado em vermelho

## Arquivos Afetados

- `backend/jarvis/tool_agent.py` — threading.Event para aguardar resposta, flag _cancelled, metodos answer_question/cancel
- `backend/jarvis/bridge.py` — toolAgentAnswer agora propaga para ToolAgent, cancelGeneration invoca cancel()
- `ui/src/types/index.ts` — PendingQuestion, ToolAgentAnswerResult
- `ui/src/hooks/use-jarvis.ts` — toolAgentAnswer adicionado
- `ui/src/components/AiPanel.tsx` — handleAnswer, handleCancel, pending question dialog, cancel button
- `ui/src/__mocks__/bridge.ts` — mock para toolAgentAnswer

## Proximos Passos

- Nenhum

## Notas

Timeout de 300s (5 min) para aguardar resposta do usuario.
