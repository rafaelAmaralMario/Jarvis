# JARVIS — AI Handoff Context

## 1. Quick Stats

| Métrica | Valor |
|---------|-------|
| Versão | 0.1.0 |
| Frontend TS | ~7.200 linhas |
| Backend Rust | ~1.100 linhas |
| Total testes | ~50 |
| Arquivos fonte TS | ~65 |
| Commits | ~42 |
| Hooks React | 13 |
| Componentes React | 17 |
| Services | 8 |
| Comandos Tauri | 26 |
| Agentes built-in | 4 |
| Plugins built-in | 3 |
| Providers IA | 3 (mock, ollama, openai-compatible) |
| Documentos context | 16 |
| ADRs | 4 |

**Stack:** React 19 + TypeScript 5.9 + Vite 7.2 + Tauri 2.11 + Monaco 0.55 + Vitest 4.1

```bash
npm run dev           # Vite browser em http://127.0.0.1:1420
npm test              # Vitest run
npm run tauri -- dev  # App desktop Tauri
npm run build         # tsc + vite build
cd src-tauri && cargo test  # Testes Rust
```

---

## 2. Architecture in 30 Seconds

JARVIS é uma IDE desktop com layout de 3 painéis (sidebar, editor com Monaco, chat IA). O frontend React segue **Clean Architecture** com 4 camadas: `ui/` (componentes + hooks) → `application/services/` (casos de uso) → `infrastructure/` (adaptadores Tauri + providers) → `domain/` (tipos puros). O backend Rust expõe 26 comandos via Tauri `invoke()` para operações de arquivo, Git, Ollama, notas Markdown e settings seguros. Toda comunicação é unidirecional; hooks nunca chamam infra diretamente. Estado persiste em `localStorage` (settings, chat, audit, memória) e no backend Rust (API keys).

---

## 3. Project Map (Essential Files)

### Camada UI (`src/ui/`)

| Arquivo | Propósito | Linhas | Exports-chave |
|---------|-----------|--------|---------------|
| `App.tsx` | Componente raiz — orquestra hooks + layout grid | 637 | `App` |
| `constants.tsx` | activityItems, sidebarTitle, commands, welcomeTab, medidas | 167 | `activityItems`, `sidebarTitle`, `commands`, `welcomeTab`, `agentDesignerPath` |
| `types.ts` | ActivityView, BottomView, ModalState, AgentFormState | 20 | tipos |
| `TreeEntry.tsx` | Árvore recursiva do explorador de arquivos | 86 | `TreeEntry` |

#### Hooks (`src/ui/hooks/`)

| Hook | O que gerencia | Service usado |
|------|---------------|---------------|
| `useWorkspace.ts` | files, expandedFolders, search, workspacePath | `WorkspaceService` |
| `useGit.ts` | gitFiles, branches, diff, commit, branch input | `GitService` |
| `useEditor.ts` | tabs, activeTab, dirty tracking | `EditorService` |
| `useChat.ts` | messages, generationActive, streaming | `ChatService` |
| `useSettings.ts` | settings, secureApiKey, modelHealth, ollamaModels | `SettingsService` |
| `usePlugins.ts` | enabledPlugins, localPlugins | `PluginService` |
| `useContextManager.ts` | notes, memoryEntries, context search | `ContextService` |
| `useAgents.ts` | customAgents, agentForm, agent creation | `AgentService` |
| `useModals.ts` | modal state, modal value | (nenhum) |
| `useAudit.ts` | audit events | (nenhum) |
| `usePalette.ts` | palette open/query/filtered | (nenhum) |
| `useLogs.ts` | action logs | (nenhum) |
| `usePanelResize.ts` | panel widths, resize handlers | (nenhum) |

#### Componentes (`src/ui/components/`)

16 componentes + ActivityBar avulso: `ActivityBar`, `FilesPanel`, `SearchPanel`, `GitPanel`, `SettingsPanel`, `PluginsPanel`, `ContextPanel`, `AgentsPanel`, `HelpPanel`, `EditorPanel`, `BottomPanel`, `LogsView`, `ProposalView`, `AuditView`, `ChatPanel`, `CommandPalette`, `ModalDialog`.

### Camada Application (`src/application/`)

| Arquivo | Propósito | Linhas |
|---------|-----------|--------|
| `services/workspace.ts` | Refresh workspace, run search | 41 |
| `services/git.ts` | Diff, stage, unstage, commit, branch, PR URL | 98 |
| `services/editor.ts` | Save file com denyList | 25 |
| `services/settings.ts` | Load/persist API key, test model, Ollama ops | 136 |
| `services/plugins.ts` | Refresh local plugins, canToggle com verifyPlugin | 38 |
| `services/context.ts` | Load Obsidian notes, write memory to vault | 39 |
| `services/chat.ts` | Send message via TextModelProvider | 53 |
| `services/agent.ts` | Run brain agent, create agent from prompt | 87 |
| `model-registry.ts` | Registry de 7+ modelos, register, byProvider | 88 |
| `app-metadata.ts` | name + description do app | 10 |

### Camada Domain (`src/domain/`)

| Arquivo | Propósito | Linhas |
|---------|-----------|--------|
| `models.ts` | `AiModel`, `TextModelProvider`, `TextProviderRequest`, `ProviderSettings`, `ProviderKind`, `ModelCapability` | 33 |

### Camada Infrastructure (`src/infrastructure/`)

| Arquivo | Propósito | Linhas |
|---------|-----------|--------|
| `native.ts` | Barrel re-exportando todos os comandos Tauri | 27 |
| `tauri.ts` | `isTauriRuntime()` detection | 4 |
| `workspace.ts` | CRUD arquivos, search, selectFolder, validatePath | 100 |
| `git.ts` | status, diff, stage, unstage, commit, branches, PR URL | 47 |
| `ollama.ts` | default path, list models, start, test | 17 |
| `settings.ts` | load/saveSecureSettings (APPDATA/JARVIS) | 19 |
| `plugins.ts` | listLocalPluginManifests | 18 |
| `note.ts` | listMarkdownNotes, writeMarkdownNote | 19 |
| `model-providers.ts` | Factory `createTextProvider` | 18 |
| `providers/mock.ts` | MockProvider com chunks + delay 90ms | 29 |
| `providers/ollama.ts` | OllamaTextProvider (POST /api/generate, JSON lines) | 67 |
| `providers/openai.ts` | OpenAICompatibleTextProvider (POST /chat/completions, SSE) | 76 |
| `providers/utils.ts` | trimUrl, delay | 7 |

### Camada Shared (`src/shared/`)

| Arquivo | Propósito | Linhas |
|---------|-----------|--------|
| `types.ts` | ChatMessage, ActionLog, AuditEvent, MemoryEntry, SettingsState, EditorTab, PermissionId, etc. | 63 |
| `utils.ts` | clamp, normalizePath, samePath, formatError, shortPath, languageRegistry, tokenize, boundPanelWidths | 92 |
| `persistence.ts` | load/save settings, messages, audit, memory (localStorage) | 88 |
| `helpers.ts` | verifyPlugin, mergeModelRegistry, renderWorkspaceTree, createAgentDiff, searchContext | 178 |

### Agentes e Plugins

| Arquivo | Propósito | Linhas |
|---------|-----------|--------|
| `agents/index.ts` | AgentDefinition, 4 built-in agents, agentRegistry | 61 |
| `plugins/index.ts` | PluginManifest interface | 10 |
| `plugins/manifests.ts` | 3 built-in plugin manifests | 25 |

### Backend Rust (`src-tauri/src/`)

| Arquivo | Propósito | Linhas |
|---------|-----------|--------|
| `main.rs` | Entry point | 3 |
| `lib.rs` | Builder Tauri com 26 comandos | 47 |
| `commands/mod.rs` | Thin wrappers delegando aos módulos | 173 |
| `workspace/mod.rs` | CRUD, busca, validações path | 382 |
| `git/mod.rs` | Status, diff, stage, commit, branches, PR URL | 157 |
| `services/mod.rs` | Ollama ops + notas Markdown | 222 |
| `security/mod.rs` | Leitura/validação manifests de plugins | 90 |
| `storage/mod.rs` | Persistência segura (APPDATA/JARVIS) | 37 |

---

## 4. How to Make Changes (Patterns & Conventions)

### Component Pattern

Componentes recebem **tudo por props** — nunca chamam hooks, services ou infra diretamente.

```tsx
// Tipico: interface de props inline, componente function puro
interface FilesPanelProps {
  files: WorkspaceEntry[];
  onOpenWorkspaceFile: (file: WorkspaceEntry) => void;
  // ...
}

export function FilesPanel({ files, onOpenWorkspaceFile }: FilesPanelProps) { ... }
```

### Hook Pattern

Hooks gerenciam estado React e chamam services via `useRef` lazy:

```tsx
export function useWorkspace(addLog: AddLogFn) {
  const serviceRef = useRef<WorkspaceService | null>(null);
  function getService() {
    if (!serviceRef.current) serviceRef.current = createWorkspaceService(addLog);
    return serviceRef.current;
  }
  const [files, setFiles] = useState<WorkspaceEntry[]>([]);

  async function refreshWorkspace(path: string) {
    const entries = await getService().refresh(path);
    setFiles(entries);
  }

  return { files, refreshWorkspace };
}
```

### Service Pattern

Services são factories puras (sem classe) que orquestram chamadas a `infrastructure/native.ts`:

```tsx
export function createWorkspaceService(addLog: AddLogFn) {
  async function refresh(path: string): Promise<WorkspaceEntry[]> {
    return listWorkspaceEntries(path);  // de infrastructure/native
  }
  return { refresh };
}
```

### Adicionando uma Nova Feature — Passo a Passo

1. **Domain**: adicione tipos em `src/domain/models.ts` se necessário
2. **Infrastructure**: adicione comando Tauri em `src-tauri/src/commands/mod.rs` + implementação no módulo correspondente; exponha em `src/infrastructure/native.ts`
3. **Shared**: adicione helpers/utils em `src/shared/`
4. **Application Service**: crie service em `src/application/services/` que chame a infra
5. **Hook**: crie hook em `src/ui/hooks/` que use o service
6. **Component**: crie componente em `src/ui/components/` que receba props
7. **App.tsx**: instancie o hook e passe props para o componente
8. **Testes**: adicione testes em `src/**/__tests__/`

### Naming Conventions

- **Arquivos**: PascalCase para componentes (`FilesPanel.tsx`), camelCase para hooks/services/utils (`useWorkspace.ts`, `createChatService.ts`)
- **Funções**: camelCase (`sendMessage`, `refreshWorkspace`)
- **Tipos/Interfaces**: PascalCase (`AiModel`, `WorkspaceEntry`)
- **Exports**: nomeados (`export function`), nunca `export default`
- **Event handlers**: `on<Evento>` nas props (`onSave`, `onCloseTab`)

### Import Conventions (Layer Rules)

```
ui/components/ → só importa de shared/, ui/types.ts, ui/constants.tsx, outros componentes
ui/hooks/      → importa de application/services/ e shared/
application/   → importa de domain/ e infrastructure/native.ts
infrastructure/ → importa de domain/ e @tauri-apps/api
shared/        → importa de infrastructure/ (helpers) ou nada (utils/types)
domain/        → NÃO importa nada
```

### Barrel Pattern

Cada camada tem `index.ts` que re-exporta tudo:

- `src/domain/index.ts` → `export * from './models'`
- `src/application/index.ts` → `export * from './services/*'`, `export * from './model-registry'`, `export * from './app-metadata'`
- `src/infrastructure/index.ts` → `export * from './tauri'`, `export * from './workspace'`, etc.
- `src/shared/index.ts` → `export * from './utils'`, `export * from './persistence'`, `export * from './helpers'`
- `src/plugins/index.ts` → `export * from './manifests'`

---

## 5. Running Tests

**Runner:** Vitest v4.1.8 com jsdom + @testing-library/react

```bash
npm test              # Todos os testes
npm run test:watch    # Watch mode
npm run test:coverage # Com coverage
```

**Config:** `vitest.config.ts` — globals true, environment jsdom, setup `src/test-setup.ts`, include `src/**/*.test.{ts,tsx}` e `src/**/__tests__/**/*.{ts,tsx}`.

**Arquivos de teste (11 arquivos, ~50 testes):**

| Arquivo | Testes | O que cobre |
|---------|--------|-------------|
| `domain/__tests__/models.test.ts` | 5 | Tipos AiModel, ProviderSettings, TextModelProvider |
| `application/__tests__/model-registry.test.ts` | 7 | Registry, 7 modelos, register, byProvider |
| `application/services/__tests__/chat.test.ts` | 5 | Send, streaming, abort |
| `application/services/__tests__/agent.test.ts` | 6 | runBrainAgent, createAgentFromPrompt |
| `application/services/__tests__/workspace.test.ts` | 5 | Refresh, quiet mode, search |
| `application/services/__tests__/git.test.ts` | 9 | Diff, stage, commit, branch, PR URL |
| `infrastructure/__tests__/mock-provider.test.ts` | 5 | Resposta, abort, onToken |
| `agents/__tests__/definitions.test.ts` | 7 | 4 agentes, register |
| `plugins/__tests__/manifests.test.ts` | 6 | 3 plugins, campos obrigatórios |
| `shared/__tests__/persistence.test.ts` | 8 | Settings round-trip, workspace isolation |
| `shared/__tests__/index.test.ts` | 3 | Nullable type |

**Mock pattern:** `vi.mock('caminho/da/infra')` com `vi.fn()`:

```tsx
vi.mock('../../../infrastructure/native', () => ({
  listWorkspaceEntries: vi.fn(),
  searchWorkspace: vi.fn(),
}));
```

**O que NÃO é testado:** hooks React, componentes React, integração de fluxos, código Rust (cargo test não está configurado/rodando).

---

## 6. Common Pitfalls

### 🔴 Críticos

- **useChat é o único hook que viola DIP**: `useChat` → `ChatService` → `createTextProvider`. Os outros hooks foram refatorados para usar services. Se for alterar `useChat`, extraia a lógica de streaming para o service.
- **App.tsx ainda tem ~637 linhas** com funções de orquestração (`submitModal`, `runAgent`, `chooseWorkspace`) que poderiam estar em hooks ou services.
- **Código morto em persistence.ts**: `loadEnabledPlugins`, `saveEnabledPlugins`, `loadCustomAgents`, `saveCustomAgents` — não usados mas ainda exportados.
- **`Nullable<T>` em shared/index.ts** — usado apenas em 1 teste, não em produção.

### 🟡 Atenção

- **styles.css ainda grande**: components.css tem 856 linhas sozinho. Não usar CSS-in-JS — tudo é CSS global com prefixo de classe.
- **Nenhum teste de hook ou componente React** — se quebrar um hook, só testes manuais detectam.
- **Mocks do Tauri**: diretório `__mocks__` existe mas está vazio. Testes usam `vi.mock` inline.
- **Barrel exports incompletos**: `shared/index.ts` não exporta `types.ts`.
- **Polling do workspace**: hardcoded em 8s em `App.tsx`. Se adicionar muitas operações de arquivo, pode causar re-renders em cascata.

### 🔵 Tech Debt Leve

- `useChat.ts` não salva mensagens periodicamente (só quando o componente desmonta indiretamente)
- `renderWorkspaceTree` em helpers.ts tem limite fixo de 80 entradas e 3 níveis de profundidade
- Lógica de `submitModal` em `App.tsx` faz CRUD + refresh + tab management tudo junto

---

## 7. Layers & Dependencies (Visual)

```
ui/components/
      ↓ props (nunca chamam services/infra)
ui/hooks/
      ↓ chamam services via useRef
application/services/
      ↓ importam de infrastructure/native.ts
infrastructure/native.ts  (barrel)
      ↓
  ├── workspace.ts  ──→  invoke() Tauri  ──→  Rust: workspace/mod.rs
  ├── git.ts        ──→  invoke() Tauri  ──→  Rust: git/mod.rs
  ├── ollama.ts     ──→  invoke() Tauri  ──→  Rust: services/mod.rs
  ├── settings.ts   ──→  invoke() Tauri  ──→  Rust: storage/mod.rs
  ├── plugins.ts    ──→  invoke() Tauri  ──→  Rust: security/mod.rs
  └── note.ts       ──→  invoke() Tauri  ──→  Rust: services/mod.rs

domain/  (tipos puros, sem dependências)

shared/  (utils, persistence, helpers — importam de infrastructure)
```

**Regras reversas (proibido):**
- `ui/components/` NUNCA importa `infrastructure/`, `application/` ou hooks
- `ui/hooks/` NUNCA importa `infrastructure/` diretamente (só via services)
- `domain/` NÃO importa nada de nenhuma camada
- `application/` NÃO importa `ui/`

---

## 8. State Management Overview

| O quê | Onde | Chave/formato |
|-------|------|---------------|
| Settings | `localStorage` | `jarvis.settings.v1` — JSON `SettingsState` |
| Chat history | `localStorage` | `jarvis.chat.<workspacePath>` — `ChatMessage[]` |
| Audit events | `localStorage` | `jarvis.audit.<workspacePath>` — `AuditEvent[]` |
| Memory entries | `localStorage` | `jarvis.memory.<workspacePath>` — `MemoryEntry[]` |
| Enabled plugins | `localStorage` | `jarvis-enabled-plugins` — `string[]` |
| Custom agents | `localStorage` | `jarvis-custom-agents` — `AgentDefinition[]` |
| API keys | Backend Rust | `%APPDATA%/JARVIS/secure-settings.json` |
| UI state efêmero | React state | tabs, activeView, modals, palette, panel widths |
| Workspace files | React state | `WorkspaceEntry[]` em `useWorkspace` |
| Git status | React state | `GitFileStatus[]` + `GitBranch[]` em `useGit` |

**SettingsState** (`src/shared/types.ts:49`):
```ts
{
  selectedModelId, providerKind, ollamaBaseUrl, ollamaModelsPath,
  openaiCompatibleBaseUrl, generalVaultPath, projectVaultPath,
  contextVaultKind, workspacePath, theme, sidebarWidth, aiPanelWidth,
  permissions: Record<PermissionId, boolean>
}
```

---

## 9. Adding a New View/Panel

1. **Adicione o tipo** em `src/ui/types.ts` — adicione novo valor em `ActivityView` (ou crie novo enum)
2. **Adicione metab dados** em `src/ui/constants.tsx`:
   - Adicione entry em `activityItems` (id, label, Icon do lucide-react)
   - Adicione entry em `sidebarTitle`
3. **Crie o componente** em `src/ui/components/MeuPanel.tsx` seguindo o pattern de props
4. **Crie hook** em `src/ui/hooks/useMeuState.ts` se precisar de estado
5. **Adicione service** em `src/application/services/meu.ts` se precisar de lógica
6. **Registre em App.tsx**:
   - Importe o hook e o componente
   - Instancie o hook
   - Adicione `{activeView === 'meu' && <MeuPanel ... />}` no JSX da sidebar
7. **Adicione atalho** na Command Palette se necessário
8. **Testes**: adicione tests para o service, hook e componente

---

## 10. Decision Records Summary

| ADR | Decisão | Status |
|-----|---------|--------|
| **0001** | Usar **Tauri** como base desktop (mais leve que Electron, backend Rust, controle de capacidades nativas) | ✅ Aceito |
| **0002** | Usar **Monaco Editor** (experiência VS Code, suporte a linguagens, temas, diff) | 📋 Proposto |
| **0003** | Modelo **explícito de permissões** por workspace, agente e plugin (ações destrutivas exigem confirmação, audit trail) | 📋 Proposto |
| **0004** | Plugins **declarativos no MVP** (sem execução de código arbitrário, apenas manifests com capacidades e permissões) | 📋 Proposto |
