# Modulo IDE

**ID:** `jarvis.ide`
**Prioridade:** 🟡 Media
**Depende de:** Kernel, Workspace
**Status:** Nao iniciado

## Visao Geral

Modulo de ambiente de desenvolvimento integrado. Diferente do modelo anterior (JARVIS como IDE), este e apenas um dos modulos do assistente.

## Funcionalidades

### 1. Editor de Codigo
- Editor baseado em QML (TextArea com syntax highlighting via QSyntaxHighlighter)
- Alternativa: Qt WebEngine + Monaco Editor (mais completo, mas mais pesado)
- Multiplas abas com dirty indicator
- Temas claro/escuro

### 2. Git
- Status, diff, stage/unstage, commit, push, pull, fetch
- Branch management (criar, checkout, merge)
- Visual diff side-by-side (QML custom)
- Integracao com GitHub via OAuth

### 3. Terminal
- Terminal integrado (QProcess + QML terminal widget)
- Suporte a Windows (pwsh/cmd), Linux/macOS (bash/zsh)

### 4. LSP
- Language Server Protocol client
- Autocomplete, definicoes, diagnosticos, hover
- Suporte a multiple LSP servers simultaneos

## Arquitetura do Editor

```
EditorPanel.qml
├── TabBar.qml
├── CodeEditor.qml
│   ├── TextArea (com highlighting)
│   └── Minimap (opcional)
├── StatusBar.qml
│   ├── Line/Column
│   ├── Language
│   └── Encoding
└── GitBlame (opcional)
```

## API Publica

```cpp
class IDEService {
public:
    // Editor
    virtual bool openFile(const std::string& path) = 0;
    virtual bool saveFile(const std::string& path) = 0;
    virtual bool closeFile(const std::string& path) = 0;
    virtual std::string getFileContent(const std::string& path) = 0;
    
    // Git
    virtual GitStatus getGitStatus() = 0;
    virtual bool stageFile(const std::string& path) = 0;
    virtual bool commit(const std::string& message) = 0;
    virtual bool push() = 0;
    virtual bool pull() = 0;
    
    // Terminal
    virtual void openTerminal() = 0;
    virtual void writeToTerminal(const std::string& input) = 0;
};
```
