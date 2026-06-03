# Recomendacoes de Ferramentas e Bibliotecas — JARVIS

## 1. Ferramentas de Desenvolvimento

| Ferramenta | Uso | Gratis? | Recomendacao |
|-----------|-----|---------|-------------|
| **VS Code** | Editor para desenvolver o JARVIS | ✅ | Ja deve estar usando |
| **Tauri CLI** | Build e dev do app desktop | ✅ | Ja configurado |
| **cargo-watch** | Auto-reload Rust | ✅ | `cargo install cargo-watch` |
| **just** | Task runner moderno | ✅ | Alternativa ao Make |
| **biome** | Linter + Formatter unificado | ✅ | Substitui ESLint + Prettier |
| **rust-analyzer** | LSP para Rust | ✅ | Ja deve ter |
| **cargo-nextest** | Test runner Rust mais rapido | ✅ | `cargo install cargo-nextest` |
| **act** | Rodar GitHub Actions localmente | ✅ | `cargo install act` |
| **gh** | GitHub CLI | ✅ | Para PRs, issues |

## 2. Bibliotecas Frontend (a Adicionar)

| Biblioteca | Versao | Uso | Por que |
|-----------|--------|-----|---------|
| zustand | ^5.0.0 | Estado global | Mais simples que Redux, TS-first |
| immer | ^10.1.0 | Imutabilidade | Updates profundos sem spread |
| react-virtuoso | ^4.10.0 | Listas virtuais | Chat com 1000+ mensagens |
| react-hot-toast | ^2.4.0 | Notificacoes | Leve, customizavel |
| react-markdown | ^9.0.0 | Markdown preview | Renderizar notas/README |
| @xterm/xterm | ^5.5.0 | Terminal emulator | Padrao da industria |
| d3-force | ^3.0.0 | Graph view (futuro) | Visualizacao de conexoes |

## 3. Bibliotecas Python (Sidecar)

| Biblioteca | Uso | Gratis? | Tam. Aprox |
|-----------|-----|---------|-----------|
| fastapi | Framework API | ✅ | ~2MB |
| uvicorn | Servidor ASGI | ✅ | ~1MB |
| websockets | WebSocket | ✅ | ~1MB |
| langchain | Framework IA | ✅ | ~10MB |
| langgraph | Agentes multi-passo | ✅ | ~5MB |
| chromadb | Busca vetorial | ✅ | ~30MB |
| sentence-transformers | Embeddings | ✅ | ~50MB (modelo) |
| openai-whisper | STT | ✅ | ~200MB (modelo) |
| edge-tts | TTS | ✅ | ~5MB |
| playwright | Automacao web | ✅ | ~30MB (browsers) |
| pyautogui | Automacao sistema | ✅ | ~1MB |
| PyMuPDF | PDF parsing | ✅ | ~5MB |
| python-docx | DOCX parsing | ✅ | ~1MB |
| jinja2 | Templates | ✅ | ~1MB |
| pydantic | Validacao dados | ✅ | ~2MB |

## 4. Servicos Externos (Gratuitos)

| Servico | Uso | Gratuito? | Limites |
|---------|-----|-----------|---------|
| **GitHub** | Codigo, CI, releases | ✅ | Ilimitado (publico) |
| **GitHub Actions** | CI/CD | ✅ | 2000 min/mes (gratis) |
| **GitHub Releases** | Distribuicao | ✅ | Ilimitado |
| **Google AI Studio** | Gemini API | ✅ | 60 req/min (gratis) |
| **DeepSeek API** | LLM texto/codigo | ✅ | 50 req/min (gratis) |
| **Ollama** | Modelos locais | ✅ | Ilimitado (local) |
| **Hugging Face** | Modelos, datasets | ✅ | Ilimitado |
| **ngrok** | Tunnel para testes | ✅ | 1 tunnel, 40 conexoes/min |

## 5. Ferramentas de Qualidade

| Ferramenta | Uso | Comando |
|-----------|-----|---------|
| **biome check** | Lint + format | `npx biome check src/` |
| **cargo clippy** | Lint Rust | `cargo clippy -- -D warnings` |
| **cargo fmt** | Format Rust | `cargo fmt` |
| **vitest** | Testes frontend | `npm test` |
| **cargo nextest** | Testes Rust | `cargo nextest run` |
| **playwright** | E2E tests | `npx playwright test` |
| **cargo audit** | Vulnerabilidades Rust | `cargo audit` |
| **npm audit** | Vulnerabilidades JS | `npm audit` |

## 6. Comandos Uteis (Task Runner com `just`)

```makefile
# justfile
dev:
    npm run tauri -- dev

test:
    npm test

test-rust:
    cd src-tauri && cargo test

test-all: test test-rust

lint:
    npx biome check src/

lint-rust:
    cd src-tauri && cargo clippy -- -D warnings

format:
    npx biome format --write src/

format-rust:
    cd src-tauri && cargo fmt

build:
    npm run build && cd src-tauri && cargo build

build-release:
    npm run tauri -- build

sidecar:
    cd sidecar && uvicorn main:app --reload --port 8652

ci: lint lint-rust test test-rust build

audit:
    cd src-tauri && cargo audit && cd .. && npm audit
```
