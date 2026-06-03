# 025 — Temas Customizáveis + Keybindings

## Metadados
- Status: a fazer
- Prioridade: 🟢 Baixa
- Fase: 7 — Polimento
- Dependências: (nenhuma)
- Paralelizável com: 026

## Descrição
Sistema de temas customizáveis (CSS variables) e UI de remapeamento de atalhos do teclado.

## Especificação Técnica

### 1. Sistema de Temas

**Arquitetura:**
- Tema definido como conjunto de CSS variables em `:root`
- Temas pré-definidos: `dark` (padrão), `light`, `hc-black`, `nord`, `dracula`
- Tema customizado: usuário define cores via UI
- Persistência: `editor_settings` key `theme` (nome do tema) + `theme_custom_colors` (JSON)

**Definição de cores (CSS variables já existentes no Tailwind):**
```css
:root {
  --background: #1e1e1e;
  --foreground: #d4d4d4;
  --card: #252526;
  --card-foreground: #d4d4d4;
  --primary: #007acc;
  --primary-foreground: #ffffff;
  --secondary: #3c3c3c;
  --accent: #2a2d2e;
  --muted: #3c3c3c;
  --border: #3c3c3c;
  --sidebar: #252526;
  --sidebar-muted: #2d2d2d;
  --sidebar-active: #37373d;
}
```

Para trocar tema: aplicar nova classe no `<html>`:
```tsx
document.documentElement.className = `theme-${themeName}`;
```

**Temas pré-definidos:**

| Tema | bg primária | fg primária | primary |
|------|------------|-------------|---------|
| dark | #1e1e1e | #d4d4d4 | #007acc |
| light | #ffffff | #333333 | #0066cc |
| hc-black | #000000 | #ffffff | #00ff00 |
| nord | #2e3440 | #d8dee9 | #88c0d0 |
| dracula | #282a36 | #f8f8f2 | #bd93f9 |

**ThemeEditor.tsx:**
- Seletor de tema (botoes/radio com preview de cor)
- Se "custom": paleta de cores com color picker para cada variável
- Preview em tempo real ao selecionar/mudar cor
- Botão "Resetar para padrão"

**Monaco theme:**
- Sincronizado com o tema da UI
- `dark` + `hc-black` → Monaco `vs-dark` ou `hc-black`
- `light` → Monaco `vs`
- `nord`/`dracula` (custom) → Monaco theme gerado dinamicamente via `monaco.editor.defineTheme()`

### 2. Sistema de Keybindings

**Armazenamento:**
Migration `keybindings`:
```sql
CREATE TABLE IF NOT EXISTS keybindings (
    command TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    when TEXT DEFAULT ''  -- contexto opcional (ex: "editorTextFocus", "terminalFocus")
);
```

**Keybinding defaults** (inseridos na migration):
```
Salvar            | Ctrl+S          | editorTextFocus
Fechar            | Ctrl+W          | editorTextFocus
Buscar            | Ctrl+F          | editorTextFocus
BuscarReplace     | Ctrl+H          | editorTextFocus
CommandPalette    | Ctrl+Shift+P    | editorTextFocus
QuickOpen         | Ctrl+P          | !editorTextFocus
SplitEditor       | Ctrl+\          | editorTextFocus
ToggleTerminal    | Ctrl+`          | global
NewTerminal       | Ctrl+Shift+`    | global
ToggleSidebar     | Ctrl+B          | global
ToggleMicrophone  | Ctrl+Shift+M    | global
SaveAll           | Ctrl+Shift+S    | global
```

**UI — KeybindingEditor.tsx:**
- Tabela: Comando | Atalho Atual | Contexto | Ações
- Clicar em "Atalho Atual" → modo de edição: "Pressione a combinação de teclas..."
- Detecta `keydown` e mostra combinação
- Valida conflitos (mesmo atalho para 2 comandos no mesmo contexto)
- Botão "Resetar para padrão"

**Aplicação no React:**
- Hook `useKeybindings()` carrega todos os keybindings do banco
- Registra listeners globais para cada comando
- Comandos executam as actions correspondentes
- Conflitos: último registro vence, log de aviso

### 3. Bridge handlers

```cpp
bridge.registerHandler("keybindingsGetAll", [db](const QVariantList&) -> QVariant { ... });
bridge.registerHandler("keybindingsSet", [db](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("keybindingsReset", [db](const QVariantList&) -> QVariant { ... });
```

### 4. Integração na SettingsPage

Aba "Aparência": ThemeEditor
Aba "Atalhos": KeybindingEditor

## Critérios de Aceitação
- [ ] Tema pode ser selecionado entre dark, light, hc-black, nord, dracula
- [ ] Tema é aplicado instantaneamente sem refresh
- [ ] Tema persiste entre sessões
- [ ] Monaco theme sincroniza com tema da UI
- [ ] Keybindings podem ser remapeados via UI
- [ ] Conflitos de keybinding são detectados e reportados
- [ ] Keybindings persistem entre sessões
- [ ] Keybinding "Resetar" restaura defaults

## Test Cases

### TC-001: Trocar tema para light
- **Passos:** 1. Settings > Aparência 2. Selecionar "Light"
- **Resultado:** UI muda para tema claro instantaneamente, Monaco muda para tema vs
- **Cobertura:** normal

### TC-002: Tema persiste
- **Passos:** 1. Selecionar tema "nord" 2. Fechar e reabrir app
- **Resultado:** App abre com tema nord
- **Cobertura:** normal

### TC-003: Remapear atalho
- **Passos:** 1. Settings > Atalhos 2. Alterar "Salvar" para Ctrl+Shift+S
- **Resultado:** Ctrl+Shift+S salva o arquivo, Ctrl+S não funciona mais
- **Cobertura:** normal

### TC-004: Conflito detectado
- **Passos:** 1. Alterar "Fechar" para Ctrl+F (já usado por "Buscar")
- **Resultado:** Aviso de conflito exibido, alteração não é salva
- **Cobertura:** borda

### TC-005: Resetar keybindings
- **Passos:** 1. Modificar vários atalhos 2. Clicar "Resetar para padrão"
- **Resultado:** Todos os atalhos voltam aos defaults
- **Cobertura:** normal
