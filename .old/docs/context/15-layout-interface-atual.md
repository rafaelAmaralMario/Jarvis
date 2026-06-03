# Layout e Interface — Estado Atual (MVP)

## Visão Geral

O layout atual do JARVIS é uma **IDE de painel triplo** com barra de atividade vertical, sidebar contextual, área de editor central com painel inferior e painel de IA à direita. Todos os painéis são redimensionáveis via drag.

```
┌────┬──────────────────┬──────────────────────┬──────────────────┐
│    │  Panel Header    │  Top Bar              │  Panel Header    │
│ A  ├──────────────────┤  (app name + model)   ├──────────────────┤
│ c  │  Sidebar         ├──────────────────────┤  AI Panel        │
│ t  │  (contextual:    │  Editor Tabs          │  (Chat)          │
│ i  │   files/search/  ├──────────────────────┤                  │
│ v  │   git/settings/  │  Editor (Monaco)      │                  │
│ i  │   plugins/       │  ou Agent Designer    │                  │
│ t  │   context/       ├──────────────────────┤                  │
│ y  │   agents/help)   │  Bottom Panel         │                  │
│    │                  │  (logs/diff/proposal/ │                  │
│ B  │                  │   audit/terminal)     │                  │
│ a  │                  │                       │                  │
│ r  │                  │                       │                  │
└────┴──────────────────┴──────────────────────┴──────────────────┘
```

## Estrutura de Componentes

```
src/ui/
├── App.tsx                  # Componente raiz — orquestra hooks + layout grid
├── styles.css               # @import dos 4 módulos CSS
├── styles/
│   ├── reset.css            # Reset, variáveis, tipografia
│   ├── theme.css            # Temas dark/light + animações
│   ├── layout.css           # Grid principal, painéis, resizers
│   └── components.css       # Todos os estilos de componentes
├── constants.tsx            # activityItems, sidebarTitle, bottomLabels, commands, medidas
├── types.ts                 # ActivityView, BottomView, ModalState, AgentFormState
├── TreeEntry.tsx            # Árvore recursiva do explorador de arquivos
├── hooks/                   # 13 hooks de estado
│   ├── useWorkspace.ts
│   ├── useGit.ts
│   ├── useEditor.ts
│   ├── useChat.ts
│   ├── useSettings.ts
│   ├── usePlugins.ts
│   ├── useContextManager.ts
│   ├── useAgents.ts
│   ├── useModals.ts
│   ├── useAudit.ts
│   ├── usePalette.ts
│   ├── useLogs.ts
│   └── usePanelResize.ts
└── components/              # 17 componentes React
    ├── ActivityBar.tsx       # Ícones verticais à esquerda
    ├── FilesPanel.tsx        # Explorador de arquivos
    ├── SearchPanel.tsx       # Busca textual
    ├── GitPanel.tsx          # Controle de versão
    ├── SettingsPanel.tsx     # Configurações de modelo/tema/vault
    ├── PluginsPanel.tsx      # Gerenciamento de plugins
    ├── ContextPanel.tsx      # Memória e notas
    ├── AgentsPanel.tsx       # Agentes de IA
    ├── HelpPanel.tsx         # Documentação de configuração
    ├── EditorPanel.tsx       # Top bar, tabs, Monaco + BottomPanel
    ├── BottomPanel.tsx       # Abas inferiores (logs/diff/proposal/audit/terminal)
    ├── LogsView.tsx          # Histórico de ações
    ├── ProposalView.tsx      # Proposta de alteração com aceite
    ├── AuditView.tsx         # Trilha de auditoria
    ├── ChatPanel.tsx         # Painel de IA (chat)
    ├── CommandPalette.tsx    # Paleta de comandos (Ctrl+Shift+P)
    └── ModalDialog.tsx       # Modal de confirmação/criação
```

## Detalhamento das Áreas

### 1. Activity Bar (`ActivityBar.tsx`)
- Ícone do JARVIS (SVG) no topo
- 8 botões de navegação vertical com ícones Lucide (17px):
  - Arquivos (Folder) — padrão ativo
  - Busca (Search)
  - Git (GitBranch)
  - Configuracoes (Settings)
  - Plugins (Boxes)
  - Contexto (Code2)
  - Agentes (Bot)
  - Ajuda (CircleHelp)
- Botão ativo: borda verde (`#75d3b5`) com animação pulse-soft
- Botões inativos: borda `#303846`, cor `#aeb7c5`
- Largura fixa: `52px`

### 2. Sidebar (painel lateral esquerdo)
- Header com título uppercase baseado na view ativa (`sidebarTitle`)
- Renderiza conteúdo conforme `activeView`:
  - **files**: `FilesPanel` — toolbar com 6 botões (abrir pasta, criar arquivo, criar pasta, renomear, mover, remover, atualizar) + workspace path + árvore recursiva via `TreeEntry`
  - **search**: `SearchPanel` — input de busca + botão Buscar + lista de resultados
  - **git**: `GitPanel` — input de mensagem de commit (com "Sugerir" e "Commit"), input de nova branch ("Criar branch"), "Gerar URL de PR", lista de branches, lista de arquivos com stage/unstage/diff
  - **settings**: `SettingsPanel` — projeto atual, provider (mock/Ollama/OpenAI-compatible), modelo ativo, testar/iniciar modelo, endpoint Ollama, pasta de modelos, endpoint OpenAI, API key, tema (dark/light), vaults Obsidian, centro de permissões (5 permissões)
  - **plugins**: `PluginsPanel` — botão "Recarregar manifestos locais" + cards de plugin com ativar/desativar
  - **context**: `ContextPanel` — destino ativo, busca de contexto, nova memória (salvar local / enviar ao Obsidian), cards de resultado, memórias locais, notas Markdown
  - **agents**: `AgentsPanel` — "Criar novo agente" (se modelo OK) + lista de agentes com "Executar"
  - **help**: `HelpPanel` — guias de instalação Ollama, OpenAI, LM Studio, agentes

### 3. Editor Central (`EditorPanel.tsx`)
- **Top Bar**: nome do app + descrição + `model-badge` (nome do modelo ativo, clicável para abrir Command Palette)
- **Editor Tabs**: abas para cada arquivo aberto, com `dirty-dot` (ponto amarelo), botão "x" para fechar, botão "Salvar" com ícone, clique do meio fecha aba
- **Editor Frame**: Monaco Editor (tema `vs-dark` / `light` sync) ou Agent Designer (formulário de criação de agente)
- **Bottom Panel** (190px altura): abas inferiores — Logs, Diff, Proposta, Auditoria, Terminal

### 4. Bottom Panel (`BottomPanel.tsx`)
- 5 abas de navegação:
  - **Logs**: `LogsView` — lista de ações com status (ok/warn)
  - **Diff**: `<pre>` raw diff ou diff do arquivo Git selecionado
  - **Proposta**: `ProposalView` — diff formatado + botão "Aceitar proposta" com `CheckCircle2`
  - **Auditoria**: `AuditView` — grid de eventos (ator, timestamp, permissão, alvo, resultado)
  - **Terminal**: `<pre>` estático com comando `npm run tauri -- dev`

### 5. AI Panel / Chat (`ChatPanel.tsx`)
- Header "IA"
- `chat-messages`: mensagens role='user' (borda azul) e role='assistant' (padrão)
- `chat-input`: textarea + botão "Enviar" (Sparkles) + "Cancelar" (quando gerando)
- Empty state: "Envie uma mensagem para testar o provider mockado."

### 6. Overlays
- **Command Palette**: `Ctrl+Shift+P`, overlay com backdrop-blur, input + lista de comandos filtrados
- **Modal Dialog**: criação/renomeação/movimentação/exclusão de arquivos, troca de workspace

## Sistema de Grid

O layout usa CSS Grid no `.app-shell`:

```css
.app-shell {
  display: grid;
  grid-template-columns: 52px <sidebar> 4px minmax(520px, 1fr) 4px <ai-panel>;
}
```

As colunas são controladas dinamicamente via `style={{ gridTemplateColumns }}` com valores de `panelWidths` do hook `usePanelResize`.

Subgrids:
- `.sidebar`: `grid-template-rows: 40px minmax(0, 1fr)` (header + conteúdo)
- `.ai-panel`: `grid-template-rows: 40px minmax(0, 1fr) auto` (header + mensagens + input)
- `.workbench`: `grid-template-rows: 48px 36px minmax(260px, 1fr) 190px` (top bar + tabs + editor + bottom)

## Medidas e Constantes

| Constante | Valor | Uso |
|-----------|-------|-----|
| `activityBarWidth` | 52px | Largura fixa da Activity Bar |
| `sidebarMinWidth` | 260px | Mínimo da sidebar |
| `aiPanelMinWidth` | 360px | Mínimo do painel de IA |
| `editorMinWidth` | 520px | Mínimo do editor |
| `combinedResizerWidth` | 8px | Soma dos dois resizers (4px cada) |
| `bottom-panel` | 190px | Altura fixa do bottom panel |

## Navegação (Views)

| View (`ActivityView`) | Atalho | Sidebar renderiza |
|------------------------|--------|-------------------|
| `files` | Padrão | FilesPanel |
| `search` | Command Palette | SearchPanel |
| `git` | — | GitPanel |
| `settings` | Command Palette | SettingsPanel |
| `plugins` | — | PluginsPanel |
| `context` | — | ContextPanel |
| `agents` | — | AgentsPanel |
| `help` | Command Palette | HelpPanel |

`BottomView`: `'terminal' | 'logs' | 'diff' | 'proposal' | 'audit'`

## Botões e Controles Interativos (Inventário Completo)

### ActivityBar
- 8 botões de navegação (icone + tooltip)

### FilesPanel
- `FolderOpen` — Abrir pasta
- `FilePlus2` — Criar arquivo (abre modal)
- `FolderPlus` — Criar pasta (abre modal)
- `Pencil` — Renomear selecionado (abre modal)
- `MoveRight` — Mover selecionado (abre modal)
- `Trash2` (danger) — Remover selecionado (abre modal)
- `RefreshCw` — Atualizar workspace
- Cada TreeEntry: `FilePlus2`, `FolderPlus`, `Pencil`, `Trash2` (hover actions)

### SearchPanel
- Input + Enter para buscar
- Botão "Buscar" (Search)
- Resultados clicáveis

### GitPanel
- "Atualizar status" (RefreshCw)
- Input mensagem de commit + "Sugerir" + "Commit"
- Input nova branch + "Criar branch"
- "Gerar URL de PR"
- Link "Abrir Pull Request"
- Branch buttons (checkout)
- Por arquivo: "Stage" / "Unstage", diff ao clicar na linha

### SettingsPanel
- "Selecionar pasta do projeto" (FolderOpen)
- Select de provider (mock/ollama/openai-compatible)
- Select de modelo ativo
- "Testar modelo" (Sparkles)
- "Iniciar modelo selecionado" (Sparkles)
- Input endpoint Ollama
- Input pasta de modelos + "Escolher pasta" + "Detectar modelos"
- Input endpoint OpenAI-compatible
- Input API key (password) + "Salvar chave"
- Select tema (dark/light)
- Select destino contexto (geral/projeto)
- Input vault geral + input vault projeto
- "Validar e carregar notas do destino"
- 5 toggles de permissão (read-workspace, write-workspace, git, network, secrets)

### PluginsPanel
- "Recarregar manifestos locais"
- Por plugin: "Ativar" / "Desativar"

### ContextPanel
- Input busca de contexto + "Buscar memoria"
- Textarea nova memoria + "Salvar local" + "Enviar ao Obsidian"

### AgentsPanel
- "Novo agente" (primary, disabled se modelHealth !== 'ok')
- Por agente: "Executar"

### HelpPanel
- "Iniciar modelo selecionado" (se provider === ollama)
- Links externos (Ollama, OpenAI, LM Studio)

### EditorPanel
- Tabs clicáveis + "x" para fechar
- Botão "Salvar" (Save)
- Monaco Editor interativo
- Agent Designer: inputs nome + textarea intent + 5 checkboxes permissão + "Criar agente com IA"

### BottomPanel
- 5 abas: Logs, Diff, Proposta, Auditoria, Terminal
- ProposalView: "Aceitar proposta" (CheckCircle2)

### ChatPanel
- Textarea input + "Enviar" (Sparkles) + "Cancelar"

### CommandPalette
- Input + lista de comandos clicáveis

### ModalDialog
- Input + "Cancelar" + "Confirmar" (ou apenas confirmação para delete/switch-workspace)

## Temas

### Tema Escuro (padrão)
- Background: `#101317` (app-shell), `#171b21` (activity-bar), `#15191f` (sidebar/panels)
- Bordas: `#252b34` (painéis), `#303846` (componentes), `#2b3340` (cards)
- Texto primário: `#e7ebf2`, secundário: `#aeb7c5`, muted: `#8f9bab`
- Destaque (accent): `#75d3b5` (verde), `#3c8dbc` (resizer hover)
- Perigo: `#e06c75` (vermelho), fundo `#5a2028`
- Aviso: `#f7c86a` (amarelo)
- Código: `"Cascadia Code", Consolas, monospace`

### Tema Claro
- Overrides completos no `theme.css`
- Background: `#f4f6f8`, componentes `#ffffff`
- Bordas: `#d8dee8`
- Texto: `#202833` (primário), `#5f6b7a` (secundário)
- Aba ativa: `#e8f0f6`
- Resizer hover: `#3c8dbc`

### Animação
- `panel-in`: fade-in + translateY(4px→0) em 180ms
- `pulse-soft`: box-shadow pulsante no botão ativo (2.6s)
- Transições: 140ms–160ms ease em hover/active de botões, borders, cores

## CSS Architecture

```
styles.css (4 @imports)
├── reset.css      (37 linhas)  — CSS reset, variáveis raiz, tipografia Inter
├── theme.css      (94 linhas)  — @keyframes + .theme-light overrides
├── layout.css     (213 linhas) — Grid principal, dimensões, resizers, workbench, bottom-panel
└── components.css (856 linhas) — Todos os componentes UI
```

Total: ~1200 linhas. Sem CSS modules, sem CSS-in-JS. Todo o estilo é global com prefixo de classe.

## Responsividade
- **Não responsivo**: `min-width: 1200px` no `.app-shell`
- Viewport mínimo de 1200px para manter layout utilizável
- Painéis redimensionáveis por drag, mas sem quebra de layout para telas menores
- Overlays (palette, modal) têm `width: min(520px, calc(100vw - 32px))`

## Hooks de Estado (13)

| Hook | Estado gerenciado |
|------|-------------------|
| `useWorkspace` | workspacePath, files, expandedFolders, selectedEntry, searchQuery, searchResults |
| `useGit` | gitFiles, gitBranches, commitMessage, branchName, prUrl, diff |
| `useEditor` | tabs, activeTabPath, activeTab, dirtyTabs |
| `useChat` | chatInput, messages, generationActive, chatHydratedWorkspace |
| `useSettings` | settings, secureApiKey, modelHealth, modelTestActive, localOllamaModels |
| `usePlugins` | enabledPlugins, localPlugins |
| `useContextManager` | notes, memoryEntries, memoryInput, contextQuery, contextResults |
| `useAgents` | customAgents, agentForm, agentCreationActive |
| `useModals` | modal, modalValue |
| `useAudit` | auditEvents |
| `usePalette` | paletteOpen, paletteQuery, filteredCommands |
| `useLogs` | logs |
| `usePanelResize` | panelWidths (sidebar + ai), startPanelResize |

## Gap Analysis: Atual vs. Planejado (`docs/interface-layout.md`)

### Implementado
- Activity Bar com 8 ícones
- Sidebar contextual com 8 views
- Editor com Monaco + abas + dirty indicator
- AI/Context Panel (ChatPanel)
- Bottom Panel (logs, diff, proposal, audit, terminal placeholder)
- Command Palette (Ctrl+Shift+P)
- Modal de confirmação
- Tema dark/light
- Estado vazio no chat
- Model-badge no top bar

### Parcialmente implementado
- **Top Bar**: existe (app name + description + model-badge), mas falta seletor rápido de modelo, indicador de agente ativo, botão de configurações — o model-badge abre a Command Palette, não um seletor
- **Painel inferior**: terminal é placeholder estático, não um terminal real
- **Permissões**: badges de permissão mencionados no plano não existem como badges visuais
- **Plugins**: sem drawer de detalhes, apenas card simples

### Não implementado (vs. plano)
- **Status Bar** (Git branch, workspace, modelo, permissões, conexão) — **não existe**
- **Seletor rápido de modelo** no top bar
- **Indicador de agente ativo** no top bar
- **Preview de Markdown** (o Monaco exibe markdown como texto, sem preview renderizado)
- **Diff viewer** visual (apenas `<pre>` raw, sem highlight)
- **Toast de resultado** (usa logs no bottom panel em vez de toast)
- **Badge de agente** como componente visual
- **Drawer de detalhes** para plugins/agentes
- **Split panes** além do grid fixo (não há split interno no editor)
- **Estados importantes** específicos: sem workspace aberto state, workspace sem Git, provider não configurado, indexação em andamento — alguns existem como mensagens de warning mas não como telas dedicadas
- **Histórico de ações** no AI Panel (só existe no bottom panel > auditoria)
- **Ferramentas disponíveis** no AI Panel
- **Contexto usado na resposta** no AI Panel
- **Sugestões e propostas** fora do fluxo de agente developer
- **Navegação por teclado** além do Ctrl+Shift+P e Ctrl+S
- **Nenhuma nota do Obsidian encontrada** — estado existe mas sem tratamento visual destacado

### Diferenças de design
- O plano menciona "Botao com icone" como componente padrão — não existe componente Button isolado, cada botão é inline com classes
- O plano lista "Split panes" como componente — o layout atual usa CSS Grid fixo com resizers, não split panes aninháveis
- O plano menciona "agentes", "contexto", "plugins" como itens da Activity Bar — implementado
- O plano não menciona a view "Ajuda" (HelpPanel) — implementada como view extra

### Resumo quantitativo
- **8/8** views da Activity Bar implementadas
- **1/6** áreas do layout plano: Top Bar (parcial), Activity Bar (completo), Sidebar (completo), Editor (completo), AI Panel (completo), Bottom Panel (parcial), Status Bar (ausente)
- **~12/17** componentes padrão do plano implementados ou com equivalente funcional
