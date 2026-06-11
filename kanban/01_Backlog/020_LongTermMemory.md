# Memória de Longo Prazo (Graph + Vector)

## Descrição
Implementar memória persistente com graph knowledge (entidades e relações extraídas do histórico) + vector store (busca semântica em conversas passadas). O LLM consulta a memória automaticamente antes de responder. Evolução do perfil do usuário ao longo do tempo.

## Critérios de Aceitação
- [ ] Extração de entidades e relações do histórico (LLM)
- [ ] Knowledge Graph com NetworkX
- [ ] Vector store com embeddings do histórico
- [ ] Consulta automática de memória antes de cada resposta
- [ ] Evolução do perfil do usuário (preferências, dados pessoais)
- [ ] Tool `remember`: força o JARVIS a memorizar algo
- [ ] Tool `recall`: pergunta sobre memórias passadas

## Dependências
- [ ] 013_RAG

## Fase
Fase 7 — Avançado

## Prioridade
Baixa

## Esforço Estimado
Grande
