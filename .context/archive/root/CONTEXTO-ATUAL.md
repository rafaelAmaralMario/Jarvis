# Contexto Atual do Projeto JARVIS

> Atualizado em: 10/06/2026

---

## 1. O que foi implementado

### 1.1 Bloco 1 — Correções Críticas (Ollama/Modelos)
- **ModelServerStatus**: ping com timeout 3s + `_find_ollama_in_path()` detecta instalação
- **startModelServer**: subprocess direto (sem PowerShell wrapper), `CREATE_NEW_CONSOLE`
- **listModels**: auto-start do servidor se conexão falhar
- **Chat timeout**: 3min no polling do AiPanel, timeout configurável no OllamaClient (padrão 120s)
- **StatusBar**: indicador Ollama clicável → abre settings/models

### 1.2 Bloco 2 — Features Rápidas
- **Context Menu (FileTree)**: "Enviar para o Chat" (arquivos), "Revisar/Criar Testes/Docs/Refatorar" (pastas), "Analisar/Suggest Features/.env.example" (vazio)
- **GeneralPanel**: language, theme, font sizes, auto-save, default model

### 1.3 Bloco 3 — Task Planner UI
- **PlannerPanel**: componente completo com input, Run, progresso, checkpoints, resume, cancel
- Novos tipos TypeScript: `PlannerProgress`, `PlannerCheckpoint`, `PlannerPanel`
- View `'planner'` na ActivityBar

### 1.4 Agente com Contexto Total
- **ToolAgent.execute()** aceita `history` (mensagens anteriores) e `system_override` (prompt personalizado do agente)
- **Bridge** passa histórico da conversa + system prompt do agente selecionado
- **AiPanel** envia `history` + `agentId` + `unattended` para o backend
- `_extract_tool_call` reforçado com 3 padrões de regex

### 1.5 Self-Improvement Module
- `self_improvement.py`: ciclo analisar → propor → executar
- Lê Project.md, context files, git log, file tree
- Gera proposta estruturada via LLM (summary, priority, steps, risks)
- Executa passos com permissão individual (ou modo não assistido)
- Streaming via bridge (`_sistreams`)

### 1.6 Modo Não Assistido + Novas Ferramentas
- Checkbox **"🔓 Não Assistido"** no chat (persiste localStorage)
- Quando ativo: **todas as permissões são puladas** — agente tem carta branca
- Novas ferramentas no ToolManager:
  | Ferramenta | Descrição | Risco |
  |---|---|---|
  | `download_file` | Baixa arquivos de URL (imagens, vídeos, etc.) | ASK |
  | `install_package` | Instala npm/pip com auto-detecção | ASK |
  | `create_note` | Salva planos/docs no Knowledge com timestamp | ASK |
  | `list_notes` | Lista notas do Knowledge por pasta | SAFE |
  | `search_notes` | Busca notas no Knowledge por texto | SAFE |

### 1.7 Integração com Knowledge
- ToolManager recebe referência ao `KnowledgeManager`
- Agente pode criar notas estruturadas com timestamps
- Notas organizadas em pastas (`/projects/nome/`)
- Suporte a wikilinks (`[[Note Title]]`)

---

## 2. Commits Recentes

| Hash | Descrição |
|------|-----------|
| `ba3f7859` | Bloco 1: ModelServerStatus, chat timeout, models list/start |
| `c232bb5c` | Bloco 2: Context Menu AI + General Settings |
| `c7bb017a` | Task Planner UI |
| `2d812d2d` | Agent autonomy — history, custom prompts, self-improvement |
| `8ccd4622` | Unattended mode + Knowledge tools + download/install |

---

## 3. Pendências

### 3.1 Conhecidas (não implementadas)
- **T4: Workspace+Editor unification** — file tree com ícones, drag & drop, busca unificada
- **T8: Terminal+Output+MCP consolidation** — unificar painéis de terminal, output e MCP
- **T9: Provider proxy** — roteamento de LLM com failover entre provedores
- **Testes e2e para as novas features** — testes para unattended mode, self-improvement, planner UI

### 3.2 Problemas Conhecidos
- `web_search`/`web_fetch` usam `verify=False` no SSL (necessário no ambiente local)
- Permissões do SecurityManager não são consultadas durante execução de ferramentas (apenas RiskLevel do ToolManager)
- ToolAgent não tem suporte a streaming de tokens durante tool calls (apenas resultado final)

### 3.3 Dívida Técnica
- Bridge tem `_tool_agent` como singleton — pode haver race condition se mensagens concorrentes forem enviadas
- TaskPlanner não expõe `pendingQuestion` para o frontend (não permite intervenção durante execução de plano)
- Agentes built-in têm system prompts extensos mas não são usados pelo ToolAgent (agora corrigido parcialmente)

---

## 4. Próximos Passos (Priorizados)

### Imediatos
1. **T4: Workspace+Editor unification** — unificar file tree, editor tabs, busca global
2. **Testes para unattended mode + self-improvement** — cobrir os novos fluxos
3. **Provider proxy (T9)** — roteamento inteligente entre Ollama, OpenAI, llama-cpp-python

### Curto Prazo
4. **T8: Terminal+Output+MCP consolidation** — interface unificada
5. **Multimodal support** — camera, audio, video, documentos como entrada
6. **Plugin system** — permitir ferramentas de terceiros via plugin API

### Médio Prazo
7. **Migração para llama-cpp-python** — ver análise separada `MIGRACAO-LLAMACPP.md`
8. **Orquestração multi-agente** — usar o OrchestrationManager com agentes especializados
9. **Memória persistente** — agente lembrar de decisões entre sessões

---

## 5. Arquitetura Atual (Resumo)

```
Frontend (React + Vite)
  ↓ pywebview IPC
Bridge (JARVISBridge)
  ├── ToolManager (ferramentas + permissões)
  ├── ToolAgent (loop autônomo)
  ├── TaskPlanner (decomposição DAG)
  ├── SelfImprovement (melhoria contínua)
  ├── KnowledgeManager (notas + busca)
  ├── AgentsManager (agentes built-in + custom)
  └── LLMGateway (abstração de provedores)
       ├── Ollama (provedor atual)
       ├── OpenAI (suporte)
       └── (futuro: llama-cpp-python)
```

### Fluxo de Execução
1. Usuário envia mensagem no chat
2. AiPanel → `bridge.toolAgentExecuteStream(query, history, agentId, unattended)`
3. Bridge cria `ToolAgent` com callbacks de streaming
4. ToolAgent loop: LLM decide → executa ferramenta → observa resultado → repete
5. Frontend polling 100ms atualiza UI com tokens + tool calls + resultados
6. Se ASK/DANGER e modo assistido: pausa para permissão do usuário
7. Se modo não assistido: executa diretamente
