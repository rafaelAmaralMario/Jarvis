# Tarefa: Refatorar useChat + Criar ChatService

**Epico:** 5 — IA e Agentes  
**Prioridade:** 🔴 Alta  
**Estimativa:** 1-2 semanas  
**Dependencias:** Nenhuma

## Objetivo

Refatorar o hook `useChat` para usar um Application Service, resolvendo a violacao de DIP (ele e o unico hook que importa `infrastructure` diretamente).

## Estado Atual

`useChat` importa `createTextProvider` diretamente de `infrastructure/model-providers.ts`, violando o principio de Dependency Inversion.

## Como Fazer

### 1. Criar ChatService

```typescript
// src/application/services/chat.ts
import { createTextProvider } from '../../infrastructure/model-providers';
import type { ChatMessage, ProviderKind } from '../../domain/models';

export function createChatService() {
  return {
    async sendMessage(
      modelId: string,
      providerKind: ProviderKind,
      messages: ChatMessage[],
      onToken: (token: string) => void,
      signal: AbortSignal,
    ): Promise<void> {
      const provider = createTextProvider(modelId, providerKind);
      const stream = provider.generate(messages, signal);
      for await (const chunk of stream) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        onToken(chunk);
      }
    },
  };
}
```

### 2. Refatorar useChat

```typescript
// src/ui/hooks/useChat.ts
export function useChat() {
  const chatServiceRef = useRef(createChatService());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      await chatServiceRef.current.sendMessage(
        activeModelId,
        providerKind,
        [...messages, userMsg],
        (token) => { /* atualizar streaming */ },
        abortControllerRef.current.signal,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${err}`, ... }]);
    } finally {
      setIsGenerating(false);
    }
  }, [messages, activeModelId, providerKind]);

  return { messages, isGenerating, sendMessage, /* ... */ };
}
```

### 3. Mover logicas para o service

- Criacao de provider
- Parsing de streaming
- Tratamento de erros (cancelamento, falha)

## Criterios de Pronto

- [ ] ChatService criado em `application/services/chat.ts`
- [ ] useChat refatorado para usar ChatService
- [ ] useChat nao importa mais de `infrastructure/` diretamente
- [ ] DIP resolvido (todos os hooks usam services)
- [ ] `npm test` passa (testes de useChat existentes)
- [ ] `npm run build` passa

## Referencias

- `docs/context/14-funcionalidades-atuais.md#379` — Problema conhecido do useChat
- `docs/context/13-plano-manutencao-pos-solid.md#etapa-1` — Plano de ChatService
