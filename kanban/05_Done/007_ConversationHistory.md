# Conversation History + Agent Prompt

## Descrição
ToolAgent.execute() aceita `history` (mensagens anteriores) e `system_override` (custom prompt do agente selecionado). Bridge passa esses parâmetros através do AiPanel para o backend. Histórico de conversa é preservado entre mensagens.

## Critérios de Aceitação
- [x] ToolAgent.execute aceita parâmetro history
- [x] ToolAgent.execute aceita parâmetro system_override
- [x] Bridge passa history e agentId para o backend
- [x] AiPanel envia histórico da conversa
- [x] Agentes usam seus próprios system prompts

## Fase
Fase 0 — Estabilização

## Prioridade
Alta

## Concluído em
2026-06-10
