# Modulo Git

## O que faz
Integracao completa com Git via CLI: status, diff, stage/unstage, commit, branches, push/pull.

## Arquivos
```
backend/jarvis/git_manager.py            — Execucao de comandos Git via subprocess

ui/src/components/Git/GitPanel.tsx           — Painel principal Git
ui/src/components/Git/GitStatusList.tsx      — Lista de arquivos modificados
ui/src/components/Git/GitCommitBox.tsx       — Caixa de mensagem de commit
ui/src/components/Git/GitBranchManager.tsx   — Gerenciamento de branches
ui/src/components/Git/GitHistoryView.tsx     — Historico de commits
```

## Funcionalidades

### Status
- Lista de arquivos modified/staged/untracked
- Icones por estado (M, A, D, ?, etc)
- Agrupamento por status

### Diff
- Visualizacao de diff lado a lado
- Destaque de linhas adicionadas/removidas
- Diff por arquivo individual
- Diff gutter (marcacoes na gutter do Monaco)

### Stage/Unstage
- Stage arquivo individual
- Stage todos os arquivos
- Unstage arquivo
- Unstage parcial (hunk)

### Commit
- Mensagem de commit com textarea
- Author name/email configuravel
- Commit com selecao de arquivos
- Indicador de sucesso

### Branches
- Listar branches (local + remote)
- Criar branch a partir de outra
- Checkout de branch
- Deletar branch
- Indicador de branch atual

### Push/Pull/Fetch
- Push para remote configurado
- Pull com merge
- Fetch de remote
- Status de ahead/behind
- Credenciais via `git config` ou OAuth

### Log
- Historico de commits
- Hash, autor, data, mensagem
- Navegacao entre paginas

## Bridge API
- 17 metodos: `gitStatus`, `gitDiff`, `gitDiffGutter`, `gitStage`, `gitUnstage`, `gitStageAll`, `gitCommit`, `gitBranches`, `gitCheckout`, `gitCreateBranch`, `gitDeleteBranch`, `gitPush`, `gitPull`, `gitLog`, `gitIsRepo`, `gitCurrentBranch`, `gitSetCredentials`

## Dependencias
- Git instalado no sistema (chamado via `subprocess.run`)
