# 011 — AI Engine Integration

## Metadados
- **Status:** ⬜ A Fazer
- **Prioridade:** 🔴 Alta
- **Dependências:** 002 (Estrutura C++ Kernel), 005 (Models & Agents C++), 006 (Models & Agents React), 007 (Bridge WebChannel)

## Descrição
Integrar o AI Engine completo: conectar ModelsManager, AgentsManager e
OrchestrationManager ao chat do AiPanel, com histórico de conversas,
streaming de respostas, e feedback do Critic Agent.

## Especificação Técnica

### Arquivos a Modificar
```
kernel/src/ai/
├── models_manager.cpp           ← Já existe, integrar com chat
├── agents_manager.cpp           ← Já existe
├── orchestration_manager.cpp    ← Já existe, conectar streaming
└── ollama_client.cpp            ← Já existe, testar streaming real

kernel/src/bridge/
└── web_channel.cpp              ← Conectar handlers de AI ao chat

ui/src/components/AiPanel.tsx   ← Conectar com streaming real
ui/src/hooks/use-jarvis.ts      ← Sem fallback mock, bridge real
```

### Fluxo de Chat Completo
```
1. Usuário digita mensagem no AiPanel
2. React chama window.jarvis.sendMessage(text, agentId)
3. C++ OrchestrationManager recebe query
4. Se orquestração ligada: roteia para specialists
5. Cada specialist chama OllamaClient.generate()
6. Respostas parciais streamadas para React (chunks)
7. Consolidator junta respostas
8. Critic Agent revisa resposta final
9. Resposta final enviada para React
10. Conversa salva em agent_conversations + conversation_messages
```

### Conversas
- Cada conversa tem ID, título (auto-gerado), agentId
- Mensagens com role (user/assistant/system), content, tokens, timestamp
- Histórico enviado como contexto para Ollama (últimas N mensagens)
- Botão "Nova Conversa" limpa contexto

## Critérios de Aceitação
- [ ] Chat funcional com Ollama real
- [ ] Streaming de respostas (chunks aparecem em tempo real)
- [ ] Multi-agent orchestration funcionando
- [ ] Histórico de conversas persistido
- [ ] Critic Agent revisa e aprova/rejeita
- [ ] Troca de agent durante conversa
- [ ] Loading states e tratamento de erro

---

## Test Cases

### TC-001: Chat simples com Ollama
- **Pré-condições:** Ollama rodando, modelo llama3 disponível
- **Passos:**
  1. Digitar "Olá, quem é você?"
  2. Pressionar Enter
  3. Aguardar resposta
- **Resultado esperado:** Resposta streamada em chunks, semântica correta
- **Cobertura:** normal

### TC-002: Streaming visual
- **Pré-condições:** Chat ativo
- **Passos:**
  1. Enviar mensagem que gera resposta longa
  2. Observar UI durante resposta
- **Resultado esperado:** Texto aparece incrementalmente (chunks), cursor piscando
- **Cobertura:** normal

### TC-003: Cancelamento de resposta
- **Pré-condições:** Resposta em andamento
- **Passos:**
  1. Clicar "Cancelar" ou "Stop" durante streaming
- **Resultado esperado:** Ollama cancela geração, UI para de mostrar chunks
- **Cobertura:** normal

### TC-004: Multi-agent orchestration
- **Pré-condições:** Orchestration ligada, 2+ agents no pool
- **Passos:**
  1. Enviar pergunta técnica: "Explique SOLID em C++"
  2. Observar trace badges
- **Resultado esperado:** Badges mostram agents consultados, resposta final consolidada
- **Cobertura:** normal

### TC-005: Critic Agent rejeita resposta
- **Pré-condições:** Critic configurado com requireApproval=true
- **Passos:**
  1. Enviar pergunta complexa
- **Resultado esperado:** Se critic rejeitar, nova rodada de geração ocorre
- **Cobertura:** borda

### TC-006: Histórico de conversa
- **Pré-condições:** 3 mensagens trocadas
- **Passos:**
  1. Fechar AiPanel
  2. Reabrir
  3. Verificar histórico preservado
- **Resultado esperado:** Conversa mantida com scroll no final
- **Cobertura:** normal

### TC-007: Nova conversa limpa contexto
- **Pré-condições:** Conversa com 5 mensagens
- **Passos:**
  1. Clicar "Nova Conversa"
- **Resultado esperado:** Chat limpo, mas conversas anteriores acessíveis no histórico
- **Cobertura:** normal

### TC-008: Troca de agente no meio da conversa
- **Pré-condições:** Conversa ativa com Agent A
- **Passos:**
  1. Trocar para Agent B no seletor
  2. Enviar mensagem
- **Resultado esperado:** Agent B responde, badge mostra Agent B
- **Cobertura:** normal

### TC-009: Ollama offline mostra erro amigável
- **Pré-condições:** Ollama NÃO rodando
- **Passos:**
  1. Tentar enviar mensagem
- **Resultado esperado:** Toast/alert "Ollama não está rodando. Inicie com 'ollama serve'"
- **Cobertura:** erro

### TC-010: Modelo não encontrado
- **Pré-condições:** Ollama rodando, modelo selecionado não existe
- **Passos:**
  1. Selecionar modelo inexistente
  2. Enviar mensagem
- **Resultado esperado:** Erro "Modelo não encontrado. Faça pull primeiro."
- **Cobertura:** erro

### TC-011: Contexto longo (muitos tokens)
- **Pré-condições:** Conversa com muitas mensagens
- **Passos:**
  1. Enviar nova mensagem
- **Resultado esperado:** Histórico truncado para caber no context window do modelo
- **Cobertura:** borda

### TC-012: Conversas múltiplas
- **Pré-condições:** 3 conversas diferentes
- **Passos:**
  1. Trocar entre conversas no histórico
- **Resultado esperado:** Cada conversa mantém seu contexto independente
- **Cobertura:** normal

### TC-013: Tokens count visível
- **Pré-condições:** Mensagem enviada
- **Passos:**
  1. Verificar footer ou badge
- **Resultado esperado:** Tokens usados na resposta visíveis (ex: "142 tokens")
- **Cobertura:** normal

### TC-014: Markdown renderizado na resposta
- **Pré-condições:** Ollama responde com Markdown
- **Passos:**
  1. Perguntar "Explique SOLID com exemplos"
- **Resultado esperado:** Markdown renderizado (headers, code blocks, lists)
- **Cobertura:** normal

### TC-015: Código com syntax highlight
- **Pré-condições:** Resposta contém code block
- **Passos:**
  1. Perguntar "Mostre um exemplo de polimorfismo em C++"
- **Resultado esperado:** Code block com syntax highlight, copy button
- **Cobertura:** normal
