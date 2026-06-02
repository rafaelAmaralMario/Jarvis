# Plano de Refatoração — SOLID

## Estratégia Geral

**Foco:** Resolver violações críticas primeiro (SRP + DIP), depois violações regulares (OCP), mantendo o projeto funcional a cada etapa.

**Abordagem:** Extrair responsabilidades sem mudar comportamento. Cada etapa gera um PR revisável.

**Premissa:** Testes automatizados são introduzidos ANTES de qualquer refatoração, para garantir que o comportamento não seja alterado.

**Prioridades:**
1. 🛡️ **Testes** — Garantia de integridade (pré-requisito)
2. 🔴 **Crítico** — Bloqueia manutenção e evolução
3. 🟡 **Alto** — Viola princípios fundamentais
4. 🟢 **Médio** — Melhoria incremental
5. 🔵 **Baixo** — Cosméticos / organização

---

## 🛡️ Etapa 0 — Infraestrutura de Testes

**Problema:** Zero testes automatizados. Qualquer refatoração pode quebrar funcionalidades sem detecção.

**Ação:** Configurar stack de testes e criar testes que validam o comportamento atual ANTES de refatorar.

### 0.1 — Configurar stack de testes

| Ferramenta | Função | Comando de setup |
|-----------|--------|-----------------|
| **Vitest** | Test runner unitário (compatível com Vite) | `npm install -D vitest` |
| **@testing-library/react** | Testes de componente React | `npm install -D @testing-library/react @testing-library/jest-dom jsdom` |
| **Cargo test** | Testes Rust (já nativo) | `cd src-tauri && cargo test` (já funciona) |

Configurar `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
});
```

### 0.2 — Testes de garantia (Safety Net Tests)

Criar testes que capturam o comportamento ATUAL de cada módulo. Esses testes são a **régua** — durante a refatoração, se quebrarem, algo mudou.

#### Frontend — Testes Unitários Prioritários

| Teste | Arquivo | O que valida |
|-------|---------|-------------|
| **Domain models** | `src/domain/__tests__/models.test.ts` | Tipos, interfaces, estrutura de dados |
| **Model registry** | `src/application/__tests__/model-registry.test.ts` | Lista de modelos, defaultModelId, estrutura |
| **Mock provider** | `src/infrastructure/__tests__/mock-provider.test.ts` | Resposta mockada, abort signal, streaming |
| **Ollama provider** | `src/infrastructure/__tests__/ollama-provider.test.ts` | (mockado) Construção de request, parsing |
| **OpenAI provider** | `src/infrastructure/__tests__/openai-provider.test.ts` | (mockado) Construção de request, parsing |
| **Agent definitions** | `src/agents/__tests__/definitions.test.ts` | 4 agentes built-in, estrutura |
| **Plugin manifests** | `src/plugins/__tests__/manifests.test.ts` | 3 plugins built-in, estrutura |
| **Utils extraídas** | `src/shared/__tests__/utils.test.ts` | clamp, normalizePath, samePath, formatError, tokenize, searchContext, shortPath |
| **Persistence** | `src/shared/__tests__/persistence.test.ts` | load/save settings, parse de localStorage |
| **Helpers** | `src/shared/__tests__/helpers.test.ts` | verifyPlugin, mergeModelRegistry, createAgentDiff |

#### Frontend — Testes de Integração Prioritários

| Teste | Arquivo | O que valida |
|-------|---------|-------------|
| **Chat flow** | `src/ui/__tests__/chat-flow.test.ts` | Envio de mensagem > streaming > exibição |
| **File CRUD** | `src/ui/__tests__/file-crud.test.ts` | Criar > renomear > mover > deletar (mock Tauri) |
| **Git flow** | `src/ui/__tests__/git-flow.test.ts` | Status > stage > diff > commit (mock Tauri) |
| **Settings persistence** | `src/ui/__tests__/settings-persistence.test.ts` | Mudar settings > reload > valores mantidos |
| **Plugin toggle** | `src/ui/__tests__/plugin-toggle.test.ts` | Ativar > desativar > verificação de permissões |

#### Backend — Testes Rust Prioritários

| Teste | Arquivo | O que valida |
|-------|---------|-------------|
| **Workspace validation** | `src-tauri/tests/workspace.rs` | canonicalize, ensure_inside_workspace, validate_entry_name |
| **Git helpers** | `src-tauri/tests/git.rs` | run_git, build_github_pr_url |
| **Plugin parsing** | `src-tauri/tests/plugins.rs` | read_plugin_manifest, validação de campos |
| **Ollama validation** | `src-tauri/tests/ollama.rs` | validate_ollama_model_name |
| **Note sanitization** | `src-tauri/tests/notes.rs` | sanitize_note_title |
| **Secure settings** | `src-tauri/tests/storage.rs` | load/save, caminho, serialização |

### 0.3 — Mock do Tauri para testes de frontend

Criar `src/infrastructure/__mocks__/tauri.ts` para simular comandos Tauri sem desktop:

```typescript
export const invoke = vi.fn();
```

Isso permite testar toda a lógica do frontend sem precisar do Tauri runtime.

### 0.4 — Scripts de teste no package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:rust": "cd src-tauri && cargo test"
  }
}
```

### Validação desta etapa

```bash
npm test            # Todos os testes unitários passam
npm test:rust       # Todos os testes Rust passam
npm run build       # Build continua funcionando
```

> **Nota:** Após esta etapa, qualquer refatoração nas etapas seguintes deve manter todos os testes verdes. Se um teste quebrar, a refatoração alterou comportamento.

> **Status: ✅ CONCLUÍDA** — Stack Vitest + testing-library configurada, 36 safety net tests criados e passando.

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

**Validação:** `npm test && npm run build` — todos os testes verdes, build passa.

**Risco:** Baixo — apenas mover código, sem mudar lógica

> **Status: ✅ CONCLUÍDA** — Tipos movidos para `domain/models.ts`, utilitários para `shared/utils.ts`, persistência para `shared/persistence.ts`, helpers para `shared/helpers.ts`, TreeEntry para `ui/TreeEntry.tsx`, constantes para `ui/constants.tsx`.

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

**Testes a adicionar:** Testes unitários para cada hook (estado inicial, ações, edge cases).

**Ordem sugerida:** Hooks independentes primeiro (useSettings, usePalette, useModals, useAudit), depois hooks com dependências.

**Validação:** `npm test && npm run build` — todos os testes verdes.

**Risco:** Médio — requer cuidado com dependências entre hooks e estado compartilhado.

> **Status: ✅ CONCLUÍDA** — 13 hooks criados em `ui/hooks/`: useWorkspace, useGit, useEditor, useChat, useSettings, usePlugins, useContextManager, useAgents, useModals, useAudit, usePalette, useLogs, usePanelResize.

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

**Testes a adicionar:** Testes de renderização com @testing-library/react para cada componente (renderiza sem erro, props são passadas corretamente).

**Validação:** `npm test && npm run build` — todos os testes verdes.

**Risco:** Médio — requer os hooks da Etapa 2 para injetar estado nos componentes.

> **Status: ✅ CONCLUÍDA** — App.tsx reduzido de ~1420 para ~750 linhas. 17 componentes em `ui/components/` + TreeEntry.tsx + ActivityBar + CommandPalette + ModalDialog.

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

**Testes a adicionar:** Testes unitários para cada service com Tauri mockado.

**Validação:** `npm test && npm run build` — todos os testes verdes.

**Risco:** Alto — requer refatoração significativa. Fazer após Etapas 1-3.

> **Status: ✅ CONCLUÍDA** — 6 services criados em `application/services/`: workspace, git, editor, settings, plugins, context. Hooks refatorados para usar services em vez de importar `infrastructure/native.ts` diretamente (DIP resolvido).

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

**Structs duplicadas:** Criar módulo `types.rs` compartilhado ou usar schemas unificados.

**Testes a adicionar:** `cargo test` já cobre — expandir testes existentes para cobrir as funções movidas.

**Validação:** `cargo test && npm run build` — todos os testes verdes.

**Risco:** Médio — mover código Rust é seguro se os paths de import forem atualizados.

> **Status: ✅ CONCLUÍDA** — commands/mod.rs reduzido de 879 para 173 linhas. Structs + helpers movidos para workspace, git, services, security. Tauri commands são thin wrappers que delegam aos módulos.

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

**Testes:** Já existem da Etapa 0 — atualizar conforme a nova API.

**Validação:** `npm test && npm run build` — todos os testes verdes.

**Risco:** Baixo — mudanças localizadas, sem impacto no comportamento.

> **Status: ✅ CONCLUÍDA** — model-registry e agentDefinitions migrados para registry pattern com `register()`; `languageFromPath` usa `languageRegistry` extensível; `verifyPlugin` usa strategy pattern com checks registráveis; `is_probably_text_file` em Rust aceita extensões customizáveis via `is_text_file_with_extensions()`.

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

**Validação:** `npm test && cargo test && npm run build` — tudo verde.

**Risco:** Baixo.

> **Status: ✅ CONCLUÍDA** — Removidos `initialize()` stubs de services, security, git, workspace, storage.

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

**Validação:** `npm test && npm run build` — tudo verde.

**Risco:** Baixo.

> **Status: ✅ CONCLUÍDA** — Todos os barrel exports atualizados.

---

## Ordem de Execução Recomendada

```
Etapa 0 ─── Testes ─── 🛡️ (pré-requisito ABSOLUTO)
   │
   ▼
Etapa 1 ─── Utilitários e tipos ─── 🔴 (base para tudo)
   │
   ▼
Etapa 2 ─── Hooks customizados ─── 🔴 (reduz ~80 states de App.tsx)
   │
   ▼
Etapa 3 ─── Componentes de UI ─── 🔴 (organiza ~800 linhas de JSX)
   │
   ▼
Etapa 4 ─── Application Services ─── 🔴 (resolve DIP)
   │
   ▼
Etapa 5 ─── Rust Backend ─── 🟡 (pode rodar paralelo à etapa 4)
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

Cada etapa gera um **PR separado** para `main`. Nenhuma etapa começa sem a anterior estar completa e validada.

---

## Fluxo de Validação Obrigatório (toda etapa)

```bash
npm test              # Testes unitários frontend
cd src-tauri && cargo test  # Testes Rust
cd .. && npm run build      # Build completo
```

Se qualquer comando falhar, a etapa **não está completa**. Rollback ou correção obrigatória antes de seguir.

---

## Matriz de Riscos

| Etapa | Risco | Mitigação |
|-------|-------|-----------|
| 0 — Testes | Baixo | Sem mudança de código, só adição ✅ |
| 1 — Utils/Tipos | Baixo | Mover sem alterar lógica; tests da etapa 0 validam ✅ |
| 2 — Hooks | Médio | Fazer hooks independentes primeiro; testar isoladamente ✅ |
| 3 — Componentes | Médio | Hooks já injetam estado; testar renderização ✅ |
| 4 — Services | Alto | Maior mudança arquitetural; fazer por módulo (ex: Git primeiro) ✅ |
| 5 — Rust | Médio | Mover mantendo assinaturas; `cargo test` valida ✅ |
| 6 — OCP | Baixo | Mudanças localizadas; tests existentes validam ✅ |
| 7 — Dead Code | Baixo | Remoção segura; build valida ✅ |
| 8 — Exports | Baixo | Só adicionar exports; build valida ✅ |
