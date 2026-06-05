# .docs — Documentacao do JARVIS

> Este diretorio espelha a documentacao atualizada do projeto JARVIS.
> Diferente de `docs/` (documentacao historica), o `.docs/` e mantido em sincronia com o estado real do codigo.

## Estrutura

```
.docs/
├── README.md                         # Este arquivo
├── 01-arquitetura/                   # Decisoes arquiteturais
│   ├── 01-visao-geral.md            # Visao geral da arquitetura
│   ├── 02-sistema-modulos.md        # Sistema de modulos
│   ├── 03-bridge-protocolo.md       # Protocolo de comunicacao React↔C++
│   └── 04-inicializacao.md          # Fluxo de inicializacao
├── 02-tecnologia/                    # Stack e convencoes
│   ├── 01-stack-decidida.md         # Stack tecnologica
│   ├── 02-banco-dados.md            # Banco SQLite
│   ├── 03-build-deploy.md           # Sistema de build
│   ├── 04-convencoes-cpp.md         # Convencoes C++
│   └── 05-convencoes-react.md       # Convencoes React
├── 03-interface/                     # Bridge e UX
│   ├── 01-paineis-ux.md             # Paineis da interface
│   └── 02-bridge-api.md             # API completa do bridge
├── 04-funcionalidades/               # Features implementadas
│   ├── 01-kernel.md                 # Kernel / Core
│   ├── 02-ia-agentes.md             # AI, Modelos, Agentes, Orquestracao
│   ├── 03-conhecimento.md           # Modulo Conhecimento
│   ├── 04-workspace.md              # Gerenciamento de projetos
│   ├── 05-editor.md                 # Editor Monaco
│   ├── 06-terminal.md               # Terminal integrado
│   ├── 07-rede-oauth.md             # Rede e OAuth
│   ├── 08-git.md                    # Integracao Git
│   └── 09-persistencia.md           # Persistencia SQLite
└── 05-futuras/                       # Propostas de expansao
    ├── 01-multi-llm-gateway.md      # Gateway multi-provedor LLM
    ├── 02-plugin-marketplace.md     # Marketplace de plugins
    ├── 03-remote-development.md     # Desenvolvimento remoto
    ├── 04-voice-interface.md        # Interface de voz
    ├── 05-real-time-collaboration.md# Colaboracao em tempo real
    ├── 06-ai-workflow-automation.md # Automacao de workflows
    ├── 07-knowledge-graph-viz.md    # Visualizacao de grafos
    ├── 08-mobile-companion.md       # App mobile companheiro
    ├── 09-code-review-ci.md         # Revisao de codigo e CI
    ├── 10-browser-extension.md      # Extensao de navegador
    ├── 11-ai-pair-programming.md    # Programacao em par com IA
    ├── 12-import-bridge.md          # Ponte de importacao
    ├── 13-mcp-server-integration.md # Integracao MCP
    ├── 14-desktop-automation.md     # Automacao de desktop
    └── 15-comunidade-modos.md       # Modos de uso e comunidade
```
