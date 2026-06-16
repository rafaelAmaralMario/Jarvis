# T8: Terminal + Output + MCP Consolidation

## Descrição
Unificar terminal, painéis de saída (build, debug, problemas) e interface de servidores MCP em um único painel de ferramentas. Abas no bottom panel: Terminal, Output, MCP Servers, Problemas. Cada aba com sua própria toolbar.

## Critérios de Aceitação
- [x] Bottom panel unificado com abas: Terminal, Output, MCP, Problemas
- [x] Terminal existente migrado para nova aba
- [x] Output mostra logs de build/execução (OutputManager + bridge + UI)
- [x] MCP Servers: lista, status, start/stop
- [x] Problemas: erros e warnings do código
- [x] Toolbar própria por aba
- [x] Painel redimensionável (mesmo resize handler do terminal anterior)

## Dependências
- [ ] — (independente, UI + backend de MCP)

## Fase
Fase 0 — Estabilização

## Prioridade
Média

## Esforço Estimado
Grande

## Notas
Originalmente T8 do roadmap. Requer refatoração da UI do terminal existente + backend MCP.
