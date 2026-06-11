# T8: Terminal + Output + MCP Consolidation

## Descrição
Unificar terminal, painéis de saída (build, debug, problemas) e interface de servidores MCP em um único painel de ferramentas. Abas no bottom panel: Terminal, Output, MCP Servers, Problemas. Cada aba com sua própria toolbar.

## Critérios de Aceitação
- [ ] Bottom panel unificado com abas: Terminal, Output, MCP, Problemas
- [ ] Terminal existente migrado para nova aba
- [ ] Output mostra logs de build/execução
- [ ] MCP Servers: lista, status, start/stop, log
- [ ] Problemas: erros e warnings do código
- [ ] Toolbar própria por aba
- [ ] Painel redimensionável

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
