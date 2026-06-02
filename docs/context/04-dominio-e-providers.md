# Domínio e Providers de IA

## Core Domain Types (`src/domain/models.ts`)

```typescript
type ModelCapability  = 'text' | 'code' | 'image' | 'embeddings'
type ModelStatus      = 'active' | 'experimental' | 'deprecated'
type ProviderKind     = 'mock' | 'ollama' | 'openai-compatible'
```

### Interfaces Principais

| Interface | Descrição |
|-----------|-----------|
| `AiModel` | id, providerId, name, capabilities[], status |
| `TextModelProvider` | id, name, sendMessage(request): AsyncGenerator |
| `TextProviderRequest` | input, modelId, signal?, onToken? |
| `ProviderSettings` | kind, modelId, baseUrl, apiKey? |

## Model Registry (`src/application/model-registry.ts`)

8 modelos embutidos:

| ID | Provider | Nome | Capabilities |
|----|----------|------|-------------|
| `mock-text` | mock | JARVIS Mock Text | text, code |
| `mock-image` | mock | JARVIS Mock Image | image |
| `mock-embeddings` | mock | JARVIS Mock Embeddings | embeddings |
| `ollama:llama3.2` | ollama | Ollama Llama 3.2 | text |
| `ollama:qwen2.5-coder` | ollama | Ollama Qwen Coder | text, code |
| `openai:gpt-4.1-mini` | openai-compatible | OpenAI-compatible GPT 4.1 Mini | text, code |
| `openai:image-model` | openai-compatible | OpenAI-compatible Image Model | image |

**Modelo padrão:** `mock-text`

## Implementações de Providers (`src/infrastructure/model-providers.ts`)

### Mock Provider
- Respostas simuladas com delay de 90ms por chunk
- Suporta abort signal e streaming de tokens
- Finalidade: validar fluxo de chat sem modelos reais

### Ollama Provider
- Conexão com Ollama local via `POST /api/generate`
- Streaming via JSON lines
- Detecta modelos instalados no filesystem
- Comandos: `ollama run <model>` e `ollama run <model> "Responda apenas OK"`

### OpenAI-Compatible Provider
- Conexão com qualquer endpoint compatível com OpenAI API
- Streaming via Server-Sent Events
- API key armazenada de forma segura (não no localStorage)

## Arquivo de Adaptadores Tauri (`src/infrastructure/native.ts`)

Centraliza todas as chamadas `invoke()` para comandos Tauri, tipadas e com tratamento de erros.

## Provider Settings no UI

Configurável via Settings > Provider:
- **Mock**: sem configuração adicional
- **Ollama**: detecta modelos automaticamente do filesystem
- **OpenAI-compatible**: baseUrl, modelId, apiKey
