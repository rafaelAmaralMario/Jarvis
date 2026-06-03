# Tarefa: Terminal Integrado Real

**Epico:** 1 — Infraestrutura e Qualidade  
**Prioridade:** 🔴 Alta  
**Estimativa:** 3-4 semanas  
**Dependencias:** Nenhuma

## Objetivo

Substituir o placeholder estatico do Terminal no Bottom Panel por um terminal funcional que execute comandos reais no workspace atual.

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| xterm.js | Emulador de terminal no frontend |
| @xterm/xterm | Pacote npm para xterm.js |
| @xterm/addon-fit | Ajuste automatico de tamanho |
| Tauri command + pty | Spawn de processo shell no backend Rust |
| portable-pty (Rust) | Crate para criar pseudo-terminal |
| serde | Serializacao para comunicacao frontend-backend |

## Arquitetura

```
Frontend (xterm.js)  <-- Tauri Event/Command -->  Backend Rust (pty)
     |                                                  |
     | Input do usuario                                 | Spawn shell (powershell, bash)
     | Output do processo                               | Gerenciamento de processo
     |                                                  | Buffer de saida
```

## Como Fazer

### 1. Adicionar dependencias Rust

```toml
# src-tauri/Cargo.toml
[dependencies]
portable-pty = "0.7"
tokio = { version = "1", features = ["full"] }
```

### 2. Adicionar dependencias Frontend

```bash
npm install @xterm/xterm @xterm/addon-fit
```

### 3. Criar modulo Rust para terminal

Criar `src-tauri/src/terminal/mod.rs`:

```rust
use portable_pty::{CommandBuilder, NativePtySystem, PtySize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

pub struct TerminalSession {
    pub reader: Box<dyn portable_pty::Reader + Send>,
    pub writer: Box<dyn portable_pty::Writer + Send>,
}

pub fn spawn_terminal(app: &AppHandle) -> Result<TerminalSession, String> {
    let pty_system = NativePtySystem::default();
    let pair = pty_system.openpty(PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    }).map_err(|e| e.to_string())?;

    let cmd = CommandBuilder::new(if cfg!(target_os = "windows") { "powershell" } else { "bash" });
    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    // Spawn thread para ler output e emitir evento Tauri
    let app_handle = app.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        let mut reader = reader;
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let _ = app_handle.emit("terminal-output", &buf[..n].to_vec());
                }
                Err(_) => break,
            }
        }
    });

    Ok(TerminalSession { reader, writer })
}
```

### 4. Registrar comandos Tauri

```rust
#[tauri::command]
fn terminal_write(session_id: String, data: String) -> Result<(), String> { ... }

#[tauri::command]
fn terminal_resize(session_id: String, rows: u16, cols: u16) -> Result<(), String> { ... }
```

### 5. Criar hook useTerminal

```typescript
// src/ui/hooks/useTerminal.ts
export function useTerminal() {
  const terminalRef = useRef<xterm.Terminal | null>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalContainerRef.current) return;
    const term = new Terminal({ cursorBlink: true, fontSize: 14 });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainerRef.current);
    fitAddon.fit();

    term.onData((data) => {
      invoke('terminal_write', { data });
    });

    // Escutar output do backend
    const unlisten = await listen('terminal-output', (event) => {
      term.write(new Uint8Array(event.payload as number[]));
    });

    terminalRef.current = term;
    return () => { term.dispose(); unlisten(); };
  }, []);

  return { terminalRef, terminalContainerRef };
}
```

### 6. Substituir placeholder no TerminalView

Substituir o placeholder atual em `TerminalView.tsx` pelo componente xterm.js.

## Criterios de Pronto

- [ ] Terminal abre no workspace atual
- [ ] Usuario consegue executar comandos reais (ls, git, npm)
- [ ] Saida aparece em tempo real via streaming
- [ ] Tamanho do terminal se ajusta ao painel (fit addon)
- [ ] Comandos sensiveis respeitam politica de permissao
- [ ] Fechar terminal limpa processo corretamente
- [ ] Suporta PowerShell (Windows) e bash (Linux/macOS)
- [ ] `npm run build` e `cargo build` passam

## Referencias

- `docs/roadmap-pos-mvp.md` — v0.1 Beta Funcional
- `docs/context/14-funcionalidades-atuais.md#32---funciona-parcialmente--work-in-progress`
- `docs/context/18-vscode-features.md#14-terminal` — Comparacao com VS Code
