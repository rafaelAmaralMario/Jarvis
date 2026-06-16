# Integração GitHub

## Descrição
Integrar GitHub CLI (`gh`) e/ou REST API. Tools: `github_create_issue` (criar issue), `github_create_pr` (criar PR), `github_list_issues`, `github_list_prs`, `github_merge_pr`. Integrar com o fluxo de desenvolvimento existente.

## Critérios de Aceitação
- [x] Verificar `gh` CLI instalado e autenticado
- [x] Tool `github_create_issue`: título + descrição → issue criada
- [x] Tool `github_create_pr`: branch + título → PR criado
- [x] Tool `github_list_issues`: lista issues do repositório
- [x] Tool `github_list_prs`: lista PRs abertos
- [x] Tool `github_merge_pr`: merge PR
- [x] Fallback para REST API se `gh` não estiver disponível

## Dependências
- [ ] — (independente)

## Fase
Fase 5 — Integrações

## Prioridade
Média

## Esforço Estimado
Pequeno

