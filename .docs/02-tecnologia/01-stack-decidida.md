# Stack Tecnologica

## Stack Atual (Junho/2026)

| Camada | Tecnologia | Versão | Função |
|--------|-----------|--------|--------|
| Desktop Framework | pywebview | 5.x | WebView2 window, Python↔JS bridge |
| Linguagem Backend | Python | 3.14 | Todo o backend |
| HTTP Client | httpx | 0.28+ | Chamadas REST (Ollama, APIs) |
| Criptografia | cryptography | 44+ | API key storage |
| Terminal PTY | subprocess + pyte | — | Emulação de terminal |
| Plugin Loader | importlib | — | Descoberta e carga de módulos Python |
| UI Web | React + TypeScript | 19 + 5.9 | Interface completa |
| Build Web | Vite | 7 | Bundle da UI |
| Estilos | Tailwind CSS + Radix UI | 4 | Design system |
| Animações | Framer Motion | 12 | Transições de painéis |
| Editor Código | Monaco Editor | 0.55 | Editor profissional |
| Terminal UI | xterm.js | 5.x | Terminal integrado |
| Bridge | pywebview js_api | 5.x | JSON-RPC nativo |
| Banco | SQLite3 (nativo) | 3.x | Persistência local |
| Build Python | pip + setuptools | — | Instalação do backend |
| Testes Python | pytest | 8.x | 260+ testes unitários/integração |
| Testes Web | Vitest | 4.x | 145 testes React |

## Por que Python + pywebview em vez de C++ + Qt?

| Aspecto | Qt C++ | Python + pywebview |
|---------|--------|-------------------|
| Desenvolvimento | Lento (compilação) | Rápido (interpretado) |
| Bridge | QWebChannel complexo | pywebview js_api nativo |
| Dependências | CMake, Qt SDK | pip install |
| Testes | Catch2 (compilação lenta) | pytest (instantâneo) |
| Curva aprendizado | Alta | Baixa |
| Performance | Nativa | Adequada para UI |
| Tamanho instalação | ~200MB | ~50MB |
| Manutenção | Complexa | Simples |

## Versões Específicas (pyproject.toml)

```toml
[project]
dependencies = [
    "pywebview>=5,<6",
    "httpx>=0.28,<1",
    "websockets>=14,<15",
    "cryptography>=44,<45",
    "pyte>=0.8,<0.9",
    "ruamel.yaml>=0.18,<0.19",
]
[project.optional-dependencies]
dev = ["pytest>=8,<9", "pytest-cov>=6,<7", "ruff>=0.9,<1"]
```
