# Tarefa: Testes de Integracao e E2E

**Epico:** 1 — Infraestrutura e Qualidade  
**Prioridade:** 🟡 Media  
**Estimativa:** 2-3 semanas  
**Dependencias:** T1 (testes hooks/componentes)

## Objetivo

Criar testes de integracao que validem fluxos completos (workspace > editor > git > chat) e smoke tests E2E para validar a aplicacao Tauri em ambiente realista.

## Stack Recomendada

| Ferramenta | Funcao |
|-----------|--------|
| Vitest + @testing-library/react | Testes de integracao frontend |
| @playwright/test | Testes E2E no app Tauri |
| cargo test | Testes Rust (ja nativo) |

## O Que Testar

### Testes de Integracao (Frontend)

| Fluxo | Descricao |
|-------|-----------|
| Chat flow | Envio de mensagem > streaming > exibicao |
| File CRUD | Criar > renomear > mover > deletar (mock Tauri) |
| Git flow | Status > stage > diff > commit (mock Tauri) |
| Settings persistence | Mudar settings > reload > valores mantidos |
| Plugin toggle | Ativar > desativar > verificacao de permissoes |
| Agent run | Executar agente > ver saida no Bottom Panel |

### Testes Rust

| Modulo | Testes Necessarios |
|--------|-------------------|
| workspace | canonicalize, ensure_inside_workspace, validate_entry_name |
| git | run_git, build_github_pr_url |
| plugins | read_plugin_manifest, validacao de campos |
| ollama | validate_ollama_model_name |
| notes | sanitize_note_title |
| storage | load/save, caminho, serializacao |

### Smoke Tests (Playwright)

| Fluxo | Descricao |
|-------|-----------|
| Abrir app | App Tauri inicia sem erro |
| Abrir workspace | Dialog de pasta funciona |
| Abrir arquivo | Monaco editor carrega conteudo |
| Editar e salvar | Edicao e salvamento funcionam |
| Busca textual | Resultados aparecem |
| Chat mock | Envio e resposta funcionam |

## Como Fazer

### 1. Testes de Integracao

```typescript
// Exemplo: fluxo Git
describe('Git Flow Integration', () => {
  it('should complete status > stage > diff > commit cycle', async () => {
    (invoke as any)
      .mockResolvedValueOnce([{ x: 'M', y: ' ', path: 'file.ts' }]) // status
      .mockResolvedValueOnce(undefined) // stage
      .mockResolvedValueOnce('diff content') // diff
      .mockResolvedValueOnce(undefined); // commit

    const { result } = renderHook(() => useGit());
    await act(async () => { await result.current.refreshStatus(); });
    expect(result.current.gitFiles).toHaveLength(1);

    await act(async () => { await result.current.stageFile('file.ts'); });
    expect(invoke).toHaveBeenCalledWith('git_stage', { file: 'file.ts' });
  });
});
```

### 2. Testes Rust

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ensure_inside_workspace() {
        let ws = PathBuf::from("/workspace");
        let file = PathBuf::from("/workspace/src/index.ts");
        assert!(ensure_inside_workspace(&ws, &file).is_ok());
    }

    #[test]
    fn test_path_traversal_blocked() {
        let ws = PathBuf::from("/workspace");
        let file = PathBuf::from("/outside/secret.txt");
        assert!(ensure_inside_workspace(&ws, &file).is_err());
    }
}
```

### 3. Smoke Tests E2E com Playwright

```typescript
import { test, expect } from '@playwright/test';

test('app opens and shows IDE layout', async () => {
  await page.waitForSelector('[data-testid="activity-bar"]');
  await page.waitForSelector('[data-testid="editor-panel"]');
  await page.waitForSelector('[data-testid="chat-panel"]');
  expect(await page.isVisible('[data-testid="bottom-panel"]')).toBeTruthy();
});
```

## Criterios de Pronto

- [ ] 5+ fluxos de integracao testados no frontend
- [ ] Testes Rust criados para cada modulo critico
- [ ] Playwright configurado com 5+ smoke tests
- [ ] `npm test` passa com 100% verde
- [ ] `cargo test` passa com 100% verde
- [ ] `npm run build` passa sem erros

## Referencias

- `docs/qualidade-testes.md` — Politicas de qualidade
- `docs/context/14-funcionalidades-atuais.md#28-testes` — Testes atuais
