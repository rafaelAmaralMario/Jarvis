# Contexto: Native Folder Picker

**ID:** CONTEXT-024
**Timestamp:** 2026-06-08T08:35:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** context-generator

## Decisao / Conteudo

Adicionado seletor de pastas nativo usando PowerShell (Windows), osascript (macOS), zenity/kdialog (Linux):

### Bridge (Python)
- `showFolderPicker()` — abre dialog nativo e retorna path selecionado:
  - Windows: `System.Windows.Forms.FolderBrowserDialog` via PowerShell
    - Dialog com `TopMost=true` para aparecer sobre a janela
    - `ShowNewFolderButton=true` para criar pastas
  - macOS: `choose folder` via osascript, converte para POSIX path
  - Linux: tenta zenity, fallback para kdialog, retorna None se nenhum disponível
  - Retorna `None` se usuário cancelar (string vazia não é path válido)

### UI (WorkspacePanel.tsx)
- Botão "+ Add Folder" agora chama `bridge.showFolderPicker()` primeiro
- Se usuário seleciona pasta nativamente → adiciona direto sem input manual
- Se usuário cancela dialog → mostra input text manual como fallback
- Fluxo: Native picker → fallback input → sucesso/erro

## Arquivos Afetados

- `backend/jarvis/bridge.py` — showFolderPicker (+~45 linhas)
- `ui/src/components/Workspace/WorkspacePanel.tsx` — handleOpenFolder usa picker nativo
- `ui/src/types/index.ts` — showFolderPicker no JarvisBridge
- `ui/src/hooks/use-jarvis.ts` — showFolderPicker implementado

## Proximos Passos

- Fase 7: Documentação final
- Indicador visual de projeto ativo com switch entre projetos
- Suporte a arrastar pastas para a sidebar

## Notas

- PowerShell FolderBrowserDialog é o dialogo nativo mais confiável no Windows
- Cancelar o dialog retorna None → fallback para input manual
- Timeout de 30s para evitar trava se dialog travar
