# Stack Tecnológica Detalhada

## Frontend

| Tecnologia | Versão | Função |
|-----------|--------|--------|
| React | 19.2.1 | Framework UI |
| TypeScript | 5.9.3 | Linguagem |
| Vite | 7.2.4 | Build tool / dev server |
| Monaco Editor | 0.55.1 | Editor de código |
| @monaco-editor/react | 4.7.0 | Wrapper React para Monaco |
| Lucide React | 1.17.0 | Biblioteca de ícones |
| @tauri-apps/api | 2.11.0 | API de comunicação com Rust |
| @tauri-apps/plugin-dialog | 2.7.1 | Diálogos nativos |

## Backend (Rust)

| Tecnologia | Função |
|-----------|--------|
| Tauri 2.11.2 | Framework desktop |
| serde / serde_json | Serialização |
| cargo | Gerenciador de pacotes |
| Rust edition 2021 | Edição da linguagem |

## Dev Dependencies

| Tecnologia | Versão | Função |
|-----------|--------|--------|
| @tauri-apps/cli | 2.11.2 | CLI do Tauri |
| @vitejs/plugin-react | 5.1.1 | Plugin Vite para React |
| @types/react | 19.2.7 | Tipos React |
| @types/react-dom | 19.2.3 | Tipos ReactDOM |

## Scripts npm

```bash
npm run dev           # Inicia Vite (browser) em http://127.0.0.1:1420
npm run build         # TypeScript check + Vite build
npm run tauri -- dev  # Inicia app desktop Tauri em dev mode
npm run tauri -- build # Build produção
npm run tauri -- info # Diagnóstico Tauri
```

## Ferramentas de Qualidade

- **Prettier**: `.prettierrc.json` / `.prettierignore`
- **EditorConfig**: `.editorconfig`
- **rustfmt**: `rustfmt.toml`
- **TypeScript**: `tsconfig.json` / `tsconfig.node.json`
- **Git**: `.gitignore` / `.gitattributes`
