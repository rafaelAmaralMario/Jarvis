# Módulo Git

## O que faz
Integração completa com Git via CLI: status, diff, stage/unstage, commit, branches, push/pull, stash e merge.

## Arquivos
```
kernel/src/git/git_manager.cpp — Execução de comandos Git via QProcess

ui/src/components/Git/GitPanel.tsx           — Painel principal Git
ui/src/components/Git/GitStatusList.tsx      — Lista de arquivos modificados
ui/src/components/Git/GitCommitBox.tsx       — Caixa de mensagem de commit
ui/src/components/Git/GitBranchManager.tsx   — Gerenciamento de branches
ui/src/components/Git/GitHistoryView.tsx     — Histórico de commits
```

## Funcionalidades

### Status
- Lista de arquivos modified/staged/untracked
- Ícones por estado (M, A, D, ?, etc)
- Agrupamento por status

### Diff
- Visualização de diff lado a lado
- Destaque de linhas adicionadas/removidas
- Diff por arquivo individual

### Stage/Unstage
- Stage arquivo individual
- Stage todos os arquivos
- Unstage arquivo
- Unstage parcial (hunk)

### Commit
- Mensagem de commit com textarea
- Author name/email configurável
- Commit com seleção de arquivos
- Indicador de sucesso

### Branches
- Listar branches (local + remote)
- Criar branch a partir de outra
- Checkout de branch
- Indicador de branch atual

### Push/Pull/Fetch
- Push para remote configurado
- Pull com merge
- Fetch de remote
- Status de ahead/behind

### Stash
- Stash com mensagem opcional
- Stash pop
- Lista de stashes

### Merge
- Merge de branch
- Detecção de conflitos

## Bridge Handlers
15 handlers: status, diff, stage, unstage, commit, log, branches, create_branch, checkout, push, pull, fetch, stash, stash_pop, merge

## Dependências
- Git instalado no sistema (chamado via QProcess)
- OAuth (Task 022) para push/pull autenticado
