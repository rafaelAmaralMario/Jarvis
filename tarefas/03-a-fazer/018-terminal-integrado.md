# 018 — Terminal Integrado

## Metadados
- Status: a fazer
- Prioridade: 🔴 Alta
- Fase: 3 — Produtividade Imediata
- Dependências: 016
- Paralelizável com: 017, 022

## Descrição
Terminal integrado usando xterm.js no painel inferior, com abas múltiplas,
shell detectado automaticamente e integração com o workspace.

## Especificação Técnica

### 1. Dependências npm

```bash
npm install xterm @xterm/xterm @xterm/addon-fit @xterm/addon-web-links @xterm/addon-search
```

### 2. C++ — TerminalManager

**Novo arquivo:** `kernel/include/jarvis/terminal/terminal_manager.h`
**Novo arquivo:** `kernel/src/terminal/terminal_manager.cpp`

```cpp
namespace jarvis::terminal {

struct TerminalInstance {
    std::string id;
    QProcess* process;
    int cols = 80;
    int rows = 24;
    std::string shell;
    bool isRunning;
};

class ITerminalManager {
public:
    virtual ~ITerminalManager() = default;
    virtual std::string create(bool useLoginShell = true) = 0;
    virtual void write(const std::string& id, const std::string& data) = 0;
    virtual void resize(const std::string& id, int cols, int rows) = 0;
    virtual void close(const std::string& id) = 0;
    virtual std::vector<std::string> list() = 0;
    virtual void setOutputCallback(std::function<void(const std::string& id, const std::string& data)> cb) = 0;
};

ITerminalManager* createTerminalManager();

}
```

**Detalhes:**
- `create()`: spawna o shell do sistema
  - Windows: `cmd.exe` (ou `powershell.exe` se configurado)
  - Linux: `$SHELL` ou `/bin/bash`
  - macOS: `$SHELL` ou `/bin/zsh`
- Usa `QProcess` com ambiente herdado do workspace
- `write()`: escreve no stdin do processo (UTF-8)
- `resize()`: envia SIGWINCH (Linux/macOS) ou ajusta buffer (Windows)
- Evento `terminal-output`: emitido via bridge quando stdout/stderr tem dados
- Evento `terminal-exit`: emitido quando o processo termina

**main.cpp — bridge handlers:**
```cpp
bridge.registerHandler("terminalCreate", [terminalManager](const QVariantList&) -> QVariant {
    return QString::fromStdString(terminalManager->create());
});

bridge.registerHandler("terminalWrite", [terminalManager](const QVariantList& args) -> QVariant {
    if (args.size() < 2) return false;
    terminalManager->write(args[0].toString().toStdString(), args[1].toString().toStdString());
    return true;
});

bridge.registerHandler("terminalResize", [terminalManager](const QVariantList& args) -> QVariant {
    if (args.size() < 3) return false;
    terminalManager->resize(args[0].toString().toStdString(), args[1].toInt(), args[2].toInt());
    return true;
});

bridge.registerHandler("terminalClose", [terminalManager](const QVariantList& args) -> QVariant {
    if (args.size() < 1) return false;
    terminalManager->close(args[0].toString().toStdString());
    return true;
});

bridge.registerHandler("terminalList", [terminalManager](const QVariantList&) -> QVariant {
    auto list = terminalManager->list();
    QJsonArray arr;
    for (const auto& id : list) arr.append(QString::fromStdString(id));
    return arr;
});
```

**Output callback** configurado no terminalManager para emitir eventos:
```cpp
terminalManager->setOutputCallback([&bridge](const std::string& id, const std::string& data) {
    bridge.emitEvent("terminal-output", QVariantMap{
        {"id", QString::fromStdString(id)},
        {"data", QString::fromStdString(data)}
    });
});
```

**Delete no shutdown** (main.cpp):
```cpp
delete terminalManager;  // junto com os outros managers
```

### 3. React — Componentes

**TerminalPanel.tsx** — painel inferior com abas:
- Renderiza na parte inferior da MainArea (split horizontal)
- Barra de abas no topo do painel
- Botão "+" para nova aba
- Ctrl+` toggle, Ctrl+Shift+` nova aba
- Resize handle para ajustar altura

**TerminalInstance.tsx** — wrapper xterm.js:
```tsx
interface TerminalInstanceProps {
  terminalId: string;
  onData: (data: string) => void;  // enviar para C++
  onResize: (cols: number, rows: number) => void;
}
```
- Cria div container, monta xterm.js
- Configura FitAddon para redimensionamento automático
- Configura WebLinksAddon para URLs clicáveis
- Conecta input do terminal → `terminalWrite` bridge
- Conecta `terminal-output` event → terminal.write()
- Tema: mesmo do editor (vs-dark)
- Fonte: mesma do editor (monospace stack)

**TerminalTab.tsx** — aba individual:
- Nome: "bash", "zsh", "cmd", "powershell", "terminal 1", etc
- Botão ✕ para fechar
- Indicador de atividade (se está executando algo)

### 4. Layout na MainArea

O TerminalPanel não é uma view do ActivityBar — é um painel global que aparece na
parte inferior, similar ao VS Code.

**MainArea.tsx — modificação:**
```tsx
<div className="flex-1 flex flex-col overflow-hidden">
  {/* View ativa (editor, knowledge, etc) */}
  <div className="flex-1 overflow-hidden">
    {renderActiveView()}
  </div>
  
  {/* Terminal panel */}
  {showTerminal && (
    <div
      className="border-t border-border bg-card"
      style={{ height: terminalHeight }}
    >
      <TerminalPanel />
    </div>
  )}
</div>
```

Estado global: `showTerminal` e `terminalHeight` via contexto ou zustand.

**Atalho Ctrl+`** registrado globalmente.

### 5. Settings (opcional)

Migration `terminal_settings`:
```sql
CREATE TABLE IF NOT EXISTS terminal_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
INSERT OR IGNORE INTO terminal_settings (key, value) VALUES ('shell', 'default');
INSERT OR IGNORE INTO terminal_settings (key, value) VALUES ('fontSize', '14');
INSERT OR IGNORE INTO terminal_settings (key, value) VALUES ('cursorStyle', 'block');
```

## Critérios de Aceitação
- [ ] xterm.js renderiza terminal com shell funcional
- [ ] Shell detectado automaticamente conforme SO
- [ ] Múltiplas abas de terminal (botão "+")
- [ ] Ctrl+` abre/fecha o painel de terminal
- [ ] Ctrl+Shift+` cria nova aba
- [ ] Redimensionamento automático (FitAddon)
- [ ] Ctrl+C/ Ctrl+D funcionam (interromper/sair)
- [ ] Copy/Paste via seleção + botão direito
- [ ] TerminalManager é destruído no shutdown

## Test Cases

### TC-001: Terminal abre com shell
- **Passos:** 1. Pressionar Ctrl+`
- **Resultado:** Painel inferior abre com terminal funcional, prompt do shell visível
- **Cobertura:** normal

### TC-002: Comando executa
- **Passos:** 1. Terminal aberto 2. Digitar "echo hello" 3. Enter
- **Resultado:** "hello" aparece no output do terminal
- **Cobertura:** normal

### TC-003: Múltiplas abas
- **Passos:** 1. Clicar "+" 3 vezes
- **Resultado:** 3 terminais em abas separadas, cada um independente
- **Cobertura:** normal

### TC-004: Fechar aba
- **Passos:** 1. Abrir 2 terminais 2. Clicar ✕ na aba 1
- **Resultado:** Aba 1 fecha, processo é terminado, aba 2 permanece ativa
- **Cobertura:** normal

### TC-005: Redimensionamento
- **Passos:** 1. Abrir terminal 2. Arrastar resize handle para cima
- **Resultado:** Terminal expande, linhas/colunas se ajustam
- **Cobertura:** normal

### TC-006: Ctrl+C interrompe
- **Passos:** 1. Executar "ping localhost" 2. Pressionar Ctrl+C
- **Resultado:** Processo interrompido, prompt retorna
- **Cobertura:** normal

### TC-007: Shell correto no Windows
- **Pré:** SO Windows
- **Passos:** 1. Abrir terminal
- **Resultado:** Shell = cmd.exe (ou powershell.exe)
- **Cobertura:** normal

### TC-008: Terminal persiste ao trocar de view
- **Passos:** 1. Abrir terminal 2. Clicar em outra view (ex: Conhecimento)
- **Resultado:** Terminal continua rodando, reaparece ao pressionar Ctrl+`
- **Cobertura:** normal
