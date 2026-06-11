# Model Server Status + Chat Timeout + Models List (T1-T3)

## Descrição
Corrigir bugs críticos: ping com timeout no ModelServerStatus, detecção de PATH para encontrar Ollama, listModels com auto-start, timeout configurável no OllamaClient (120s), polling de chat com timeout 180s e auto-cancel, indicador de status clicável no StatusBar.

## Critérios de Aceitação
- [x] ModelServerStatus usa ping com timeout em vez de espera infinita
- [x] startModelServer encontra Ollama via PATH detection (sem PowerShell)
- [x] listModels tenta auto-start do servidor se estiver offline
- [x] OllamaClient aceita timeout configurável (default 120s)
- [x] Chat polling tem timeout de 180s com auto-cancel
- [x] StatusBar mostra status do Ollama e é clicável

## Fase
Fase 0 — Estabilização

## Prioridade
Alta

## Concluído em
2026-06-10
