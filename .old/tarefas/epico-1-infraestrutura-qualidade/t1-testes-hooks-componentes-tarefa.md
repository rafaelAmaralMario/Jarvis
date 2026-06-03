# Tarefa: Testes de Hooks e Componentes React

**Epico:** 1 — Infraestrutura e Qualidade  
**Prioridade:** 🔴 Alta  
**Estimativa:** 2-3 semanas  
**Dependencias:** Nenhuma (pode começar imediatamente)

## Objetivo

Criar testes unitarios para os 13 hooks React e 17 componentes da UI. Atualmente existem ~50 testes, mas **nenhum** cobre hooks ou componentes. Essa lacuna torna refatoracoes arriscadas.

## Stack Recomendada

| Ferramenta | Versao | Funcao |
|-----------|--------|--------|
| Vitest | 4.1.8 | Test runner (ja configurado) |
| @testing-library/react | 16.3.2 | Renderizacao de componentes (ja configurado) |
| @testing-library/jest-dom | ~6.0 | Matchers DOM customizados |
| @testing-library/user-event | ~14.0 | Simulacao de eventos de usuario |
| jsdom | ~29.0 | Ambiente DOM para testes (ja configurado) |
| vi.mock (Vitest) | — | Mock de dependencias Tauri |

## O Que Testar

### Hooks (13 hooks em `src/ui/hooks/`)

| Hook | Arquivo | Testes Necessarios |
|------|---------|-------------------|
| useWorkspace | hooks/__tests__/useWorkspace.test.ts | Estado inicial, refresh, CRUD, erro handling |
| useGit | hooks/__tests__/useGit.test.ts | Estado inicial, status, stage, unstage, commit, branches |
| useEditor | hooks/__tests__/useEditor.test.ts | Abrir/fechar tab, dirty tracking, salvamento |
| useChat | hooks/__tests__/useChat.test.ts | Send message, streaming, cancel, historico |
| useSettings | hooks/__tests__/useSettings.test.ts | Load/save, toggle theme, provider config |
| usePlugins | hooks/__tests__/usePlugins.test.ts | Toggle plugin, load local, verify |
| useContextManager | hooks/__tests__/useContextManager.test.ts | Notes, memory, search |
| useAgents | hooks/__tests__/useAgents.test.ts | Agent form, create, run |
| useModals | hooks/__tests__/useModals.test.ts | Open/close/submit modal |
| useAudit | hooks/__tests__/useAudit.test.ts | Add event, get events |
| usePalette | hooks/__tests__/usePalette.test.ts | Open/close, filter commands |
| useLogs | hooks/__tests__/useLogs.test.ts | Add log, clear |
| usePanelResize | hooks/__tests__/usePanelResize.test.ts | Resize handlers, min/max bounds |

### Componentes (17 em `src/ui/components/`)

Testes de renderizacao para cada componente:
- Renderiza sem erro
- Props sao passadas corretamente
- Estados vazios aparecem quando necessario
- Interacoes basicas funcionam (cliques, inputs)

## Como Fazer

### 1. Configurar Mocks do Tauri

Criar `src/infrastructure/__mocks__/tauri.ts`:

```typescript
import { vi } from 'vitest';
export const invoke = vi.fn();
export const convertFileSrc = vi.fn();
```

### 2. Setup para Testes de Hook

Criar `src/ui/hooks/__tests__/test-utils.tsx` com providers mock e wrapper.

### 3. Implementar Testes de Hook

Exemplo para `useWorkspace`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useWorkspace } from '../useWorkspace';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('useWorkspace', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useWorkspace());
    expect(result.current.files).toBeNull();
    expect(result.current.workspacePath).toBeNull();
  });

  it('should load workspace files on refresh', async () => {
    const mockFiles = [{ name: 'src', path: '/test/src', is_dir: true, children: [] }];
    (invoke as any).mockResolvedValue(mockFiles);
    const { result } = renderHook(() => useWorkspace());
    await act(async () => { await result.current.refreshWorkspace(); });
    expect(result.current.files).toEqual(mockFiles);
  });
});
```

### 4. Implementar Testes de Componente

```typescript
import { render, screen } from '@testing-library/react';
import { FilesPanel } from '../FilesPanel';

describe('FilesPanel', () => {
  it('should render empty state when no files', () => {
    render(<FilesPanel files={null} />);
    expect(screen.getByText(/nenhum arquivo/i)).toBeInTheDocument();
  });
});
```

## Criterios de Pronto

- [ ] Mocks do Tauri criados e funcionando
- [ ] Testes para todos os 13 hooks implementados
- [ ] Testes de renderizacao para todos os 17 componentes
- [ ] Minimo de 50 novos testes hooks + 20 testes componentes = 70+ novos testes
- [ ] `npm test` passa com 100% dos testes verdes
- [ ] `npm run build` passa sem erros
- [ ] Cobertura minima de 40% nas camadas `ui/hooks/` e `ui/components/`

## Referencias

- `docs/qualidade-testes.md` — Politicas de qualidade
- `docs/context/14-funcionalidades-atuais.md` — Lista completa de hooks e componentes
- `docs/context/12-plano-refatoracao-solid.md` — Etapa 0 de testes
- `docs/context/13-plano-manutencao-pos-solid.md` — Etapa 0 e 8 de expansao
