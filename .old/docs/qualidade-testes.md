# Qualidade e Testes - JARVIS

Status: inicial  
Objetivo: definir criterios de qualidade para evitar regressao e manter o projeto facil de evoluir.

## Principios

- Testar regras de negocio longe da UI.
- Testar integracoes sensiveis com mocks.
- Validar fluxos visuais principais.
- Priorizar testes nos pontos de risco: permissoes, filesystem, Git, agentes e plugins.

## Tipos de Teste

### Unitarios

Para:

- Funcoes puras.
- Regras de permissao.
- Parse de manifestos.
- Registro de modelos.
- Selecao de provider.

### Integracao

Para:

- Tauri commands.
- Git status/diff.
- Leitura de workspace.
- Persistencia local.
- Indexacao de Markdown.

### UI

Para:

- Layout principal.
- Configuracoes.
- Painel Git.
- Painel de IA.
- Tela de plugins.

### E2E

Para fluxos completos:

- Abrir workspace.
- Abrir arquivo.
- Ver status Git.
- Usar chat mockado.
- Propor alteracao e revisar diff.

## Qualidade Minima por PR

Cada PR deve ter:

- Build sem erro.
- Formatacao aplicada.
- Testes relevantes.
- Validacao manual quando envolver UI.
- Revisao de seguranca quando envolver acoes sensiveis.

## Areas de Alto Risco

Exigir mais cuidado em:

- Execucao de comandos.
- Escrita/remocao de arquivos.
- Envio de contexto para providers externos.
- Credenciais.
- Plugins.
- Agentes com autonomia.

## Metas Futuras

- Cobertura minima para dominio e application.
- Smoke test automatizado do app.
- Testes visuais para layout principal.
- Testes de permissao para ferramentas de agentes.

