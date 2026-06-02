# Desenvolvimento Local - JARVIS

Status: inicial

## Requisitos

- Node.js 20+
- npm 11+
- Rust 1.95+
- Visual Studio Build Tools ou Visual Studio Community com MSVC
- WebView2 Runtime
- Git
- GitHub CLI para operacoes de issues e projetos

## Instalar Dependencias

```powershell
npm install
```

## Rodar Frontend no Navegador

```powershell
npm run dev
```

URL padrao:

```text
http://127.0.0.1:1420
```

## Rodar App Desktop

```powershell
npm run tauri -- dev
```

## Build Frontend

```powershell
npm run build
```

## Build Desktop

```powershell
npm run tauri -- build
```

## Validacoes Recomendadas

```powershell
npm audit
npm run build
cargo check
npm run tauri -- info
```

Para `cargo check`, use:

```powershell
cd src-tauri
cargo check
cd ..
```

## Estrutura Principal

- `src/ui`: telas e componentes.
- `src/application`: casos de uso e servicos de aplicacao.
- `src/domain`: contratos e tipos centrais.
- `src/infrastructure`: adaptadores concretos.
- `src/agents`: agentes e ferramentas.
- `src/plugins`: plugins e manifestos.
- `src-tauri/src`: comandos e servicos Rust.

## Observacoes

- `dist/`, `node_modules/` e `src-tauri/target/` nao devem ser versionados.
- `Cargo.lock` e `package-lock.json` devem ser versionados.
- Secrets devem ficar fora do repositorio.
- Acoes sensiveis devem passar por permissao e log.

