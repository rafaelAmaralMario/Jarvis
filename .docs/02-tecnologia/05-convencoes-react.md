# Convencoes React

## Stack Frontend

- React 19 + TypeScript 5.9 (strict mode)
- Vite 7 (build tool)
- Tailwind CSS 4 (estilos)
- Radix UI (componentes acessíveis headless)
- Framer Motion 12 (animações)
- Monaco Editor (editor de código)
- xterm.js (terminal)
- lucide-react (ícones)
- marked (Markdown)

## Estrutura de Componentes

```
ui/src/
├── components/
│   ├── ActivityBar.tsx        # Barra lateral de navegação
│   ├── AiPanel.tsx            # Chat com IA
│   ├── Sidebar.tsx            # Sidebar contextual
│   ├── MainArea.tsx           # Área central
│   ├── StatusBar.tsx          # Barra de status inferior
│   ├── Editor/                # Componentes do editor
│   ├── Git/                   # Componentes Git
│   ├── Knowledge/             # Componentes de conhecimento
│   ├── Settings/              # Componentes de configuração
│   ├── Terminal/              # Componentes do terminal
│   └── Workspace/             # Componentes do workspace
├── hooks/
│   ├── use-jarvis.ts          # Bridge hook (singleton)
│   └── useAutoSave.ts         # Auto-save do editor
├── types/index.ts             # Interfaces TypeScript
├── lib/utils.ts               # cn() helper
└── styles/globals.css         # Tailwind + variáveis CSS
```

## Convenções

- **Componentes funcionais** com hooks (sem classes)
- **Props tipadas** com interfaces (exportadas)
- **Nomes de arquivo**: `PascalCase.tsx`
- **Pastas**: agrupamento por domínio (Editor/, Git/, etc)
- **Hooks**: prefixo `use` — `useAutoSave`, `useBridgeEvent`
- **Event handlers**: `handleXxx` — `handleSearch`, `handleSave`

## Bridge Hook (use-jarvis.ts)

O hook `useJarvis()` retorna um objeto bridge singleton com métodos para todos os 89 handlers do backend:

```typescript
const jarvis = useJarvis();
const notes = await jarvis.knowledge.searchNotes({ query: "ML" });
const models = await jarvis.ai.models.list();
```

O `useBridgeEvent()` registra listeners para eventos C++ → React:

```typescript
useBridgeEvent('file-changed', (data) => {
    refreshFileTree(data.path);
});
```

## Testes (Vitest)

```typescript
// ui/src/__tests__/
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ActivityBar', () => {
    it('deve renderizar icones de navegacao', () => {
        render(<ActivityBar activeView="assistant" onViewChange={() => {}} />);
        expect(screen.getByTitle('Assistente')).toBeDefined();
    });
});
```
