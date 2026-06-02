# Fluxo de Trabalho - JARVIS

Status: inicial  
Objetivo: definir como o projeto sera conduzido em issues, branches, PRs e releases.

## Unidade de Trabalho

A unidade principal de trabalho e a GitHub Issue.

Cada issue deve ter:

- Objetivo.
- Entregavel.
- Criterios de aceite.
- Fora do escopo, quando necessario.
- Labels.

## Branches

Padrao sugerido:

- `main`: estado estavel.
- `feat/<numero-issue>-descricao-curta`
- `fix/<numero-issue>-descricao-curta`
- `docs/<numero-issue>-descricao-curta`

Exemplos:

- `feat/9-tauri-scaffold`
- `feat/11-layout-base`
- `docs/27-guia-desenvolvimento`

## Pull Requests

PRs devem ser pequenos e fecharem uma issue sempre que possivel.

Template recomendado:

```md
## Resumo

## Issue

Closes #

## Validacao

- [ ] Build
- [ ] Testes
- [ ] Revisao visual, se aplicavel

## Riscos
```

## Done

Uma issue so deve ser considerada pronta quando:

- Criterios de aceite foram atendidos.
- Build/testes relevantes passaram.
- Documentacao foi atualizada se necessario.
- Mudancas sensiveis foram revisadas.

## Releases

Enquanto o projeto estiver em MVP:

- Releases podem ser tags simples.
- Changelog pode ser gerado a partir de issues/PRs.
- Builds empacotados entram em fase posterior.

