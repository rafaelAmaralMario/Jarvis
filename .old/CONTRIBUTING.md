# Contribuindo com o JARVIS

Obrigado por ajudar a construir o JARVIS.

Este projeto deve evoluir de forma incremental, com issues pequenas, criterios de aceite claros e foco em manutencao.

## Fluxo Recomendado

1. Escolha uma issue.
2. Confirme o escopo e criterios de aceite.
3. Crie uma branch curta.
4. Implemente apenas o necessario para a issue.
5. Rode formatacao, build e testes disponiveis.
6. Abra PR com resumo e evidencias de validacao.

## Padroes

Antes de implementar, leia:

- [docs/especificacao-jarvis.md](docs/especificacao-jarvis.md)
- [docs/arquitetura.md](docs/arquitetura.md)
- [docs/padroes-de-codigo.md](docs/padroes-de-codigo.md)
- [docs/seguranca-permissoes.md](docs/seguranca-permissoes.md)

## Commits

Mensagens recomendadas:

- `docs: ...`
- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `test: ...`
- `chore: ...`

## Pull Requests

Todo PR deve explicar:

- O que mudou.
- Qual issue resolve.
- Como foi validado.
- Riscos ou limitacoes.

Mudancas sensiveis em filesystem, Git, agentes, plugins, terminal ou credenciais devem citar impactos de seguranca.

