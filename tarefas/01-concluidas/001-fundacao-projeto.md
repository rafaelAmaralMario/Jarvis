# 001 — Fundação do Projeto

## Metadados
- **Status:** ✅ Concluída
- **Prioridade:** 🔴 Alta
- **Dependências:** Nenhuma

## Descrição
Criar a estrutura inicial do projeto JARVIS: documentação, ADRs, convenções,
pastas, e configurações de ambiente. Estabelecer a base arquitetural para todos
os módulos seguintes.

## Especificação Técnica

### Arquivos Criados
```
docs/
├── 01-arquitetura/
│   ├── visao-geral.md
│   ├── sistema-modulos.md
│   └── fluxo-comunicacao.md
├── 02-tecnologia/
│   ├── stack-decidida.md
│   ├── cpp-convencoes.md
│   ├── qt-framework.md
│   └── banco-dados.md
├── 03-interface/
│   └── principios-ux.md
├── 04-modulos/
│   ├── 00-catalogo-completo-solid.md
│   ├── indice.md
│   ├── kernel.md
│   ├── conhecimento.md
│   ├── ide.md
│   ├── ai-engine.md
│   ├── automacao.md
│   ├── voz.md
│   ├── workspace.md
│   ├── seguranca.md
│   └── plugins.md
├── 05-funcional/
│   └── casos-de-uso.md
└── 06-decisoes/adr/
    └── 001-migrar-cpp-qt.md
.context/
├── INDEX.md
├── TEMPLATE.md
├── CONTEXTO-COMPLETO.md
└── contextos/ (001 a 005)
.agents/skills/ (40 skills)
.gitignore
CMakeLists.txt (root)
CMakePresets.json
```

### Decisões Arquiteturais
- Stack: C++20 + Qt 6.8+ WebEngine + React 19 (híbrido)
- 5 camadas: L0 Kernel → L1 Infra → L2 Domínio → L3 Apresentação → L4 Extensão
- Módulos como .dll/.so carregados em runtime
- SQLite como banco local único
- Projeto anterior (Tauri+Rust) movido para `.old/`

## Critérios de Aceitação
- [x] Docs organizados em 6 seções com índice
- [x] ADR documentando decisão de migração
- [x] Catálogo SOLID com 14 módulos em 5 camadas
- [x] 40 skills em `.agents/skills/`
- [x] Sistema de contexto com 5 contextos registrados
- [x] `.gitignore` configurado
- [x] `CMakePresets.json` com 3 presets

---

## Test Cases

### TC-001: Estrutura de diretórios completa
- **Pré-condições:** Repositório clonado
- **Passos:**
  1. Executar `ls docs/` e verificar 6 pastas
  2. Executar `ls .agents/skills/` e verificar 40+ skills
  3. Executar `ls .context/` e verificar INDEX.md + TEMPLATE.md
- **Resultado esperado:** Todas as pastas e arquivos existem
- **Cobertura:** normal

### TC-002: ADR documentado
- **Pré-condições:** Nenhuma
- **Passos:**
  1. Abrir `docs/06-decisoes/adr/001-migrar-cpp-qt.md`
  2. Verificar que contém: contexto, decisão, consequências, status
- **Resultado esperado:** ADR completo e legível
- **Cobertura:** normal

### TC-003: Catálogo SOLID completo
- **Pré-condições:** Nenhuma
- **Passos:**
  1. Abrir `docs/04-modulos/00-catalogo-completo-solid.md`
  2. Verificar que lista 14 módulos com análise SOLID
  3. Verificar que cada módulo tem: nome, camada, descrição, SRP, OCP, LSP, ISP, DIP
- **Resultado esperado:** Catálogo completo com análise SOLID por módulo
- **Cobertura:** normal

### TC-004: Sistema de contexto funcional
- **Pré-condições:** Nenhuma
- **Passos:**
  1. Abrir `.context/INDEX.md`
  2. Verificar que contém tabela com ID, timestamp, status
  3. Verificar que existem 5 contextos registrados
  4. Verificar que cada contexto tem supersedes/superseded_by
- **Resultado esperado:** Contextos versionados e encadeados
- **Cobertura:** normal | borda (contexto sem supersedes)

### TC-005: CMakePresets configurados
- **Pré-condições:** CMake 3.30+
- **Passos:**
  1. Executar `cmake --list-presets` na raiz
  2. Verificar 3 presets: default, debug, release
- **Resultado esperado:** Presets listados sem erro
- **Cobertura:** normal

### TC-006: .gitignore cobre todos os padrões
- **Pré-condições:** Nenhuma
- **Passos:**
  1. Abrir `.gitignore`
  2. Verificar que contém: build/, *.o, *.dll, node_modules/, data/, *.db, .env
  3. Verificar que Docker files NÃO estão ignorados
- **Resultado esperado:** .gitignore completo
- **Cobertura:** normal
