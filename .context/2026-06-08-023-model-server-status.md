# Contexto: Model Server Status Detection + Start Button

**ID:** CONTEXT-023
**Timestamp:** 2026-06-08T08:30:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** context-generator

## Decisao / Conteudo

Adicionado detecção de status do servidor Ollama e botão para iniciar:

### Bridge (Python)
- `getModelServerStatus()` — detecta processo ollama via:
  - Windows: `Get-Process ollama -ErrorAction SilentlyContinue`
  - Linux/Mac: `pgrep -f ollama`
  - Retorna: `{running, command, pid, error}`
  - Detecta caminho de instalação no Windows (LOCALAPPDATA, PROGRAMFILES)
- `startModelServer()` — inicia ollama serve:
  - Windows: `Start-Process -WindowStyle Hidden`
  - Linux/Mac: subprocess.Popen com stdout/stderr para DEVNULL

### UI (ModelsPanel.tsx)
- Banner dinâmico no topo da página de modelos:
  - Verde pulsante quando servidor rodando (com PID e comando)
  - Vermelho quando servidor parado (com comando para iniciar)
  - Botão "▶ Iniciar Servidor" quando parado
- Auto-refresh do status a cada 5 segundos (setInterval)
- Feedback visual durante start (2s timeout antes de re-check)

## Arquivos Afetados

- `backend/jarvis/bridge.py` — getModelServerStatus + startModelServer
- `ui/src/components/Settings/ModelsPanel.tsx` — Server status banner + start button
- `ui/src/types/index.ts` — ModelServerStatus interface
- `ui/src/hooks/use-jarvis.ts` — getModelServerStatus + startModelServer

## Proximos Passos

- Fase 6: Native Folder Picker para abrir projetos
- Adicionar suporte a detecção de ollama em WSL

## Notas

- Detecção no Windows usa PowerShell (Get-Process)
- Botão só aparece quando servidor não está rodando
- Refresh automático a cada 5s para capturar start/stop manual
