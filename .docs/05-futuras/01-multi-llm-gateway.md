# Proposta: Gateway Multi-Provedor LLM

## Visão Geral
Expandir o suporte de modelos de IA para múltiplos provedores além do Ollama, permitindo que o usuário escolha e troque entre provedores transparentemente.

## Provedores Alvo

| Provedor | API | Autenticação | Custo |
|----------|-----|-------------|-------|
| OpenAI | GPT-4o, GPT-4-turbo | API Key | Pay-per-token |
| Anthropic | Claude 3.5 Sonnet, Opus | API Key | Pay-per-token |
| Google | Gemini 1.5 Pro, Flash | API Key | Free tier + pago |
| AWS Bedrock | Claude, Llama, Mistral | IAM + AWS Creds | Pay-per-token |
| Azure OpenAI | GPT-4o | Azure AD + Key | Pay-per-token |
| Groq | Llama 3, Mixtral | API Key | Free tier |
| Ollama | Qualquer modelo local | — | Grátis (local) |

## Arquitetura

```
┌──────────────────────────────────────────┐
│              AI Engine                    │
│  ┌────────────────────────────────────┐   │
│  │     Provider Abstraction Layer     │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ │   │
│  │  │ Ollama │ │ OpenIA │ │ Claude │ │   │
│  │  │ Client │ │Client  │ │Client  │ │   │
│  │  └────────┘ └────────┘ └────────┘ │   │
│  └────────────────────────────────────┘   │
│  ┌────────────────────────────────────┐   │
│  │     Router Inteligente             │   │
│  │  • Fallback automático             │   │
│  │  • Balanceamento de carga          │   │
│  │  • Caching de respostas            │   │
│  └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

## Funcionalidades

### Provider Abstraction Layer (PAL)
- Interface unificada `IModelProvider` com métodos:
  - `generate(prompt, options) → Response`
  - `stream(prompt, options) → AsyncIterator<Chunk>`
  - `embed(text) → Embedding[]`
  - `countTokens(text) → int`
  - `listModels() → Model[]`
- Adaptador por provedor implementando a interface
- Registro dinâmico de provedores

### Router Inteligente
- Roteamento automático baseado em:
  - Custo: escolher modelo mais barato que atenda requisitos
  - Latência: priorizar provedor mais rápido disponível
  - Capacidade: fallback se provedor principal estiver sobrecarregado
- Configuração de regras pelo usuário
- Per-request override (forçar provedor específico)

### Gerenciamento de Chaves
- UI para gerenciar chaves de múltiplos provedores
- Validação de chave (test call)
- Rotação automática de chaves
- Armazenamento criptografado no SQLite

### Caching Inteligente
- Cache de respostas idênticas (hash do prompt)
- Cache de embeddings
- TTL configurável por provedor
- Invalidação manual

## Interface do Usuário
- Aba "Provedores" no painel de Configuração
- Card por provedor com status (conectado/desconectado/erro)
- Configuração de chave por provedor
- Seletor de modelo ativo no AiPanel
- Indicador de qual provedor está sendo usado na resposta

## Tabelas SQLite
```sql
CREATE TABLE llm_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL,  -- 'openai', 'anthropic', 'ollama', etc
    api_key_encrypted TEXT,
    base_url TEXT,
    is_active INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 0,
    config JSON,  -- timeout, max_retries, etc
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE llm_routing_rules (
    id TEXT PRIMARY KEY,
    priority INTEGER,
    condition JSON,  -- { "cost_max": 0.01, "latency_max": 2000 }
    provider_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES llm_providers(id)
);
```

## Dependências
- Task 023 (Segurança) para armazenamento criptografado de chaves
- Novo módulo C++: `kernel/src/ai/provider_*.cpp`
- 3-5 novos componentes React

## Prioridade: Média-Alta
## Esforço Estimado: 3-4 semanas
## Impacto: Alto — torna o JARVIS independente de um único provedor
