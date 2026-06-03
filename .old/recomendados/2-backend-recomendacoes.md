# Recomendacoes de Backend — JARVIS

## Visao Geral

Backend dividido em **3 camadas**: Rust (nativo Tauri), Python Sidecar (IA pesada), TypeScript (orquestracao frontend). Cada um faz o que faz de melhor.

---

## 1. Rust (Tauri) — Backend Nativo

### O que manter
| Modulo | Funcao | Arquivo |
|--------|--------|---------|
| workspace | CRUD arquivos, busca, validacao path | `src-tauri/src/workspace/` |
| git | Status, diff, commit, branches, push/pull | `src-tauri/src/git/` |
| services | Ollama, notas Markdown | `src-tauri/src/services/` |
| security | Validacao plugins, permissoes | `src-tauri/src/security/` |
| storage | Secure settings (API keys) | `src-tauri/src/storage/` |
| terminal | PTY management (a implementar) | `src-tauri/src/terminal/` (novo) |

### Dependencias Rust a Adicionar

```toml
[dependencies]
# Terminal real
portable-pty = "0.7"        # Pseudo-terminal multiplataforma
tokio = { version = "1", features = ["full"] }  # Async runtime

# Automacao de sistema
enigo = "0.2"               # Controle de teclado/mouse (automatizacao)
robotjs = { version = "0.4", features = ["clipboard"] }  # Alternativa

# Captura de tela/tela
screenshots = "0.5"         # Captura de tela para contexto visual

# Audio (via sidecar Python, mas se quiser nativo)
# cpal = "0.15"             # Audio capture/playback

# Web scraping (lado Rust — pesado, prefira Python)
# headless_chrome = "1.0"   # Alternativa: scraper

# Seguranca adicional
keyring = "2.0"             # Credential managers do SO
tauri-plugin-stronghold = "2" # Criptografia de dados sensiveis
```

### Novos Comandos Tauri

```rust
// Automacao de Sistema
#[tauri::command]
fn system_execute_command(command: String, args: Vec<String>) -> Result<String, String>;

#[tauri::command]
fn system_simulate_keypress(key: String, modifiers: Vec<String>) -> Result<(), String>;

#[tauri::command]
fn system_simulate_mouse_click(x: u32, y: u32) -> Result<(), String>;

#[tauri::command]
fn system_get_screenshot() -> Result<Vec<u8>, String>;

#[tauri::command]
fn system_get_open_windows() -> Result<Vec<WindowInfo>, String>;

#[tauri::command]
fn system_focus_window(title: String) -> Result<(), String>;

// Navegacao Web (via browser control)
#[tauri::command]
fn browser_navigate(url: String) -> Result<(), String>;

#[tauri::command]
fn browser_fill_input(selector: String, value: String) -> Result<(), String>;

#[tauri::command]
fn browser_click(selector: String) -> Result<(), String>;

#[tauri::command]
fn browser_get_html(url: String) -> Result<String, String>;

// Perifericos
#[tauri::command]
fn microphone_start_listening() -> Result<(), String>;

#[tauri::command]
fn microphone_stop_listening() -> Result<(), String>;

#[tauri::command]
fn webcam_capture() -> Result<Vec<u8>, String>;

// Tempo Real (WebSocket)
#[tauri::command]
fn websocket_connect(url: String) -> Result<(), String>;

#[tauri::command]
fn websocket_send(message: String) -> Result<(), String>;
```

---

## 2. Python Sidecar — IA e Automacao Pesada

### Por que Python?
- Ecossistema de IA imbatível (LangChain, LangGraph, ChromaDB, whisper, TTS)
- Automacao web com Playwright/Puppeteer e Python
- Parsing de documentos (PyMuPDF, python-docx, openpyxl)
- Processamento de audio (whisper, pyttsx3, edge-tts)

### Arquitetura do Sidecar

```
Python Sidecar (FastAPI em localhost:8652)
├── /api/agent              → Orquestracao de agentes (LangGraph)
├── /api/chat               → Chat com streaming SSE
├── /api/embeddings         → Busca semantica (ChromaDB + sentence-transformers)
├── /api/browser            → Automacao web (Playwright)
├── /api/voice              → STT (whisper) + TTS (edge-tts)
├── /api/system             → Automacao sistema (PyAutoGUI)
├── /api/documents          → Parsing PDF, DOCX, XLSX
├── /api/templates          → Jinja2 template rendering
└── /ws/chat                → WebSocket para chat tempo real
```

### Dependencias Python

```txt
# Core
fastapi==0.115.0
uvicorn[standard]==0.30.0
websockets==13.0
httpx==0.27.0

# IA e Agentes
langchain==0.3.0
langgraph==0.2.0
langchain-ollama==0.1.0
langchain-openai==0.1.0
sentence-transformers==3.0.0
chromadb==0.5.0

# Audio/Voz
openai-whisper==20240930
edge-tts==6.1.0
pyaudio==0.2.14

# Automacao
playwright==1.47.0
pyautogui==0.9.54
pynput==1.7.7
pillow==10.4.0
mss==9.0.2

# Documentos
PyMuPDF==1.24.0
python-docx==1.1.2
openpyxl==3.1.5
markdown==3.6.0

# Templates
jinja2==3.1.4

# Utilitarios
pydantic==2.9.0
pyyaml==6.0.2
```

### Empacotamento do Sidecar

Usar **PyInstaller** para empacotar em executavel unico:

```bash
pip install pyinstaller
pyinstaller --onefile --name jarvis-sidecar sidecar/main.py
```

Ou usar **Nuitka** para binario menor e mais rapido:

```bash
pip install nuitka
nuitka --standalone --onefile sidecar/main.py
```

---

## 3. TypeScript/React — Frontend

### Bibliotecas a Adicionar

```json
{
  "dependencies": {
    "@xterm/xterm": "^5.5.0",          // Terminal
    "@xterm/addon-fit": "^0.10.0",      // Terminal resize
    "react-markdown": "^9.0.0",         // Markdown preview
    "remark-gfm": "^4.0.0",             // GFM tables
    "react-virtuoso": "^4.10.0",        // Listas virtualizadas (chat, logs)
    "zustand": "^5.0.0",               // Estado global (alternativa a hooks)
    "immer": "^10.1.0",                 // Immutable state
    "@tauri-apps/plugin-shell": "^2.0.0", // Shell Tauri plugin
    "@tauri-apps/plugin-process": "^2.0.0", // Process management
    "@tauri-apps/plugin-websocket": "^2.0.0", // WebSocket
    "react-hot-toast": "^2.4.0"        // Toast notifications
  },
  "devDependencies": {
    "@playwright/test": "^1.47.0",      // E2E tests
    "msw": "^2.4.0"                     // Mock service worker
  }
}
```

### Servicos a Adicionar

```typescript
// application/services/
chat-stream.ts          // WebSocket chat em tempo real
automation-service.ts   // Automacao de sistema
browser-service.ts      // Automacao web
voice-service.ts        // Entrada/saida de voz
system-service.ts       // Comandos de sistema, perifericos
notification-service.ts // Notificacoes desktop e in-app
```

---

## 4. Modelos de IA Gratuitos Recomendados

### Modelos Locais (via Ollama)

| Modelo | Tamanho | RAM | Melhor para | Comando Ollama |
|--------|---------|-----|-------------|----------------|
| **Llama 3.2 (3B)** | ~2GB | 4GB | Texto geral, rapido | `ollama pull llama3.2` |
| **Qwen 2.5 Coder (7B)** | ~4.5GB | 8GB | **Codigo**, melhor custo-beneficio | `ollama pull qwen2.5-coder` |
| **DeepSeek Coder V2 (6.7B)** | ~4GB | 8GB | Codigo, raciocinio | `ollama pull deepseek-coder` |
| **Mistral 7B** | ~4.1GB | 8GB | Texto, analise | `ollama pull mistral` |
| **Phi-3 Mini (3.8B)** | ~2.3GB | 4GB | Texto, leve | `ollama pull phi3` |
| **nomic-embed-text** | ~274MB | 2GB | **Embeddings** (busca semantica) | `ollama pull nomic-embed-text` |
| **Llama 3.2 Vision (11B)** | ~7GB | 12GB | **Imagem** + texto | `ollama pull llama3.2-vision` |
| **Gemma 2 (9B)** | ~5.5GB | 8GB | Texto geral | `ollama pull gemma2` |

### Modelos Gratuitos via API

| Modelo | Provider | Rate Limit | Melhor para |
|--------|----------|-----------|-------------|
| **GPT-4o Mini** | OpenAI | 3rpm (free) | Texto, codigo, imagem |
| **Gemini 1.5 Flash** | Google | 60rpm (free) | Texto, audio, imagem, video |
| **Claude 3 Haiku** | Anthropic | 5rpm (free) | Texto, analise rapida |
| **DeepSeek V2** | DeepSeek | 50rpm (free) | Codigo excelente |
| **Mistral Small** | Mistral | 1rpm (free) | Texto geral |

### Modelos de Embeddings Gratuitos

| Modelo | Provider | Dimensoes | GRATIS |
|--------|----------|-----------|--------|
| nomic-embed-text (local) | Ollama | 768 | ✅ Sim |
| text-embedding-3-small | OpenAI | 1536 | ❌ Pago |
| text-embedding-004 | Google | 768 | ✅ Free tier |

---

## 5. Seguranca e Permissoes

### Novo Sistema de Permissoes Expandido

```typescript
type PermissionId =
  | 'read-workspace'      // Ja existe
  | 'write-workspace'     // Ja existe
  | 'git'                 // Ja existe
  | 'network'             // Ja existe
  | 'secrets'             // Ja existe
  // NOVAS:
  | 'system-command'      // Executar comandos no sistema
  | 'browser-control'     // Controlar navegador
  | 'microphone'          // Acessar microfone
  | 'webcam'              // Acessar webcam
  | 'screen-capture'      // Capturar tela
  | 'keyboard-mouse'      // Simular teclado/mouse
  | 'file-download'       // Download para o sistema
  | 'clipboard-read'      // Ler area de transferencia
  | 'clipboard-write'     // Escrever area de transferencia
  | 'notifications'       // Enviar notificacoes
  | 'automation-web'      // Automacao de sites (login, formularios)
  | 'automation-finance'  // Operacoes financeiras (compras, trades)
;
```

### Tabela de Risco das Novas Permissoes

| Permissao | Risco | Descricao |
|-----------|-------|-----------|
| system-command | 🔴 Critico | Execucao arbitraria de comandos |
| browser-control | 🔴 Alto | Controlar navegador, preencher formularios |
| microphone | 🟡 Medio | Capturar audio |
| webcam | 🔴 Alto | Capturar video |
| screen-capture | 🔴 Critico | Ver tudo na tela |
| keyboard-mouse | 🔴 Alto | Simular interacoes |
| automation-web | 🔴 Alto | Logar em sites, fazer acoes |
| automation-finance | 🔴 Critico | Comprar/vender, transferencias |
| clipboard-read | 🟡 Medio | Ler dados copiados |
| clipboard-write | 🟢 Baixo | Copiar dados |

### Fluxo de Confirmacao

```
[Agente solicita permissao X] 
    → [Sistema verifica workspace permissions]
    → [Se ja autorizada: executa]
    → [Se nao autorizada: mostra banner na UI]
    → [Usuario: "Permitir uma vez" / "Permitir sempre" / "Negar"]
    → [Registra em auditoria]
    → [Executa ou bloqueia]
```
