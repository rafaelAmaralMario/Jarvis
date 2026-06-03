# Contexto: UI Hibrida — C++ Kernel + React (WebEngine)

**Timestamp:** 2026-06-03T11:05:00-03:00
**Status:** active
**Supersedes:** 001 (fundacao), 002 (estrutura inicial)
**Superseded by:** —

## Decisao

Adotar arquitetura hibrida para o JARVIS:

| Camada | Tecnologia | Funcao |
|--------|-----------|--------|
| UI | React 19 + TypeScript + Tailwind + shadcn/ui + Framer Motion | Interface moderna com animacoes GPU |
| Editor | Monaco Editor | Editor de codigo profissional |
| Bridge | Qt WebChannel (JSON-RPC) | Comunicacao React ↔ C++ |
| Navegador | Qt WebEngine (Chromium) | Renderiza a UI web |
| Backend Nativo | C++20 + Qt 6 | Module loader, AI, FS, Git, SQLite |

## Por que WebEngine + React em vez de QML puro?

| Aspecto | QML puro | WebEngine + React |
|---------|----------|-------------------|
| Componentes prontos | Qt Quick Controls | shadcn/ui + milhares no npm |
| Animacoes | PropertyAnimation (procedural) | Framer Motion (declarativo) |
| Editor de codigo | Nao existe nativo | Monaco Editor |
| Ecossistema | Pequeno | Gigante |
| Curva de aprendizado | Alta (linguagem nova) | Baixa (ja conhecido) |
| Performance UI | Nativa (GPU) | Chrome V8 (GPU composta) |
| Tamanho binario | ~30MB | ~80MB (+ Chromium) |

## Estrutura de Pastas

```
/
├── kernel/                # C++ Qt (executavel)
│   ├── CMakeLists.txt
│   ├── include/jarvis/
│   │   ├── api/           # ABI dos modulos (.dll)
│   │   ├── core/          # Module loader, service locator
│   │   └── bridge/        # WebChannel bridge
│   ├── src/
│   │   ├── main.cpp       # QApplication + WebEngine + Bridge
│   │   ├── module_loader.cpp
│   │   ├── ...
│   │   └── bridge/
│   │       └── web_channel.cpp
│   └── resources/
│       └── webui/         # React build output (Vite)
│
├── ui/                    # React source
│   ├── package.json
│   ├── vite.config.ts     # Build output → kernel/resources/webui/
│   ├── tailwind.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/    # ActivityBar, Sidebar, AiPanel, StatusBar
│       ├── hooks/         # use-jarvis.ts (bridge hook)
│       ├── lib/           # utils.ts (cn helper)
│       ├── types/         # Bridge types
│       └── styles/        # globals.css (Tailwind)
│
├── modules/               # .dll/.so modules
├── docs/
├── context/
└── .old/                  # Projeto anterior
```

## Comunicacao React ↔ C++

React envia JSON-RPC via WebChannel:

```
React: bridge.sendMessage("hello") 
  → QWebChannel serializes to JSON
  → BridgeHandler::handleMessage(json)
  → Handler registrado para "sendMessage"
  → C++ processa e retorna resultado
  → JSON response volta pro React
  → Promise resolve com o resultado
```

Eventos C++ → React:

```
C++: bridge.emitEvent("file-changed", {path: "/x"})
  → BridgeHandler::eventEmitted signal
  → runJavaScript("window.jarvisBridge.onMessage(...)")
  → React hook useBridgeEvent("file-changed", handler)
```

## Fluxo de Build

1. `cd ui && npm install && npm run build` → `kernel/resources/webui/`
2. `cmake --build build/default` → compila C++ com webui embarcado
3. Executavel `jarvis.exe` abre janela com WebEngine carregando webui

## Arquivos Criados (nesta sessao)

### UI React (8 arquivos)
- `ui/package.json` — dependencias (React, Tailwind, shadcn/ui, Framer Motion)
- `ui/vite.config.ts` — build output para kernel/resources/webui/
- `ui/tsconfig.json` — TypeScript strict
- `ui/tailwind.config.ts` — Tema dark, animacoes, cores CSS variables
- `ui/postcss.config.js` — PostCSS + Tailwind
- `ui/index.html` — HTML shell com qwebchannel.js
- `ui/src/main.tsx` — Entry point React
- `ui/src/App.tsx` — Layout principal com motion
- `ui/src/styles/globals.css` — Tailwind + CSS variables + scrollbar
- `ui/src/lib/utils.ts` — cn() helper (clsx + tailwind-merge)
- `ui/src/types/index.ts` — Bridge types
- `ui/src/hooks/use-jarvis.ts` — Bridge hook (JSON-RPC sobre WebChannel)
- `ui/src/components/ActivityBar.tsx` — Sidebar animada com icones
- `ui/src/components/Sidebar.tsx` — Painel lateral contextual
- `ui/src/components/MainArea.tsx` — Area central com animacao
- `ui/src/components/AiPanel.tsx` — Chat IA com AnimatePresence
- `ui/src/components/StatusBar.tsx` — Status bar com pulsar

### Bridge C++ (2 arquivos)
- `kernel/include/jarvis/bridge/web_channel.h` — BridgeHandler + WebEngineBridge
- `kernel/src/bridge/web_channel.cpp` — Implementacao JSON-RPC

### Kernel atualizado (2 arquivos)
- `kernel/CMakeLists.txt` — WebEngine + WebChannel + Copy webui
- `kernel/src/main.cpp` — QApplication + WebEngine + Bridge handlers

### Root (1 arquivo)
- `CMakeLists.txt` — Adicionado webui custom target (npm build)

### Documentacao atualizada
- `docs/01-arquitetura/01-visao-geral.md` — Camada WebEngine + React
- `docs/02-tecnologia/01-stack-decidida.md` — WebEngine + React na stack

## Proximos Passos

1. Instalar Qt 6.8+ com WebEngine
2. `cd ui && npm install && npm run build`
3. `cmake --preset default` && `cmake --build build/default`
4. Implementar modulo Conhecimento (feature principal)
5. Implementar modulo Workspace (dependencia)
