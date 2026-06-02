# Interface e Layout - JARVIS

Status: inicial  
Objetivo: definir uma interface de IDE moderna, profissional e pensada para IA desde a origem.

## Principio Visual

O JARVIS deve parecer uma IDE real, nao um chat com editor embutido. A interface deve ser familiar para quem usa Visual Studio e VS Code, mas com IA, agentes, contexto, modelos e permissoes como elementos nativos.

## Layout Principal

Estrutura recomendada:

```text
Top Bar
Activity Bar | Sidebar | Editor Area | AI/Context Panel
             |         | Bottom Panel |
Status Bar
```

## Areas da Interface

### Top Bar

Funcionalidades:

- Nome do workspace.
- Seletor rapido de modelo.
- Status do modelo ativo.
- Indicador de agente ativo.
- Botao de command palette.
- Acesso rapido a configuracoes.

### Activity Bar

Icones principais:

- Arquivos.
- Busca.
- Git.
- Agentes.
- Contexto.
- Plugins.
- Configuracoes.

Padrao visual:

- Usar icones modernos, vetoriais e de linha, preferencialmente da mesma biblioteca.
- Manter espessura, tamanho e alinhamento consistentes.
- Evitar misturar icones preenchidos, emojis, letras soltas e pictogramas de estilos diferentes.
- O icone ativo deve ter cor de destaque e animacao sutil.
- Acoes destrutivas devem usar cor de risco apenas no estado adequado.

### Icone do JARVIS

O icone do JARVIS deve ser tratado como identidade do produto.

Diretrizes:

- Aparencia moderna, tecnica e memoravel.
- Deve funcionar em 16px, 32px, 128px, 256px e 1024px.
- Deve ter versao para app desktop, instalador e favicon.
- Deve evitar excesso de detalhe para permanecer legivel em tamanhos pequenos.
- Deve combinar com a linguagem visual da IDE: precisa, limpa, tecnologica e profissional.
- O icone atual e temporario e existe apenas para permitir build e empacotamento.

### Sidebar

Deve exibir conteudo conforme item ativo da Activity Bar:

- Explorador de arquivos.
- Busca global.
- Status Git.
- Lista de agentes.
- Fontes de contexto.
- Plugins instalados.

### Editor Area

Area central da IDE.

Funcionalidades:

- Abas de arquivos.
- Monaco Editor.
- Diff viewer.
- Preview de Markdown.
- Estados vazios bem definidos.
- Indicadores de arquivo modificado.

### AI/Context Panel

Painel lateral direito dedicado a IA.

Funcionalidades:

- Conversa atual.
- Modelo selecionado.
- Agente selecionado.
- Contexto usado na resposta.
- Ferramentas disponiveis.
- Historico de acoes.
- Sugestoes e propostas de alteracao.

### Bottom Panel

Funcionalidades:

- Terminal integrado.
- Logs de agentes.
- Problemas.
- Saidas de tarefas.
- Resultado de comandos.
- Auditoria resumida.

### Status Bar

Informacoes:

- Branch Git atual.
- Workspace ativo.
- Modelo ativo.
- Estado de indexacao.
- Permissoes em uso.
- Status de conexao com provider.

## Telas de Configuracao

Secoes iniciais:

- Modelos e provedores.
- Agentes.
- Plugins.
- Integracoes.
- Seguranca e permissoes.
- Interface.
- Contexto e memoria.
- Git.

Cada tela deve ter:

- Titulo claro.
- Descricao curta.
- Estado atual.
- Controles editaveis.
- Botao para testar quando existir integracao.
- Mensagens de erro e sucesso.

## Componentes Padrao

Componentes esperados:

- Botao com icone.
- Tabs.
- Split panes.
- Lista de arquivos.
- Lista de comandos.
- Badge de modelo.
- Badge de agente.
- Badge de permissao.
- Modal de confirmacao.
- Drawer de detalhes.
- Diff viewer.
- Empty state.
- Toast de resultado.

## Command Palette

Deve unificar comandos da IDE e comandos de IA.

Exemplos:

- Abrir arquivo.
- Alternar tema.
- Escolher modelo.
- Executar agente.
- Revisar alteracoes.
- Indexar workspace.
- Abrir configuracoes.
- Criar commit sugerido.

## Estados Importantes

A interface deve prever:

- Sem workspace aberto.
- Workspace aberto sem Git.
- Provider nao configurado.
- Modelo indisponivel.
- Agente sem permissao.
- Erro de arquivo.
- Erro de rede.
- Indexacao em andamento.
- Nenhuma nota do Obsidian encontrada.

## Temas

Temas iniciais:

- Escuro.
- Claro.

Regras:

- Contraste suficiente para leitura longa.
- Layout denso, mas nao apertado.
- Cores devem indicar estado, nao apenas decoracao.
- Badges de permissao e risco precisam ser distinguiveis.

## Experiencia com IA

IA deve ser visivel, mas nao invasiva.

Regras:

- Sempre mostrar modelo ativo em tarefas de IA.
- Sempre mostrar agente ativo quando houver agente.
- Mostrar contexto utilizado quando possivel.
- Mostrar propostas de edicao antes de aplicar.
- Permitir cancelar tarefa em andamento.
- Permitir copiar, salvar ou transformar respostas.
