# Contexto: Testes Integrados (Vitest + C++)

**ID:** CONTEXT-009
**Timestamp:** 2026-06-03T13:50:00-03:00
**Status:** active
**Supersedes:** —
**Superseded by:** —
**Skill usada:** —

## Decisao

Criada infraestrutura de testes para kernel (C++ com Qt6::Sql) e UI (Vitest + Testing Library + jsdom).

### Testes C++ (kernel/tests/)

| Arquivo | Descrição |
|---------|-----------|
| `test_database.cpp` | Database open/close, WAL mode, mutex, transactions (commit/rollback) |
| `test_migration_runner.cpp` | Migration version tracking, up/down, idempotency |
| `test_knowledge.cpp` | Knowledge manager CRUD (notes, search, backlinks, graph) |
| `test_workspace.cpp` | Workspace CRUD, file operations, settings, folder management |

### Testes React (ui/src/__tests__/)

| Arquivo | Descrição |
|---------|-----------|
| `ActivityBar.test.tsx` | Render items by title, click handler, active highlight |
| `Settings/ModelsPanel.test.tsx` | Render model list after loading |
| `Settings/AgentsPanel.test.tsx` | Render agent list, open create dialog |
| `Settings/AgentFormDialog.test.tsx` | Submit with valid data |
| `Settings/OrchestrationPanel.test.tsx` | Render form, toggle enabled |

### Infraestrutura

- **Vitest 4.1.8** com `@vitejs/plugin-react`, jsdom, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `vitest.config.ts` com alias `@/` → `src/`, globals enabled, CSS off
- `src/test-setup.ts` — import `@testing-library/jest-dom`
- `src/__mocks__/bridge.ts` — mock bridge factory (não usado nos testes atuais; usamos `vi.mock('@/hooks/use-jarvis')`)
- Mock pattern: `vi.mock` com factory retornando objeto bridge estável (evita infinite loop do useEffect)

### Ajustes feitos

- Testes corrigidos para alinhar com API real dos componentes: `title` attribute no ActivityBar, `getByPlaceholderText` para inputs sem `htmlFor`, `getAllByRole` para múltiplos checkboxes
- Mock hoisting resolvido movendo dados mock para dentro da factory de `vi.mock`
- Bridge estável via `const bridge = { ... }; return { useJarvis: () => bridge }` para evitar re-render infinito

## Arquivos Afetados

- `ui/vitest.config.ts` (novo)
- `ui/src/test-setup.ts` (novo)
- `ui/src/__mocks__/bridge.ts` (novo)
- `ui/src/__tests__/ActivityBar.test.tsx` (novo)
- `ui/src/__tests__/Settings/ModelsPanel.test.tsx` (novo)
- `ui/src/__tests__/Settings/AgentsPanel.test.tsx` (novo)
- `ui/src/__tests__/Settings/AgentFormDialog.test.tsx` (novo)
- `ui/src/__tests__/Settings/OrchestrationPanel.test.tsx` (novo)
- `kernel/tests/test_database.cpp` (novo)
- `kernel/tests/test_knowledge.cpp` (novo)
- `kernel/tests/test_migration_runner.cpp` (novo)
- `kernel/tests/test_workspace.cpp` (novo)
- `kernel/CMakeLists.txt` (modificado — novos targets de teste)
- `ui/package.json` (modificado — scripts de teste, dependências)

## Proximos Passos

- Task 014: CI/CD (GitHub Actions)
