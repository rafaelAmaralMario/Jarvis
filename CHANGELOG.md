# Changelog

## v0.1.0 (2026-06-08)

### 🚀 Features
- Assistente AI com interface React moderna
- Sistema de módulos com carregamento dinâmico
- Gerenciamento de conhecimento (Obsidian-like notes com links, backlinks, graph)
- Editor de código com abas, syntax highlighting, busca
- Terminal integrado com suporte a múltiplas sessões
- Git manager (status, diff, commit, branch, log)
- Workspace manager com árvore de arquivos
- Chat com histórico por sessão
- MCP Server manager
- Orchestration manager (agentes coordenados)
- Workflow engine
- Security manager (permissões, audit log, secrets)
- LLM Gateway multi-provedor (Ollama, OpenAI, Anthropic, etc.)
- Network manager (HTTP client, OAuth)

### 🎨 Interface
- Context menus sensíveis ao contexto (FileTree, EditorTabs, Agent Panel)
- Model Server Status com indicador visual e botão de iniciar
- Seletor de pasta nativo (PowerShell/zenity/osascript)
- Painel de atualizações com verificação de versão e instalação
- StatusBar com contagem de módulos, modelo ativo, notificações de update

### 🔧 Sistema de Atualização
- `version.py`: parsing semântico, check via GitHub Releases API
- Auto-update runtime: download → batch updater → replace/installer → restart
- Suporte a instalador (Inno Setup) e portable .exe
- Badge de notificação na StatusBar

### 🏗 Build & Distribuição
- PyInstaller: executável único ~35MB
- Inno Setup: instalador Windows com shortcut
- GitHub Actions: release workflow automatizado
- Ícone do app: 64x64 ICO

### ✅ Testes
- 331 testes backend (pytest)
- 179 testes UI (Vitest + Testing Library)
- 5 testes server (Mocha)
- 9 testes E2E (Playwright)
- Total: 524 testes
