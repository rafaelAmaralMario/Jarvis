# Contexto: Refinamento de Modelos, Classificação e Chat

**ID:** CONTEXT-002
**Timestamp:** 2026-06-12T14:00:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** context-generator

## Decisao / Conteudo

### Problemas Identificados e Correcoes

1. **Default Model no GeneralPanel removido** — nao faz sentido ter um campo de texto livre para "modelo padrao" quando o sistema agora usa classificacao por especialidade.

2. **Terminal abrindo toda hora** — `listModels()` no bridge chamava `startModelServer()` quando detectava que o Ollama estava offline. `startModelServer()` usava `subprocess.CREATE_NEW_CONSOLE` que abria uma janela de terminal visivel. Corrigido: `listModels()` apenas loga o erro, nao tenta mais iniciar o servidor automaticamente.

3. **Erro '"tool"' no chat** — o backend retornava `state.error = "tool"` quando uma ferramenta falhava, sem contexto. Corrigido para mostrar o erro real da ferramenta.

4. **Badge "Ollama connected" removido** — badge estatico e enganoso no cabecalho das Settings.

5. **Modernizacao dos seletores no Chat (AiPanel)**:
   - Seletor de **Agente**: dropdown estilizado com icone de especialidade (🔍🧠💻📐👁🤖)
   - Seletor de **Provedor** (Ollama/Native): dropdown ao lado do agente
   - Seletor de **Modelo**: carregado dinamicamente baseado no provedor + especialidade
   - Filtragem por especialidade: mostra apenas modelos compativeis com a especialidade do agente

6. **Classificacao obrigatoria por especialidade**:
   - Agentes e modelos sao classificados em: `chat`, `code`, `reasoning`, `embedding`, `vision`, `general`
   - Cada especialidade tem um **modelo default** configurado via backend (nova config `default_models_by_specialty`)
   - Interface nas Settings para configurar modelo default por especialidade

7. **Prioridade de resolucao de modelo**:
   ```
   1. Modelo recomendado do agente (agent.model)
   2. Se nao existir → modelo default da especialidade do agente
   3. Se usuario sobrecarregou no chat → modelo escolhido no chat
   4. Se nenhum modelo disponivel → mensagem de erro orientando a iniciar um modelo
   ```

8. **Auto-registro do provider NATIVE** — se houver arquivos .gguf em `~/.jarvis/models/`, o provider `native` e registrado automaticamente com o primeiro modelo como default.

9. **ModelsManager inclui GGUF** — `list_models()` agora lista modelos GGUF junto com os do Ollama, mesmo se Ollama estiver offline.

## Arquivos Afetados

### Frontend (React/TypeScript)
- `ui/src/components/AiPanel.tsx` — seletores modernizados, logica de prioridade, error handling
- `ui/src/components/Settings/GeneralPanel.tsx` — removido campo Default Model
- `ui/src/components/Settings/SettingsPage.tsx` — removido badge Ollama connected
- `ui/src/components/Settings/ModelClassificationPanel.tsx` — NOVO: config de default model por especialidade
- `ui/src/types/index.ts` — adicionados tipos `ModelDefaultBySpecialty`, `getLogPath` na interface

### Backend (Python)
- `backend/jarvis/bridge.py` — removido auto-start de `startModelServer()`, adicionado `getLogPath()`
- `backend/jarvis/models_manager.py` — incluido GGUF models no listing
- `backend/jarvis/llm_gateway.py` — auto-registro do NATIVE provider se houver GGUF
- `backend/jarvis/orchestration_manager.py` — migrado de OllamaClient direto para LLMGateway com fallback
- `backend/jarvis/main.py` — validacao de agentes considera GGUF + Ollama

### Contexto
- `.context/CONTEXTO-COMPLETO.md` — atualizado com novo fluxo de modelos e prioridades

## Proximos Passos

- Testar build completo com `build_installer`
- Validar fluxo de fallback entre providers no OrchestrationManager
- Verificar se o seletor de modelo no chat carrega corretamente os modelos do provider selecionado

## Notas

A prioridade de resolucao de modelo segue:

```
Agente (agent.model + agent.provider)
  → se modelo nao existe no provider escolhido
    → fallback para default model da especialidade do agente (configurado em Settings)
      → se usuario escolheu modelo diferente no chat (chat override)
        → usa override do chat
          → se nenhum modelo disponivel
            → mensagem "Nenhum modelo disponivel para esta especialidade. Inicie um modelo em Settings → Models."
```

O seletor de modelo no chat so mostra modelos:
1. Do provedor selecionado (Ollama ou Native)
2. Que sejam compativeis com a especialidade do agente selecionado (por nome)
