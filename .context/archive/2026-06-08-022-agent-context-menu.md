# Contexto: Agent Panel Context Menu

**ID:** CONTEXT-022
**Timestamp:** 2026-06-08T08:25:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** context-generator

## Decisao / Conteudo

Adicionado menu de contexto contextual ao painel do agente (AiPanel.tsx):

### Funcionalidades
- Disparado ao clicar com botão direito em qualquer área do painel
- Elemento marcado com `data-context-menu-enabled` (não bloqueado pela prevenção global)
- Menu sensível ao contexto:
  - Novo Chat, Limpar Conversa (sempre visíveis)
  - Copiar Última Resposta (visível se houver mensagens)
  - Copiar Seleção (visível se houver texto selecionado)
  - Exportar Conversa (copia formato texto)
  - Configurações do Agente

## Arquivos Afetados

- `ui/src/components/AiPanel.tsx` — Context menu state + handler + items

## Proximos Passos

- Fase 5: Model Server Status (ModelCard + ModelsPanel)
- Fase 6: Native Folder Picker

## Notas

- Usa o mesmo componente `ContextMenu` reutilizável
- `data-context-menu-enabled` impede que o listener global do App.tsx bloqueie o evento
