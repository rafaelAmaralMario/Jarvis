# Funcionalidades Atuais do JARVIS — v0.1.0

## 1. Funcionalidades do Produto

### 1.1. Gerenciamento de Workspace e Arquivos

- **Abertura de projeto:** seletor de pasta nativo usando `@tauri-apps/plugin-dialog`; carrega a árvore de arquivos do diretório selecionado.
- **Árvore de arquivos:** listagem recursiva com profundidade máxima de 8 níveis; diretórios e arquivos exibidos com ícones; ordenação diretórios primeiro, depois arquivos, ambos alfabéticos.
- **CRUD de arquivos e pastas:**
  - Criar arquivo vazio
  - Criar pasta
  - Renomear entrada
  - Mover entrada entre pastas
  - Deletar entrada (com proteção contra remoção da raiz do workspace)
- **Busca textual:** busca case-insensitive no workspace com limite de 200 resultados; respeita `.gitignore` e diretórios ignorados (`.git`, `node_modules`, `target`, `dist`, `.vite`, `.tmp`, `tmp`, `temp`).
- **Abrir arquivo no Monaco Editor:** ao abrir um arquivo, o conteúdo é lido via Tauri e exibido em uma aba do Monaco; se o arquivo já estiver aberto, a aba existente é reutilizada.
- **Polling de workspace:** a cada 8 segundos, o workspace é atualizado silenciosamente para refletir mudanças externas.

### 1.2. Editor de Código (Monaco Editor)

- **Múltiplas abas:** com suporte a dirty indicator (ponto amarelo quando há alterações não salvas).
- **Detecção de linguagem:** mapeamento de extensão para linguagem Monaco via `languageRegistry` (`css`, `html`, `js`, `json`, `md`, `rs`, `ts`, `tsx`, `plaintext`).
- **Salvamento:** atalho `Ctrl+S` ou botão Salvar; bloquear salvamento de tabs especiais (`welcome.md`, `jarvis://new-agent`).
- **Fechamento de aba:** com detecção de dirty state; modal de confirmação se houver alterações não salvas; clique do meio para fechar.
- **Temas:** sincroniza com o tema da aplicação (`vs-dark` para dark, `light` para light).
- **Minimap desabilitado** por padrão.

### 1.3. Git

- **Status:** `git status --short` exibido no Git Panel com arquivos modificados, staged e untracked.
- **Diff:** `git diff -- <file>` por arquivo; exibido no Bottom Panel.
- **Stage/Unstage:** `git add -- <file>` e `git restore --staged -- <file>` operations individuais.
- **Commit:** com validação de mensagem vazia; logs e trilha de auditoria registrados.
- **Branches:**
  - Listar branches (`git branch --list`)
  - Checkout de branch (`git checkout <branch>`)
  - Criar branch (`git checkout -b <branch>`)
- **Pull Request URL:** gera URL de comparação GitHub (`https://github.com/<repo>/compare/main...<branch>?expand=1`).
- **Sugestão de mensagem de commit:** baseada nos nomes dos arquivos modificados (ex.: `chore: update file1.ts, file2.ts`).

### 1.4. Chat com IA

- **Streaming de respostas:** tokens são exibidos em tempo real via callback `onToken`.
- **Cancelamento:** suporte a `AbortController` para interromper geração.
- **Seletor de modelo ativo:** modelos disponíveis conforme provider configurado.
- **Indicador de saúde do modelo:** exibe `ok`, `fail` ou `unknown` conforme resultado do teste.
- **Histórico por workspace:** armazenado em `localStorage` sob chave `jarvis.chat.<path>`.
- **Modo escuro/claro:** o chat segue o tema da aplicação.

### 1.5. Providers de IA

- **Mock Provider:** respostas simuladas com chunks pré-definidos e delay de 90ms por chunk; valida fluxo de chat sem modelo real.
- **Ollama Provider:** conexão com Ollama local via `POST /api/generate`; streaming via JSON lines; detecção de modelos instalados no filesystem (`~/.ollama/models/blobs/manifests`).
- **OpenAI-compatible Provider:** conexão com qualquer endpoint compatível com OpenAI API; streaming via Server-Sent Events.
- **8 modelos no registry:**
  - 3 mock (`mock-text`, `mock-image`, `mock-embeddings`)
  - 2 Ollama (`ollama:llama3.2`, `ollama:qwen2.5-coder`)
  - 2 OpenAI-compatible (`openai:gpt-4.1-mini`, `openai:image-model`)
  - Padrão: `mock-text`
  - Modelos Ollama detectados dinamicamente são mesclados ao registry automaticamente.
- **Teste de modelo:** envia "Responda apenas OK" para validar funcionalidade; timeout de 12 segundos.
- **Modelos Ollama detectados dinamicamente** mesclados ao registry com `mergeModelRegistry`.

### 1.6. Agentes de IA

- **4 agentes built-in:**

| ID | Nome | Função | Permissões |
|---|---|---|---|
| `project-brain` | Cérebro do Projeto | Analisa projeto e gera nota Markdown para Obsidian | read-workspace |
| `developer` | Desenvolvedor | Propõe alterações de código em diff | read-workspace, write-workspace |
| `reviewer` | Revisor | Revisa mudanças, riscos e gaps de teste | read-workspace, git |
| `documenter` | Documentador | Sugere documentação para features e decisões técnicas | read-workspace |

- **Execução de agente:** cada agente gera saída específica (`diff`, `review`, `docs`, `context`) exibida no Bottom Panel ou enviada ao Obsidian.
- **Agentes customizados:** criados via Agent Designer; nome, objetivo e permissões definidos pelo usuário; refinados pelo modelo ativo.
- **Verificação de permissões:** antes de executar, o sistema valida se o workspace concedeu as permissões necessárias.

### 1.7. Sistema de Plugins

- **3 plugins built-in:**

| ID | Nome | Capabilities |
|---|---|---|
| `jarvis.mock-provider` | Mock AI Provider | models.text, models.code |
| `jarvis.git` | Git Local | git.status, git.diff |
| `jarvis.obsidian` | Obsidian Context | context.markdown, obsidian.vault.read |

- **Plugins locais:** carregados do workspace via `jarvis.plugins.json` (raiz) ou `.jarvis/plugins/*.json`.
- **Ativação/desativação:** interface no Plugins Panel com verificação de permissões.
- **Verificação de permissões:** usa strategy pattern com `createPluginVerifier`; valida se plugin é válido, se requer `commands.execute` (bloqueado no MVP), e checa permissões individuais (`secrets.read`, `network.request`, `git.write`).
- **Estados:** Built-in, Local (loaded), Active, Inactive, Blocked.

### 1.8. Permissões e Segurança

- **5 permissões base:**

| ID | Risco | Descrição |
|---|---|---|
| `read-workspace` | Baixo | Analisar arquivos do projeto |
| `write-workspace` | Alto | Criar propostas de modificação |
| `git` | Médio | Ler status e diffs Git |
| `network` | Alto | Providers e integrações externas |
| `secrets` | Crítico | Acessar chaves salvas |

- **Configuração por workspace** no Settings Panel.
- **Audit trail:** toda ação sensível registra: actor, permissão usada, alvo, resultado; armazenado em localStorage por workspace (`jarvis.audit.<path>`).
- **Segurança no Rust:**
  - `ensure_inside_workspace()` previne path traversal
  - `validate_entry_name()` sanitiza nomes de arquivo
  - `validate_ollama_model_name()` sanitiza nomes de modelo
  - `sanitize_note_title()` sanitiza títulos de nota
- **API keys armazenadas no backend** (`%APPDATA%/JARVIS/secure-settings.json`), não no frontend.

### 1.9. Integração com Obsidian

- **Configuração de vault:** dois vaults configuráveis: geral (conhecimento reutilizável) e específico do projeto.
- **Listagem de notas:** varredura recursiva de arquivos `.md` no vault, ignorando `.obsidian`, `.git`, `node_modules`.
- **Escrita de notas:** cria arquivos `.md` no vault com título sanitizado.
- **Memory entries:** entradas de memória salvas em localStorage por workspace (`jarvis.memory.<path>`).
- **Busca de contexto:** busca textual simples com tokenização e scoring.

### 1.10. Interface do Usuário

- **Activity Bar:** 8 views verticais (Files, Search, Git, Settings, Plugins, Context, Agents, Help) com ícones Lucide.
- **Sidebar contextual:** exibe o painel correspondente à view ativa.
- **Editor Panel:** abas + Monaco Editor + Bottom Panel.
- **Bottom Panel:** 5 abas (Logs, Diff, Proposal, Audit, Terminal com placeholder).
- **Painéis redimensionáveis:** sidebar e AI Panel redimensionáveis por drag com `onPointerDown`.
- **Command Palette:** atalho `Ctrl+Shift+P` com comandos rápidos (abrir pasta, salvar, busca, configurações, ajuda, alternar tema).
- **Modal de confirmação:** para operações destrutivas (delete, fechar aba suja, trocar workspace).
- **Tema dark/light:** alternância com persistência em localStorage.
- **Guias de ajuda:** instruções integradas para configuração de Ollama, OpenAI e LM Studio.

### 1.11. Persistência

| Dado | Chave localStorage | Local |
|---|---|---|
| Settings | `jarvis.settings.v1` | Frontend |
| Chat history | `jarvis.chat.<path>` | Frontend por workspace |
| Audit events | `jarvis.audit.<path>` | Frontend por workspace |
| Memory entries | `jarvis.memory.<path>` | Frontend por workspace |
| Enabled plugins | `jarvis-enabled-plugins` | Frontend |
| Custom agents | `jarvis-custom-agents` | Frontend |
| API keys | — | Backend Rust (`secure-settings.json`) |

---

## 2. Funcionalidades Técnicas

### 2.1. Arquitetura (Frontend — `src/`)

```
src/
├── ui/                    # Camada de apresentação (React 19)
│   ├── App.tsx            # Componente principal (~637 linhas)
│   ├── constants.tsx      # Constantes de UI (activityItems, commands, etc.)
│   ├── TreeEntry.tsx      # Componente de árvore do explorador
│   ├── hooks/             # 13 hooks customizados
│   ├── components/        # 17 componentes React
│   ├── styles/            # CSS modular (reset, theme, layout, components)
│   └── types.ts           # Tipos específicos de UI
├── application/           # Casos de uso e orquestração
│   ├── services/          # 8 services (workspace, git, editor, settings, plugins, context, chat, agent)
│   ├── model-registry.ts  # Registry pattern para modelos
│   └── app-metadata.ts    # Metadados da aplicação
├── domain/                # Tipos e contratos puros
│   └── models.ts          # AiModel, TextModelProvider, ProviderSettings, etc.
├── infrastructure/        # Adaptadores para Tauri e providers de IA
│   ├── native.ts          # Barrel para comandos Tauri (workspace, git, ollama, settings, plugins, notes)
│   ├── model-providers.ts # Factory createTextProvider
│   ├── workspace.ts       # CRUD de arquivos via invoke Tauri
│   ├── git.ts             # Operações Git via invoke Tauri
│   ├── ollama.ts          # Operações Ollama via invoke Tauri
│   ├── settings.ts        # Secure settings via invoke Tauri
│   ├── plugins.ts         # Plugin manifests locais
│   ├── note.ts            # Notas Markdown via invoke Tauri
│   ├── tauri.ts           # Detecção de runtime Tauri
│   └── providers/         # Implementações de providers (mock, ollama, openai)
├── agents/                # Definições de agentes (registry pattern)
├── plugins/               # Definições de plugins (manifests + tipos)
└── shared/                # Utilitários compartilhados
    ├── utils.ts           # clamp, normalizePath, languageRegistry, etc.
    ├── persistence.ts     # Load/save localStorage
    ├── helpers.ts         # verifyPlugin, mergeModelRegistry, searchContext, etc.
    └── types.ts           # ChatMessage, SettingsState, EditorTab, etc.
```

### 2.2. Regras de Dependência (estritas)

```
UI Components → Hooks → Application Services → Infrastructure (native.ts) → Tauri invoke → Rust
domain/ → nada (tipos puros)
application/ → domain/ + interfaces
infrastructure/ → domain/ (implementa interfaces)
ui/hooks/ → application/services/ (nunca infrastructure diretamente)
ui/components/ → recebem props dos hooks (nunca chamam services/infrastructure)
```

### 2.3. Backend Rust (`src-tauri/src/`)

| Módulo | Responsabilidade | Linhas |
|---|---|---|
| `main.rs` | Entry point | 3 |
| `lib.rs` | Builder Tauri com 26 comandos registrados | 47 |
| `commands/mod.rs` | Thin wrappers Tauri que delegam aos módulos | 173 |
| `workspace/mod.rs` | CRUD de arquivos, busca, validações de path | 382 |
| `git/mod.rs` | Status, diff, stage, unstage, commit, branches, PR URL | 157 |
| `services/mod.rs` | Ollama (detecção, start, test), notas Markdown | 222 |
| `security/mod.rs` | Leitura e validação de manifests de plugins locais | 90 |
| `storage/mod.rs` | Persistência segura em `%APPDATA%/JARVIS/secure-settings.json` | 37 |

**Dependências Rust:** `serde`, `serde_json`, `tauri 2.11.2`, `tauri-plugin-dialog 2.7.1`.

### 2.4. Providers de IA — Implementações

**MockProvider** (`infrastructure/providers/mock.ts`):
- Objeto singleton com chunks pré-definidos
- Delay de 90ms entre chunks
- Suporte a `AbortSignal` (lança `AbortError`)

**OllamaTextProvider** (`infrastructure/providers/ollama.ts`):
- `POST /api/generate` com `stream: true`
- Parsing de JSON lines (cada linha tem `response`, `done`)
- Construtor recebe `baseUrl`

**OpenAICompatibleTextProvider** (`infrastructure/providers/openai.ts`):
- `POST /chat/completions` com `stream: true`
- Header `Authorization: Bearer <apiKey>` quando chave presente
- Parsing de Server-Sent Events (formato `data: {...}\n\n`)
- Detecta `[DONE]` como marcador de fim

### 2.5. UI — Hooks (13 hooks)

| Hook | Estado gerenciado | Service usado |
|---|---|---|
| `useWorkspace` | files, search, expanded folders, workspacePath | WorkspaceService |
| `useGit` | gitFiles, branches, diff, commit/branch input | GitService |
| `useEditor` | tabs, activeTab, dirty tracking | EditorService |
| `useChat` | messages, generationActive, streaming | ChatService |
| `useSettings` | settings, secureApiKey, modelHealth | SettingsService |
| `usePlugins` | enabledPlugins, localPlugins | PluginService |
| `useContextManager` | notes, memoryEntries, context search | ContextService |
| `useAgents` | customAgents, agentForm, agent creation | AgentService |
| `useModals` | modal state, modal value | (nenhum) |
| `useAudit` | audit events | (nenhum) |
| `usePalette` | palette open, query, filtered commands | (nenhum) |
| `useLogs` | action logs | (nenhum) |
| `usePanelResize` | panel widths, resize handlers | (nenhum) |

### 2.6. UI — Componentes (17 componentes)

`ActivityBar`, `FilesPanel`, `SearchPanel`, `GitPanel`, `SettingsPanel`, `PluginsPanel`, `ContextPanel`, `AgentsPanel`, `HelpPanel`, `EditorPanel`, `ChatPanel`, `BottomPanel`, `LogsView`, `ProposalView`, `AuditView`, `CommandPalette`, `ModalDialog`.

### 2.7. Estilos

- `styles.css` (~1039 linhas) — arquivo principal que importa os módulos do `styles/`.
- `styles/reset.css` (37 linhas) — reset/normalize básico.
- `styles/theme.css` (94 linhas) — variáveis e overrides do tema claro.
- `styles/layout.css` (213 linhas) — grid do app shell, sidebar, panels.
- `styles/components.css` (856 linhas) — estilos de todos os componentes.

### 2.8. Testes

**Stack:** Vitest v4 + @testing-library/react v16 + jsdom v29 + @testing-library/jest-dom v6.

**Total: 36 testes (safety net) + testes de services = ~50 testes**

| Arquivo | Testes | O que valida |
|---|---|---|
| `domain/__tests__/models.test.ts` | 5 | Tipos, interfaces, estrutura |
| `application/__tests__/model-registry.test.ts` | 7 | Modelos, default, register, byProvider |
| `infrastructure/__tests__/mock-provider.test.ts` | 5 | Resposta, abort, streaming |
| `agents/__tests__/definitions.test.ts` | 7 | 4 agentes built-in, estrutura, register |
| `plugins/__tests__/manifests.test.ts` | 6 | 3 plugins, campos obrigatórios, unique ids |
| `shared/__tests__/persistence.test.ts` | 8 | Settings round-trip, workspace isolation |
| `shared/__tests__/index.test.ts` | 3 | Nullable type |
| `application/services/__tests__/workspace.test.ts` | 5 | Refresh, erro, quiet mode, search |
| `application/services/__tests__/git.test.ts` | 9 | Diff, stage, unstage, commit, branch, PR URL |
| `application/services/__tests__/chat.test.ts` | 5 | Create, send, streaming, cancel |
| `application/services/__tests__/agent.test.ts` | 6 | Run brain agent, create agent |

**Mock do Tauri:** `__mocks__` directory exists but is empty (tests use `vi.mock` directly).

**Cobertura atual:** ~50 testes, nenhum teste de hook ou componente React.

### 2.9. Infraestrutura

- **Tauri v2.11.2:** framework desktop com 26 comandos registrados.
- **Vite v7.2.4:** dev server em `http://127.0.0.1:1420`, build de produção.
- **TypeScript 5.9.3:** configuração strict.
- **Monaco Editor 0.55.1** via `@monaco-editor/react` 4.7.0.
- **Lucide React 1.17.0:** ícones na UI.
- **Tauri plugin dialog 2.7.1:** seletor de pasta nativo.
- **Prettier + EditorConfig + rustfmt:** formatação consistente.

### 2.10. Ferramentas de Qualidade

- Prettier (`.prettierrc.json`, `.prettierignore`)
- EditorConfig (`.editorconfig`)
- rustfmt (`rustfmt.toml`)
- TypeScript strict mode
- Vitest para testes

---

## 3. O Que Funciona e O Que Não Funciona

### 3.1. ✅ Funciona (MVP completo)

- [x] Abertura e navegação de workspace
- [x] CRUD completo de arquivos e pastas
- [x] Busca textual no workspace
- [x] Editor Monaco com múltiplas abas, dirty indicator, salvamento
- [x] Git: status, diff, stage/unstage, commit, branch management, PR URL
- [x] Chat com IA: streaming, cancelamento, histórico por workspace
- [x] Mock provider funcional
- [x] Ollama provider (conexão local, detecção de modelos, teste)
- [x] OpenAI-compatible provider (API key no backend, streaming)
- [x] 4 agentes built-in com verificação de permissões
- [x] Criação de agentes customizados
- [x] 3 plugins built-in
- [x] Carregamento de plugins locais do workspace
- [x] Ativação/desativação de plugins com verificação de permissões
- [x] 5 permissões base configuráveis por workspace
- [x] Audit trail
- [x] Integração com Obsidian (listar/escrever notas)
- [x] Memory entries com busca de contexto
- [x] Command Palette (`Ctrl+Shift+P`)
- [x] Modal de confirmação
- [x] Tema dark/light
- [x] Painéis redimensionáveis
- [x] Guias de ajuda integradas
- [x] Testes unitários (~50 testes rodando com Vitest)
- [x] Refatoração SOLID concluída (9 etapas)
- [x] Arquitetura em camadas (domain, application, infrastructure, ui)
- [x] Registry patterns (model-registry, agent-registry, language-registry, plugin-verifier)
- [x] Services extraídos com DIP aplicado
- [x] CSS modularizado (4 arquivos no `styles/`)
- [x] `native.ts` fatiado por domínio (workspace, git, ollama, settings, plugins, notes)
- [x] `model-providers.ts` fatiado (mock, ollama, openai, utils)
- [x] `commands/mod.rs` reduzido de 879 para 173 linhas

### 3.2. ⚠️ Funciona Parcialmente / Work in Progress

- **Terminal integrado:** existe a aba "Terminal" no Bottom Panel com um placeholder estático (`npm run tauri -- dev`). **Não é um terminal funcional** — não executa comandos, não tem processo real, não suporta input do usuário.
- **Aplicação de diffs:** o botão "Aceitar Proposta" existe e registra no audit log, mas **não aplica mudanças reais** no arquivo — é uma proposta mockada.
- **Agentes:** a execução de agentes (developer, reviewer, documenter) gera conteúdo mockado (diffs, revisões, documentação) baseado no conteúdo da aba ativa, **não usa o modelo de IA ativo para gerar conteúdo**. Apenas o `project-brain` (Cérebro do Projeto) usa o modelo ativo.
- **Pull Request:** gera apenas a URL de comparação GitHub; **não cria PRs nem faz push**.
- **Git push/pull/fetch:** não implementado. Apenas operações locais funcionam.
- **Testes de hooks e componentes:** nenhum teste implementado para hooks ou componentes React.
- **Busca semântica:** o `searchContext` é uma busca textual simples baseada em tokenização e scoring, **não usa embeddings**.
- **Diff side-by-side:** não implementado; o diff é exibido como texto puro.
- **Filtros no audit trail:** não implementado; todos os eventos são exibidos sem possibilidade de filtro.

### 3.3. ❌ Não Funciona / Não Implementado

- **Push, pull, fetch** do Git
- **Criação de PR** pela UI (gera apenas URL)
- **Aplicação real de diffs** (propostas mockadas)
- **Terminal real** (placeholder estático)
- **Execução sandboxada de plugins** (`commands.execute` bloqueado)
- **Busca semântica com embeddings**
- **Login/integração GitHub** (OAuth)
- **Resolução de conflitos de merge**
- **Diff side-by-side**
- **Plugin signing/verification**
- **Plugin marketplace**
- **Ícones finais** (usa placeholder JARVIS)
- **Binary signing** (Windows/macOS)
- **Auto-update**
- **CI/CD pipeline** (GitHub Actions)
- **Telemetria**
- **Módulo de voz**

### 3.4. 🔴 Problemas Técnicos Conhecidos

- **Cobertura de testes baixa:** ~50 testes apenas. Nenhum teste de hook, componente React, ou integração. Camadas críticas (useChat, useWorkspace, SettingsPanel) sem testes.
- **`useChat` é o único hook que ainda importa de `infrastructure` diretamente** (via `ChatService` que usa `createTextProvider`). Apesar de ter um service, o DIP ainda não está 100% — os demais hooks foram refatorados para usar services.
- **`styles.css` (~1039 linhas)** ainda é grande apesar da modularização — `components.css` sozinho tem 856 linhas.
- **`App.tsx` (~637 linhas)** ainda contém lógica de orquestração que poderia ser extraída (ex.: `submitModal`, `runAgent`, `chooseWorkspace`).
- **Código morto** identificado em `persistence.ts` (funções não usadas como `loadEnabledPlugins`, `saveEnabledPlugins`, `loadCustomAgents`, `saveCustomAgents`).
- **`Nullable<T>`** em `shared/index.ts` é usado apenas em teste, não em produção.
- **Barrel exports incompletos** em `shared/index.ts` (não exporta `types.ts`).

---

## 4. Estatísticas do Projeto

| Métrica | Valor |
|---|---|
| Versão | 0.1.0 |
| Frontend TypeScript | ~7.200 linhas (estimado) |
| Backend Rust | ~1.100 linhas (estimado) |
| Arquivos de teste | 11 arquivos |
| Total de testes | ~50 |
| Commits | ~42 |
| Hooks React | 13 |
| Componentes React | 17 |
| Serviços de aplicação | 8 |
| Comandos Tauri | 26 |
| Agentes built-in | 4 |
| Plugins built-in | 3 |
| Providers de IA | 3 (mock, ollama, openai-compatible) |
| Documentos de contexto | 14 |
| ADRs | 4 |

---

## 5. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Desktop Framework | Tauri | 2.11.2 |
| Frontend Framework | React | 19.2.1 |
| Linguagem Frontend | TypeScript | 5.9.3 |
| Build Tool | Vite | 7.2.4 |
| Editor | Monaco Editor | 0.55.1 |
| Ícones | Lucide React | 1.17.0 |
| Test Runner | Vitest | 4.1.8 |
| Test Library | @testing-library/react | 16.3.2 |
| Backend Language | Rust | edition 2021 |
| Serialização | serde + serde_json | 1.0 |
| Diálogos | @tauri-apps/plugin-dialog | 2.7.1 |
| Gerenciamento de estado | React hooks + localStorage | — |
