# Backlog Pos-MVP - Issues JARVIS

Status: backlog operacional  
Origem: `docs/roadmap-pos-mvp.md`

## Milestone Recomendada

`v0.1 beta funcional`

## Issues

### Epic Pos-MVP 1 - Estabilidade da UI e Fluxos Criticos

```md
## Objetivo

Garantir que os fluxos essenciais da IDE funcionem de forma previsivel no app Tauri.

## Escopo

- Abrir projeto.
- Redimensionar paineis por arraste.
- Scroll em listas longas.
- Chat apos multiplas mensagens.
- Teste de modelo selecionado.

## Labels
`epic` `pos-mvp` `ux` `stability`
```

### Validar fluxo de abrir projeto no Tauri

```md
## Objetivo

Validar manualmente e automatizar o smoke test do botao de abrir projeto no app Tauri.

## Criterios de Aceite

- Botao abre dialog de pasta no app Tauri.
- Cancelar selecao nao quebra o estado.
- Selecionar pasta valida atualiza o workspace.
- Ultimo workspace e persistido.
- Falhas aparecem nos logs e auditoria.

## Labels
`pos-mvp` `ux` `filesystem` `testing`
```

### Validar redimensionamento dos paineis por arraste

```md
## Objetivo

Garantir que sidebar e painel de IA possam ser redimensionados com o mouse como em uma IDE moderna.

## Criterios de Aceite

- Usuario consegue arrastar o divisor da sidebar.
- Usuario consegue arrastar o divisor do painel de IA.
- Larguras respeitam limites minimos e maximos.
- Larguras sao persistidas entre sessoes.
- Editor central nao quebra visualmente.

## Labels
`pos-mvp` `ux` `layout` `testing`
```

### Corrigir e testar scroll de paineis e busca

```md
## Objetivo

Garantir que paineis com conteudo longo mantenham scroll visivel e usavel.

## Criterios de Aceite

- Busca no projeto mostra scroll quando ha muitos resultados.
- Explorador de arquivos mostra scroll em arvores longas.
- Painel de Git mostra scroll em listas grandes.
- Contexto, plugins e agentes mantem scroll independente.
- Chat mantem input fixo e mensagens rolaveis.

## Labels
`pos-mvp` `ux` `scroll` `testing`
```

### Estabilizar chat apos multiplas mensagens

```md
## Objetivo

Garantir que o chat nao perca historico, foco ou estado apos enviar mensagens.

## Criterios de Aceite

- Usuario consegue enviar varias mensagens seguidas.
- Historico nao e sobrescrito ao hidratar workspace.
- Erro de provider aparece como mensagem amigavel.
- Scroll acompanha a ultima mensagem.
- Cancelar geracao nao deixa resposta vazia.

## Labels
`pos-mvp` `chat` `provider` `testing`
```

### Testar modelo selecionado pela UI

```md
## Objetivo

Criar validacao confiavel do provider/modelo ativo.

## Criterios de Aceite

- Botao de teste chama o provider/modelo ativo.
- Resultado de sucesso aparece nos logs.
- Falha ou timeout aparece nos logs.
- Teste registra auditoria.
- Botao bloqueia cliques duplicados durante execucao.

## Labels
`pos-mvp` `provider` `ux` `testing`
```

### Epic Pos-MVP 2 - Qualidade e Testes

```md
## Objetivo

Adicionar uma base de testes para proteger funcionalidades principais.

## Escopo

- Testes unitarios.
- Testes E2E.
- Smoke tests de UI.
- Validacao automatizada de build.

## Labels
`epic` `pos-mvp` `testing` `quality`
```

### Adicionar suite de testes unitarios

```md
## Objetivo

Criar testes unitarios para os contratos principais do JARVIS.

## Criterios de Aceite

- Testes para providers de IA.
- Testes para helpers de contexto/memoria.
- Testes para validacao de plugins.
- Testes para helpers de filesystem quando aplicavel.
- Script de teste documentado no `package.json` ou docs.

## Labels
`pos-mvp` `testing` `quality`
```

### Adicionar smoke test E2E da UI

```md
## Objetivo

Validar os fluxos principais da interface em ambiente realista.

## Criterios de Aceite

- Abrir app.
- Abrir workspace.
- Abrir arquivo.
- Editar e salvar arquivo.
- Usar busca.
- Enviar mensagem no chat mock.
- Testar modelo mock.

## Labels
`pos-mvp` `testing` `e2e` `ux`
```

### Criar pipeline CI inicial

```md
## Objetivo

Executar validacoes principais automaticamente no GitHub Actions.

## Criterios de Aceite

- CI executa `npm run build`.
- CI executa `cargo check`.
- CI executa testes unitarios quando existirem.
- CI roda em pull requests e push na main.
- Status fica visivel no GitHub.

## Labels
`pos-mvp` `ci` `testing` `devops`
```

### Epic Pos-MVP 3 - Configuracoes e UX Moderna

```md
## Objetivo

Reorganizar a experiencia visual e tornar configuracoes mais faceis de localizar.

## Escopo

- Revisao visual clean/moderna.
- Configuracoes separadas por modulo.
- Busca nas configuracoes.
- Estados vazios e feedback visual.

## Labels
`epic` `pos-mvp` `ux` `settings`
```

### Separar configuracoes por categorias

```md
## Objetivo

Quebrar o painel de configuracoes atual em secoes claras.

## Criterios de Aceite

- Categorias: Geral, Workspace, IA, Providers, Voz, Git, Plugins, Seguranca, Aparencia e Atalhos.
- Cada categoria mostra apenas campos relacionados.
- Estado visual indica categoria ativa.
- Configuracoes existentes continuam persistindo.

## Labels
`pos-mvp` `settings` `ux`
```

### Adicionar busca nas configuracoes

```md
## Objetivo

Permitir encontrar uma configuracao rapidamente.

## Criterios de Aceite

- Campo de busca filtra configuracoes por nome.
- Resultado indica categoria da configuracao.
- Selecionar resultado navega para a categoria correta.
- Busca vazia restaura visual normal.

## Labels
`pos-mvp` `settings` `ux`
```

### Revisar UI para visual moderno e clean

```md
## Objetivo

Refinar a interface para reduzir ruido visual e melhorar usabilidade.

## Criterios de Aceite

- Revisao dos espacamentos.
- Hierarquia visual mais clara.
- Estados vazios melhores.
- Feedback consistente para loading, erro e sucesso.
- Contraste validado em tema claro e escuro.

## Labels
`pos-mvp` `ux` `design`
```

### Epic Pos-MVP 4 - IA, Providers e Voz

```md
## Objetivo

Tornar a camada de IA mais confiavel e iniciar interacao por voz.

## Escopo

- Teste automatizado de providers.
- Validacao de conexao.
- Entrada por microfone.
- Resposta falada.
- Configuracao de vozes.

## Labels
`epic` `pos-mvp` `provider` `voice`
```

### Melhorar teste de conexao dos providers

```md
## Objetivo

Transformar o teste manual de modelo em uma validacao mais robusta.

## Criterios de Aceite

- Teste mock retorna sucesso previsivel.
- Teste Ollama verifica endpoint e modelo.
- Teste OpenAI-compatible valida endpoint/chave sem expor secret.
- Resultado diferencia timeout, autenticacao, endpoint e modelo ausente.

## Labels
`pos-mvp` `provider` `testing`
```

### Implementar modulo inicial de fala

```md
## Objetivo

Permitir que o usuario fale com o JARVIS em vez de apenas digitar.

## Criterios de Aceite

- Botao ativa/desativa microfone.
- Transcricao vira texto no chat.
- UI mostra claramente quando esta ouvindo.
- Erros de permissao de microfone sao tratados.
- Uso de audio registra auditoria.

## Labels
`pos-mvp` `voice` `ux` `permissions`
```

### Implementar resposta falada e configuracao de vozes

```md
## Objetivo

Permitir que o JARVIS responda em voz alta com voz configuravel.

## Criterios de Aceite

- Usuario pode ativar/desativar resposta falada.
- Usuario pode escolher voz quando o provider oferecer opcoes.
- Usuario pode configurar idioma e velocidade.
- Configuracao fica persistida.
- Resposta falada respeita cancelamento.

## Labels
`pos-mvp` `voice` `settings` `ux`
```

### Epic Pos-MVP 5 - Desenvolvimento, Git e Seguranca

```md
## Objetivo

Completar os fluxos de desenvolvimento real com seguranca e rastreabilidade.

## Escopo

- Terminal integrado.
- Aplicacao de diff com aprovacao.
- Secrets seguros.
- Push/pull/fetch Git.
- Auditoria filtravel.

## Labels
`epic` `pos-mvp` `git` `security`
```

### Implementar terminal integrado real

```md
## Objetivo

Adicionar terminal funcional dentro da IDE.

## Criterios de Aceite

- Terminal abre no workspace atual.
- Usuario consegue executar comandos.
- Saida aparece em tempo real.
- Comandos sensiveis devem respeitar politica de permissao.
- Encerrar terminal limpa processo corretamente.

## Labels
`pos-mvp` `terminal` `security`
```

### Aplicar diffs de agentes com aprovacao

```md
## Objetivo

Permitir aplicar propostas de agentes de forma revisavel e segura.

## Criterios de Aceite

- Agente gera diff aplicavel.
- UI mostra preview antes de aplicar.
- Usuario pode aceitar ou rejeitar.
- Aplicacao registra auditoria.
- Falhas preservam arquivos originais.

## Labels
`pos-mvp` `agents` `diff` `security`
```

### Migrar secrets para storage seguro

```md
## Objetivo

Substituir armazenamento simples de secrets por keyring ou Tauri Stronghold.

## Criterios de Aceite

- Chaves nao ficam em JSON comum.
- UI permite salvar/remover secret.
- Providers leem secrets pelo servico seguro.
- Logs nunca exibem tokens.
- Migracao nao quebra configuracoes existentes.

## Labels
`pos-mvp` `security` `provider`
```

### Implementar push, pull e fetch Git

```md
## Objetivo

Completar o ciclo Git basico dentro da IDE.

## Criterios de Aceite

- Usuario consegue executar fetch.
- Usuario consegue executar pull.
- Usuario consegue executar push.
- UI mostra progresso/resultado.
- Falhas de autenticacao ou conflito sao explicadas.

## Labels
`pos-mvp` `git` `collaboration`
```

### Melhorar auditoria com filtros e detalhes

```md
## Objetivo

Transformar auditoria em uma tela realmente consultavel.

## Criterios de Aceite

- Filtrar por ator.
- Filtrar por tipo de permissao.
- Filtrar por resultado.
- Ver detalhes do evento.
- Exportar auditoria localmente ou preparar estrutura para exportacao futura.

## Labels
`pos-mvp` `security` `audit` `ux`
```
