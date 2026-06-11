# Contexto: Estrutura do Novo Projeto

**Timestamp:** 2026-06-03T10:55:00-03:00
**Status:** active
**Supersedes:** —
**Superseded by:** —

## Decisao

Criada a estrutura inicial do novo projeto JARVIS em C++ com Qt 6:

### Estrutura criada

```
/
├── CMakeLists.txt              # Root CMake
├── CMakePresets.json           # Build presets (default, debug, release)
├── .gitignore                  # C++/Qt rules
├── context/                    # Sistema de contexto
│   ├── INDEX.md               # Indice central
│   └── YYYY-MM-DD-NNN-*.md   # Contextos individuais
├── docs/                       # Documentacao completa
│   ├── README.md
│   ├── 01-arquitetura/        # 3 docs
│   ├── 02-tecnologia/         # 4 docs
│   ├── 03-interface/          # 1 doc
│   ├── 04-modulos/            # 10 docs (indice + 9 modulos)
│   ├── 05-funcional/          # 1 doc
│   └── 06-decisoes/adr/       # 1 ADR
├── kernel/                     # Kernel executavel
│   ├── CMakeLists.txt
│   ├── include/jarvis/api/    # ABI publica (module_api.h)
│   ├── include/jarvis/core/   # Kernel interno
│   ├── src/                    # main.cpp, module_loader, service_locator, permission_manager
│   ├── tests/                  # Testes unitarios (Catch2)
│   └── resources/              # QRC + QML
├── modules/                    # Modulos (cada um e uma .dll)
│   └── conhecimento.json      # Exemplo de manifesto
├── libs/                       # Bibliotecas compartilhadas
├── tests/                      # Testes de integracao
└── resources/                  # Recursos globais
```

### Documentacao criada (17 arquivos)

| Pasta | Arquivos |
|-------|----------|
| 01-arquitetura | visao-geral, sistema-modulos, fluxo-comunicacao |
| 02-tecnologia | stack-decidida, cpp-convencoes, qt-framework, banco-dados |
| 03-interface | principios-ux |
| 04-modulos | indice, kernel, ide, ai-engine, conhecimento, automacao, voz, workspace, seguranca, plugins |
| 05-funcional | casos-de-uso |
| 06-decisoes | ADR 001 (migrar para C++ + Qt) |

### Codigo fonte criado (7 arquivos)

| Arquivo | Descricao |
|---------|-----------|
| kernel/include/jarvis/api/module_api.h | ABI publica (C-linkage para modulos .dll) |
| kernel/include/jarvis/core/service_locator.h | Service Locator header |
| kernel/include/jarvis/core/module_loader.h | Module Loader header |
| kernel/include/jarvis/core/permission_manager.h | Permission Manager header |
| kernel/src/main.cpp | Entry point com init Qt + module loader |
| kernel/src/module_loader.cpp | Implementacao do loader (.dll discovery, load, init, shutdown) |
| kernel/src/service_locator.cpp | Implementacao do Service Locator |
| kernel/src/permission_manager.cpp | Implementacao do Permission Manager |
| kernel/resources/qml/main.qml | UI principal em QML |
| kernel/resources/jarvis.qrc | Qt Resource file |
| kernel/tests/test_service_locator.cpp | Testes do Service Locator |
| kernel/tests/test_module_loader.cpp | Testes da API de modulos |

### .old contem

Todo o projeto anterior: ~8.300 linhas entre TypeScript, Rust, React, Tauri, docs, tarefas, recomendacoes. Mantido para referencia.
