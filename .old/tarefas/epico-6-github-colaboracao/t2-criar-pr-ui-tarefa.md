# Tarefa: Criar PR da UI

**Epico:** 6 — GitHub e Colaboracao  
**Prioridade:** 🟡 Media  
**Estimativa:** 1-2 semanas  
**Dependencias:** T1 (Login GitHub)

## Objetivo

Permitir criar Pull Requests no GitHub diretamente da interface do JARVIS, com selecao de branch base, titulo e descricao.

## Como Fazer

### 1. Componente CreatePR

```tsx
function CreatePRView() {
  const { branches, currentBranch } = useGit();
  const [baseBranch, setBaseBranch] = useState('main');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="create-pr">
      <h3>Criar Pull Request</h3>
      <select value={baseBranch} onChange={e => setBaseBranch(e.target.value)}>
        {branches.map(b => <option key={b}>{b}</option>)}
      </select>
      <input placeholder="Titulo do PR" value={title} onChange={...} />
      <textarea placeholder="Descricao" value={description} onChange={...} />
      <DiffPreview />
      <button onClick={handleCreatePR}>Criar PR</button>
    </div>
  );
}
```

### 2. Comando Rust

```rust
#[tauri::command]
async fn create_pull_request(
    repo: String,
    title: String,
    body: String,
    head: String,
    base: String,
    token: String,
) -> Result<PullRequest, String> {
    let client = reqwest::Client::new();
    let response = client
        .post(format!("https://api.github.com/repos/{}/pulls", repo))
        .header("Authorization", format!("Bearer {}", token))
        .json(&serde_json::json!({
            "title": title,
            "body": body,
            "head": head,
            "base": base,
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    // ...
}
```

### 3. Botao no GitPanel

Adicionar botao "Criar PR" que abre o `CreatePRView` no Bottom Panel.

### 4. Preencher dados automaticamente

- Titulo: sugestao baseada no nome da branch
- Descricao: template com changes.md ou diff resumido
- Branch base: `main` ou `develop`

## Criterios de Pronto

- [ ] Botao "Criar PR" no GitPanel
- [ ] Formulario com titulo, descricao, branch base
- [ ] Preview do diff (reutilizar DiffView)
- [ ] PR criado via GitHub API
- [ ] URL do PR aberto retornada apos criacao
- [ ] Auditoria registra criacao do PR
- [ ] Funciona com token do gh ou OAuth

## Referencias

- `docs/roadmap-pos-mvp.md` — v0.3 Colaboracao e GitHub
- GitHub REST API docs
