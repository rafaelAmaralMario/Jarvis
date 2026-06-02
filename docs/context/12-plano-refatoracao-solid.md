# Plano de Refatoração — SOLID

## Estratégia Geral

**Foco:** Resolver violações críticas primeiro (SRP + DIP), depois violações regulares (OCP), mantendo o projeto funcional a cada etapa.

**Abordagem:** Extrair responsabilidades sem mudar comportamento. Cada etapa gera um PR revisável.

**Prioridades:**
1. 🔴 **Crítico** — Bloqueia manutenção e evolução
2. 🟡 **Alto** — Viola princípios fundamentais
3. 🟢 **Médio** — Melhoria incremental
4. 🔵 **Baixo** — Cosméticos / organização

---

## 🔴 Etapa 1 — Extrair utilitários e tipos de App.tsx

**Problema:** App.tsx mistura UI com utilitários (clamp, normalizePath, samePath, formatError, shortPath, directoryPath, languageFromPath) e tipos (ChatMessage, ActionLog, AuditEvent, MemoryEntry, EditorTab, etc.)

**Ação:** Mover para arquivos dedicados

| O que | Para onde |
|-------|-----------|
| `ChatMessage`, `ActionLog`, `AuditEvent`, `MemoryEntry`, `ContextResult`, `EditorTab`, `ModalState`, `SettingsState`, `ModelHealth`, `AgentFormState`, `PermissionId` | `src/domain/models.ts` |
| `clamp`, `normalizePath`, `samePath`, `formatError`, `shortPath`, `directoryPath`, `languageFromPath`, `tokenize`, `searchContext`, `scoreContextItem` | `src/shared/utils.ts` |
| `loadSettings`, `loadEnabledPlugins`, `loadCustomAgents`, `loadWorkspaceMessages`, `loadWorkspaceAudit`, `loadWorkspaceMemory` | `src/shared/persistence.ts` |
| `verifyPlugin`, `mergeModelRegistry`, `createAgentDiff`, `createReview`, `createDocumentationProposal` | `src/shared/helpers.ts` |
| `TreeEntry` component | `src/ui/TreeEntry.tsx` |
| `activityItems`, `sidebarTitle`, `bottomLabels`, `permissionItems`, `commands`, `welcomeHelp`, `welcomeTab` | `src/ui/constants.tsx` |
| `tabToEntry`, `historyKey`, `auditKey`, `memoryKey` | `src/shared/utils.ts` |
| `boundPanelWidths` | `src/shared/utils.ts` |

**Risco:** Baixo — apenas mover código, sem mudar lógica

---

## 🔴 Etapa 2 — Extrair hooks customizados de App.tsx

**Problema:** App.tsx tem ~80 state variables e ~40 funções de orquestração, tudo no mesmo componente.

**Ação:** Criar hooks customizados por domínio

| Hook | Responsabilidade |
|------|-----------------|
| `useWorkspace()` | workspacePath, files, load workspace, refresh, CRUD operations |
| `useGit()` | gitFiles, branches, diff, stage, unstage, commit, branch mgmt |
| `useChat()` | messages, send, cancel, generation state, provider creation |
| `useSettings()` | all settings state, load/save, provider config, theme, vaults |
| `useEditor()` | tabs, active tab, open, save, close, dirty tracking |
| `usePlugins()` | enabled plugins, local plugins, toggle, verify |
| `useContext()` | notes, memory entries, context search, Obsidian integration |
| `useAgents()` | custom agents, agent form, run agent, create agent |
| `useModals()` | modal state, open, close, submit |
| `useAudit()` | audit events, add audit |
| `usePalette()` | command palette state |
| `usePanelResize()` | panel width state, resize handlers |

**Risco:** Médio — requer cuidado com dependências entre hooks e estado compartilhado. Sugiro começar com hooks independentes (useSettings, usePalette, useModals, useAudit) antes dos que interagem entre si.

---

## 🔴 Etapa 3 — Extrair componentes de UI de App.tsx

**Problema:** O JSX de App.tsx tem ~800 linhas com 8 views na sidebar + bottom panel + modals + palette + chat panel.

**Ação:** Componentizar a UI

| Componente | Conteúdo |
|------------|----------|
| `SidebarView` | Container da sidebar |
| `FilesPanel` | Tree explorer + toolbar |
| `SearchPanel` | Search input + results |
| `GitPanel` | Status, diff, stage, commit, branches |
| `SettingsPanel` | All settings forms |
| `PluginsPanel` | Plugin list + toggle |
| `ContextPanel` | Memory, context search, Obsidian notes |
| `AgentsPanel` | Agent list + designer |
| `HelpPanel` | Help guides |
| `ChatPanel` | AI chat messages + input |
| `EditorPanel` | Tabs + Monaco editor |
| `BottomPanel` | Container + tab navigation |
| `LogsView` | Log entries |
| `DiffView` | Diff display |
| `ProposalView` | Proposal review + accept |
| `AuditView` | Audit trail |
| `TerminalView` | Terminal placeholder |
| `CommandPalette` | Palette overlay |
| `ModalDialog` | Modal overlay |
| `ActivityBar` | Activity bar with icons |

**Risco:** Médio — requer os hooks da Etapa 2 para injetar estado nos componentes.

---

## 🔴 Etapa 4 — Extrair Application Services

**Problema:** Nenhuma camada Application real existe. App.tsx orquestra tudo diretamente.

**Ação:** Criar serviços na camada `application/services/`

| Service | Função |
|---------|--------|
| `WorkspaceService` | openWorkspace, refreshWorkspace, createEntry, deleteEntry, etc. |
| `GitService` | getStatus, getDiff, stage, unstage, commit, branches, PR URL |
| `ChatService` | sendMessage, createProvider, testModel |
| `SettingsService` | loadSettings, saveSettings, updateProvider |
| `PluginService` | loadLocal, toggle, verify |
| `ContextService` | searchContext, addMemory, writeObsidianNote |
| `AgentService` | runAgent, createCustomAgent |
| `AuditService` | addEvent, getEvents |

**Depois:** `App.tsx` (ou hooks) chama `application/services/*` em vez de `infrastructure/native` diretamente.

**Risco:** Alto — requer refatoração significativa. Fazer após Etapas 1-3.

---

## 🟡 Etapa 5 — Refatorar Rust Backend

**Problema:** `commands/mod.rs` tem 879 linhas com tudo misturado.

**Ação:** Mover implementações para os módulos correspondentes

| Comando | Mover para |
|---------|-----------|
| `default_workspace_path` | `workspace/mod.rs` |
| `list_workspace_entries`, `read/write/delete/rename/move` | `workspace/mod.rs` |
| `search_workspace` | `workspace/mod.rs` |
| `git_status`, `git_diff`, `stage`, `unstage`, `commit`, `branches`, `checkout`, `create`, `pr_url` | `git/mod.rs` |
| `list_ollama_models`, `start_ollama_model`, `test_ollama_model` | `services/mod.rs` |
| `list_local_plugin_manifests` | `security/mod.rs` (ou novo `plugins/mod.rs`) |
| `list_markdown_notes`, `write_markdown_note` | `services/mod.rs` |
| `load/save_secure_settings` | `storage/mod.rs` |
| `utils`: `canonicalize_existing`, `ensure_inside_workspace`, `validate_entry_name`, `validate_ollama_model_name`, `sanitize_note_title`, `load_ignore_patterns`, `should_ignore_entry`, `is_probably_text_file`, `collect_*` | `workspace/mod.rs` ou novo `utils.rs` |

**Structs duplicadas** (WorkspaceEntry, GitFileStatus, etc.): criar um módulo `types.rs` compartilhado ou usar `serde` com schemas unificados.

**Risco:** Médio — mover código Rust é seguro se os paths de import forem atualizados.

---

## 🟡 Etapa 6 — Tornar OCP-compliant

**Problema:** Várias listas hardcoded (extensões, linguagens, modelos, agentes, permissões).

**Ação:**

| Arquivo | O que fazer |
|---------|------------|
| `model-registry.ts` | Mudar de array estático para registry com método `register(model)` — aberto para extensão |
| `agentDefinitions` | Mudar de array estático para registry com `registerAgent()` |
| `is_probably_text_file` | Mover para config ou permitir que cada workspace declare extensões |
| `languageFromPath` | Usar Monaco's built-in language detection ou registry extensível |
| `verifyPlugin` | Tornar verificações extensíveis com strategy pattern |

**Risco:** Baixo — mudanças localizadas, sem impacto no comportamento.

---

## 🟢 Etapa 7 — Limpeza de Dead Code

**Problema:** 4 módulos Rust vazios + 1 re-export desnecessário.

**Ação:**

| Arquivo | Ação |
|---------|------|
| `src-tauri/src/git/mod.rs` | Remover `pub fn initialize() {}` se não usado |
| `src-tauri/src/workspace/mod.rs` | Remover `pub fn initialize() {}` se não usado |
| `src-tauri/src/services/mod.rs` | Remover `pub fn initialize() {}` se não usado |
| `src-tauri/src/security/mod.rs` | Remover `pub fn initialize() {}` se não usado |
| `src/infrastructure/mock-provider.ts` | Remover arquivo (é só re-export) |
| `lib.rs` — chamadas `X::initialize()` | Remover após confirmar que não fazem nada |

**Risco:** Baixo.

---

## 🔵 Etapa 8 — Consistência de Barrel Exports

**Problema:** Barrel exports inconsistentes.

**Ação:**

| Arquivo | Ação |
|---------|------|
| `src/application/index.ts` | Adicionar `export * from './model-registry'` |
| `src/infrastructure/index.ts` | Adicionar `export * from './native'`, `export * from './mock-provider'` |
| `src/domain/index.ts` | Já está ok |
| `src/shared/index.ts` | Adicionar `export * from './utils'`, `export * from './persistence'`, `export * from './helpers'` |

**Risco:** Baixo.

---

## Ordem de Execução Recomendada

```
Etapa 1 ─── Utilitários e tipos ─── 🔴 (base para tudo)
   │
   ▼
Etapa 2 ─── Hooks customizados ─── 🔴 (reduz complexidade de App.tsx)
   │
   ▼
Etapa 3 ─── Componentes de UI ─── 🔴 (organiza JSX)
   │
   ▼
Etapa 4 ─── Application Services ─── 🔴 (resolve DIP)
   │
   ▼
Etapa 5 ─── Rust Backend ─── 🟡 (paralelizável com 4)
   │
   ▼
Etapa 6 ─── OCP compliance ─── 🟡
   │
   ▼
Etapa 7 ─── Dead Code ─── 🟢
   │
   ▼
Etapa 8 ─── Barrel Exports ─── 🔵
```

Cada etapa é um PR separado na branch `refactor/solid-refactoring-plan`. A `main` permanece estável.

---

## Como Validar Após Cada Etapa

```bash
npm run build          # TypeScript check + Vite build
cd src-tauri && cargo check  # Rust compilation
npm run tauri -- build # Desktop build (opcional, mais lento)
```

Nenhum teste automatizado existe ainda — após a refatoração, a Etapa 0 (pré-requisito) idealmente seria adicionar testes. Mas como não está no escopo, a validação será build + inspeção visual.
