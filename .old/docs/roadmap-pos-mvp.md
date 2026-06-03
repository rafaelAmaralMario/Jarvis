# Roadmap Pos-MVP - JARVIS

Status: planejamento do que falta apos o MVP avancado  
Objetivo: organizar os proximos entregaveis para transformar o JARVIS em uma IDE confiavel para uso diario com IA, agentes, plugins, Git e memoria de contexto.

## Atualizacoes Recentes

- Fluxo de abrir projeto corrigido com capability do dialog, validacao de pasta, logs e auditoria.
- Layout lateral deixou de depender de configuracao manual e passou a permitir redimensionamento por arraste.
- Scroll dos paineis laterais, busca, chat e paineis inferiores foi revisado para nao se perder em listas longas.
- Chat foi estabilizado para preservar historico apos troca/hidratacao de workspace e mostrar erro quando provider falhar.
- Botao `Testar modelo` foi adicionado nas configuracoes para validar o provider/modelo ativo.

## Estado Atual

O JARVIS ja possui uma base funcional:

- App desktop Tauri com build Windows.
- Editor Monaco com abas, indicador de alteracao e salvamento.
- Explorador de workspace com arvore recursiva.
- Criar, remover, renomear e mover arquivos/pastas.
- Seletor visual de pasta e persistencia do ultimo workspace.
- Busca no projeto.
- Command palette e atalhos iniciais.
- Painel lateral e painel de IA redimensionaveis por arraste.
- Chat com providers mock, Ollama e OpenAI-compatible.
- Botao para testar o modelo/provider selecionado.
- Streaming e cancelamento de respostas.
- Historico de conversa por workspace.
- Git com status, diff, stage, unstage, commit e branches.
- URL inicial para Pull Request GitHub.
- Agentes controlados com propostas, revisao e auditoria.
- Central visual de permissoes por workspace.
- Plugins declarativos com ativar/desativar e verificacao.
- Contexto com notas Markdown, memoria local e escrita opcional no Obsidian.
- Tema claro/escuro, icone inicial, microanimacoes e layout salvo.
- Instaladores Windows gerados via Tauri.

## Visao de Versoes

### v0.1 Beta Funcional

Meta: tornar a IDE usavel em projetos reais pequenos, com seguranca basica e fluxo de desenvolvimento diario.

Entregaveis:

- Validar manualmente o fluxo corrigido de abrir projeto no app Tauri instalado e em modo dev.
- Testes unitarios para providers, filesystem, Git, plugins e memoria.
- Testes E2E para abrir workspace, editar arquivo, salvar, usar Git e chat.
- Terminal integrado real.
- Aplicacao de diff proposta por agente com confirmacao visual.
- Provider Ollama mais robusto com teste de conexao.
- Provider OpenAI-compatible com validacao de endpoint e chave.
- Keyring ou Tauri Stronghold para secrets.
- Push, pull e fetch Git.
- Melhor tratamento de arquivos binarios e arquivos grandes.
- Tela de auditoria com filtros.
- Reorganizacao inicial das configuracoes em secoes separadas para facilitar busca e manutencao.
- Testes automatizados para redimensionamento dos paineis, scroll de listas longas e estabilidade do chat.

Critérios de pronto:

- `npm run build`, `cargo check` e `npm run tauri:build` passam.
- Usuario consegue abrir um projeto pelo botao da interface, editar codigo, pedir ajuda ao modelo, revisar diff, commitar e gerar instalador.
- Nenhuma acao sensivel ocorre sem registro de auditoria.

### v0.2 IDE com IA Aplicavel

Meta: permitir que agentes ajudem de forma pratica, mas ainda supervisionada.

Entregaveis:

- Revisao e reformulacao da UI para uma experiencia moderna, clean, consistente e mais facil de usar.
- Redesenhar navegacao, paineis e estados vazios para reduzir ruido visual.
- Criar uma area de configuracoes modular, com categorias, busca e edicao mais clara.
- Agente desenvolvedor lendo multiplos arquivos autorizados.
- Agente revisor analisando diff real do Git.
- Aplicacao parcial de hunks.
- Preview lado a lado de mudancas.
- Geração de testes sugeridos por agente.
- Explicacao de quais arquivos/contextos foram usados na resposta.
- Roteamento de modelo por tarefa: texto, codigo, imagem e embeddings.
- Busca semantica real com embeddings locais ou provider configuravel.
- Indexacao incremental do workspace.
- Memoria editavel por projeto.
- Modulo inicial de fala para permitir que o usuario converse por voz com o JARVIS.
- Transcricao de voz para texto antes de enviar ao provider de IA.
- Resposta por voz usando mecanismo configuravel de text-to-speech.
- Configuracao para selecionar vozes, idioma, velocidade e provider de voz.

Critérios de pronto:

- Usuario consegue pedir uma alteracao, revisar o diff, aplicar parcialmente e rodar validacoes.
- A UI mostra claramente origem do contexto e permissoes usadas.
- O agente nunca aplica mudanca sem confirmacao.
- Usuario consegue falar com a ferramenta e receber resposta falada quando o modo de voz estiver ativo.

### v0.3 Colaboracao e GitHub

Meta: fechar o ciclo de trabalho profissional com Git/GitHub.

Entregaveis:

- Login/integração GitHub via `gh` ou API.
- Criar Pull Request pela UI.
- Listar PRs do repositório.
- Agente revisor para PR.
- Resolver conflitos com painel visual.
- Gerar changelog.
- Push/pull com feedback de progresso.
- Mensagens de commit geradas por IA com edicao antes de confirmar.

Critérios de pronto:

- Usuario consegue criar branch, commitar, fazer push e abrir PR sem sair do JARVIS.
- Revisoes de PR ficam registradas em auditoria.

### v0.4 Plugins Reais e Sandbox

Meta: permitir extensibilidade sem comprometer seguranca.

Entregaveis:

- API publica de plugins.
- Sandbox real para execucao de plugins.
- Configuracoes por plugin.
- Permissoes por plugin e por workspace.
- Assinatura/verificacao de plugins.
- Instalacao local de plugin.
- Atualizacao de plugin.
- Documentacao para criar plugin.

Critérios de pronto:

- Plugin externo pode adicionar comando ou provider sem alterar o core.
- Plugin sem permissao nao acessa filesystem, rede, Git, secrets ou comandos.

### v0.5 Produto e Distribuicao Profissional

Meta: preparar o JARVIS para instalacao e atualizacao confiavel.

Entregaveis:

- Icones finais em todos os formatos Tauri.
- Assinatura de binarios Windows.
- Preparacao macOS e Linux.
- Auto-update assinado.
- Canal beta.
- Changelog automatico.
- Pipeline CI/CD GitHub Actions.
- Checklist de release versionado.
- Telemetria opcional, transparente e desligada por padrao.
- Revisao visual final com foco em acessibilidade, contraste, legibilidade e consistencia de componentes.

Critérios de pronto:

- Release gera artefatos instalaveis por plataforma.
- Usuario consegue atualizar sem reinstalar manualmente.
- Builds sao reproduziveis via CI.

## Backlog Prioritario

### Prioridade Alta

1. Validar e corrigir o botao de abrir projeto.
2. Validar manualmente abrir projeto, resize dos paineis, scroll da busca e estabilidade do chat no app Tauri.
3. Adicionar testes automatizados.
4. Implementar terminal integrado real.
5. Aplicar diffs de agentes com aprovacao.
6. Migrar secrets para keyring/Stronghold.
7. Separar configuracoes por categorias e adicionar busca.
8. Implementar push/pull/fetch Git.
9. Criar testes de conexao para providers.
10. Melhorar auditoria com filtros e detalhes.
11. Criar pipeline CI.

### Prioridade Media

1. Revisar e reformular a UI para um visual moderno, clean e mais facil de usar.
2. Busca semantica real com embeddings.
3. Indexacao incremental do workspace.
4. Agente revisor com diff Git real.
5. Preview lado a lado de alteracoes.
6. GitHub PR completo.
7. Resolucao visual de conflitos.
8. Configuracao de atalhos.
9. Onboarding inicial.
10. Modulo de voz com entrada por fala e resposta falada.

### Prioridade Baixa

1. Marketplace de plugins.
2. Temas personalizados.
3. Telemetria opcional.
4. Comparacao entre modelos.
5. Custo por provider/modelo.
6. Grafo visual de contexto.
7. Perfis de uso por tipo de usuario.
8. Marketplace de vozes e presets de fala.

## Riscos Tecnicos

- Segurança de agentes aplicando mudancas no filesystem.
- Vazamento acidental de secrets ou contexto sensivel para providers externos.
- Performance de indexacao em workspaces grandes.
- Execucao de plugins sem sandbox suficiente.
- Diferencas de empacotamento entre Windows, macOS e Linux.
- Dependencia de ferramentas externas como Git, Ollama e GitHub CLI.
- Permissoes de microfone e privacidade no modulo de voz.
- Qualidade e latencia de transcricao e text-to-speech em providers diferentes.

## Decisoes Pendentes

- Usar keyring nativo, Tauri Stronghold ou ambos para secrets.
- Escolher estrategia de terminal integrado.
- Definir formato oficial de diff aplicavel por agente.
- Escolher provider inicial de embeddings.
- Definir se GitHub sera via `gh`, API direta ou ambos.
- Definir modelo de sandbox para plugins.
- Definir se auto-update usara GitHub Releases ou servidor proprio.
- Definir arquitetura de configuracoes: abas, busca, schema tipado e persistencia.
- Definir providers de voz iniciais: Web Speech API, provider local ou APIs externas.
- Definir politica de privacidade para microfone, transcricao e armazenamento de audio.

## Proximo Marco Recomendado

Criar a milestone `v0.1 beta funcional` com as seguintes issues iniciais:

1. Validar manualmente fluxos criticos da UI no app Tauri.
2. Adicionar suite de testes unitarios.
3. Adicionar smoke test E2E da UI.
4. Separar configuracoes por categorias e adicionar busca.
5. Implementar terminal integrado.
6. Implementar aplicacao de diff com aprovacao.
7. Migrar secrets para storage seguro.
8. Implementar push/pull/fetch Git.
9. Criar teste automatizado de conexao dos providers.
10. Criar pipeline CI com build web, cargo check e Tauri build.

## Epic Futuro - UI, Configuracoes e Voz

Objetivo: tornar o JARVIS mais simples, moderno e natural de usar.

Entregaveis:

- Revisar todos os fluxos principais da interface.
- Reformular a UI para um padrao mais clean, moderno e direto.
- Validar botoes essenciais, especialmente abrir projeto, salvar arquivo, selecionar provider e carregar contexto.
- Separar configuracoes em modulos: Geral, Workspace, IA, Providers, Voz, Git, Plugins, Seguranca, Aparencia e Atalhos.
- Adicionar busca dentro das configuracoes.
- Adicionar modulo de fala com entrada por microfone.
- Adicionar resposta falada do JARVIS.
- Permitir escolher voz, idioma, velocidade e provider de voz.
- Mostrar claramente quando o microfone esta ativo.
- Registrar em auditoria quando audio/transcricao forem usados.
