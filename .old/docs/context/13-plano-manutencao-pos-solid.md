# Plano de Manutenção Pós-Refatoração SOLID

## Diagnóstico

Após as 9 etapas da refatoração SOLID, o código está organizado em camadas, com SRP e DIP respeitados. No entanto, ainda há pontos de melhoria para legibilidade e manutenção:

| Problema | Local | Gravidade |
|----------|-------|-----------|
| `native.ts` monolítico (216 linhas, 6 concerns) | `src/infrastructure/native.ts` | 🔴 |
| `useChat` é o único hook sem service | `src/ui/hooks/useChat.ts` | 🔴 |
| Funções de orquestração grandes em App.tsx | `src/ui/App.tsx:293-571` | 🔴 |
| Dead code em persistence.ts | `src/shared/persistence.ts` | 🟡 |
| Barrel exports incompletos | `src/shared/index.ts` | 🟡 |
| Tipos de UI em shared/types.ts | `src/shared/types.ts` | 🟡 |
| model-providers.ts monolítico (187 linhas) | `src/infrastructure/model-providers.ts` | 🟢 |
| styles.css monolítico (1039 linhas) | `src/ui/styles.css` | 🟢 |
| Cobertura de testes baixa | 6 arquivos, ~38 testes | 🟢 |

---

## 🛡️ Etapa 0 — Testes de Garantia

**Problema:** Testes existentes cobrem apenas tipos e definições estáticas. Nenhum hook, service ou componente tem testes.

**Ação:** Criar testes para as camadas que serão refatoradas nas etapas seguintes.

### 0.1 — Testes dos hooks (antes da refatoração)

Criar `src/ui/hooks/__tests__/` com testes para cada hook capturando comportamento atual:

| Teste | O que valida |
|-------|-------------|
| `useChat.test.ts` | Estado inicial, sendMessage (mock), cancelamento, parsing de streaming |
| `useWorkspace.test.ts` | Estado inicial, refresh, CRUD operations |
| `useGit.test.ts` | Estado inicial, status, stage, unstage, commit |
| `useEditor.test.ts` | Estado inicial, open tab, close tab, dirty tracking |
| `useSettings.test.ts` | Estado inicial, load/save, toggle settings |

### 0.2 — Testes dos services

Criar `src/application/services/__tests__/`:

| Teste | O que valida |
|-------|-------------|
| `workspace.test.ts` | CRUD, validação de workspace |
| `git.test.ts` | Status, diff, commit, branches |
| `settings.test.ts` | Load/save, theme toggle |
| `plugins.test.ts` | Refresh, canToggle, verifyPlugin |

### 0.3 — Testes dos componentes (básico)

Criar `src/ui/components/__tests__/` com snapshot/render-tests:

| Teste | O que valida |
|-------|-------------|
| `FilesPanel.test.tsx` | Renderiza sem erro |
| `GitPanel.test.tsx` | Renderiza sem erro |
| `ChatPanel.test.tsx` | Renderiza sem erro |
| `BottomPanel.test.tsx` | Renderiza sem erro |

### Validação

```bash
npm test          # Todos os testes passam (incluindo os novos)
npm run build     # Build continua funcionando
```

---

## 🔴 Etapa 1 — Extrair ChatService + Refatorar useChat

**Problema:** `useChat` é o único hook dos 7 que não usa um application service. Ele importa `createTextProvider` diretamente de `infrastructure/model-providers`, violando DIP.

**Ação:** Criar `application/services/chat.ts` e refatorar `useChat` para usá-lo.

### 1.1 — Criar ChatService

```typescript
// application/services/chat.ts
export function createChatService() {
  return {
    async sendMessage(
      modelId: string,
      providerKind: ProviderKind,
      messages: ChatMessage[],
      onToken: (token: string) => void,
      signal: AbortSignal,
    ): Promise<void> { ... },
  };
}
```

Mover para o service:
- Criação de provider (`createTextProvider`)
- Lógica de streaming (token parsing)
- Tratamento de erros (cancelamento, falha)

### 1.2 — Refatorar useChat

`useChat` passa a:
- Usar `useRef(createChatService())` como os demais hooks
- Gerenciar apenas estado React (messages, isGenerating, streamingContent)
- Chamar `service.sendMessage()` em vez de `createTextProvider` diretamente

### Validação

```bash
npm test          # Testes do hook/chat passam
npm run build     # Build ok
```

---

## 🔴 Etapa 2 — Fatiar infrastructure/native.ts

**Problema:** `native.ts` tem 216 linhas com 24 funções de 6 domínios diferentes (workspace, git, ollama, settings, plugins, notes).

**Ação:** Dividir em arquivos por domínio.

### Estrutura proposta

```
src/infrastructure/native/
├── index.ts        # Barrel: re-exporta tudo
├── workspace.ts    # CRUD de arquivos + busca
├── git.ts          # Status, diff, commit, branches
├── ollama.ts       # Listar/testar modelos
├── settings.ts     # Secure settings load/save
├── plugins.ts      # Listar manifests
└── notes.ts        # Listar/criar notas Markdown
```

### Interfaces compartilhadas

Mover interfaces de `native.ts` para `domain/models.ts` quando forem puras, ou manter em cada arquivo com barrel export.

### Validação

```bash
npm test          # Todos os testes passam
npm run build     # Build ok
```

---

## 🟡 Etapa 3 — Limpeza de Dead Code

**Problema:** Código morto e exports não utilizados poluem a base.

### Ação

| Item | Arquivo | Ação |
|------|---------|------|
| `loadEnabledPlugins` | `shared/persistence.ts` | Remover (não usado) |
| `saveEnabledPlugins` | `shared/persistence.ts` | Remover |
| `loadCustomAgents` | `shared/persistence.ts` | Remover |
| `saveCustomAgents` | `shared/persistence.ts` | Remover |
| Código de migração `vaultPath` | `shared/persistence.ts` | Remover (migração completa) |
| `Nullable<T>` | `shared/index.ts` | Remover (só usado em teste) |
| `pluginVerifierApi` | `shared/helpers.ts` | Remover export (só `verifyPlugin` é usado) |
| `closeTabByPath` do hook | `ui/hooks/useEditor.ts` | Remover do return (não usado em App.tsx) |
| `generationController` do hook | `ui/hooks/useChat.ts` | Remover do return (não usado em App.tsx) |
| `mock-provider.ts` | `infrastructure/mock-provider.ts` | Remover arquivo (só re-export) |
| `defaultSettings` export | `ui/hooks/useSettings.ts` | Remover `export { defaultSettings }` |

### Validação

```bash
npm test          # Testes continuam passando
npm run build     # Build ok sem warnings de unused
```

---

## 🟡 Etapa 4 — Extrair Funções de App.tsx

**Problema:** App.tsx (~750 linhas) ainda contém ~20 funções de orquestração inline que misturam UI, estado e lógica de negócio.

### Ação

| Função | Linhas | Mover para |
|--------|--------|------------|
| `useEffect` de keyboard shortcuts | 222-238 | `ui/hooks/useKeyboardShortcuts.ts` |
| `useEffect` de workspace polling | 212-220 | `ui/hooks/useWorkspace.ts` (ou `useWorkspacePolling.ts`) |
| `runAgent()` + `runProjectBrainAgent()` | 447-529 | `application/services/agent-service.ts` + `ui/hooks/useAgents.ts` |
| `createCustomAgent()` | 531-571 | `ui/hooks/useAgents.ts` |
| `selectAndApplyWorkspace()`, `chooseWorkspace()` | 311-346 | `ui/hooks/useWorkspace.ts` |
| `submitModal()` | 348-405 | `ui/hooks/useModals.ts` |
| `acceptProposal()` | 424-428 | Pode remover (mock) ou mover para `ui/hooks/useEditor.ts` |

### Validação

```bash
npm test          # Testes passam
npm run build     # Build ok
```

---

## 🟡 Etapa 5 — Organizar Barrel Exports + Tipos

**Problema:** `shared/index.ts` não exporta `types.ts`. Tipos de UI estão em `shared/types.ts` em vez de `ui/types.ts`.

### 5.1 — Corrigir barrel exports

| Barrel | Ação |
|--------|------|
| `src/shared/index.ts` | Adicionar `export * from './types'` |
| `src/plugins/index.ts` | Adicionar `export * from './manifests'` |
| `src/infrastructure/native/index.ts` | Garantir que re-exporta tudo |

### 5.2 — Mover tipos de UI

Mover de `shared/types.ts` para `src/ui/types.ts`:
- `ModalState`
- `AgentFormState`
- `ModelHealth`
- `ActivityView`
- `BottomView`

Manter em `shared/types.ts`:
- `ChatMessage`, `ActionLog`, `AuditEvent`, `MemoryEntry`, `ContextResult`
- `SettingsState`, `PermissionId`, `EditorTab`

### Validação

```bash
npm test          # Testes passam
npm run build     # Build ok
```

---

## 🟢 Etapa 6 — Fatiar model-providers.ts

**Problema:** `model-providers.ts` (187 linhas) contém 4 concerns em um arquivo.

### Ação

```
src/infrastructure/providers/
├── index.ts        # Barrel + createTextProvider factory
├── mock.ts         # mockTextProvider
├── ollama.ts       # OllamaTextProvider
├── openai.ts       # OpenAICompatibleTextProvider
└── streams.ts      # readJsonLines, readServerSentEvents
```

### Validação

```bash
npm test          # Testes de mock-provider passam
npm run build     # Build ok
```

---

## 🟢 Etapa 7 — Fatiar styles.css

**Problema:** `styles.css` com 1039 linhas, único arquivo de estilo.

### Ação

```
src/ui/styles/
├── index.css       # Importa todos os parciais
├── reset.css       # Reset/normalize
├── variables.css   # Variáveis CSS (tema dark/light)
├── layout.css      # App shell, sidebar, panels
├── components.css  # Estilos de componentes
└── overrides.css   # Overrides de tema claro
```

### Validação

```bash
npm run build     # Build ok
```

---

## 🟢 Etapa 8 — Expandir Cobertura de Testes

**Problema:** 6 arquivos de teste, 38 testes. Nenhum teste de hook, service ou componente.

### Ação

| Grupo | O que testar |
|-------|-------------|
| **Hooks** | useChat (send, cancel, streaming mock), useWorkspace (refresh, CRUD), useSettings (load, save) |
| **Services** | Cada service com Tauri mockado |
| **Components** | Renderização básica com @testing-library/react |
| **Integration** | Fluxo chat (send → streaming → display), fluxo git (status → stage → commit) |

### Meta

- Mínimo de 70 testes no total
- Cobrir todas as camadas

### Validação

```bash
npm test          # Mínimo 70 testes, todos verdes
```

---

## Ordem de Execução Recomendada

```
Etapa 0 ─── Testes ─── 🛡️ (pré-requisito)
   │
   ▼
Etapa 1 ─── ChatService + useChat ─── 🔴 (DIP)
   │
   ▼
Etapa 2 ─── Fatiar native.ts ─── 🔴 (SRP)
   │
   ▼
Etapa 3 ─── Dead Code ─── 🟡
   │
   ▼
Etapa 4 ─── Extrair App.tsx ─── 🟡 (SRP)
   │
   ▼
Etapa 5 ─── Barrel + Tipos ─── 🟡
   │
   ▼
Etapa 6 ─── Fatiar model-providers ─── 🟢
   │
   ▼
Etapa 7 ─── Fatiar styles.css ─── 🟢
   │
   ▼
Etapa 8 ─── Expandir testes ─── 🟢 (pode rodar em paralelo com etapas 1-7)
```

## Matriz de Riscos

| Etapa | Risco | Mitigação |
|-------|-------|-----------|
| 0 — Testes | Baixo | Só adicionar código, não modificar |
| 1 — ChatService | Médio | Maior mudança em hook existente; testes da etapa 0 validam |
| 2 — native.ts | Baixo | Mover mantendo assinaturas |
| 3 — Dead Code | Baixo | Remoção segura; build valida |
| 4 — App.tsx | Médio | Mover funções sem alterar lógica |
| 5 — Barrel+Tipos | Baixo | Só mover exports |
| 6 — model-providers | Baixo | Mover classes sem alterar API |
| 7 — styles.css | Baixo | Só dividir arquivo existente |
| 8 — Testes | Baixo | Só adicionar código |
