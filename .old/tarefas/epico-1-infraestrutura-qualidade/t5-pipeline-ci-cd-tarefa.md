# Tarefa: Pipeline CI/CD

**Epico:** 1 — Infraestrutura e Qualidade  
**Prioridade:** 🟡 Media  
**Estimativa:** 1 semana  
**Dependencias:** T1, T2 (testes implementados)

## Objetivo

Criar pipeline de CI/CD com GitHub Actions para automatizar build, lint, testes e release.

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| GitHub Actions | Pipeline CI/CD |
| actions/checkout@v4 | Checkout do repositorio |
| actions/setup-node@v4 | Setup Node.js |
| dtolnay/rust-toolchain | Setup Rust |
| taiki-e/install-action@v2 | Instalar Tauri CLI |

## Como Fazer

### 1. Criar `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: dtolnay/rust-toolchain@stable
      - run: npm ci
      - run: npm run build  # TypeScript check + Vite build
      - run: npm test       # Vitest
      - run: cd src-tauri && cargo check  # Rust check
      - run: cd src-tauri && cargo test   # Rust tests
      - run: cd src-tauri && cargo clippy # Rust lint
```

### 2. Criar `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: dtolnay/rust-toolchain@stable
      - run: npm ci
      - run: npm run tauri build
      - uses: softprops/action-gh-release@v2
        with:
          files: src-tauri/target/release/bundle/**/*
```

### 3. Configurar badges no README

```markdown
[![CI](https://github.com/user/jarvis/actions/workflows/ci.yml/badge.svg)](https://github.com/user/jarvis/actions/workflows/ci.yml)
```

## Criterios de Pronto

- [ ] CI executa `npm run build` em todo PR
- [ ] CI executa `npm test` e `cargo test`
- [ ] CI executa `cargo check` e `cargo clippy`
- [ ] Release workflow gera artefatos para Windows, macOS e Linux
- [ ] Badge de status no README
- [ ] Pipeline leva menos de 10 minutos

## Referencias

- `docs/desenvolvimento-local.md` — Setup de desenvolvimento
- `docs/distribuicao.md` — Build e distribuicao
