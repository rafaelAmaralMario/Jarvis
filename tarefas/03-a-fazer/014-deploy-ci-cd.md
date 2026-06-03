# 014 — CI/CD & Deploy

## Metadados
- **Status:** ⬜ A Fazer
- **Prioridade:** 🟢 Baixa
- **Dependências:** 002 (Estrutura C++ Kernel), 003 (UI React Base), 005 (Models & Agents C++), 008 (Módulo Conhecimento)

## Descrição
Implementar pipeline de CI/CD com GitHub Actions para build automatizado,
testes, lint, e deploy. Inclui builds para Windows, Linux e futuro macOS.

## Especificação Técnica

### Arquivos
```
.github/workflows/
├── ci.yml                     ← Build + test (push/PR)
├── release.yml                ← Build release artifacts
├── docker-sync.yml            ← Sync server deploy
└── lint.yml                   ← Lint + format check
```

### Workflow CI (ci.yml)
```yaml
name: CI
on: [push, pull_request]

jobs:
  build-cpp:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - name: Install Qt (Linux)
        run: sudo apt install qt6-base-dev qt6-webengine-dev
      - name: Configure CMake
        run: cmake --preset default
      - name: Build
        run: cmake --build build/default
      - name: Test
        run: ctest --preset default

  build-ui:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Install & Build
        run: |
          cd ui
          npm ci
          npm run build
      - name: Lint
        run: cd ui && npm run lint
      - name: Test
        run: cd ui && npx vitest run

  docker-sync:
    steps:
      - name: Build sync server image
        run: docker build -t jarvis-sync ./server
```

### Lint
- C++: clang-tidy + clang-format
- React: ESLint + Prettier
- Script: `.github/scripts/run-lint.sh`

## Critérios de Aceitação
- [ ] CI roda em push e PR
- [ ] Build C++ em Ubuntu e Windows
- [ ] Build React com lint + test
- [ ] Release workflow gera .exe/.AppImage
- [ ] Docker build do sync server
- [ ] Badge de status no README

---

## Test Cases

### TC-001: CI pipeline completa
- **Pré-condições:** Push para main
- **Passos:**
  1. `git push origin main`
  2. Abrir GitHub Actions
- **Resultado esperado:** Pipeline CI roda, todos os jobs passam (green)
- **Cobertura:** normal

### TC-002: PR trigger
- **Pré-condições:** PR aberto
- **Passos:**
  1. Abrir PR contra main
- **Resultado esperado:** CI roda, status reportado no PR
- **Cobertura:** normal

### TC-003: Build C++ Ubuntu
- **Pré-condições:** Workflow CI configurado
- **Passos:**
  1. Job build-cpp matrix ubuntu-latest executa
- **Resultado esperado:** CMake configure + build + test passam
- **Cobertura:** normal

### TC-004: Build C++ Windows
- **Pré-condições:** Workflow CI configurado
- **Passos:**
  1. Job build-cpp matrix windows-latest executa
- **Resultado esperado:** CMake configure + build + test passam
- **Cobertura:** normal

### TC-005: Build React
- **Pré-condições:** Workflow CI configurado
- **Passos:**
  1. Job build-ui executa
- **Resultado esperado:** npm ci + build + lint + test passam
- **Cobertura:** normal

### TC-006: Docker build sync server
- **Pré-condições:** Workflow CI configurado
- **Passos:**
  1. Job docker-sync executa
- **Resultado esperado:** Docker image criada sem erro
- **Cobertura:** normal

### TC-007: Lint C++ falha em código ruim
- **Pré-condições:** Arquivo com erro de estilo
- **Passos:**
  1. Fazer commit com formatação incorreta
- **Resultado esperado:** clang-tidy ou clang-format falha
- **Cobertura:** erro

### TC-008: Lint React falha em código ruim
- **Pré-condições:** Componente com erro ESLint
- **Passos:**
  1. Fazer commit com variável não usada
- **Resultado esperado:** ESLint falha
- **Cobertura:** erro

### TC-009: Release workflow gera artifact
- **Pré-condições:** Tag de release criada (v0.1.0)
- **Passos:**
  1. `git tag v0.1.0 && git push --tags`
- **Resultado esperado:** Release workflow roda, artifact .zip/.exe gerado
- **Cobertura:** normal

### TC-010: Badge no README
- **Pré-condições:** CI configurado
- **Passos:**
  1. Abrir README.md
  2. Verificar badge "CI: passing"
- **Resultado esperado:** Badge visível com status atual
- **Cobertura:** normal

### TC-011: Build falha notifica
- **Pré-condições:** CI configurado com notificações
- **Passos:**
  1. Fazer commit que quebra build
- **Resultado esperado:** Notificação enviada (email/slack/discord)
- **Cobertura:** normal | borda

### TC-012: Cache de dependências
- **Pré-condisções:** Workflow CI configurado
- **Passos:**
  1. Executar CI duas vezes
  2. Verificar segunda execução usa cache (npm, CMake)
- **Resultado esperado:** Segunda execução mais rápida (cache hit)
- **Cobertura:** performance
