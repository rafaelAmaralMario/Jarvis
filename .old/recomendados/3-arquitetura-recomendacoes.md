# Recomendacoes de Arquitetura — JARVIS

## 1. Arquitetura Geral (Atual + Proposta)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + TS)                      │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Monaco   │ │ Chat     │ │ Automacao│ │ Terminal │ │ Painéis   │  │
│  │ Editor   │ │ Panel    │ │ Panel    │ │ (xterm)  │ │ (Git/etc) │  │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       │           │            │            │             │         │
│  ┌────┴───────────┴────────────┴────────────┴─────────────┴──────┐ │
│  │                    HOOKS (13 hooks React)                     │ │
│  └────┬───────────┬────────────┬────────────┬─────────────┬──────┘ │
│       │           │            │            │             │         │
│  ┌────┴───────────┴────────────┴────────────┴─────────────┴──────┐ │
│  │              APPLICATION SERVICES (8+ services)               │ │
│  └────┬───────────┬────────────┬────────────┬─────────────┬──────┘ │
└───────┼───────────┼────────────┼────────────┼─────────────┼────────┘
        │           │            │            │             │
  ┌─────┴─────┐ ┌──┴───┐ ┌─────┴─────┐ ┌────┴─────┐ ┌──────┴──────┐
  │ Tauri IPC │ │ HTTP │ │ WebSocket  │ │ Tauri    │ │ Tauri Plugin│
  │ (invoke)  │ │ REST │ │ (tempo     │ │ Events   │ │ Shell (pty) │
  │           │ │      │ │  real)     │ │          │ │             │
  └─────┬─────┘ └──┬───┘ └─────┬─────┘ └────┬─────┘ └──────┬──────┘
        │          │            │            │              │
┌───────┴──────────┴────────────┴────────────┴──────────────┴────────┐
│                     BACKEND RUST (Tauri)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Workspace │ │ Git      │ │Terminal  │ │Segurança  │ │Storage   │ │
│  │ CRUD/busca│ │diff/commi│ │pty proc  │ │permissoes│ │keyring   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │System    │ │Browser   │ │Perifericos│ │ Sidecar Manager     │ │
│  │Automacao │ │Control   │ │micro/webc│ │ (spawn/kill Python)  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┬───────────┘ │
└─────────────────────────────────────────────────────┼─────────────┘
                                                      │
              ┌───────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PYTHON SIDECAR (FastAPI)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Agentes   │ │Chat      │ │Busca     │ │Voz       │ │Browser   │ │
│  │LangGraph │ │Streaming │ │Semantica  │ │STT/TTS   │ │Playwright│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │Documentos│ │System    │ │Templates │ │ Embeddings + ChromaDB│ │
│  │PDF/DOCX  │ │PyAutoGUI │ │Jinja2    │ │                      │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Fluxo de Comunicacao

### Legenda de Caminhos
- **───>** IPC Tauri (invoke, rapido, seguro)
- **‑‑‑>** HTTP REST (para sidecar Python)
- **~~~>** WebSocket (tempo real, bidirecional)
- **- ->** Tauri Events (broadcast)

### Fluxos Especificos

```
[Usuario digita no chat]
    → Frontend: Hook useChat.sendMessage()
    → ChatService decide rota:
        ├── Se resposta rapida: Tauri invoke → Rust → modelo Ollama local
        └── Se agente complexo: HTTP ~~~> Python Sidecar → LangGraph → modelo

[Usuario fala no microfone]
    → Frontend: VoiceService.startListening()
    → Rust: Captura audio via CPAL/sidecar
    → Rust envia audio ~~~> Python Sidecar (whisper STT)
    → Python retorna texto transcrito ~~~> Frontend
    → Frontend envia texto para chat
    → Resposta chega, Frontend envia ~~~> Python (edge-tts TTS)
    → Rust reproduz audio

[Usuario: "Execute npm run build no terminal"]
    → Frontend: TerminalView.onData("npm run build\n")
    → Tauri invoke ~~~> Rust: TerminalSession.write()
    → Rust: PTY processa comando
    → Rust: Emite evento `terminal-output` com stdout/stderr
    → Frontend: xterm.js exibe saida em tempo real

[Usuario: "Acesse o site do banco e baixe o extrato"]
    → Agente solicita permissao [browser-control, file-download]
    → UI mostra banner de confirmacao
    → Usuario autoriza
    → Frontend ~~~> Python Sidecar (Playwright)
    → Python: Navega, faz login (com credenciais seguras do keyring)
    → Python: Baixa extrato, salva na pasta Downloads
    → Python retorna resultado ~~~> Frontend
    → Frontend notifica usuario com toast

[Usuario: "Compre 10 acoes da PETR4"]
    → Agente solicita permissao [automation-finance, browser-control, secrets]
    → UI mostra banner CRITICO com detalhes da operacao
    → Usuario precisa autorizar explicitamente
    → Python: Playwright acessa corretora via navegador
    → Python: Preenche login (credenciais seguras)
    → Python: Executa ordem de compra
    → Python retorna comprovante ~~~> Frontend
    → Auditoria registra operacao completa
```

## 3. Gerenciamento de Estado (Tempo Real)

### WebSocket Central

```
                    ┌─────────────────────┐
                    │  WebSocket Server   │
                    │  (Python Sidecar)   │
                    └──────────┬──────────┘
                               │ ws://localhost:8653/ws
              ┌────────────────┼─────────────────┐
              ▼                ▼                  ▼
        ┌──────────┐    ┌──────────┐    ┌──────────────┐
        │ Chat     │    │ Voice    │    │ Automation   │
        │ Streaming│    │ STT/TTS  │    │ Status       │
        └──────────┘    └──────────┘    └──────────────┘
```

### Zustand Store (Estado Global)

```typescript
// store/index.ts - Alternativa moderna aos hooks individuais
interface JarvisStore {
  // Workspace
  workspace: WorkspaceState;
  
  // Chat em tempo real
  chat: ChatState;
  voice: VoiceState;
  
  // Automacao
  automation: AutomationState;
  browser: BrowserState;
  
  // Sistema
  terminal: TerminalState;
  system: SystemState;
  
  // Permissoes
  permissions: PermissionState;
  
  // IA
  models: ModelState;
  agents: AgentState;
  
  // UI
  ui: UIState;
  notifications: Notification[];
}
```

## 4. Banco de Dados e Persistencia

| Tipo | Solucao | Uso |
|------|---------|-----|
| Configuracoes | localStorage (frontend) + secure-settings.json (Rust) | Settings do usuario |
| Chat historico | localStorage por workspace + SQLite (expansao futura) | Historico de conversas |
| Auditoria | localStorage por workspace | Logs de acoes sensiveis |
| Memoria | localStorage + ChromaDB (Python) | Memoria de curto/longo prazo |
| Indice semantico | ChromaDB (Python) | Embeddings + busca vetorial |
| Cache de modelos | RAM (Rust/Python) | Modelos carregados em memoria |
| Credenciais | Keyring (SO) + secure-settings (fallback) | API keys, tokens |
| Plugins locais | Filesystem (.jarvis/plugins/) | Manifests de plugins |

## 5. Estrutura de Pastas Recomendada (Expandida)

```
jarvis/
├── src/                     # Frontend TypeScript
│   ├── ui/
│   │   ├── components/      # 17+ componentes (expandir)
│   │   ├── hooks/            # 13+ hooks
│   │   ├── styles/           # CSS modular
│   │   └── store/            # Zustand store (NOVO)
│   ├── application/
│   │   └── services/         # 8+ services (expandir)
│   ├── domain/               # Tipos e contratos
│   ├── infrastructure/       # Tauri adapters + providers
│   ├── agents/               # Definicoes de agentes
│   ├── plugins/              # Manifests de plugins
│   └── shared/               # Utilitarios
│
├── src-tauri/                # Backend Rust
│   └── src/
│       ├── commands/         # Comandos Tauri
│       ├── workspace/        # CRUD arquivos
│       ├── git/              # Operacoes Git
│       ├── services/         # Ollama, notas
│       ├── terminal/         # PTY (NOVO)
│       ├── system/           # Automacao sistema (NOVO)
│       ├── browser/          # Controle navegador (NOVO)
│       ├── peripheral/       # Microfone, webcam (NOVO)
│       ├── security/         # Permissoes
│       └── storage/          # Keyring/secrets
│
├── sidecar/                  # Python Sidecar (NOVO)
│   ├── main.py               # FastAPI entrypoint
│   ├── api/
│   │   ├── agent.py          # LangGraph agents
│   │   ├── chat.py           # Chat streaming
│   │   ├── embeddings.py     # ChromaDB busca
│   │   ├── browser.py        # Playwright automacao
│   │   ├── voice.py          # STT/TTS
│   │   └── system.py         # PyAutoGUI
│   ├── core/
│   │   ├── agent_engine.py   # Orquestracao de agentes
│   │   └── tools/            # Ferramentas dos agentes
│   ├── models/               # Schemas Pydantic
│   └── requirements.txt
│
├── docs/                     # Documentacao (ja existe)
├── tarefas/                  # Tarefas organizadas (NOVO)
├── recomendados/             # Recomendacoes tecnicas (NOVO)
└── scripts/                  # Scripts de automacao
```

## 6. Decisoes Arquiteturais Chave

| Decisao | Opcao Escolhida | Alternativa | Motivo |
|---------|----------------|-------------|--------|
| Desktop framework | **Tauri 2** | Electron | 10x menor, Rust safety |
| Frontend state | **Zustand + Immer** | Redux, Context | Simples, performatico, TS-first |
| IA pesada | **Python Sidecar** | Rust puro, TS puro | Ecossistema LangChain insuperavel |
| Comunicacao sidecar | **HTTP + WebSocket** | IPC Tauri stdin/stdout | Streaming bidirecional mais facil |
| Banco vetorial | **ChromaDB** | Pinecone, Qdrant | Local, gratis, open-source |
| Terminal | **xterm.js + portable-pty** | WebSocket pty | Maduro, testado em VS Code |
| Automacao web | **Playwright (Python)** | Puppeteer (JS), Selenium | Mais moderno, async, rapido |
| STT | **whisper (local)** | Google STT API, Azure | Gratuito, roda local, privado |
| TTS | **edge-tts** | pyttsx3, ElevenLabs | Gratuito, vozes naturais, offline |
| Credenciais | **keyring (Rust)** | Stronghold, JSON cripto | Nativo do SO, seguro |
