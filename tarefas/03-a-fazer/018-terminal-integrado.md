# 018 — Terminal Integrado

## Metadados
- Status: a fazer
- Prioridade: 🔴 Alta
- Dependências: 016

## Descrição
Terminal integrado usando xterm.js no painel inferior, com abas múltiplas e shell detectado automaticamente.

## Especificação Técnica

### Dependências npm
```bash
npm install xterm @xterm/xterm @xterm/addon-fit @xterm/addon-web-links @xterm/addon-search
```

### C++ — Bridge handlers
```cpp
bridge.registerHandler("terminalCreate", [](const QVariantList&) -> QVariant {
    // Cria novo processo shell, retorna terminal id
});

bridge.registerHandler("terminalWrite", [](const QVariantList& args) -> QVariant {
    // Escreve stdin no terminal id
});

bridge.registerHandler("terminalResize", [](const QVariantList& args) -> QVariant {
    // Redimensiona colunas/linhas do terminal id
});
```

- Usa `QProcess` para spawnar shell
- Eventos: `terminal-output(id, data)` emitido quando stdout/stderr tem dados
- Detecta shell: $SHELL (linux/mac), windir (windows)

### React — Componentes
- `TerminalPanel.tsx` — painel inferior com abas
- `TerminalInstance.tsx` — wrapper xterm.js
- `TerminalTab.tsx` — aba de terminal com nome e botão fechar

### UI
- Painel na parte inferior (split horizontal)
- Ctrl+` para toggle
- Ctrl+Shift+` para nova aba
- Botão "Terminal" na ActivityBar ou atalho global

## Critérios de Aceitação
- [ ] xterm.js renderiza terminal funcional
- [ ] Shell detectado automaticamente conforme SO
- [ ] Múltiplas abas de terminal
- [ ] Ctrl+` abre/fecha terminal
- [ ] Redimensionamento automático (fit addon)
- [ ] Copy/Paste funciona (Ctrl+Insert/Shift+Insert ou seleção + botão direito)

## Test Cases

### TC-001: Terminal abre com shell
- **Passos:** 1. Pressionar Ctrl+` 
- **Resultado:** Painel inferior com terminal funcional, prompt do shell visível
- **Cobertura:** normal

### TC-002: Comando executa
- **Passos:** 1. Digitar "echo hello" 2. Enter
- **Resultado:** "hello" aparece no output
- **Cobertura:** normal

### TC-003: Múltiplas abas
- **Passos:** 1. Ctrl+Shift+` 3x
- **Resultado:** 3 terminais em abas separadas, cada um independente
- **Cobertura:** normal

### TC-004: Redimensionamento
- **Passos:** 1. Abrir terminal 2. Redimensionar painel
- **Resultado:** Terminal se adapta ao novo tamanho
- **Cobertura:** normal
