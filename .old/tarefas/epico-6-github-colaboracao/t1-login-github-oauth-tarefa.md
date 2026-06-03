# Tarefa: Login/Integracao GitHub (OAuth)

**Epico:** 6 — GitHub e Colaboracao  
**Prioridade:** 🟡 Media  
**Estimativa:** 2-3 semanas  
**Dependencias:** Epic 2 T2 (git push/pull/fetch)

## Objetivo

Permitir que o usuario faca login no GitHub pela UI do JARVIS, usando OAuth, para habilitar operacoes remotas e criacao de PRs.

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| `gh` CLI | Autenticacao GitHub via device flow |
| GitHub REST API v3 | Operacoes programaticas (PRs, issues) |
| Tauri command + URL scheme | Abertura de browser para OAuth |
| secure-settings | Armazenamento do token |

## Como Fazer

### 1. Fluxo OAuth (Device Flow)

1. Usuario clica "Login GitHub" no Settings
2. JARVIS chama `https://github.com/login/device/code`
3. Exibe codigo de dispositivo e URL
4. Usuario acessa github.com/login/device e insere o codigo
5. JARVIS poll `https://github.com/login/oauth/access_token` ate usuario autorizar
6. Token salvo em `secure-settings.json`

### 2. Opcao Alternativa: gh CLI

```typescript
async function loginWithGh() {
  const result = await invoke('exec_command', { command: 'gh auth token' });
  if (result.success) {
    // gh ja autenticado, usar token
    await saveGitHubToken(result.stdout.trim());
  } else {
    await invoke('exec_command', { command: 'gh auth login' });
    // gh abre browser para login
  }
}
```

### 3. Armazenamento seguro

Token GitHub salvo em `secure-settings.json` no backend Rust.

### 4. UI de Login

```tsx
function GitHubSettings() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <img src={user.avatarUrl} width={24} />
          <span>{user.login}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login com GitHub</button>
      )}
    </div>
  );
}
```

## Criterios de Pronto

- [ ] Botao "Login com GitHub" no Settings > Git
- [ ] Fluxo OAuth via device flow (codigo + URL)
- [ ] Token armazenado com seguranca (secure-settings)
- [ ] Avatar e nome de usuario exibidos apos login
- [ ] Botao de logout remove token
- [ ] Token usado para operacoes Git (push, pull)

## Referencias

- `docs/roadmap-pos-mvp.md` — v0.3 Colaboracao e GitHub
- `docs/backlog-pos-mvp-issues.md` — Issues de GitHub
