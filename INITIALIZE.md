# JARVIS — INITIALIZE.md

> Leia este arquivo para configurar o projeto JARVIS em uma nova maquina.
> Cobre Windows, macOS e Linux.

---

## 1. Pre-requisitos por Plataforma

### Windows
```powershell
winget install Git.Git
winget install Python.Python.3.14
winget install OpenJS.NodeJS.LTS
# WebView2 ja incluso no Windows 11
# Opcional: Ollama
winget install Ollama.Ollama
```

### macOS
```bash
brew install git python@3.14 node
# WebView2: pywebview usa WKWebView (nativo)
# Opcional: Ollama
brew install ollama
```

### Linux (Ubuntu/Debian 24.04+)
```bash
sudo apt update && sudo apt install -y \
    git python3 python3-pip python3-venv nodejs npm \
    libgtk-3-dev libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev \
    libsoup-3.0-dev
# Opcional: Ollama
curl -fsSL https://ollama.com/install.sh | sh
```

---

## 2. Clonar e Buildar

```bash
git clone <url-do-repositorio> Jarvis
cd Jarvis
```

### Windows
```powershell
.\build_rls.bat
```

### Linux / macOS
```bash
chmod +x build.sh
./build.sh
```

### Manual (qualquer plataforma)
```bash
# 1. Build React frontend
cd ui
npm install
npm run build
cd ..

# 2. Instalar backend Python
cd backend
pip install -e .
cd ..
```

---

## 3. Executar

### Modo producao (build pronto)
```bash
python backend/jarvis/main.py
```

### Modo desenvolvimento (Vite hot reload)
```bash
# Terminal 1: dev server React
cd ui && npm run dev

# Terminal 2: backend apontando pro dev server
python backend/jarvis/main.py --dev
```

---

## 4. Estrutura do Projeto

```
Jarvis/
├── backend/          # Python 3.14+ (pywebview)
│   ├── jarvis/       # Core: bridge, managers, database
│   │   ├── bridge.py          # 65+ metodos window.pywebview.api.*
│   │   ├── main.py            # Entry point com --dev
│   │   ├── database.py        # SQLite WAL + RLock
│   │   ├── knowledge_manager.py
│   │   ├── models_manager.py, agents_manager.py
│   │   ├── orchestration_manager.py
│   │   ├── workspace_manager.py
│   │   ├── editor_manager.py, git_manager.py
│   │   ├── terminal_manager.py, network_manager.py
│   │   ├── ollama_client.py, graph_builder.py
│   │   ├── migration_runner.py, module_loader.py
│   │   └── __init__.py
│   └── tests/        # 260+ pytest tests
├── ui/               # React 19 + TypeScript + Vite
│   └── src/
│       ├── components/    # 30+ componentes
│       ├── hooks/use-jarvis.ts  # Bridge hook
│       ├── types/index.ts
│       └── main.tsx
├── server/           # Sync server (Node.js, opcional)
├── .docs/            # Documentacao ativa
├── .context/         # Registro de contexto
├── .old/old-cpp/     # Codigo C++ original (migrado)
├── build_rls.bat     # Build Windows
├── build.sh          # Build Linux/macOS
└── Dockerfile.dev    # Dev container
```

---

## 5. Testes

```bash
# Backend (Python)
cd backend && python -m pytest

# Frontend (React)
cd ui && npm test
```

---

## 6. Configuracao

### Variaveis de ambiente (copie `.env.example` para `.env`)
```bash
cp .env.example .env
```

| Variavel | Obrigatoria | Default | Descricao |
|----------|-------------|---------|-----------|
| `OLLAMA_BASE_URL` | Nao | `http://localhost:11434` | URL do Ollama |

### Banco de dados
- SQLite local em `%APPDATA%/JARVIS/jarvis-ai.db` (Windows)
- ou `~/.local/share/JARVIS/jarvis-ai.db` (Linux/macOS)
- 8 migrations executadas automaticamente na inicializacao

---

## 7. Docker (Linux dev container)

```bash
# Dev container (Python + Node + ferramentas)
docker compose --profile dev up -d

# Sync server (opcional, requer Postgres)
docker compose --profile sync up -d
```

---

## 8. Documentacao para Agentes de IA

### Contexto completo
- `.context/CONTEXTO-COMPLETO.md` — visao geral, stack, arquitetura, modulos, bridge API, decisoes

### Arquitetura
- `.docs/01-arquitetura/02-sistema-modulos.md` — 14 modulos Python
- `.docs/01-arquitetura/03-bridge-protocolo.md` — protocolo pywebview js_api
- `.docs/01-arquitetura/04-inicializacao.md` — fluxo de startup

### Funcionalidades
- `.docs/04-funcionalidades/01-kernel.md` — core
- `.docs/04-funcionalidades/02-ia-agentes.md` — AI Engine
- `.docs/04-funcionalidades/03-conhecimento.md` — Knowledge
- `.docs/04-funcionalidades/04-workspace.md` — Workspace
- `.docs/04-funcionalidades/05-editor.md` — Editor
- `.docs/04-funcionalidades/06-terminal.md` — Terminal
- `.docs/04-funcionalidades/07-rede-oauth.md` — Rede/OAuth
- `.docs/04-funcionalidades/08-git.md` — Git
- `.docs/04-funcionalidades/09-persistencia.md` — Database

### Context Registry
- `.context/INDEX.md` — indice de todas as entradas de contexto

---

## 9. Proximos Passos (Roadmap)

1. **Plugin Ecosystem** — ativar ModuleLoader
2. **Multi-Provider LLM** — OpenAI, Anthropic, Bedrock
3. **Knowledge Graph Viz** — visualizacao interativa
4. **MCP Server** — Model Context Protocol
5. **Workflow Automation** — engine de steps
6. **Seguranca** — permission center + audit log
7. **Voz** — STT/TTS
8. **Instalador** — NSIS / AppImage
9. **Sync Server** — colaboracao multi-usuario
10. **Mobile Companion**

---

## 10. Troubleshooting

| Problema | Causa | Solucao |
|----------|-------|---------|
| "No bridge available" | Navegador comum, sem pywebview | Use `python backend/jarvis/main.py --dev` com Vite rodando |
| "module not found" | Dependencia Python faltando | `pip install -e .` no backend |
| WebView2 nao abre | Runtime faltando | Instalar WebView2 Runtime |
| "pywebview" import error | GTK/WebKit faltando (Linux) | Instalar libwebkit2gtk-4.1-dev |
