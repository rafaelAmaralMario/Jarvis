# 020 — Git Integrado

## Metadados
- Status: a fazer
- Prioridade: 🔴 Alta
- Fase: 4 — Controle de Versão
- Dependências: 022 (OAuth para push)
- Nota: Git Gutter movido da 017 para cá

## Descrição
Controle de versão Git completo: status, diff, stage, unstage, commit, branches,
push/pull, Git History e Git Gutter no editor.

## Especificação Técnica

### 1. Dependência Externa: libgit2

Adicionar libgit2 como dependência do CMake.

**CMakeLists.txt:**
```cmake
find_package(PkgConfig REQUIRED)
pkg_search_module(LIBGIT2 REQUIRED libgit2)

target_link_libraries(jarvis_kernel PRIVATE ${LIBGIT2_LIBRARIES})
target_include_directories(jarvis_kernel PRIVATE ${LIBGIT2_INCLUDE_DIRS})
```

Fallback: usar git CLI via QProcess se libgit2 não estiver disponível.

### 2. C++ — GitManager

**Novo arquivo:** `kernel/include/jarvis/git/git_manager.h`
**Novo arquivo:** `kernel/src/git/git_manager.cpp`

```cpp
namespace jarvis::git {

struct GitStatus {
    std::string path;
    char status;       // 'M' modified, 'A' added, 'D' deleted, 'R' renamed, '?' untracked, ' ' unmodified
    bool staged;       // true if in staging area
};

struct GitBranch {
    std::string name;
    bool isCurrent;
    bool isRemote;
};

struct GitLogEntry {
    std::string hash;
    std::string author;
    std::string email;
    std::string message;
    std::string date;
};

struct GitDiffLine {
    int oldLine;
    int newLine;
    char type;         // ' ' context, '+' added, '-' removed
    std::string content;
};

class IGitManager {
public:
    virtual ~IGitManager() = default;

    virtual bool isRepo(const std::string& path) = 0;
    virtual bool init(const std::string& path) = 0;
    virtual bool clone(const std::string& url, const std::string& path) = 0;

    virtual std::vector<GitStatus> status(const std::string& repoPath) = 0;
    virtual std::string diff(const std::string& repoPath, const std::string& filePath) = 0;
    virtual std::vector<GitDiffLine> diffLines(const std::string& repoPath, const std::string& filePath) = 0;

    virtual bool stage(const std::string& repoPath, const std::string& filePath) = 0;
    virtual bool unstage(const std::string& repoPath, const std::string& filePath) = 0;
    virtual bool stageAll(const std::string& repoPath) = 0;
    virtual bool commit(const std::string& repoPath, const std::string& message) = 0;

    virtual std::vector<GitBranch> branches(const std::string& repoPath) = 0;
    virtual bool checkout(const std::string& repoPath, const std::string& branch) = 0;
    virtual bool createBranch(const std::string& repoPath, const std::string& branch) = 0;
    virtual bool deleteBranch(const std::string& repoPath, const std::string& branch) = 0;

    virtual bool push(const std::string& repoPath, const std::string& remote = "origin", const std::string& branch = "") = 0;
    virtual bool pull(const std::string& repoPath, const std::string& remote = "origin", const std::string& branch = "") = 0;
    virtual bool fetch(const std::string& repoPath, const std::string& remote = "origin") = 0;

    virtual std::vector<GitLogEntry> log(const std::string& repoPath, int count = 50) = 0;
    virtual std::string fileLog(const std::string& repoPath, const std::string& filePath, int count = 10) = 0;

    virtual void setCredentials(const std::string& remote, const std::string& token) = 0;
};

IGitManager* createGitManager();

}
```

### 3. Bridge handlers (main.cpp)

```cpp
bridge.registerHandler("gitStatus", [gitManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("gitDiff", [gitManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("gitDiffLines", [gitManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("gitStage", [gitManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("gitUnstage", [gitManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("gitCommit", [gitManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("gitBranches", [gitManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("gitCheckout", [gitManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("gitPush", [gitManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("gitPull", [gitManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("gitLog", [gitManager](const QVariantList& args) -> QVariant { ... });
```

### 4. Git Gutter no Monaco

Indicadores visuais na gutter do Monaco mostrando diff lines do git index.

**C++ — Bridge handler:**
```cpp
bridge.registerHandler("editorGetGitGutter", [gitManager](const QVariantList& args) -> QVariant {
    // Retorna as linhas com diff para o arquivo aberto no editor
    // { decorations: [{ startLine, endLine, type: 'added'|'modified'|'deleted' }] }
});
```

**React — MonacoWrapper integração:**
```tsx
useEffect(() => {
  if (!editorRef.current || !path) return;

  const updateGutter = async () => {
    const result = await bridge.editorGetGitGutter(path);
    if (!result?.decorations) return;

    const decorations = result.decorations.map((d: any) => ({
      range: new monaco.Range(d.startLine, 1, d.endLine, 1),
      options: {
        isWholeLine: true,
        glyphMarginClassName: `git-gutter-${d.type}`,
        glyphMarginHoverMessage: { value: d.type === 'added' ? 'Adicionado' : d.type === 'deleted' ? 'Removido' : 'Modificado' },
      },
    }));

    editorRef.current.deltaDecorations([], decorations);
  };

  updateGutter();
  const interval = setInterval(updateGutter, 5000);  // Poll a cada 5s

  return () => clearInterval(interval);
}, [path]);
```

**CSS para os ícones na gutter:**
```css
.git-gutter-added::before { content: ''; background: #4caf50; width: 3px; height: 100%; display: block; }
.git-gutter-modified::before { content: ''; background: #ff9800; width: 3px; height: 100%; display: block; }
.git-gutter-deleted::before { content: ''; background: #f44336; width: 3px; height: 100%; display: block; }
```

### 5. React — Componentes

**GitPanel.tsx** — painel lateral de Git:
- Abre como view separada ou como painel no Workspace
- Ícone na ActivityBar (quando repo git detectado)
- Seções: Changes (unstaged), Staged Changes, Branches

**GitStatusList.tsx** — lista de arquivos com status:
- Cada item: ícone de status (M/A/D/R/?) + nome do arquivo
- Clique abre diff side-by-side
- Checkbox para stage/unstage
- Botão "Stage All"

**GitDiffView.tsx** — diff side-by-side:
- Usa Monaco para renderizar diff (createdEditor com 2 modelos)
- Ou diff2html para visualização
- Navegação entre hunks com setas

**GitBranchManager.tsx** — gerenciamento de branches:
- Lista com indicador de branch atual (✔)
- Input para criar nova branch
- Botões checkout, delete, merge

**GitCommitBox.tsx** — commit:
- Textarea para mensagem de commit
- Botão "Commit" (desabilitado se mensagem vazia)
- Botão "Commit & Push"
- Sugestão de mensagem via IA (opcional, chamar AI Engine)

**GitHistoryView.tsx** — histórico visual:
- Tabela: hash (abreviado) | author | message | date
- Clique em hash → mostra diff do commit
- Botão "Refresh"

### 6. Fluxo Completo de Git

1. Usuário abre workspace com repositório git
2. GitManager detecta `.git/` → habilita painel Git
3. Usuário modifica arquivo no editor → Git Gutter mostra mudanças
4. Usuário vai no Git Panel → arquivos aparecem em "Changes (unstaged)"
5. Usuário clica no arquivo → diff side-by-side abre no editor
6. Usuário stage → arquivo move para "Staged Changes"
7. Usuário escreve mensagem → Commit
8. (Opcional) Commit & Push → pede OAuth se necessário

## Critérios de Aceitação
- [ ] `git status` mostra arquivos com status correto
- [ ] Stage/Unstage funcionam individualmente e bulk
- [ ] Commit com mensagem persiste no repositório
- [ ] Diff side-by-side mostra mudanças linha a linha
- [ ] Branches: criar, trocar, deletar
- [ ] Push/Pull com remote (autenticado via OAuth)
- [ ] Git Log mostra histórico do repositório
- [ ] Git Gutter no Monaco mostra indicadores visuais (🟢🟡🔴)
- [ ] Git gutter atualiza a cada 5s ou após git status

## Test Cases

### TC-001: Detecção de repositório
- **Pré:** Workspace com repositório git
- **Passos:** 1. Abrir workspace 2. Verificar `gitStatus`
- **Resultado:** Status retorna lista de arquivos com mudanças
- **Cobertura:** normal

### TC-002: Stage + Commit
- **Passos:** 1. Modificar arquivo 2. Stage 3. Commit "fix: typo"
- **Resultado:** `git log` mostra o commit, arquivo some da lista de changes
- **Cobertura:** normal

### TC-003: Git Gutter
- **Pré:** Arquivo modificado em repo git
- **Passos:** 1. Abrir arquivo no editor
- **Resultado:** Gutter mostra indicador 🟡 nas linhas modificadas
- **Cobertura:** normal

### TC-004: Push com OAuth
- **Pré:** Repositório com remote, OAuth configurado
- **Passos:** 1. Commit 2. Push
- **Resultado:** Commits são enviados ao remote
- **Cobertura:** normal

### TC-005: Branch checkout
- **Passos:** 1. Criar branch "feature-x" 2. Checkout 3. Verificar `git branch`
- **Resultado:** Branch atual é "feature-x"
- **Cobertura:** normal

### TC-006: Log history
- **Passos:** 1. Abrir Git History
- **Resultado:** Lista de commits com hash, author, message, date
- **Cobertura:** normal
