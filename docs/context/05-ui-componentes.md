# Interface do Usuário — Componentes e Funcionalidades

## Arquitetura da UI

- **Componente principal:** `src/ui/App.tsx` (~750 linhas) — composição de hooks + componentes
- **Hooks customizados:** `src/ui/hooks/` (13 hooks de estado)
- **Componentes React:** `src/ui/components/` (17 componentes de UI)
- **Estilos:** `src/ui/styles.css` (~1197 linhas) — tema dark/light, scrollbars, animações

## Estrutura do Layout

```
┌─────────────────────────────────────────────────┐
│  Activity Bar (ícones verticais à esquerda)      │
├────┬────────────────────────┬───────────────────┤
│    │                        │                   │
│ A  │   Sidebar             │   AI Panel        │
│ c  │   (contextual)        │   (chat)          │
│ t  │                        │                   │
│ i  ├────────────────────────┤                   │
│ v  │   Editor (Monaco)     │                   │
│ i  │   com tabs            │                   │
│ t  │                        │                   │
│ y  ├────────────────────────┴───────────────────┤
│    │  Bottom Panel (Logs/Diff/Proposal/Audit)   │
└────┴────────────────────────────────────────────┘
```

## Estrutura de Componentes

```
src/ui/
├── App.tsx              # Componente principal (~750 linhas)
├── styles.css           # Estilos globais
├── constants.tsx        # Constantes de UI (activityItems, sidebarTitle, commands, etc.)
├── TreeEntry.tsx        # Componente de entrada de árvore (explorador de arquivos)
├── hooks/               # 13 hooks customizados de estado
│   ├── useWorkspace.ts  # Estado do workspace (path, files, search)
│   ├── useGit.ts        # Estado Git (status, branches, diff)
│   ├── useEditor.ts     # Estado do editor (tabs, activeTab, dirty)
│   ├── useChat.ts       # Estado do chat (mensagens, input, geração)
│   ├── useSettings.ts   # Estado das configurações
│   ├── usePlugins.ts    # Estado dos plugins (enable/disable)
│   ├── useContextManager.ts  # Estado de contexto (memória, notas)
│   ├── useAgents.ts     # Estado dos agentes (custom, form)
│   ├── useModals.ts     # Estado de modais
│   ├── useAudit.ts      # Estado de auditoria
│   ├── usePalette.ts    # Estado da paleta de comandos
│   ├── useLogs.ts       # Estado de logs
│   └── usePanelResize.ts # Estado de redimensionamento
├── components/          # 17 componentes React
│   ├── ActivityBar.tsx
│   ├── FilesPanel.tsx
│   ├── SearchPanel.tsx
│   ├── GitPanel.tsx
│   ├── SettingsPanel.tsx
│   ├── PluginsPanel.tsx
│   ├── ContextPanel.tsx
│   ├── AgentsPanel.tsx
│   ├── HelpPanel.tsx
│   ├── EditorPanel.tsx
│   ├── BottomPanel.tsx
│   ├── LogsView.tsx
│   ├── ProposalView.tsx
│   ├── AuditView.tsx
│   ├── ChatPanel.tsx
│   ├── CommandPalette.tsx
│   └── ModalDialog.tsx
```

## Activity Bar (views)

| View | Ícone | Função |
|------|-------|--------|
| Files | 📁 | Explorador de arquivos com árvore |
| Search | 🔍 | Busca textual no workspace |
| Git | ⎇ | Status, diff, stage, commit, branches |
| Settings | ⚙️ | Configurações de modelo, tema, vaults |
| Plugins | 🔌 | Gerenciar plugins ativados/desativados |
| Context | 🧠 | Memória do projeto, notas Markdown |
| Agents | 🤖 | Agentes de IA built-in e customizados |
| Help | ❓ | Guias de configuração |

## Funcionalidades Implementadas

### File Explorer
- Tree view do workspace
- Criar/renomear/mover/deletar arquivos e pastas
- Abrir arquivos em tabs do Monaco

### Monaco Editor
- Múltiplas tabs com dirty indicator
- Salvamento com indicador visual
- Temas dark/light sync

### Git Panel
- `git status --short`
- `git diff` por arquivo
- Stage/unstage individual
- Commit com mensagem
- Branch management (list, checkout, create)
- Geração de URL de PR do GitHub

### AI Chat Panel
- Streaming de respostas
- Cancelamento
- Seletor de modelo ativo
- Indicador de saúde do modelo
- Histórico por workspace (localStorage)

### Settings
- Seleção de provider (mock/Ollama/OpenAI-compatible)
- Teste de modelo
- Dark/Light theme toggle
- Configuração de Obsidian vault
- Gerenciamento de permissões por workspace

### Plugins Panel
- Visualizar plugins built-in e locais
- Ativar/desativar com verificação de permissões

### Context Panel
- Busca de contexto
- Adicionar entradas de memória
- Enviar para Obsidian
- Navegar por notas Markdown

### Agents Panel
- 4 agentes built-in
- Execução de agente
- Criação de agentes customizados via IA

### Command Palette
- Atalho: Ctrl+Shift+P
- Acesso rápido a comandos

### Bottom Panel
- Logs: histórico de ações
- Diff: visualização de diferenças
- Proposal: propostas de mudança
- Audit: trilha de auditoria

### Recursos Gerais
- Painéis redimensionáveis por drag
- Alternância dark/light theme
- Modal de confirmação para operações de arquivo
- Indicadores de status nas ações

## Persistência (Frontend)

| Dado | Local |
|------|-------|
| Settings | `localStorage` (`jarvis.settings.v1`) |
| Chat history | `localStorage` por workspace (`jarvis.chat.<path>`) |
| Audit events | `localStorage` por workspace (`jarvis.audit.<path>`) |
| Memory entries | `localStorage` por workspace (`jarvis.memory.<path>`) |
| Enabled plugins | `localStorage` (`jarvis.plugins.enabled`) |
| Custom agents | `localStorage` (`jarvis.agents.custom`) |
| API keys | Rust backend (`%APPDATA%/JARVIS/secure-settings.json`) |

## Pontos de Atenção

- styles.css extenso (~1197 linhas) — candidato a modularização futura
- Tema claro tem overrides completos sobre o escuro
