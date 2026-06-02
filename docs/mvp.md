# MVP - JARVIS

Status: inicial  
Objetivo: definir a primeira versao funcional do JARVIS com entregas pequenas, verificaveis e uteis.

## Objetivo do MVP

Criar uma IDE desktop funcional com base Tauri, interface moderna, editor, configuracoes iniciais, painel de IA mockado, Git basico e primeiras fundacoes para agentes, plugins e contexto.

## Entra no MVP

- App Tauri com frontend TypeScript/Vite.
- Layout base de IDE.
- Monaco Editor.
- Explorador de arquivos inicial.
- Tela visual de configuracoes.
- Persistencia local de configuracoes.
- Registro inicial de modelos.
- Painel de chat/IA com provider mockado.
- Painel Git com status.
- Visualizacao de diff Git.
- Manifesto inicial de plugins.
- Tela inicial de plugins.
- Configuracao de vault Obsidian.
- Listagem de Markdown do Obsidian.
- Logs basicos de acoes de agentes.
- Fluxo de proposta de alteracao revisavel.
- Documentacao de desenvolvimento local.

## Nao Entra no MVP

- Marketplace publico de plugins.
- Execucao de codigo arbitrario por plugins.
- Multiagentes autonomos complexos.
- Geracao avancada de imagens.
- Voz/audio.
- Sincronizacao em nuvem.
- Sistema corporativo de permissoes.
- Compatibilidade completa com extensoes VS Code.

## Ordem Recomendada

1. Scaffold Tauri.
2. Arquitetura de pastas.
3. Layout base.
4. Monaco Editor.
5. Explorador de arquivos.
6. Configuracoes visuais.
7. Persistencia local.
8. Registro de modelos.
9. Painel IA mockado.
10. Git status.
11. Diff Git.
12. Manifesto de plugins.
13. Tela de plugins.
14. Obsidian vault.
15. Markdown do Obsidian.
16. Logs de agentes.
17. Proposta de alteracao.
18. Documentacao local.

## Criterios de Sucesso

- O app abre como desktop.
- O usuario reconhece a interface como uma IDE.
- O usuario abre/navega arquivos autorizados.
- O editor renderiza corretamente.
- O usuario altera configuracoes basicas visualmente.
- O usuario conversa com provider mockado.
- O usuario visualiza status e diff Git.
- O usuario configura um vault Obsidian.
- O sistema registra acoes basicas.
- Alteracoes propostas passam por revisao antes de aplicar.

## Qualidade Minima

- Build sem erro.
- Formatacao aplicada.
- Estrutura de pastas documentada.
- Sem secrets versionados.
- Fluxos sensiveis passam por permissao.
- Componentes principais com estados vazios e erros basicos.

