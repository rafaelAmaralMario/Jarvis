# Stack Tecnologica Decidida

## Decisao Principal

Substituir a stack anterior (Tauri 2 + React 19 + Rust + TypeScript + Python sidecar) por **C++ + Qt 6** como linguagem e framework unicos.

## Justificativas

| Fator | Stack Anterior | Nova Stack |
|-------|---------------|------------|
| Linguagens | 3 (TS, Rust, Python) | 1 (C++) |
| Modular nativo | Limitado (Tauri plugin system) | Total (QPluginLoader + ABI C) |
| Performance | IPC Tauri (serializacao JSON) | Chamadas diretas de funcao |
| Controle de sistema | Via Rust commands | Qt + C++ nativo |
| UI | Web (React) em WebView | Nativa (QML) |
| AI local | Sidecar Python (whisper, llama.cpp) | Nativo (whisper.cpp, llama.cpp) |
| Tamanho binario | ~100MB + WebView runtime | ~30-50MB (Qt LGPL dinamico) |

## Stack Detalhada

### Linguagem
- **C++20** — ISO standard, modules, concepts, coroutines
- Compilador: MSVC 2022 (Windows), Clang 18+ (Linux/macOS)

### Framework Desktop
- **Qt 6.8+** (LGPL v3)
  - Qt Core — fundamentos, signal/slot, threads
  - Qt Widgets — QApplication base
  - Qt WebEngine — Chromium embarcado para UI principal (React)
  - Qt WebChannel — Bridge JSON-RPC entre React e C++
  - Qt SQL — SQLite integration
  - Qt Network — HTTP, WebSocket

### UI Moderna (WebEngine)
A interface do usuario e construida com tecnologias web modernas rodando dentro do Qt WebEngine:

| Tecnologia | Uso | Versao |
|-----------|-----|--------|
| React | Framework UI | 19 |
| TypeScript | Linguagem | 5.9 |
| Vite | Build tool | 7 |
| Tailwind CSS | Estilizacao | 4 |
| shadcn/ui | Componentes | latest |
| Framer Motion | Animacoes | 12 |
| Monaco Editor | Editor de codigo | 0.55 |

### Build System
- **CMake 3.30+** — modern CMake, FetchContent, presets
- **Ninja** — build generator (Windows/Linux/macOS)
- **vcpkg** — gerenciamento de dependencias (opcional)

### Bibliotecas Principais
| Biblioteca | Uso | Tipo |
|-----------|-----|------|
| nlohmann/json 3.x | JSON parsing | Header-only |
| spdlog 1.x | Logging estruturado | Header-only |
| SQLite 3.x | Banco de dados local | Compilado |
| Catch2 3.x | Testes unitarios | Header-only |
| fmt 10.x | Formatacao de strings | Header-only |
| range-v3 | Range algorithms (C++20) | Header-only |

### AI (futuro, modulos separados)
| Biblioteca | Uso |
|-----------|-----|
| whisper.cpp | Speech-to-text local |
| llama.cpp | LLM local (Ollama-compatible) |
| ggml | Tensor operations (ja incluso em whisper/llama.cpp) |

### Ferramentas de Desenvolvimento
| Ferramenta | Uso |
|-----------|-----|
| Qt Creator | IDE para QML/C++ |
| Visual Studio 2022 | Alternativa Windows |
| CMake Presets | Build configurations |
| Clang-Format | Formatacao de codigo |
| Clang-Tidy | Analise estatica |
| Valgrind / DrMemory | Deteccao de leaks |

## Por que nao...

- **Electron:** Binario enorme (+150MB), WebView, menos performance
- **Flutter Desktop:** Imaturo,生态 pequeno para integracao sistema
- **C++ puro + WebView:** Duas linguagens, IPC overhead
- **Rust + Qt:** Possivel (CXX-Qt) mas complexo, ecossistema Qt em C++ e mais maduro
- **C++ + wxWidgets:** UI menos moderna, sem QML
- **C++ + Dear ImGui:** So para ferramentas dev, nao para app de usuario final
