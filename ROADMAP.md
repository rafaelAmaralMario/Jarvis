# Roadmap — Editor Context Menu + Model Server Status

## Status
- ✅ = Concluído
- 🔄 = Em andamento
- ⬜ = Pendente

---

### Fase 1: ContextMenu Componente Reutilizável + Prevenção de Menu Padrão
**Descrição:** Extrair context menus inline para um componente `<ContextMenu>` genérico. Desabilitar o menu de contexto padrão do navegador em toda a app.

- [x] Criar `ui/src/components/ui/ContextMenu.tsx` — componente reutilizável
- [x] Adicionar prevenção global de `contextmenu` no `App.tsx`
- [x] Substituir context menu inline do `FileTree.tsx` pelo novo componente
- [x] Substituir context menu inline do `EditorPanel.tsx` pelo novo componente
- [x] Adicionar métodos bridge: `copyToClipboard`, `revealInExplorer`, `getRelativePath`, `getPlatform`, `getPathSeparator`, `getModelServerStatus`, `startModelServer`
- [x] Atualizar types (`JarvisBridge`, `ModelServerStatus`)
- [x] Atualizar hook `use-jarvis.ts`

**Commit:** `feat: reusable ContextMenu component + app-wide right-click prevention`
**Contexto:** `.context/2026-06-08-021-context-menu-part1.md`

---

### Fase 2: File Tree Context Menu Aprimorado
**Descrição:** Adicionar ações do VS Code ao menu de contexto da árvore de arquivos.

- [x] Novo Arquivo, Nova Pasta (raiz/diretório/arquivo)
- [x] Renomear, Excluir (diretório/arquivo)
- [x] Copiar Caminho Absoluto
- [x] Copiar Caminho Relativo
- [x] Abrir Pasta do Arquivo (Reveal in Explorer)
- [x] Abrir Projeto (acionar seletor de pasta nativo)
- [x] Menu sensível ao contexto (raiz vs diretório vs arquivo)
- [x] Menu na raiz da árvore (ao clicar em espaço vazio)

**Commit:** (mesmo commit da Fase 1 — implementado junto)

---

### Fase 3: Editor Tabs Context Menu Aprimorado
**Descrição:** Adicionar ações de editor ao menu de contexto das abas.

- [x] Salvar, Fechar (individuais)
- [x] Salvar Todos, Fechar Outros, Fechar Todos
- [x] Copiar Caminho do Arquivo
- [x] Abrir no Painel Esquerdo / Direito (split)
- [x] Shortcuts visuais (Ctrl+S, Ctrl+W)

**Commit:** (mesmo commit da Fase 1 — implementado junto)

---

### Fase 4: Agent Panel Context Menu
**Descrição:** Adicionar menu de contexto contextual no painel do agente.

- [x] Adicionar `data-context-menu-enabled` no painel do agente
- [x] Opções: Novo Chat, Limpar Conversa, Copiar Última Resposta, Exportar Chat, Configurações do Agente
- [x] Menu sensível ao contexto (com seleção vs sem seleção)

**Commit:** `feat: agent panel context menu`

---

### Fase 5: Model Server Status — Detectar e Iniciar Servidor
**Descrição:** Detectar se o servidor Ollama está rodando e oferecer botão para iniciar.

- [x] Método bridge `getModelServerStatus()` — detecta processo ollama
- [x] Método bridge `startModelServer()` — inicia servidor com comando
- [x] Método bridge `getModelServerStatus()` — detecta processo ollama
- [x] Método bridge `startModelServer()` — inicia servidor com comando
- [x] Atualizar `ModelsPanel.tsx` — indicador global de servidor + botão iniciar
- [x] Auto-refresh do status a cada 5s

**Commit:** `feat: model server status detection + start button`

---

### Fase 6: Native Folder Picker + Project Management
**Descrição:** Usar seletor de pastas nativo do Windows para abrir projetos.

- [x] Método bridge `showFolderPicker()` via PowerShell/zenity/osascript
- [x] Atualizar `WorkspacePanel.tsx` — botão "Abrir Pasta" abre dialog nativo
- [x] Fallback para input manual se dialog for cancelado
- ⬜ Indicador visual de projeto ativo com switch entre projetos

**Commit:** `feat: native folder picker dialog`

---

### Fase 7: Documentação Final + Contextos
**Descrição:** Gerar docs, README, e arquivos de contexto para cada fase.

- [x] Contexto Fase 1-3: `021-context-menu-part1.md`
- [x] Contexto Fase 4: `022-agent-context-menu.md`
- [x] Contexto Fase 5: `023-model-server-status.md`
- [x] Contexto Fase 6: `024-native-folder-picker.md`
- [x] Atualizar `.context/INDEX.md`
- [x] E2E tests (Playwright) — 9 testes, bridge mock + context menu + models

---

## Legenda
- ✅ = Concluído / Commit feito
- 🔄 = Em andamento
- ⬜ = Pendente
