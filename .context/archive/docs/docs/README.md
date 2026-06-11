# Documentacao do Projeto JARVIS

Bem-vindo a documentacao do JARVIS — um assistente de IA completo e modular construido em C++ com Qt 6.

## Estrutura

```
docs/
├── README.md                          # Este arquivo
├── 01-arquitetura/                    # Decisoes de arquitetura
│   ├── 01-visao-geral.md             # Visao geral do sistema
│   ├── 02-sistema-modulos.md          # Sistema de modulos (.dll)
│   └── 03-fluxo-comunicacao.md        # IPC e comunicacao entre modulos
├── 02-tecnologia/                     # Stack tecnologica
│   ├── 01-stack-decidida.md           # Stack escolhida e justificativas
│   ├── 02-cpp-convencoes.md           # Convencoes C++ do projeto
│   ├── 03-qt-framework.md             # Uso do Qt (QML, Widgets, modulos)
│   └── 04-banco-dados.md              # SQLite e persistencia local
├── 03-interface/                      # Interface do usuario
│   ├── 01-principios-ux.md            # Principios de UX
│   ├── 02-layout-principal.md         # Layout da janela principal
│   └── 03-temas-identidade.md         # Temas e identidade visual
├── 04-modulos/                        # Especificacao dos modulos
│   ├── 00-indice-modulos.md           # Indice de todos os modulos
│   ├── 01-kernel.md                   # Kernel — module loader, lifecycle
│   ├── 02-ide.md                      # IDE — editor, git, terminal
│   ├── 03-ai-engine.md               # AI Engine — LLM, agentes
│   ├── 04-conhecimento.md            # Conhecimento — "cerebro" (Obsidian-like)
│   ├── 05-automacao.md               # Automacao — browser, desktop
│   ├── 06-voz.md                      # Voz — STT, TTS
│   ├── 07-perifericos.md             # Perifericos — mic, webcam
│   ├── 08-workspace.md               # Workspace — sistema de arquivos
│   ├── 09-rede.md                     # Rede — HTTP, WebSocket, OAuth
│   ├── 10-seguranca.md               # Seguranca — permissoes, criptografia
│   └── 11-plugins.md                  # Plugins — API publica para terceiros
├── 05-funcional/                      # Documentacao funcional
│   ├── 01-casos-de-uso.md            # Casos de uso do sistema
│   └── 02-fluxos-usuario.md           # Fluxos de interacao do usuario
└── 06-decisoes/                       # Decisoes arquiteturais (ADRs)
    └── adr/
        └── 001-migrar-cpp-qt.md       # ADR 001: Migrar para C++ + Qt
```

## Modulos Planejados

| # | Modulo | Prioridade | Depende de |
|---|--------|-----------|------------|
| 1 | Kernel | 🔴 Alta | — |
| 2 | Conhecimento | 🔴 Alta | Kernel |
| 3 | Workspace | 🔴 Alta | Kernel |
| 4 | AI Engine | 🔴 Alta | Kernel, Conhecimento |
| 5 | IDE | 🟡 Media | Kernel, Workspace |
| 6 | Seguranca | 🟡 Media | Kernel |
| 7 | Rede | 🟡 Media | Kernel, Seguranca |
| 8 | Plugins | 🟢 Baixa | Kernel, Seguranca |
| 9 | Voz | 🟢 Baixa | Kernel, AI Engine |
| 10 | Automacao | 🟢 Baixa | Kernel, AI Engine |
| 11 | Perifericos | 🟢 Baixa | Kernel, Seguranca |

## Stack Tecnologica

| Componente | Tecnologia | Versao |
|------------|-----------|--------|
| Linguagem | C++ | 20 |
| Desktop | Qt | 6.8+ (LGPL) |
| Build | CMake | 3.30+ |
| Banco | SQLite | 3.x |
| JSON | nlohmann/json | 3.x |
| Log | spdlog | 1.x |
| Testes | Catch2 / Qt Test | — |
| STT | whisper.cpp | futuro |
| LLM | llama.cpp | futuro |
