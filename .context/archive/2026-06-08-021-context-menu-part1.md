# Contexto: Context Menu Reutilizável + Bridge Utilities

**ID:** CONTEXT-021
**Timestamp:** 2026-06-08T08:10:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** context-generator

## Decisao / Conteudo

Implementado sistema de context menu reutilizável e utilitários de bridge:

### ContextMenu Componente (`ui/src/components/ui/ContextMenu.tsx`)
- Componente genérico com items tipados (`ContextMenuItem`)
- Suporte a ícone, atalho, disabled, danger, divider
- Posicionamento automático com boundary detection
- Fechamento ao clicar fora (mousedown) ou Escape
- Z-index 100 para sobrepor qualquer conteúdo

### Prevenção Global
- `App.tsx` adiciona listener `contextmenu` que previne default
- Elementos com atributo `data-context-menu-enabled` podem ter menu próprio

### File Tree Context Menu (`FileTree.tsx`)
- Menu sensível ao contexto (raiz vs diretório vs arquivo)
- Raiz: Novo Arquivo, Nova Pasta, Abrir Projeto
- Diretório: Novo Arquivo, Nova Pasta, Renomear, Excluir, Copiar Caminho, Copiar Relativo, Abrir Pasta
- Arquivo: Abrir, Renomear, Excluir, Copiar Caminho, Copiar Relativo, Abrir Pasta

### Editor Tabs Context Menu (`EditorPanel.tsx`)
- Salvar, Fechar, Salvar Todos, Fechar Outros, Fechar Todos
- Copiar Caminho
- Abrir no Painel Esquerdo/Direito

### Bridge Utilities (`backend/jarvis/bridge.py`)
- `copyToClipboard(text)` — PowerShell (Win), osascript (Mac), xclip (Linux)
- `revealInExplorer(path)` — explorer (Win), open -R (Mac), xdg-open (Linux)
- `getRelativePath(base, target)` — os.path.relpath
- `getPlatform()` — windows/macos/linux
- `getPathSeparator()` — \\ ou /
- `getModelServerStatus()` — detecta processo ollama, retorna running/command/pid
- `startModelServer()` — inicia ollama serve via subprocess

### Types + Hook
- `ModelServerStatus` interface adicionada
- 7 novos métodos no `JarvisBridge`
- Hook `use-jarvis.ts` atualizado com os métodos

## Arquivos Afetados

- `ui/src/components/ui/ContextMenu.tsx` — Novo (85 linhas)
- `ui/src/components/Workspace/FileTree.tsx` — Rewrite com ContextMenu + novos actions
- `ui/src/components/Editor/EditorPanel.tsx` — ContextMenu substitui inline
- `ui/src/App.tsx` — Prevenção global de contextmenu
- `backend/jarvis/bridge.py` — 7 novos métodos utilitários
- `ui/src/types/index.ts` — ModelServerStatus + novos métodos bridge
- `ui/src/hooks/use-jarvis.ts` — 7 novos métodos
- `ROADMAP.md` — Criado

## Proximos Passos

- Fase 4: Agent Panel Context Menu
- Fase 5: Model Server Status UI (ModelCard + ModelsPanel)
- Fase 6: Native Folder Picker
- Fase 7: Documentação completa

## Notas

- Clipboard usa PowerShell no Windows (mais confiável que ctypes)
- Reveal in Explorer usa `explorer /select,` para selecionar o arquivo
- Model server detection usa `Get-Process ollama` no Windows, `pgrep` no Linux/Mac
- Browser default context menu desabilitado globalmente
