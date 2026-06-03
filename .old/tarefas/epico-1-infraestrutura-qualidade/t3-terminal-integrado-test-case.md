# Tarefa: Test Case - Terminal Integrado Real

## Testes Unitarios (Frontend - useTerminal hook)

| # | Nome | Descricao | Input | Expected Result |
|---|------|-----------|-------|-----------------|
| TU1 | hook inicializa | Terminal container montado | containerRef valido | terminalRef.current nao e null |
| TU2 | onData envia comando | Input do usuario | data="ls\n" | invoke('terminal_write') chamado |
| TU3 | listen recebe output | Output do backend | payload=[72,105] | terminal.write chamado com bytes |
| TU4 | cleanup ao desmontar | Componente removido | unmount | term.dispose() chamado |
| TU5 | fit addon resize | Painel redimensionado | resize event | fitAddon.fit() chamado |

## Testes Rust

| # | Nome | Descricao | Input | Expected Result |
|---|------|-----------|-------|-----------------|
| TR1 | spawn terminal | Cria sessao terminal | app handle | Ok(session) |
| TR2 | terminal write | Escreve no PTY | data="echo hello" | Dados escritos no writer |
| TR3 | terminal resize | Redimensiona PTY | rows=40, cols=120 | PtySize atualizado |
| TR4 | terminal close | Fecha sessao | session_id | Processo filho encerrado |

## Testes de Integracao

| # | Nome | Passos | Expected Result |
|---|------|--------|-----------------|
| TI1 | Terminal abre no workspace | 1. Abrir app 2. Clicar aba Terminal | Terminal visivel no Bottom Panel, prompt do shell |
| TI2 | Executar comando simples | 1. Digitar "echo hello" 2. Enter | "hello" aparece na saida |
| TI3 | Executar comando longo | 1. "npm run build" 2. Wait | Saida streaming aparece em tempo real |
| TI4 | Comando com erro | 1. "invalidcommand" | Mensagem de erro no terminal |
| TI5 | Ctrl+C interrompe | 1. "ping localhost" 2. Ctrl+C | Processo interrompido |
| TI6 | Resize automatico | 1. Redimensionar painel | Terminal reflow, linhas se ajustam |
