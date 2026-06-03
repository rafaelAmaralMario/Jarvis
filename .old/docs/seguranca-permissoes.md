# Seguranca e Permissoes - JARVIS

Status: inicial  
Objetivo: definir como o JARVIS controla acoes sensiveis, especialmente porque a IDE podera alterar arquivos e executar comandos.

## Principio Central

Automacao deve ser poderosa, mas explicita. O usuario precisa saber quando um agente, plugin ou modelo quer ler dados, escrever arquivos, executar comandos, acessar rede ou usar credenciais.

## Tipos de Permissao

Permissoes iniciais:

- Ler workspace.
- Escrever workspace.
- Criar arquivos.
- Remover arquivos.
- Executar comandos.
- Acessar internet.
- Ler vault do Obsidian.
- Escrever no vault do Obsidian.
- Usar Git.
- Criar commits.
- Acessar secrets.
- Usar provedores externos.

## Niveis de Risco

### Baixo

Exemplos:

- Ler arquivo aberto.
- Gerar resposta de chat sem ferramenta.
- Listar arquivos autorizados.

### Medio

Exemplos:

- Ler varios arquivos do workspace.
- Indexar notas.
- Gerar diff de alteracao.
- Consultar status Git.

### Alto

Exemplos:

- Escrever arquivos.
- Executar comando.
- Enviar contexto para API externa.
- Criar commit.
- Modificar configuracoes.

### Critico

Exemplos:

- Remover arquivos.
- Acessar secrets.
- Executar comando destrutivo.
- Escrever fora do workspace.
- Instalar plugin com codigo local.

## Politica de Confirmacao

Regras iniciais:

- Acoes de baixo risco podem ser executadas se ja estiverem autorizadas.
- Acoes de medio risco devem ser visiveis ao usuario.
- Acoes de alto risco exigem confirmacao quando iniciadas por agente.
- Acoes criticas exigem confirmacao explicita sempre.

## Controle por Workspace

Permissoes devem poder variar por workspace.

Exemplos:

- Workspace pessoal com mais autonomia.
- Workspace de cliente com rede bloqueada.
- Workspace sensivel com leitura limitada.

## Controle por Agente

Cada agente deve declarar:

- Ferramentas permitidas.
- Pastas autorizadas.
- Tipos de arquivo permitidos.
- Nivel de autonomia.
- Modelo padrao.

## Controle por Plugin

Cada plugin deve declarar:

- Capacidades.
- Permissoes.
- Configuracoes.
- Se acessa rede.
- Se acessa arquivos.
- Se executa codigo.

Plugins sem permissao nao devem acessar capacidades sensiveis.

## Protecao de Credenciais

Regras:

- Secrets nao devem ser enviados a modelos por padrao.
- Chaves de API devem ficar fora de arquivos comuns de configuracao.
- Logs nao devem gravar tokens.
- Prompts nao devem conter secrets sem confirmacao explicita.
- O usuario deve poder remover credenciais salvas.

## Logs de Auditoria

Toda acao sensivel deve registrar:

- Data e hora.
- Usuario ou origem.
- Agente, plugin ou ferramenta.
- Modelo utilizado, quando aplicavel.
- Permissao usada.
- Arquivos afetados.
- Resultado.

Logs devem ser locais no MVP.

## Propostas de Edicao

Alteracoes feitas por agentes devem seguir fluxo:

1. Gerar proposta.
2. Mostrar diff.
3. Usuario aceita ou rejeita.
4. Aplicar apenas arquivos autorizados.
5. Registrar acao.

## Comandos de Terminal

Comandos executados por agentes devem:

- Mostrar o comando antes da execucao.
- Declarar motivo.
- Declarar diretorio de trabalho.
- Ter permissao apropriada.
- Registrar saida resumida.

Operacoes destrutivas devem exigir confirmacao explicita.

