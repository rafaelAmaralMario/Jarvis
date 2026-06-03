# Tarefa: Status Bar

**Epico:** 3 — Editor Profissional  
**Prioridade:** 🔴 Alta  
**Estimativa:** 1-2 semanas  
**Dependencias:** Nenhuma

## Objetivo

Adicionar uma Status Bar na parte inferior da IDE (acima do Bottom Panel ou na base da janela) com informacoes contextuais do projeto.

## Estado Atual

Nao existe Status Bar. Informacoes como branch atual, modelo ativo e permissoes estao espalhadas em diferentes paineis.

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| React component | StatusBar |
| Lucide React (icons) | Icones para cada item |
| Hooks existentes (useGit, useSettings) | Dados para exibir |

## Como Fazer

### 1. Criar componente StatusBar

```tsx
function StatusBar() {
  const { currentBranch } = useGit();
  const { activeModelId, theme } = useSettings();

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-item">
          <GitBranch size={14} />
          {currentBranch || 'main'}
        </span>
      </div>
      <div className="status-bar-right">
        <span className="status-item">{activeModelId}</span>
        <span className="status-item">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
      </div>
    </div>
  );
}
```

### 2. Itens da Status Bar

**Lado esquerdo:**
- Branch Git atual
- Erros/warnings (quando LSP existir)
- Encoding do arquivo ativo (UTF-8)

**Lado direito:**
- Modelo de IA ativo
- Tema atual
- Permissoes do workspace
- Tipo de indentacao (espacos: 2)

### 3. Estilizar StatusBar

```css
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  background: var(--status-bar-bg);
  font-size: 12px;
  color: var(--status-bar-fg);
}
```

## Criterios de Pronto

- [ ] Status Bar visivel na base da janela
- [ ] Mostra branch Git atual
- [ ] Mostra modelo de IA ativo
- [ ] Mostra tema atual
- [ ] Itens sao clicaveis (ex.: clicar no modelo abre settings)
- [ ] Tema claro/escuro funcionando

## Referencias

- `docs/context/18-vscode-features.md#19-layout-e-interface` — VS Code Status Bar
- `docs/context/14-funcionalidades-atuais.md#110-interface-do-usuario` — UI atual
