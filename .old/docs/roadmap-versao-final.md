# Roadmap para Versao Final Funcional - JARVIS

Status: revisao inicial apos MVP  
Objetivo: mapear o que falta para transformar o MVP em uma IDE final, funcional e confiavel.

## Ja Existe

- App desktop Tauri.
- Layout principal de IDE.
- Monaco Editor.
- Seletor visual de pasta do projeto.
- Persistencia do ultimo projeto aberto.
- Explorador de arquivos do workspace.
- Criar arquivo.
- Criar pasta.
- Remover arquivo ou pasta.
- Abrir arquivo de texto no editor.
- Salvar arquivo aberto.
- Painel Git com status e diff.
- Tela de configuracoes.
- Registro inicial de modelos.
- Provider mockado de IA.
- Painel de chat.
- Tela de plugins declarativos.
- Integracao inicial com Obsidian via Markdown.
- Logs basicos.
- Proposta mockada de alteracao revisavel.
- Icones e microanimacoes na UI.

## Falta para uma IDE Realmente Completa

### Editor

- Abas reais de multiplos arquivos.
- Indicador de arquivo modificado sem salvar.
- Fechar/reabrir abas.
- Buscar no arquivo.
- Buscar no projeto.
- Atalhos de teclado.
- Command palette.
- Renomear arquivos e pastas.
- Mover arquivos e pastas.
- Confirmacoes visuais proprias em vez de `prompt`/`confirm` do navegador.

### Filesystem

- Arvore recursiva de arquivos.
- Ignorar arquivos via `.gitignore`.
- Watcher para atualizar mudancas externas.
- Lixeira/recuperacao ou modo seguro para remocoes.
- Permissoes por workspace.
- Tratamento melhor para arquivos binarios.

### IA e Modelos

- Provider real local, como Ollama.
- Provider OpenAI-compatible.
- Configuracao segura de chaves.
- Streaming de respostas.
- Cancelar geracao.
- Selecionar modelo por tarefa.
- Fallback de modelo.
- Historico persistente de conversas.
- Contexto enviado de forma transparente.

### Agentes

- Agente desenvolvedor real.
- Agente revisor real.
- Ferramentas controladas por permissao.
- Execucao por etapas.
- Diffs reais propostos por agente.
- Logs completos por acao.
- Politicas de autonomia.

### Git

- Stage/unstage.
- Criar commits.
- Criar branches.
- Trocar branches.
- Resolver conflitos.
- Gerar mensagem de commit com IA.
- Integracao GitHub para PRs.

### Plugins

- Carregamento de manifestos locais.
- Ativar/desativar plugin.
- Configuracoes por plugin.
- Permissoes por plugin.
- Sandbox antes de permitir execucao de codigo.
- Marketplace futuro.

### Contexto e Obsidian

- Indexacao real.
- Busca textual.
- Busca semantica com embeddings.
- Memoria por projeto.
- Escrita opcional no vault.
- Registro automatico de decisoes.

### Seguranca

- Central de permissoes.
- Auditoria consultavel pela UI.
- Protecao de secrets.
- Avisos antes de enviar contexto a APIs externas.
- Perfis de risco por workspace.

### UX e Produto

- Onboarding inicial.
- Estados de loading e erro mais refinados.
- Icone definitivo e moderno do JARVIS.
- Sistema de icones moderno, consistente e baseado em linhas limpas.
- Microanimacoes consistentes para hover, selecao, carregamento e transicoes de paineis.
- Tema claro completo.
- Tema escuro polido.
- Layout redimensionavel.
- Configuracao de atalhos.
- Tour inicial opcional.

### Icones e Identidade Visual

- Criar icone definitivo do JARVIS em alta resolucao.
- Gerar variantes do icone para Windows, macOS, Linux e favicon.
- Usar icones modernos, geometricos e consistentes em toda a interface.
- Priorizar biblioteca de icones vetoriais, como Lucide, para a UI interna.
- Evitar mistura de estilos de icones no mesmo painel.
- Definir tamanhos padrao: 16px para toolbar, 18px para activity bar, 20px para botoes principais.
- Definir estados visuais de icones: normal, hover, ativo, desabilitado e risco.
- Criar icones especificos apenas quando a biblioteca nao representar bem a acao.
- Manter icones com contraste suficiente nos temas claro e escuro.
- Animar icones com sutileza: hover, loading, sucesso e erro.

### Distribuicao

- Icone definitivo.
- Assinatura de binarios.
- Auto-update.
- Instaladores versionados.
- Canal beta.
- Changelog.

## Proximas Prioridades Recomendadas

1. Arvore recursiva de arquivos com renomear/mover.
2. Abas reais no editor e indicador de arquivo modificado.
3. Modais proprios para criar/remover arquivos e pastas.
4. Provider local com Ollama.
5. Streaming no chat.
6. Stage/commit Git.
7. Sistema de permissoes visual.
8. Proposta real de edicao com diff aplicavel.

## Melhorias Futuras Consolidadas

Esta secao consolida ideias de evolucao futura que ficam fora da primeira versao final, mas devem orientar a arquitetura para nao fechar caminhos importantes.

### Produto

- Marketplace publico de plugins.
- Perfis de uso: desenvolvedor, escritor, pesquisador, estudante.
- Workspaces com presets de agentes e modelos.
- Onboarding guiado.
- Templates de projetos.
- Sistema de comandos favoritos.

### IA e Modelos

- Roteador automatico de modelos por tarefa.
- Comparacao de respostas entre modelos.
- Medicao de custo por tarefa.
- Cache de respostas.
- Avaliacao de qualidade por modelo.
- Suporte a modelos locais com Ollama e LM Studio.
- Suporte a provedores OpenAI-compatible.
- Suporte a modelos de imagem, audio e video.

### Agentes

- Multiagentes com coordenador.
- Planos de execucao longos com checkpoints.
- Agentes por projeto.
- Agentes treinados por contexto do usuario.
- Simulacao antes de executar.
- Avaliador automatico de mudancas.

### Contexto e Memoria

- Embeddings locais.
- Busca semantica no workspace.
- Memoria longa editavel.
- Grafo de conhecimento.
- Integracao profunda com Obsidian.
- Registro automatico de decisoes arquiteturais.
- Explicacao de qual contexto foi usado em cada resposta.

### Git e Colaboracao

- Criar commits com mensagem sugerida por IA.
- Criar branches pela interface.
- Abrir pull requests.
- Revisar PRs com agente revisor.
- Comparar mudancas de agentes e humanas.
- Gerar changelog.

### Plugins

- Sandbox de plugins.
- Assinatura/verificacao de plugins.
- Plugins privados.
- Plugins por workspace.
- Atualizacao automatica.
- Loja/marketplace.
- API publica para extensoes.

### Seguranca

- Perfis de permissao.
- Politicas por workspace.
- Modo seguro.
- Auditoria exportavel.
- Alertas para vazamento de secrets.
- Bloqueio de envio de dados sensiveis a providers externos.

### Interface

- Temas personalizados.
- Layouts salvos.
- Painel de timeline de acoes.
- Visualizacao grafica de contexto.
- Mapa de agentes e ferramentas.
- Melhor experiencia mobile/tablet apenas se fizer sentido no futuro.

### Empacotamento e Distribuicao

- Instaladores Windows, macOS e Linux.
- Auto-update.
- Assinatura de binarios.
- Canal beta.
- Telemetria opcional e transparente.
