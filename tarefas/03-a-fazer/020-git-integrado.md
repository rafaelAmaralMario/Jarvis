# 020 — Git Integrado

## Metadados
- Status: a fazer
- Prioridade: 🔴 Alta
- Dependências: 019

## Descrição
Controle de versão Git integrado com diff view, stage/unstage, commit, branch manager, push/pull.

## Especificação Técnica

### C++ — GitManager
Classe `GitManager` usando libgit2 para operações nativas:

```cpp
class GitManager {
    std::string repoPath;
    bool isRepo();
    std::vector<GitStatus> status();  // modified, added, deleted, renamed
    std::string diff(const std::string& path);
    bool stage(const std::string& path);
    bool unstage(const std::string& path);
    bool commit(const std::string& message);
    std::vector<GitBranch> branches();
    bool checkout(const std::string& branch);
    bool push(const std::string& remote, const std::string& branch);
    bool pull(const std::string& remote, const std::string& branch);
    std::vector<GitLog> log(int count = 50);
};
```

Bridge handlers:
- `gitStatus()` → lista de arquivos com status
- `gitDiff(path)` → diff unificado
- `gitStage(path)` / `gitUnstage(path)`
- `gitCommit(message)`
- `gitBranches()` / `gitCheckout(branch)`
- `gitPush(remote, branch)` / `gitPull(remote, branch)`
- `gitLog(count)`

### React — Componentes
- `GitPanel.tsx` — painel lateral de git (ícone na activity bar ou no editor)
- `GitStatusList.tsx` — lista de arquivos com status (M, A, D, R, ?)
- `GitDiffView.tsx` — diff side-by-side usando Monaco ou diff2html
- `GitBranchManager.tsx` — criar/trocar/deletar branches
- `GitCommitBox.tsx` — textarea + botão commit + suggested message
- `GitHistory.tsx` — log de commits com grafo visual

### Git Gutter (integrado com Editor Fase 3)
- Indicadores na gutter do Monaco (adicionado/modificado/removido)
- Cores: verde (#4caf50), amarelo (#ff9800), vermelho (#f44336)
- Atualizado após git status

## Critérios de Aceitação
- [ ] Status mostra arquivos modificados/adicionados/deletados
- [ ] Stage/Unstage funciona
- [ ] Commit com mensagem personalizada
- [ ] Diff side-by-side exibe mudanças
- [ ] Cria/troca branches
- [ ] Push/Pull com remote
- [ ] Git History visual
- [ ] Git Gutter no editor

## Test Cases

### TC-001: Status do repo
- **Passos:** 1. Abrir repositório git 2. Modificar arquivo 3. Abrir Git Panel
- **Resultado:** Arquivo aparece como modificado (M) na lista
- **Cobertura:** normal

### TC-002: Commit
- **Passos:** 1. Stage arquivo 2. Escrever mensagem 3. Clicar Commit
- **Resultado:** Arquivo some da lista, commit aparece no log
- **Cobertura:** normal

### TC-003: Branch checkout
- **Passos:** 1. Criar branch "feature-x" 2. Checkout
- **Resultado:** HEAD aponta para feature-x, arquivos atualizados
- **Cobertura:** normal
