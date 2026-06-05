# Módulo Terminal

## O que faz
Terminal integrado usando xterm.js no frontend e QProcess no backend, com suporte a múltiplas abas.

## Arquivos
```
kernel/src/terminal/terminal_manager.cpp — Gerenciamento de processos shell

ui/src/components/Terminal/TerminalPanel.tsx      — Painel inferior
ui/src/components/Terminal/TerminalInstance.tsx    — Instância xterm.js
```

## Funcionalidades

### Múltiplas Abas
- Criar nova aba de terminal (+)
- Fechar aba
- Alternar entre abas
- Título por aba (shell name)

### Terminal xterm.js
- Emulação completa de terminal
- Temas (cores, fonte)
- Suporte a 256 cores
- Clipboard (copiar/colar)
- Seleção de texto
- Scroll infinito

### Backend QProcess
- Cada terminal = 1 processo shell
- Comunicação via stdin/stdout
- Redimensionamento de terminal (SIGWINCH)
- Kill de processo

### Atalhos
- `` Ctrl+` `` — toggle painel
- `Ctrl+Shift+5` — nova aba

### Eventos
- `terminal-output`: nova saída do terminal (streaming para frontend)

## Bridge Handlers
6 handlers: create_terminal, write, resize, kill, list, get_output
