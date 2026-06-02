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
- Tema claro completo.
- Tema escuro polido.
- Layout redimensionavel.
- Configuracao de atalhos.
- Tour inicial opcional.

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

