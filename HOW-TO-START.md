# HOW-TO-START — JARVIS

Assistente AI desktop com IDE integrada. Backend Python (pywebview) + Frontend React 19 + Sync Server opcional (Node.js).

---

## 1. Pré-requisitos

| Ferramenta | Versão Mínima | Onde Obter |
|---|---|---|
| Python | 3.11+ (4.0+ ideal) | [python.org](https://python.org) |
| Node.js | 22+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | (vem com Node.js) |
| Ollama | Última | `winget install Ollama.Ollama` (Win), `brew install ollama` (Mac), `curl -fsSL https://ollama.com/install.sh | sh` (Linux) |
| WebView2 Runtime | — | Windows 11 já inclui; Win 10: [Microsoft](https://developer.microsoft.com/microsoft-edge/webview2) |

**Linux (Ubuntu/Debian)** — instalar libs do pywebview:
```bash
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev \
  libjavascriptcoregtk-4.1-dev libsoup-3.0-dev
```

---

> O server (`server/`) é **opcional** — apenas para colaboração multiusuário.
> Pule a etapa 3 se for usar apenas o app local.

## 2. Setup

```bash
# 1. Backend — instalar dependências Python
cd backend
pip install -e ".[dev]"

# 2. UI — instalar dependências Node
cd ../ui
npm install

# 3. Server (apenas para sync multiusuário)
cd ../server
npm install
```

---

## 3. Rodar (Desenvolvimento)

Dois terminais simultâneos:

```bash
# Terminal 1 — Frontend com hot-reload
cd ui
npm run dev
# → http://127.0.0.1:1420

# Terminal 2 — Backend
cd backend
python jarvis/main.py --dev
# → Abre janela desktop conectada ao Vite
```

> **`--dev`** faz o pywebview carregar `http://127.0.0.1:1420` ao invés do build estático.

---

## 4. Rodar (Produção)

```bash
# 1. Build do frontend
cd ui
npm run build
# → Gera ui/dist/

# 2. Iniciar backend (modo produção)
cd ../backend
python jarvis/main.py
# → Abre janela desktop carregando ui/dist/index.html
```

---

## 5. Modelos AI (Ollama)

Após instalar o Ollama, baixar modelos:

```bash
# Modelo principal de código
ollama pull qwen2.5-coder:7b

# Modelo de chat
ollama pull llama3.2:3b

# Modelo de embedding (para busca semântica)
ollama pull nomic-embed-text:v1.5
```

> A interface Settings → Models permite gerenciar modelos e ver status do servidor.

---

## 6. Testes

```bash
# Backend (318 testes)
cd backend && python -m pytest

# UI (179 testes)
cd ui && npm test

# Server (8 testes)
cd server && npm test

# E2E (9 testes, Playwright — abre navegador)
cd ui && npm run test:e2e

# Tudo de uma vez (Windows)
.\build_rls.bat
```

---

## 7. Estrutura do Projeto

```
jarvis/
├── backend/              # Python + pywebview
│   ├── jarvis/
│   │   ├── main.py       # Entry point
│   │   ├── bridge.py     # 65+ métodos expostos ao frontend
│   │   ├── database.py   # SQLite WAL-mode
│   │   ├── ollama_client.py
│   │   ├── llm_gateway.py   # Ollama/OpenAI/Anthropic/Bedrock
│   │   ├── mcp_manager.py   # MCP servers
│   │   ├── workflow_engine.py
│   │   ├── security_manager.py
│   │   └── ... (20 módulos)
│   └── tests/
├── ui/                   # React 19 + Vite + Tailwind
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # use-jarvis bridge
│   │   ├── types/        # TypeScript interfaces
│   │   └── App.tsx
│   ├── e2e/              # Playwright tests
│   └── package.json
├── server/               # Sync multiusuário (Node.js, opcional)
│   └── src/
└── .context/             # Contexto das sessões
```

---

> ⚠ O server (`server/`) é **opcional**. O app principal funciona sem ele.

## 8. Sync Server (Opcional — apenas para colaboração multiusuário)

Requer PostgreSQL:

```bash
cd server

# Configure .env (copie .env.example)
# DATABASE_URL=postgres://jarvis:jarvis-dev@localhost:5432/jarvis

# Criar schema
psql -U jarvis -d jarvis -f sql/init.sql

# Rodar (dev)
npm run dev

# Rodar (produção)
npm run build && npm start
```

---

## 9. Comandos Úteis

| Ação | Comando |
|---|---|
| Dev full (2 terminais) | `cd ui && npm run dev` + `python backend/jarvis/main.py --dev` |
| Build produção | `cd ui && npm run build` |
| Rodar produção | `cd backend && python jarvis/main.py` |
| Rodar testes backend | `cd backend && python -m pytest` |
| Rodar testes UI | `cd ui && npx vitest run` |
| Rodar testes E2E | `cd ui && npm run test:e2e` |
| Rodar todos os testes | `.\build_rls.bat` |
| Lint Python | `cd backend && ruff check .` |
| TypeScript check | `cd ui && npx tsc --noEmit` |
| Atalho terminal (app) | <code>Ctrl + \`</code> |

---

## 10. Troubleshooting

**"No bridge available"** no console → App rodando em navegador sem backend. Ignorar em dev, ou conectar backend com `--dev`.

**pywebview não abre janela** → WebView2 Runtime não instalado (Windows) ou libwebkit2gtk ausente (Linux).

**Ollama connection refused** → Servidor Ollama não está rodando. Iniciar com `ollama serve` ou pela interface Settings → Models → "Iniciar Servidor".

**Porta 1420 ocupada** → Alterar em `ui/vite.config.ts` ou matar processo na porta.

**Banco SQLite corrompido** → Deletar `%APPDATA%/JARVIS/jarvis-ai.db` (Windows) ou `~/.local/share/JARVIS/jarvis-ai.db` (Linux/Mac) — migrações recriam do zero.
