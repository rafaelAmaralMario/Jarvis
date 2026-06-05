# Stack Tecnologica

## Stack Atual (Junho/2026)

| Camada | Tecnologia | Versão | Função |
|--------|-----------|--------|--------|
| Desktop Framework | Qt | 6.8.0 (LGPL) | Janela principal, WebEngine, WebChannel, SQL, Network, WebSockets |
| Linguagem Nativa | C++ | 20 | Todo o backend |
| UI Web | React + TypeScript | 19 + 5.9 | Interface completa |
| Build Web | Vite | 7 | Bundle da UI |
| Estilos | Tailwind CSS + Radix UI | 4 | Design system |
| Animações | Framer Motion | 12 | Transições de painéis |
| Editor Código | Monaco Editor | 0.55 | Editor profissional |
| Terminal | xterm.js + QProcess | 5.x | Terminal integrado |
| Bridge | Qt WebChannel | 6.8 | JSON-RPC adaptado |
| Banco | SQLite (via Qt Sql) | 3.x | Persistência local |
| Build Nativo | CMake + Ninja | 3.30+ | Build do C++ |
| Testes C++ | Catch2 | 3.x | Testes unitários |
| Testes Web | Vitest | 4.x | Testes React |
| JSON | nlohmann_json | 3.11+ | Parsing JSON |

## Por que Qt WebEngine + React em vez de QML?

| Aspecto | QML puro | WebEngine + React |
|---------|----------|-------------------|
| Componentes prontos | Qt Quick Controls | shadcn/ui + npm |
| Animações | PropertyAnimation | Framer Motion |
| Editor código | Não existe nativo | Monaco Editor |
| Ecossistema | Pequeno | Gigante |
| Curva aprendizado | Alta | Baixa |
| Performance UI | Nativa | V8 composto |
| Tamanho binário | ~30MB | ~80MB |

## Versões Específicas (package.json)

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "~5.9.0",
  "vite": "^7.0.0",
  "tailwindcss": "^4.0.0",
  "@tailwindcss/vite": "^4.0.0",
  "@radix-ui/react-tabs": "^1.1.0",
  "@radix-ui/react-dialog": "^1.1.0",
  "@radix-ui/react-select": "^2.1.0",
  "@radix-ui/react-dropdown-menu": "^2.1.0",
  "@radix-ui/react-toggle": "^1.1.0",
  "@radix-ui/react-scroll-area": "^1.2.0",
  "@monaco-editor/react": "^4.7.0",
  "@xterm/xterm": "^5.5.0",
  "@xterm/addon-fit": "^0.10.0",
  "framer-motion": "^12.0.0",
  "lucide-react": "^0.400.0",
  "marked": "^15.0.0"
}
```
