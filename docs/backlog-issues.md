# Backlog Inicial de Issues - JARVIS

Status: rascunho operacional  
Origem: `docs/especificacao-jarvis.md`  
Objetivo: transformar a especificacao em entregaveis pequenos, testaveis e fechaveis um por um.

## Como Usar

Cada item abaixo foi escrito para virar uma GitHub Issue. A recomendacao e criar primeiro os epicos e depois as issues do MVP. O GitHub Project pode ser criado depois, usando estas colunas:

- Backlog
- Ready
- In Progress
- Review
- Done

Labels sugeridas:

- `epic`
- `mvp`
- `frontend`
- `tauri`
- `security`
- `llm`
- `agent`
- `git`
- `plugins`
- `context`
- `obsidian`
- `docs`

## Epicos

### Epic 1 - Arquitetura Base Tauri

```md
## Objetivo
Criar a base desktop do JARVIS com Tauri, frontend em TypeScript/Vite e backend nativo em Rust para capacidades sensiveis.

## Entregavel
Projeto inicial executavel como aplicativo desktop Tauri.

## Criterios de aceite
- O app Tauri inicia localmente.
- O frontend Vite renderiza dentro da janela desktop.
- A estrutura de pastas separa frontend, backend Tauri, documentacao e configuracoes.
- Existe um comando documentado para rodar o app em desenvolvimento.
- Existe um comando documentado para gerar build basico.

## Fora do escopo
- Chat com LLM.
- Agentes.
- Plugins.
- Integracao Git completa.
```

### Epic 2 - Interface Principal da IDE

```md
## Objetivo
Construir a interface principal do JARVIS como uma IDE moderna, inspirada em ferramentas como Visual Studio e VS Code, mas pensada para IA.

## Entregavel
Layout funcional com explorador, editor central, painel de IA e terminal/painel inferior.

## Criterios de aceite
- A interface possui layout de IDE, nao apenas uma tela de chat.
- Existe uma area central para editor.
- Existe uma sidebar para arquivos e ferramentas.
- Existe um painel lateral para IA/agentes.
- Existe area inferior para terminal, logs ou saidas.
- O layout funciona em resolucoes desktop comuns.
```

### Epic 3 - Configuracoes Visuais

```md
## Objetivo
Permitir que o usuario configure o JARVIS por uma interface visual.

## Entregavel
Tela de configuracoes com secoes iniciais para modelos, agentes, plugins, integracoes, seguranca, interface e contexto.

## Criterios de aceite
- A tela de configuracoes pode ser acessada pela interface.
- Existem secoes navegaveis.
- Configuracoes basicas sao persistidas localmente.
- O usuario nao precisa editar arquivo manualmente para alterar configuracoes comuns.
```

### Epic 4 - Sistema de Modelos e Provedores

```md
## Objetivo
Criar uma camada abstrata para provedores e modelos, permitindo trocar LLMs por tarefa.

## Entregavel
Registro local de provedores/modelos com categorias como texto, codigo, imagem e embeddings.

## Criterios de aceite
- Existe uma interface comum para provedores.
- Modelos possuem metadados de capacidade.
- O usuario pode escolher modelo padrao por funcao.
- Existe preparacao para fallback quando um modelo nao estiver disponivel.
```

### Epic 5 - Agentes e Permissoes

```md
## Objetivo
Criar a base para agentes configuraveis com modelo, ferramentas e permissoes.

## Entregavel
Sistema inicial de agentes com definicao declarativa e regras de permissao.

## Criterios de aceite
- Agentes possuem nome, objetivo, modelo padrao e ferramentas permitidas.
- Permissoes sensiveis sao explicitamente declaradas.
- Acoes de agentes podem ser registradas em log local.
- Alteracoes em arquivos podem ser propostas antes de aplicadas.
```

### Epic 6 - Integracao Git

```md
## Objetivo
Integrar Git como recurso nativo da IDE para acompanhar e revisar mudancas.

## Entregavel
Painel Git basico com status de arquivos e diff visual.

## Criterios de aceite
- O usuario visualiza arquivos modificados, adicionados, removidos e nao rastreados.
- O usuario abre diff de um arquivo alterado.
- A interface prepara o caminho para commits e branches.
- Mudancas propostas por agentes podem ser revisadas antes de commit.
```

### Epic 7 - Sistema de Plugins

```md
## Objetivo
Preparar a arquitetura para extensoes e plugins futuros.

## Entregavel
Formato inicial de manifesto de plugin e tela basica para listar plugins instalados.

## Criterios de aceite
- Existe um manifesto documentado para plugins.
- Plugins declaram nome, versao, capacidades e permissoes.
- A tela de plugins exibe plugins conhecidos.
- O core nao depende de plugins especificos para iniciar.
```

### Epic 8 - Contexto e Obsidian

```md
## Objetivo
Criar a base do cerebro de contexto do JARVIS com suporte inicial a arquivos locais e Obsidian.

## Entregavel
Leitura inicial de Markdown e configuracao de um vault do Obsidian como fonte de contexto.

## Criterios de aceite
- O usuario configura um caminho de vault.
- O sistema lista arquivos Markdown autorizados.
- Pastas ignoradas podem ser configuradas.
- O contexto recuperado pode ser usado por um agente no futuro.
```

## Issues do MVP

### Issue 1 - Criar scaffold inicial do app Tauri

```md
## Objetivo
Criar a estrutura inicial do JARVIS usando Tauri, Vite e TypeScript.

## Entregavel
Aplicativo desktop vazio, executavel em modo desenvolvimento.

## Criterios de aceite
- O projeto contem configuracao Tauri.
- O frontend usa TypeScript e Vite.
- O app abre uma janela desktop com o nome JARVIS.
- O README explica como rodar o app.

## Labels
`mvp`, `tauri`, `frontend`
```

### Issue 2 - Definir arquitetura de pastas do projeto

```md
## Objetivo
Organizar a estrutura inicial do repositario para suportar frontend, backend, docs, testes e configuracoes.

## Entregavel
Estrutura de pastas documentada.

## Criterios de aceite
- Existe uma estrutura clara para frontend.
- Existe uma estrutura clara para comandos Tauri/Rust.
- Existe uma pasta para documentacao.
- Existe uma pasta ou convencao para configuracoes locais.
- A estrutura esta descrita em Markdown.

## Labels
`mvp`, `docs`, `tauri`
```

### Issue 3 - Criar layout base da IDE

```md
## Objetivo
Criar a primeira versao visual da IDE.

## Entregavel
Tela com sidebar, editor central, painel lateral de IA e painel inferior.

## Criterios de aceite
- Sidebar esquerda visivel.
- Editor central visivel.
- Painel de IA lateral visivel.
- Painel inferior para terminal/logs visivel.
- Layout responsivo para desktop.
- Visual moderno, limpo e profissional.

## Labels
`mvp`, `frontend`
```

### Issue 4 - Adicionar editor Monaco

```md
## Objetivo
Integrar Monaco Editor como area central de edicao.

## Entregavel
Editor funcional renderizado no painel central.

## Criterios de aceite
- Monaco carrega sem erro.
- O editor exibe conteudo inicial.
- O tema do editor acompanha o tema da IDE.
- A area do editor nao quebra o layout.

## Labels
`mvp`, `frontend`
```

### Issue 5 - Criar explorador de arquivos inicial

```md
## Objetivo
Permitir que o usuario visualize arquivos do workspace na sidebar.

## Entregavel
Explorador basico de arquivos.

## Criterios de aceite
- O backend Tauri lista arquivos autorizados do workspace.
- A sidebar mostra pastas e arquivos.
- Clicar em um arquivo prepara abertura no editor.
- O acesso a arquivos respeita uma raiz autorizada.

## Labels
`mvp`, `tauri`, `frontend`, `security`
```

### Issue 6 - Criar tela visual de configuracoes

```md
## Objetivo
Criar a tela inicial de configuracoes do JARVIS.

## Entregavel
Tela com navegacao entre secoes de configuracao.

## Criterios de aceite
- A tela e acessivel pela interface.
- Existem secoes para Modelos, Agentes, Plugins, Integracoes, Seguranca, Interface e Contexto.
- Configuracoes basicas podem ser exibidas.
- A estrutura esta pronta para persistencia.

## Labels
`mvp`, `frontend`
```

### Issue 7 - Persistir configuracoes locais

```md
## Objetivo
Salvar configuracoes basicas do usuario localmente.

## Entregavel
Mecanismo local de leitura e escrita de configuracoes.

## Criterios de aceite
- Configuracoes sao salvas localmente.
- Configuracoes sao carregadas ao iniciar o app.
- O formato e documentado.
- Dados sensiveis ficam separados de configuracoes comuns.

## Labels
`mvp`, `tauri`, `security`
```

### Issue 8 - Criar registro inicial de modelos

```md
## Objetivo
Definir o formato inicial para registrar provedores e modelos.

## Entregavel
Schema ou tipo TypeScript/Rust para provedores e modelos.

## Criterios de aceite
- Modelos possuem nome, provedor, categoria e status.
- Categorias iniciais incluem texto, codigo, imagem e embeddings.
- Existe configuracao de modelo padrao por funcao.
- O formato permite adicionar novos provedores no futuro.

## Labels
`mvp`, `llm`
```

### Issue 9 - Criar painel de chat/IA inicial

```md
## Objetivo
Criar a interface inicial do painel de IA.

## Entregavel
Painel lateral com campo de mensagem, historico e indicador de modelo ativo.

## Criterios de aceite
- O painel mostra uma conversa vazia.
- O usuario pode digitar uma mensagem.
- O painel mostra qual modelo esta selecionado.
- O envio pode usar resposta mockada no MVP inicial.

## Labels
`mvp`, `frontend`, `llm`
```

### Issue 10 - Implementar primeiro provedor LLM mockado

```md
## Objetivo
Criar um provedor falso para desenvolver a interface antes de conectar APIs reais.

## Entregavel
Provider mock que responde mensagens de teste.

## Criterios de aceite
- O painel de IA consegue chamar o provider mock.
- A resposta aparece no historico.
- O provider usa a mesma interface esperada para provedores reais.
- O mock pode ser substituido sem alterar a UI.

## Labels
`mvp`, `llm`
```

### Issue 11 - Criar painel Git com status basico

```md
## Objetivo
Mostrar o status Git do workspace dentro da IDE.

## Entregavel
Painel Git com lista de arquivos alterados.

## Criterios de aceite
- O backend executa leitura segura de status Git.
- A UI exibe arquivos modificados, adicionados, removidos e nao rastreados.
- O painel mostra estado vazio quando nao ha repositorio Git.
- Erros sao exibidos de forma amigavel.

## Labels
`mvp`, `git`, `tauri`, `frontend`
```

### Issue 12 - Criar visualizacao de diff Git

```md
## Objetivo
Permitir revisar mudancas de um arquivo pelo JARVIS.

## Entregavel
Visualizacao basica de diff.

## Criterios de aceite
- O usuario seleciona um arquivo alterado no painel Git.
- A IDE exibe diff textual ou visual.
- A visualizacao diferencia linhas adicionadas e removidas.
- O recurso funciona sem criar commits.

## Labels
`mvp`, `git`, `frontend`
```

### Issue 13 - Definir manifesto inicial de plugins

```md
## Objetivo
Criar o formato inicial para plugins do JARVIS.

## Entregavel
Documento e schema inicial de manifesto de plugin.

## Criterios de aceite
- O manifesto possui nome, versao, autor, capacidades e permissoes.
- Existe exemplo de plugin.
- O formato deixa claro se o plugin executa codigo ou apenas declara integracoes.
- Permissoes sensiveis sao explicitamente declaradas.

## Labels
`mvp`, `plugins`, `security`, `docs`
```

### Issue 14 - Criar tela de plugins inicial

```md
## Objetivo
Criar uma tela visual para listar e configurar plugins no futuro.

## Entregavel
Tela de plugins com lista mockada ou manifestos locais.

## Criterios de aceite
- A tela mostra plugins instalados/conhecidos.
- Cada plugin exibe nome, versao, status e permissoes.
- Existem controles visuais para ativar/desativar, ainda que mockados.
- A tela nao permite execucao arbitraria de codigo no MVP.

## Labels
`mvp`, `plugins`, `frontend`, `security`
```

### Issue 15 - Configurar vault do Obsidian

```md
## Objetivo
Permitir selecionar ou informar o caminho de um vault do Obsidian.

## Entregavel
Configuracao inicial de caminho do vault.

## Criterios de aceite
- O usuario informa um caminho de vault.
- O caminho e salvo nas configuracoes locais.
- O sistema valida se o caminho existe.
- O usuario pode remover ou trocar o vault configurado.

## Labels
`mvp`, `obsidian`, `context`, `frontend`, `tauri`
```

### Issue 16 - Listar notas Markdown do Obsidian

```md
## Objetivo
Ler arquivos Markdown de um vault autorizado.

## Entregavel
Listagem inicial de notas Markdown.

## Criterios de aceite
- O sistema lista arquivos `.md` do vault configurado.
- Pastas ignoradas podem ser respeitadas.
- A leitura permanece limitada ao caminho autorizado.
- A UI exibe as notas encontradas.

## Labels
`mvp`, `obsidian`, `context`, `security`
```

### Issue 17 - Criar base de logs de acoes de agentes

```md
## Objetivo
Registrar acoes relevantes executadas por agentes ou automacoes.

## Entregavel
Log local simples de acoes.

## Criterios de aceite
- Cada acao registra data, origem, agente/modelo quando aplicavel e resultado.
- Logs sao armazenados localmente.
- A estrutura permite consulta futura pela interface.
- O log nao grava segredos em texto aberto.

## Labels
`mvp`, `agent`, `security`
```

### Issue 18 - Criar fluxo de proposta de alteracao revisavel

```md
## Objetivo
Permitir que uma automacao proponha alteracoes antes de aplicar em arquivos.

## Entregavel
Fluxo inicial de proposta, diff e confirmacao.

## Criterios de aceite
- Uma alteracao pode ser gerada como proposta.
- O usuario visualiza o diff antes de aplicar.
- O usuario pode aceitar ou rejeitar a proposta.
- A proposta aceita altera apenas arquivos autorizados.

## Labels
`mvp`, `agent`, `security`, `frontend`
```

### Issue 19 - Criar documentacao de desenvolvimento local

```md
## Objetivo
Documentar como preparar, rodar e validar o projeto localmente.

## Entregavel
Guia de desenvolvimento no README ou em `docs/`.

## Criterios de aceite
- O guia lista requisitos.
- O guia explica comandos de desenvolvimento.
- O guia explica comandos de build/teste existentes.
- O guia explica convencoes basicas do projeto.

## Labels
`mvp`, `docs`
```

### Issue 20 - Criar GitHub Project para acompanhamento

```md
## Objetivo
Criar um quadro visual para acompanhar issues do JARVIS.

## Entregavel
GitHub Project com colunas de fluxo.

## Criterios de aceite
- O project possui colunas Backlog, Ready, In Progress, Review e Done.
- Issues do MVP estao adicionadas ao project.
- Epicos estao identificados por label.
- O fluxo de trabalho esta documentado.

## Labels
`docs`
```

