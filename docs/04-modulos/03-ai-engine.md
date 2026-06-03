# Modulo AI Engine

**ID:** `jarvis.ai-engine`
**Prioridade:** 🔴 Alta
**Depende de:** Kernel, Conhecimento
**Status:** Nao iniciado

## Visao Geral

Motor de IA que orquestra modelos de linguagem (locais e remotos), gerencia agentes e executa ferramentas.

## Funcionalidades

### 1. Provedores de Modelo
- **Local:** llama.cpp (modelos GGUF via Ollama API ou direto)
- **Remoto:** OpenAI-compatible API (OpenAI, Anthropic, Google, DeepSeek, etc.)
- **Streaming:** tokens em tempo real via callback
- **Fallback:** se um modelo falha, tenta o proximo na lista

### 2. Agentes
- Agentes built-in (gerente de codigo, revisor, documentador, pesquisador)
- Agentes customizados (usuario define nome, objetivo, permissoes)
- Tool calling: cada agente pode usar ferramentas (ler arquivo, buscar web, etc.)

### 3. Integracao com Conhecimento
- RAG automatico: antes de responder, busca notas relevantes no modulo Conhecimento
- Memoria de sessoes anteriores
- Criacao automatica de notas com resumos e decisoes

### 4. Streaming
- Respostas em tempo real via callback QT signal/slot
- Suporte a cancelamento
- Interface QML com chat bubble animado

## API Publica

```cpp
class AIEngineService {
public:
    // Model management
    virtual std::vector<ModelInfo> listModels() = 0;
    virtual bool setActiveModel(const std::string& modelId) = 0;
    virtual ModelStatus testModel(const std::string& modelId) = 0;
    
    // Chat
    virtual std::string sendMessage(
        const std::string& input,
        StreamCallback onToken = nullptr
    ) = 0;
    virtual void cancelGeneration() = 0;
    
    // Agents
    virtual std::vector<AgentInfo> listAgents() = 0;
    virtual AgentResult runAgent(const std::string& agentId, const std::string& input) = 0;
    virtual AgentInfo createCustomAgent(const std::string& name, const std::string& goal) = 0;
};
```

## Provedores (Strategy Pattern)

```cpp
class LLMProvider {
public:
    virtual ~LLMProvider() = default;
    virtual std::string id() const = 0;
    virtual std::string name() const = 0;
    virtual bool isAvailable() = 0;
    virtual std::string sendMessage(
        const std::string& input,
        const std::string& modelId,
        StreamCallback onToken
    ) = 0;
};

class OllamaProvider : public LLMProvider { ... };
class OpenAIProvider : public LLMProvider { ... };
```
