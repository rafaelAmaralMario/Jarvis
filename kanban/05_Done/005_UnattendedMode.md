# Unattended Mode

## Descrição
Checkbox "🔓 Não Assistido" no input do AiPanel, persistido em localStorage. Quando ativo, todas as verificações de permissão são puladas (ferramentas executam diretamente). Quando desativo, ferramentas ASK/DANGER prompt usuário. Diálogo de permissão melhorado com botões Allow/Deny.

## Critérios de Aceitação
- [x] Checkbox no AiPanel com label "🔓 Não Assistido"
- [x] Persistência em localStorage (chave `jarvis_unattended`)
- [x] Unattended ativo → todas as tools executam sem perguntar
- [x] Unattended desativo → tools ASK/DANGER prompt usuário
- [x] Diálogo de permissão com Allow/Deny rápidos

## Fase
Fase 0 — Estabilização

## Prioridade
Alta

## Concluído em
2026-06-10
