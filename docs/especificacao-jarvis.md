# JARVIS - Especificacao Inicial do Projeto

Status: rascunho inicial  
Data: 2026-06-02  
Nome temporario: JARVIS

## 1. Visao

O JARVIS sera uma IDE pensada desde o inicio para trabalhar com modelos de linguagem, agentes e ferramentas externas. A proposta nao e apenas criar um editor de codigo com chat acoplado, mas um ambiente de trabalho onde o usuario possa escolher, trocar e combinar modelos conforme a tarefa.

O sistema deve permitir que o usuario use modelos gratuitos quando possivel, modelos locais quando fizer sentido, e modelos pagos ou especializados quando uma tarefa exigir mais qualidade, velocidade ou capacidade.

## 2. Objetivos Principais

- Criar uma IDE com editor integrado, terminal, explorador de arquivos e assistente de IA.
- Permitir escolha e troca de provedores de LLM sem prender o projeto a um unico fornecedor.
- Separar modelos por especialidade: texto, codigo, imagem, embeddings, analise, automacao e agentes.
- Suportar agentes capazes de executar tarefas com contexto, ferramentas e memoria controlada.
- Integrar ferramentas externas como Obsidian para formar um cerebro de contexto.
- Construir uma arquitetura modular, extensivel e preparada para plugins.
- Manter transparencia sobre custo, privacidade, modelo utilizado e permissoes concedidas.

## 3. Principios do Produto

- O usuario controla o modelo: escolher, trocar e configurar modelos deve ser simples.
- O contexto e um ativo do usuario: notas, projetos, arquivos e historico devem permanecer organizados e exportaveis.
- Agentes precisam de limites claros: toda acao sensivel deve ter permissao, rastreabilidade e possibilidade de revisao.
- O editor vem primeiro: a IA deve aumentar o fluxo de trabalho, nao esconder a IDE atras de um chat.
- A interface deve ser moderna, profissional e familiar para quem usa IDEs como Visual Studio e VS Code, mas pensada desde a origem para IA, agentes e contexto.
- O sistema deve funcionar em camadas: com recursos basicos offline/local, e recursos avancados quando houver provedores externos configurados.

## 4. Publico-Alvo Inicial

- Desenvolvedores que querem uma IDE nativa para trabalho com agentes.
- Usuarios tecnicos que usam Obsidian, Git, terminal e automacoes.
- Criadores que alternam entre texto, codigo, imagem e documentacao.
- Pessoas que querem experimentar modelos diferentes sem reconstruir todo o workflow.

## 5. Escopo Inicial

### 5.1 Editor

- Explorador de arquivos.
- Editor de texto/codigo com abas.
- Terminal integrado.
- Painel de assistente com conversas por projeto.
- Comandos de IA aplicaveis ao arquivo, selecao, pasta ou projeto inteiro.
- Historico de alteracoes propostas pela IA antes da aplicacao.
- Interface visual de configuracoes para modelos, agentes, plugins, integracoes, temas e permissoes.
- Integracao com Git para status de arquivos, diffs, commits, branches e revisao de mudancas.

### 5.2 Configuracoes Visuais

O usuario deve ter uma area visual clara para configurar o JARVIS sem depender apenas de arquivos manuais. Configuracoes avancadas podem continuar existindo em arquivos editaveis, mas a experiencia principal deve oferecer paineis organizados.

Areas de configuracao esperadas:

- Modelos e provedores: adicionar chaves, testar conexao, escolher modelos padrao por tarefa.
- Agentes: criar, editar, ativar, desativar e definir permissoes.
- Plugins: instalar, remover, ativar, desativar e configurar plugins.
- Integracoes: conectar Obsidian, Git, GitHub, navegadores, APIs e ferramentas locais.
- Seguranca: revisar permissoes, comandos permitidos, pastas autorizadas e logs.
- Interface: temas, layout, paineis, atalhos e comportamento do editor.
- Contexto: fontes indexadas, memoria, pastas ignoradas e politicas de privacidade.

### 5.3 Sistema de Modelos

O JARVIS deve usar uma camada de abstracao para provedores e modelos.

Categorias iniciais:

- Texto geral: conversa, resumo, escrita, analise.
- Codigo: edicao, explicacao, refatoracao, testes, revisao.
- Imagem: geracao, edicao, variacoes, assets.
- Embeddings: busca semantica, memoria, contexto.
- Raciocinio/planejamento: decomposicao de tarefas, agentes longos.
- Voz/audio: transcricao, sintese e comandos por voz, em etapa futura.

Provedores possiveis:

- Modelos locais via Ollama, LM Studio ou runtime equivalente.
- APIs comerciais como OpenAI, Anthropic, Google, Mistral e outras.
- Provedores gratuitos ou com camada gratuita.
- Provedores self-hosted compativeis com APIs padrao.

Cada modelo deve possuir metadados:

- Nome do provedor.
- Nome do modelo.
- Tipo de tarefa recomendado.
- Custo estimado, quando aplicavel.
- Limite de contexto.
- Suporte a ferramentas/function calling.
- Suporte a imagem, audio ou arquivos.
- Requisitos de privacidade.
- Status: ativo, experimental, depreciado.

### 5.4 Agentes

Agentes serao unidades configuraveis com objetivo, ferramentas, modelo preferencial e politicas de permissao.

Agentes iniciais sugeridos:

- Agente Desenvolvedor: altera codigo, cria testes e explica decisoes.
- Agente Revisor: revisa pull requests, identifica riscos e sugere melhorias.
- Agente Documentador: cria documentacao tecnica e funcional.
- Agente Pesquisador: consulta fontes, organiza achados e gera resumos.
- Agente Criativo: trabalha com textos, roteiros, imagens e assets.
- Agente Organizador: estrutura notas, tarefas e contexto do usuario.

Cada agente deve declarar:

- Modelo padrao.
- Modelos alternativos aceitos.
- Ferramentas disponiveis.
- Permissoes necessarias.
- Formato de saida esperado.
- Nivel de autonomia.

### 5.5 Cerebro de Contexto

O cerebro de contexto sera a camada responsavel por conectar arquivos, notas, historico, embeddings e memoria.

Fontes iniciais:

- Workspace atual da IDE.
- Repositorios Git.
- Notas do Obsidian.
- Conversas e decisoes do projeto.
- Documentos locais.
- Tarefas e backlog.

Recursos esperados:

- Indexacao de arquivos e notas.
- Busca textual e semantica.
- Perfis de contexto por projeto.
- Memoria curta da sessao atual.
- Memoria longa controlada pelo usuario.
- Registro de decisoes arquiteturais.
- Possibilidade de excluir fontes sensiveis da indexacao.

### 5.6 Integracao com Obsidian

A integracao com Obsidian deve ser tratada como uma fonte de conhecimento e tambem como destino de registros.

Funcionalidades desejadas:

- Selecionar um vault do Obsidian.
- Indexar notas Markdown.
- Respeitar pastas ignoradas.
- Criar ou atualizar notas de projeto.
- Registrar decisoes, tarefas e aprendizados.
- Buscar contexto relevante antes de acionar agentes.
- Manter links internos no formato wiki quando possivel.

### 5.7 Plugins e Extensoes

O JARVIS deve nascer preparado para plugins, mesmo que o marketplace ou sistema completo de extensoes fique para fases futuras. A arquitetura deve permitir adicionar novas capacidades sem alterar o core da IDE a cada integracao.

Tipos de plugins desejados:

- Provedores de LLM.
- Ferramentas de contexto.
- Integracoes com aplicativos externos.
- Agentes especializados.
- Temas e customizacoes de interface.
- Comandos da command palette.
- Ferramentas de automacao.
- Geradores de imagem, audio, video ou documentos.

Cada plugin deve declarar:

- Nome, versao e autor.
- Capacidades oferecidas.
- Permissoes necessarias.
- Configuracoes visuais disponiveis.
- Modelos ou provedores adicionados, quando aplicavel.
- Comandos adicionados a IDE.
- Politica de seguranca e acesso a dados.

### 5.8 Integracao com Git

Git deve ser uma integracao nativa do JARVIS, pois a IDE precisa ajudar o usuario a entender, revisar e controlar mudancas feitas por humanos e por agentes.

Funcionalidades desejadas:

- Visualizar arquivos modificados, adicionados, removidos e nao rastreados.
- Abrir diff visual de mudancas.
- Separar mudancas feitas pelo usuario e propostas por agentes quando possivel.
- Criar commits com mensagem sugerida por IA.
- Gerenciar branches.
- Integrar com provedores remotos como GitHub em etapa futura.
- Permitir revisao de alteracoes antes de commit.
- Registrar qual agente/modelo gerou uma mudanca quando aplicavel.

## 6. Arquitetura Conceitual

Camadas propostas:

- Interface: editor, paineis, comandos, configuracoes e visualizacoes.
- Core da IDE: arquivos, terminal, Git, workspace e extensoes.
- Orquestrador de IA: conversas, agentes, ferramentas, permissoes e execucao.
- Registro de Modelos: provedores, modelos, capacidades e preferencias.
- Context Engine: indexacao, embeddings, memoria e recuperacao de contexto.
- Sistema de Plugins: instalacao, ativacao, configuracao, permissoes e ciclo de vida de extensoes.
- Integracoes: Obsidian, Git, GitHub, navegadores, APIs externas e ferramentas locais.
- Persistencia: configuracoes, historico, indices, cache e segredos.

## 7. Possiveis Tecnologias

Decisao inicial: o JARVIS deve ser construido com Tauri.

A escolha por Tauri favorece uma aplicacao desktop mais leve, com melhor integracao ao sistema operacional e maior controle sobre as capacidades locais do editor. Como a IDE tera permissao para ler arquivos, editar projetos, executar comandos e futuramente interagir com outras partes do sistema, essa base deve ser tratada como uma decisao de arquitetura e seguranca, nao apenas como escolha de interface.

Opcoes para o aplicativo:

- Tauri: escolha inicial do projeto. Aplicativo mais leve, boa integracao desktop, backend em Rust e controle mais explicito das capacidades locais.
- Electron: alternativa possivel apenas se uma necessidade forte de ecossistema justificar o custo maior de memoria.
- Web app local: util para prototipos isolados, mas insuficiente como base principal da IDE.

Opcoes para editor:

- Monaco Editor: base parecida com VS Code, muito maduro para codigo.
- CodeMirror: mais leve e flexivel para editor web.

Opcoes para backend local:

- Rust para comandos nativos, permissoes, acesso ao sistema, arquivos, processos e integracoes locais via Tauri.
- Node.js/TypeScript quando fizer sentido para ferramentas de desenvolvimento, servidores auxiliares ou integracoes do ecossistema web.
- Python para automacoes especificas, indexacao ou ferramentas auxiliares.

Recomendacao inicial:

- Frontend com TypeScript, Vite e Monaco.
- Aplicativo desktop com Tauri.
- Backend nativo em Rust para operacoes sensiveis.
- Camada de seguranca desde o inicio para controlar leitura, escrita, execucao de comandos e acesso a integracoes.

## 8. Configuracao de Modelos

O usuario deve poder configurar modelos por funcao.

Exemplo:

```yaml
models:
  default_text:
    provider: ollama
    model: llama3.1
  default_code:
    provider: openai-compatible
    model: qwen-coder
  default_image:
    provider: image-provider
    model: image-model
  default_embeddings:
    provider: local
    model: embedding-model
```

Regras importantes:

- Nenhum provedor deve ser obrigatorio.
- Chaves de API devem ser armazenadas com seguranca.
- O usuario deve ver qual modelo sera usado antes de tarefas caras ou sensiveis.
- Deve existir fallback quando um modelo nao estiver disponivel.

## 9. Permissoes e Seguranca

O JARVIS deve tratar agentes como colaboradores com permissoes limitadas.

Como o JARVIS sera uma IDE com capacidade real de alterar arquivos, executar comandos e interagir com o sistema, seguranca e controle devem ser requisitos centrais desde a primeira versao. O objetivo nao e impedir automacao, mas tornar cada capacidade explicita, auditavel e reversivel quando possivel.

Permissoes iniciais:

- Ler arquivos do workspace.
- Editar arquivos do workspace.
- Executar comandos.
- Acessar internet.
- Ler vault do Obsidian.
- Escrever no vault do Obsidian.
- Usar API externa.
- Criar commits ou branches.

Toda acao sensivel deve ser registrada com:

- Quem solicitou.
- Qual agente executou.
- Qual modelo foi usado.
- Quais arquivos ou ferramentas foram afetados.
- Resultado da acao.

Regras de controle:

- Agentes nao devem executar comandos de sistema sem permissao configurada.
- Alteracoes em arquivos devem ser mostradas como diff antes da aplicacao quando a tarefa for sensivel.
- Operacoes destrutivas devem exigir confirmacao explicita.
- O usuario deve poder limitar agentes por projeto, pasta, tipo de arquivo e ferramenta.
- O sistema deve manter logs locais das acoes executadas por agentes.
- Credenciais, tokens e chaves de API nunca devem ser expostos a modelos sem autorizacao clara.

## 10. Experiencia do Usuario

O JARVIS deve parecer uma IDE moderna, nao apenas uma pagina com chat. A experiencia visual deve passar a sensacao de uma ferramenta profissional, organizada e poderosa, semelhante ao nivel de polimento esperado em ambientes como Visual Studio e VS Code, mas com uma diferenca essencial: IA, agentes, modelos e contexto devem ser partes nativas da interface.

Diretrizes de interface:

- Layout principal com explorador de arquivos, editor central, terminal integrado e paineis laterais configuraveis.
- Painel de IA persistente, com conversas, agentes, contexto usado, modelo selecionado e historico de acoes.
- Seletor de modelo sempre acessivel, permitindo trocar rapidamente entre modelos de texto, codigo, imagem, embeddings e agentes.
- Area visual de configuracoes acessivel pela interface, sem exigir edicao manual de arquivos para tarefas comuns.
- Tela de plugins com busca, status, permissoes e configuracoes de cada extensao.
- Painel Git para diffs, status, commits, branches e revisao de alteracoes.
- Indicadores claros mostrando qual modelo ou agente esta ativo em cada tarefa.
- Visual moderno, limpo e denso o suficiente para trabalho tecnico real.
- Suporte a temas claro, escuro e possivelmente temas personalizados.
- Command palette para comandos tradicionais da IDE e comandos de IA.
- Revisao visual de alteracoes propostas pela IA antes de aplicar no codigo.
- Abas ou areas dedicadas para contexto, memoria, ferramentas conectadas e logs de agentes.
- Interface preparada para extensoes e paineis futuros, sem depender de uma unica tela fixa.

Fluxo ideal:

1. Usuario abre um projeto.
2. JARVIS detecta o workspace e oferece indexacao.
3. Usuario escolhe provedores e modelos preferenciais.
4. Usuario conecta fontes de contexto, como Obsidian.
5. Usuario conversa com agentes ou executa comandos sobre arquivos.
6. JARVIS propoe alteracoes, explica impactos e aguarda confirmacao quando necessario.
7. Decisoes importantes podem ser salvas automaticamente em notas do projeto.

## 11. MVP Proposto

Primeira versao util:

- Aplicacao local com editor, explorador de arquivos e painel de chat.
- Configuracao simples de provedores/modelos.
- Tela visual de configuracoes basicas.
- Suporte inicial a um provedor local ou OpenAI-compatible.
- Agente Desenvolvedor basico capaz de ler arquivos e propor alteracoes.
- Integracao Git basica com status e diff.
- Registro de conversas por projeto.
- Integracao inicial com Obsidian via leitura de Markdown.
- Documento de decisoes do projeto salvo em Markdown.

Fora do MVP:

- Marketplace publico de plugins.
- Multiagentes autonomos complexos.
- Geracao avancada de imagens.
- Voz/audio.
- Sincronizacao em nuvem.
- Permissoes corporativas avancadas.

## 12. Roadmap Inicial

### Fase 0 - Especificacao

- Refinar este documento.
- Decidir stack inicial.
- Definir arquitetura de pastas.
- Definir formato de configuracao dos modelos.
- Definir formato inicial de plugins e permissoes.

### Fase 1 - Prototipo da IDE

- Criar app base.
- Adicionar editor.
- Adicionar explorador de arquivos.
- Adicionar painel de chat.
- Adicionar tela de configuracoes.
- Adicionar painel Git basico.
- Persistir configuracoes locais.

### Fase 2 - Provedores de LLM

- Criar interface comum de provedores.
- Implementar primeiro provedor.
- Adicionar registro de modelos por categoria.
- Adicionar fallback de modelo.

### Fase 3 - Contexto

- Indexar workspace.
- Ler arquivos Markdown.
- Integrar Obsidian.
- Adicionar busca semantica com embeddings.

### Fase 4 - Agentes

- Criar agentes configuraveis.
- Adicionar ferramentas com permissoes.
- Implementar propostas de edicao revisaveis.
- Registrar acoes e decisoes.

### Fase 5 - Produto

- Melhorar UX.
- Evoluir sistema de plugins.
- Adicionar testes.
- Empacotar app desktop.
- Criar documentacao de uso.

## 13. Decisoes em Aberto

- Quais capacidades nativas do Tauri entram no MVP?
- O primeiro provedor sera local, gratuito, OpenAI-compatible ou outro?
- O projeto deve priorizar codigo, notas/conhecimento ou automacao no MVP?
- Como sera o modelo de permissoes para comandos de terminal?
- Qual sera o formato inicial dos plugins?
- Plugins poderao executar codigo local desde o inicio ou apenas declarar integracoes controladas?
- O contexto sera indexado localmente apenas, ou podera usar APIs externas?
- O Obsidian sera apenas fonte de leitura no inicio ou tambem destino de escrita?
- Qual nivel de compatibilidade desejamos com extensoes do VS Code?

## 14. Criterios de Sucesso do MVP

- O usuario consegue abrir um projeto e navegar pelos arquivos.
- O usuario consegue escolher um modelo padrao.
- O usuario consegue alterar configuracoes basicas por uma interface visual.
- O usuario consegue conversar com um agente sobre o projeto.
- O agente consegue ler contexto local autorizado.
- O agente consegue propor uma alteracao de arquivo de forma revisavel.
- O usuario consegue visualizar status e diff Git dentro da IDE.
- O usuario consegue conectar um vault do Obsidian como fonte de contexto.
- O sistema registra decisoes importantes em Markdown.

## 15. Proximos Passos

1. Revisar este documento e ajustar a visao.
2. Escolher a stack do prototipo.
3. Definir o primeiro provedor de LLM.
4. Criar a estrutura inicial do projeto.
5. Implementar o primeiro fluxo: abrir projeto, conversar com modelo e ler contexto local.
