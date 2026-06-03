# Tarefa: Busca Semantica com Embeddings

**Epico:** 5 — IA e Agentes  
**Prioridade:** 🟡 Media  
**Estimativa:** 3-4 semanas  
**Dependencias:** T1 (ChatService)

## Objetivo

Substituir a busca textual simples (tokenizacao + scoring) por busca semantica real com embeddings, indexando o workspace e vault Obsidian para recuperacao inteligente de contexto.

## Estado Atual

O `searchContext` e uma busca textual simples baseada em tokenizacao e scoring, **sem embeddings**.

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| OpenAI Embeddings API | Geracao de embeddings (ou provider local) |
| Ollama embeddings (nomic-embed-text, etc.) | Embeddings locais |
| cosine-similarity | Calculo de similaridade |
| IndexedDB / SQLite | Armazenamento local de indices |
| Rust (Tauri) | Indexacao em background |

## Como Fazer

### 1. Definir Provider de Embeddings

```typescript
interface EmbeddingProvider {
  name: string;
  embed(texts: string[]): Promise<number[][]>;
}
```

### 2. Criar servico de indexacao

```typescript
interface IndexedDocument {
  path: string;
  content: string;
  chunks: { text: string; embedding: number[] }[];
  updatedAt: number;
}

class SemanticIndex {
  async addDocument(path: string, content: string): Promise<void> { ... }
  async search(query: string, topK: number): Promise<SearchResult[]> { ... }
  async removeDocument(path: string): Promise<void> { ... }
}
```

### 3. Indexacao incremental do workspace

- Indexar arquivos ao abrir workspace
- Watch de mudancas (re-indexar arquivos alterados)
- Respeitar `.gitignore` e pastas ignoradas

### 4. Atualizar ContextService

```typescript
// application/services/context.ts
const contextService = createContextService({ embeddingProvider, semanticIndex });

searchContext: async (query: string) => {
  const semanticResults = await semanticIndex.search(query, 10);
  const textResults = tokenizeSearch(query, allNotes);
  return mergeResults(semanticResults, textResults);
},
```

### 5. Configuracao

Adicionar no Settings > IA:
- Provider de embeddings (Ollama, OpenAI, local)
- Modelo de embeddings
- Opcao de ativar/desativar indexacao automatica

## Criterios de Pronto

- [ ] Provider de embeddings configurado (Ollama nomic-embed-text ou similar)
- [ ] Indexador incremental do workspace
- [ ] Busca semantica retorna resultados relevantes (nao apenas correspondencia textual)
- [ ] Indexacao respeita `.gitignore` e pastas ignoradas
- [ ] Performance aceitavel: index scan < 5s para 1000 arquivos
- [ ] Fallback para busca textual se embeddings nao disponiveis

## Referencias

- `docs/roadmap-pos-mvp.md` — v0.2 Busca semantica
- `docs/context/14-funcionalidades-atuais.md#352` — Busca textual atual
