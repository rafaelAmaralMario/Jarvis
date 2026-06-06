# Modulo Terminal

## O que faz
Terminal integrado usando xterm.js no frontend e subprocess PTY no backend, com suporte a multiplas abas.

## Arquivos
```
backend/jarvis/terminal_manager.py       — Gerenciamento de processos shell (subprocess + pyte)

ui/src/components/Terminal/TerminalPanel.tsx      — Painel inferior
ui/src/components/Terminal/TerminalInstance.tsx    — Instancia xterm.js
```

## Funcionalidades

### Multiplas Abas
- Criar nova aba de terminal (+)
- Fechar aba
- Alternar entre abas
- Titulo por aba (shell name)

### Terminal xterm.js
- Emulacao completa de terminal
- Temas (cores, fonte)
- Suporte a 256 cores
- Clipboard (copiar/colar)
- Selecao de texto
- Scroll infinito

### Backend subprocess PTY
- Cada terminal = 1 processo shell
- Comunicacao via stdin/stdout com `subprocess.Popen`
- Emulacao de terminal com `pyte` (escapes ANSI)
- Redimensionamento de terminal
- Kill de processo

### Atalhos
- `` Ctrl+` `` — toggle painel
- `Ctrl+Shift+5` — nova aba

### Eventos
- `terminal-output`: nova saida do terminal (streaming para frontend via `evaluate_js`)
- `terminal-exit`: processo shell encerrou

## Bridge API
- 6 metodos: `terminalCreate`, `terminalWrite`, `terminalResize`, `terminalClose`, `terminalList`, `terminalCloseAll`
