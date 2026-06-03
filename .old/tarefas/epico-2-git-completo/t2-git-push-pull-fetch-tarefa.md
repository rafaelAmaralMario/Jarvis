# Tarefa: Git Push/Pull/Fetch

**Epico:** 2 — Git Completo  
**Prioridade:** 🔴 Alta  
**Estimativa:** 1 semana  
**Dependencias:** Nenhuma

## Objetivo

Adicionar operacoes remotas Git (push, pull, fetch) na UI para completar o ciclo basico de trabalho com repositorios remotos.

## Estado Atual

GitPanel tem: status, diff, stage, unstage, commit, branches. **Nao tem** push, pull ou fetch.

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| Rust `std::process::Command` (git) | Execucao de comandos git |
| Tauri command | Interface frontend-backend |
| React state + loading | Feedback de progresso na UI |

## Como Fazer

### 1. Adicionar comandos Rust

```rust
// src-tauri/src/git/mod.rs
pub fn git_push(workspace_path: &Path, remote: &str, branch: &str) -> Result<String, String> {
    let output = run_git(workspace_path, &["push", remote, branch])?;
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn git_pull(workspace_path: &Path, remote: &str, branch: &str) -> Result<String, String> {
    let output = run_git(workspace_path, &["pull", "--rebase", remote, branch])?;
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn git_fetch(workspace_path: &Path, remote: &str) -> Result<String, String> {
    let output = run_git(workspace_path, &["fetch", remote])?;
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
```

### 2. Registrar comandos Tauri

```rust
#[tauri::command]
fn git_push(workspace_path: &str, remote: &str, branch: &str) -> Result<String, String> {
    git::git_push(Path::new(workspace_path), remote, branch)
}
```

### 3. Adicionar no GitService

```typescript
// src/application/services/git.ts
push: async (remote: string, branch: string) => {
    const result = await invoke<string>('git_push', {
        workspacePath: workspacePath,
        remote,
        branch,
    });
    addAudit({ actor: 'user', action: 'git.push', target: `${remote}/${branch}`, result: 'success' });
    return result;
},
```

### 4. Adicionar botoes na UI do GitPanel

```tsx
<div className="git-remote-actions">
  <button onClick={handleFetch} disabled={loading} title="Fetch">
    <ArrowDownFromLine size={16} />
  </button>
  <button onClick={handlePull} disabled={loading} title="Pull">
    <ArrowDownToLine size={16} />
  </button>
  <button onClick={handlePush} disabled={loading} title="Push">
    <ArrowUpFromLine size={16} />
  </button>
</div>
```

### 5. Feedback de progresso e erro

- Loading state durante operacao
- Resultado mostrado como toast/log
- Erros de autenticacao explicados
- Conflitos no pull mostrados como warning

## Criterios de Pronto

- [ ] Botao Fetch busca atualizacoes do remoto
- [ ] Botao Pull faz rebase com o remoto (padrao: `--rebase`)
- [ ] Botao Push envia commits locais
- [ ] Erro de autenticacao exibido claramente
- [ ] Conflito no pull exibe warning
- [ ] Loading state desabilita botoes durante operacao
- [ ] Auditoria registra cada operacao remota
- [ ] `npm run build` e `cargo test` passam
