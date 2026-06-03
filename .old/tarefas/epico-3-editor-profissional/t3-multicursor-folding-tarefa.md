# Tarefa: Multi-cursor + Code Folding

**Epico:** 3 — Editor Profissional  
**Prioridade:** 🟡 Media  
**Estimativa:** ~1 semana  
**Dependencias:** Nenhuma

## Objetivo

Habilitar e expor funcionalidades do Monaco Editor que ja sao suportadas nativamente mas estao desabilitadas ou sem atalhos: multi-cursor, code folding, bracket pair colorization.

## Como Fazer

### 1. Configurar Monaco

```typescript
// No componente EditorPanel ou App.tsx
const editorOptions: MonacoOptions = {
  multiCursorModifier: 'alt',
  multiCursorMergeOverlapping: true,
  folding: true,
  foldingHighlight: true,
  foldingStrategy: 'indentation',
  bracketPairColorization: { enabled: true },
};
```

### 2. Expor atalhos

| Acao | Atalho | Status |
|------|--------|--------|
| Multi-cursor: Add next occurrence | Ctrl+D | ❌ Ausente |
| Multi-cursor: Add all occurrences | Ctrl+Shift+L | ❌ Ausente |
| Multi-cursor: Alt+Click | Alt+Click | ❌ Ausente |
| Code Folding: Fold | Ctrl+Shift+[ | ❌ Ausente |
| Code Folding: Unfold | Ctrl+Shift+] | ❌ Ausente |
| Bracket Colorization | — | Desabilitado |

### 3. Adicionar opcoes no SettingsPanel

```typescript
interface EditorSettings {
  multiCursorEnabled: boolean;    // default: true
  codeFolding: boolean;           // default: true
  bracketPairColorization: boolean; // default: true
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded'; // default: 'off'
}
```

## Criterios de Pronto

- [ ] Alt+Click adiciona cursor extra
- [ ] Ctrl+D seleciona proxima ocorrencia
- [ ] Ctrl+Shift+L seleciona todas as ocorrencias
- [ ] Ctrl+Shift+[ e ] fazem fold/unfold
- [ ] Bracket pair colorization ativo
- [ ] Opcoes configuraveis no SettingsPanel
- [ ] Word wrap opcional

## Referencias

- `docs/context/18-vscode-features.md#11-editor-de-codigo` — Features do VS Code
- Monaco Editor options documentation
