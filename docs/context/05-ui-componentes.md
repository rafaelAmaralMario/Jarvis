# Interface do Usuário — Componentes e Funcionalidades

## Arquitetura da UI

- **Componente principal:** `src/ui/App.tsx` (~2584 linhas) — aplicação single-file React
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

- App.tsx muito grande (~2584 linhas) — candidato a refatoração em componentes menores
- styles.css também extenso (~1197 linhas)
- Tema claro tem overrides completos sobre o escuro
