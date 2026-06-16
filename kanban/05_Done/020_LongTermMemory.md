# Memória de Longo Prazo (Graph + Vector)

## Descrição
Implementar memória persistente com graph knowledge (entidades e relações extraídas do histórico) + vector store (busca semântica em conversas passadas). O LLM consulta a memória automaticamente antes de responder. Evolução do perfil do usuário ao longo do tempo.

## Critérios de Aceitação
- [x] Extração de entidades e relações do histórico (LLM via prompt + fallback regex)
- [x] Knowledge Graph com persistência JSON (`memory_service.py`, `knowledge_graph.json`)
- [x] Vector store com embeddings do histórico (ChromaDB via `RAGService.index_text`)
- [x] Consulta automática de memória antes de cada resposta (`tool_agent.py` → `MemoryService.recall` antes do LLM)
- [x] Evolução do perfil do usuário (`user_profile.json`, extração LLM)
- [x] Tool `remember`: memoriza conteúdo → extrai entidades + perfil + relations + vector store
- [x] Tool `recall`: busca vector store + knowledge graph por entidades/relações

## Dependências
- [ ] 013_RAG

## Fase
Fase 7 — Avançado

## Prioridade
Baixa

## Esforço Estimado
Grande
