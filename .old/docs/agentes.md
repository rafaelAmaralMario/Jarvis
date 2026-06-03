# Agentes - JARVIS

Status: inicial  
Objetivo: definir como agentes funcionam no JARVIS de forma controlada, testavel e extensivel.

## Visao

Agentes sao colaboradores configuraveis. Eles usam modelos, ferramentas e contexto para executar tarefas, mas suas acoes devem respeitar permissoes e produzir resultados revisaveis.

## Estrutura de um Agente

Cada agente deve declarar:

- Identificador.
- Nome.
- Objetivo.
- Modelo padrao.
- Modelos alternativos.
- Ferramentas permitidas.
- Permissoes necessarias.
- Nivel de autonomia.
- Formato de saida.
- Politica de log.

## Agentes Iniciais

### Desenvolvedor

Foco:

- Ler codigo.
- Explicar arquivos.
- Propor alteracoes.
- Criar testes.
- Refatorar com diff.

### Revisor

Foco:

- Revisar mudancas.
- Identificar riscos.
- Sugerir testes.
- Avaliar impacto.

### Documentador

Foco:

- Criar documentacao.
- Atualizar Markdown.
- Registrar decisoes.
- Resumir funcionalidades.

### Pesquisador

Foco:

- Buscar contexto.
- Organizar informacoes.
- Criar resumos.

### Organizador

Foco:

- Estruturar notas.
- Manter backlog.
- Organizar memoria do projeto.

## Niveis de Autonomia

### Manual

Agente apenas responde e sugere.

### Assistido

Agente cria propostas, mas usuario aplica.

### Controlado

Agente pode executar acoes de baixo risco com permissao previa.

### Avancado

Agente pode executar fluxos maiores com checkpoints.

No MVP, usar Manual e Assistido.

## Ferramentas

Ferramentas previstas:

- Ler arquivo.
- Listar arquivos.
- Criar proposta de edicao.
- Aplicar edicao aprovada.
- Ler Git status.
- Gerar diff.
- Ler notas Markdown.
- Registrar log.

Ferramentas devem ser pequenas, auditaveis e testaveis.

## Fluxo de Proposta

1. Usuario pede alteracao.
2. Agente coleta contexto permitido.
3. Agente gera proposta.
4. Sistema mostra diff.
5. Usuario aceita ou rejeita.
6. Sistema aplica se autorizado.
7. Log registra acao.

## Escolha de Modelo

Cada agente pode ter:

- Modelo padrao.
- Fallback.
- Modelo recomendado por tarefa.

O usuario sempre deve conseguir ver e trocar o modelo ativo.

## Logs

Logs de agente devem registrar:

- Agente.
- Modelo.
- Ferramentas usadas.
- Arquivos afetados.
- Permissoes usadas.
- Resultado.

