# Tarefa: LSP Client (Language Server Protocol)

**Epico:** 10 — LSP e IntelliSense  
**Prioridade:** 🟡 Media  
**Estimativa:** 4-8 semanas  
**Dependencias:** Nenhuma (pode comecar independente)

## Objetivo

Implementar um cliente LSP (Language Server Protocol) no JARVIS para obter IntelliSense real: autocomplete, hover, go-to-definition, diagnostics, refactoring.

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| vscode-languageserver-protocol (npm) | Tipos e protocolo LSP |
| Monaco Editor API | Integracao de providers (completion, hover, definition) |
| Tauri command | Spawn de processo para language server |
| Rust `std::process` | Gerenciamento de processo filho |

## Como Fazer

### 1. Arquitetura

```
Monaco Editor (providers) <-> LSP Client (TS) <-> Tauri IPC <-> Language Server Process (ex: typescript-language-server)
```

### 2. LSP Client em TypeScript

```typescript
import { spawn } from '@tauri-apps/plugin-shell';
import {
  createProtocolConnection,
  StreamMessageReader,
  StreamMessageWriter,
} from 'vscode-languageserver-protocol';

class LspClient {
  private connection: ProtocolConnection;
  private capabilities: ServerCapabilities;

  async start(language: string, workspacePath: string) {
    const serverCmd = getServerCommand(language); // ex: 'typescript-language-server'
    const process = await spawn(serverCmd, ['--stdio']);

    const reader = new StreamMessageReader(process.stdout);
    const writer = new StreamMessageWriter(process.stdin);
    this.connection = createProtocolConnection(reader, writer);

    this.connection.listen();
    const result = await this.connection.initialize({
      processId: null,
      capabilities: {},
      workspaceFolders: [{ uri: `file://${workspacePath}`, name: 'workspace' }],
      rootUri: `file://${workspacePath}`,
    });
    this.capabilities = result.capabilities;
  }

  async getCompletion(documentUri: string, position: Position) {
    return this.connection.sendRequest('textDocument/completion', {
      textDocument: { uri: documentUri },
      position,
    });
  }

  async getHover(documentUri: string, position: Position) {
    return this.connection.sendRequest('textDocument/hover', {
      textDocument: { uri: documentUri },
      position,
    });
  }

  async goToDefinition(documentUri: string, position: Position) {
    return this.connection.sendRequest('textDocument/definition', {
      textDocument: { uri: documentUri },
      position,
    });
  }

  async getDiagnostics(documentUri: string) {
    // diagnostics sao push do server -> { method: 'textDocument/publishDiagnostics', params }
    this.connection.onNotification('textDocument/publishDiagnostics', (params) => {
      // Atualizar problemas
    });
  }
}
```

### 3. Integrar com Monaco

```typescript
// Registrar completion provider para TypeScript
monaco.languages.registerCompletionItemProvider('typescript', {
  provideCompletionItems: async (model, position) => {
    const items = await lspClient.getCompletion(model.uri.toString(), position);
    return { suggestions: items.map(lspToMonacoCompletion) };
  },
});
```

### 4. Language Servers para iniciar

| Linguagem | Server | Comando npm |
|-----------|--------|-------------|
| TypeScript | typescript-language-server | `npm install -g typescript-language-server` |
| Rust | rust-analyzer | Ja incluido no Rust toolchain |
| JSON | vscode-json-languageservice | Built-in no Monaco |
| CSS | vscode-css-languageservice | Built-in no Monaco |

### 5. Mapeamento de linguagens

```typescript
const languageServerMap: Record<string, string> = {
  typescript: 'typescript-language-server',
  javascript: 'typescript-language-server',
  tsx: 'typescript-language-server',
  jsx: 'typescript-language-server',
  rust: 'rust-analyzer',
};
```

### 6. Lazy loading

Language server so e iniciado quando o usuario abre um arquivo da linguagem.

## Criterios de Pronto

- [ ] LSP Client implementado com protocolo completo (initialize, shutdown, textDocument/completion, hover, definition, references, publishDiagnostics)
- [ ] Autocomplete/IntelliSense funcionando para TypeScript
- [ ] Hover com tipos e documentacao
- [ ] Go-to-definition (F12) e Peek Definition
- [ ] Diagnostics (erros/warnings) exibidos no Monaco
- [ ] Problems Panel no Bottom Panel para erros agregados
- [ ] Suporte a TypeScript e JavaScript no minimo
- [ ] Language server iniciado sob demanda (lazy)
- [ ] Language server encerrado quando nao usado
- [ ] `npm run build` passa

## Referencias

- `docs/context/18-vscode-features.md#32-language-server-protocol-lsp` — LSP no VS Code
- `docs/context/18-vscode-features.md#212` — LSP no roadmap do JARVIS
- [LSP Specification](https://microsoft.github.io/language-server-protocol/)
