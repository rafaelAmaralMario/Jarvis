# Contexto: Confirmacao de Permissao (ask/danger)

**ID:** CONTEXT-004
**Timestamp:** 2026-06-10T07:05:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** —

## Decisao / Conteudo

Implementada confirmacao de permissao antes de executar ferramentas de risco `ask` e `danger`.

### Fluxo
- Antes de executar qualquer ferramenta, o ToolAgent verifica o risk level via `tool_manager.get_risk()`
- Se `ASK`: exibe dialogo "Permitir execucao da ferramenta X? Argumentos: {...}"
- Se `DANGER`: exibe dialogo similar com indicador "PERIGOSA"
- Usuario responde "sim" (ou "s", "yes", "permitir") para permitir, qualquer outra resposta nega
- Se negado: LLM recebe "User DENIED execution" e deve sugerir alternativas
- Reutiliza o mesmo mecanismo de pendingQuestion / answer do CONTEXT-002

### Integracao Frontend
- O mesmo dialogo de pergunta pendente exibe tanto perguntas do `ask_user` quanto confirmacoes de permissao
- Input de texto + botao "Enviar" para resposta
- Indicador visual amber para questoes do agente

## Arquivos Afetados

- `backend/jarvis/tool_agent.py` — verificacao de risco antes de executar ferramentas, ask/danger usam pending question
- `backend/jarvis/tool_manager.py` — RiskLevel enum (ja existia)

## Proximos Passos

- Nenhum

## Notas

Ferramenta `ask_user` (tool_name == "ask_user") é tratada separadamente, sempre requer resposta.
