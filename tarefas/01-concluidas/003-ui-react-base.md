# 003 — UI React Base

## Metadados
- **Status:** ✅ Concluída
- **Prioridade:** 🔴 Alta
- **Dependências:** 001 (Fundação do Projeto)

## Descrição
Implementar a interface React que roda dentro do QWebEngineView.
Inclui Vite 7, Tailwind CSS, shadcn/ui, Framer Motion, e os componentes
principais da shell: ActivityBar, Sidebar, MainArea, AiPanel, StatusBar.

## Especificação Técnica

### Stack
- React 19 + TypeScript
- Vite 7 (build tool)
- Tailwind CSS v4 + shadcn/ui
- Framer Motion (animações spring)
- Monaco Editor (planejado)

### Arquivos Criados
```
ui/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tailwind.config.ts
├── postcss.config.js
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx                    ← Layout principal
    ├── styles/globals.css         ← Tailwind base
    ├── lib/utils.ts              ← cn() helper
    ├── types/index.ts            ← Interfaces da bridge
    ├── hooks/use-jarvis.ts       ← Bridge hook (WebChannel JSON-RPC)
    └── components/
        ├── ActivityBar.tsx       ← Sidebar com ícones + layoutId
        ├── Sidebar.tsx           ← Painel lateral contextual
        ├── MainArea.tsx          ← Área principal com transições
        ├── AiPanel.tsx           ← Chat IA com AnimatePresence
        └── StatusBar.tsx         ← Barra de status com pulsar online
```

### Layout
```
┌────────────────────────────────────────────┐
│  ActivityBar │     MainArea      │ AiPanel │
│  (48px)      │    (flex-1)       │ (320px) │
│  ┌────────┐  │  ┌──────────────┐ │ ┌────┐ │
│  │ 🧠 IA  │  │  │              │ │ │Chat│ │
│  │ 📁 Conh │  │  │ Conteúdo    │ │ │    │ │
│  │ ⌨️ IDE │  │  │ principal    │ │ │    │ │
│  │ ⚡ Auto │  │  │              │ │ │    │ │
│  │ ⚙️ Conf│  │  └──────────────┘ │ └────┘ │
│  └────────┘  └───────────────────┴────────┘
├──────────────── StatusBar ─────────────────┤
│  Módulos: 3 ativos  ● Ollama online  v0.1.0│
└────────────────────────────────────────────┘
```

## Critérios de Aceitação
- [x] Vite + React + TypeScript compila sem erros
- [x] Tailwind + shadcn/ui funcionando com tema escuro
- [x] ActivityBar com 5 ícones e indicador animado (layoutId)
- [x] Sidebar contextual por view
- [x] MainArea com transições spring entre views
- [x] AiPanel com chat, mensagens animadas (AnimatePresence)
- [x] StatusBar com status pulsante
- [x] use-jarvis hook com fallback mock
- [x] Tipos da bridge definidos

---

## Test Cases

### TC-001: npm install sem erros
- **Pré-condições:** Node.js 20+, npm 10+
- **Passos:**
  1. `cd ui && npm install`
- **Resultado esperado:** Instalação completa sem warnings ou erros
- **Cobertura:** normal

### TC-002: npm run dev abre servidor
- **Pré-condições:** Dependências instaladas
- **Passos:**
  1. `cd ui && npm run dev`
  2. Abrir `http://localhost:5173`
- **Resultado esperado:** Página carrega com layout completo
- **Cobertura:** normal

### TC-003: npm run build gera bundle
- **Pré-condições:** Dependências instaladas
- **Passos:**
  1. `cd ui && npm run build`
- **Resultado esperado:** `dist/` gerado com index.html + assets
- **Cobertura:** normal

### TC-004: ActivityBar navega entre views
- **Pré-condições:** Servidor rodando
- **Passos:**
  1. Clicar em cada ícone da ActivityBar
  2. Verificar que o indicador roxo se move (layoutId)
  3. Verificar que o MainArea muda de conteúdo
- **Resultado esperado:** Navegação fluida com animação
- **Cobertura:** normal

### TC-005: AiPanel envia mensagem
- **Pré-condições:** Servidor rodando
- **Passos:**
  1. Digitar texto no input do AiPanel
  2. Clicar "Enviar" ou pressionar Enter
  3. Verificar que mensagem aparece no chat
- **Resultado esperado:** Mensagem adicionada com animação spring
- **Cobertura:** normal

### TC-006: AiPanel mensagem vazia não envia
- **Pré-condições:** Servidor rodando
- **Passos:**
  1. Clicar "Enviar" com input vazio
  2. Clicar "Enviar" com apenas espaços
- **Resultado esperado:** Nenhuma mensagem adicionada
- **Cobertura:** borda

### TC-007: StatusBar mostra status correto
- **Pré-condições:** Servidor rodando
- **Passos:**
  1. Verificar texto "Módulos: 3 ativos"
  2. Verificar status do modelo
  3. Verificar versão
- **Resultado esperado:** Informações visíveis e corretas
- **Cobertura:** normal

### TC-008: Bridge hook funciona em modo mock
- **Pré-condições:** Browser sem Qt WebChannel
- **Passos:**
  1. `const bridge = useJarvis()`
  2. `await bridge.getModules()`
- **Resultado esperado:** Retorna fallback ou erro tratado
- **Cobertura:** normal | borda (sem bridge disponível)

### TC-009: Tema escuro consistente
- **Pré-condições:** Servidor rodando
- **Passos:**
  1. Verificar cores de fundo (bg-background, bg-card, bg-sidebar)
  2. Verificar cores de texto (foreground, muted-foreground)
  3. Verificar cores de borda (border, border-border)
- **Resultado esperado:** Tema escuro uniforme em todos os componentes
- **Cobertura:** normal

### TC-010: Responsividade (AiPanel colapsa em tela pequena)
- **Pré-condições:** Servidor rodando
- **Passos:**
  1. Redimensionar janela para < 900px
  2. Verificar comportamento do AiPanel
- **Resultado esperado:** AiPanel pode colapsar/reduzir
- **Cobertura:** borda
