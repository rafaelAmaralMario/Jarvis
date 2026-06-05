# Proposta: Revisão de Código e Integração CI

## Visão Geral
Integrar o JARVIS com GitHub/GitLab para revisão de Pull Requests, análise de código automatizada com IA, e monitoramento de pipelines CI/CD diretamente da interface.

## Funcionalidades

### Revisão de PR com IA
- Análise automatizada de PRs usando agentes do JARVIS
- Comentários inteligentes: "Esta função tem complexidade ciclomática alta. Considere refatorar."
- Detecção de code smells, vulnerabilidades, e más práticas
- Sugestão de correções inline (com diff preview)
- Revisão por diff: foco no que mudou, não no código todo

### Interface de PRs
- Lista de PRs abertos do repositório atual
- Status de CI checks (passou/falhou/pendente)
- Diff view lado a lado dentro do Monaco Editor
- Aba de comentários da review
- Aprovar/solicitar changes diretamente do JARVIS

### Análise Estática
- Lint integrado (ESLint, clang-tidy, ruff) com resultados na UI
- Análise de segurança (dependências vulneráveis)
- Medição de qualidade: cobertura de testes, duplicação, complexidade
- Histórico de métricas ao longo do tempo (gráfico)

### CI/CD Pipeline Monitor
- Status de pipelines do GitHub Actions/GitLab CI
- Logs de build em tempo real
- Notificações: "Pipeline #42 falhou no job 'test'"
- Re-run de jobs falhos
- Artefatos de build disponíveis para download

### Integração com Git Module
- Extensão do `git_manager.cpp` para GitHub/GitLab API
- Comentários de review postados via API
- Checkout automático de PR para teste local
- Commit suggestions aplicados com um clique

## Interface

```
┌────────────────────────────────────────────┐
│  Git Panel                                  │
│  ┌────────────────────────────────────┐     │
│  │  [Status] [Branches] [PRs] [CI]    │     │
│  ├────────────────────────────────────┤     │
│  │  PR #42: Refatora modulo kernel    │     │
│  │  ● Aberto   │  ○ 2 checks passing │     │
│  │  │                                    │     │
│  │  │  🤖 AI Review (3 comments)        │     │
│  │  │  📝 Seus comentários (1)          │     │
│  │  │  💬 Discussão (12 mensagens)      │     │
│  │  │                                    │     │
│  │  │  [Approve] [Request Changes]      │     │
│  └────────────────────────────────────┘     │
└────────────────────────────────────────────┘
```

## Extensões Bridge
```typescript
// Novos handlers
git.pr.list({ repo, state? })         → PullRequest[]
git.pr.get(id)                         → PullRequest
git.pr.createReview(id, { comments })  → { success }
git.pr.approve(id)                     → { success }
git.pr.merge(id, { strategy })         → { success }
git.ai.reviewPR(id)                    → { reviewId, comments }

ci.list({ repo })                      → Pipeline[]
ci.get(id)                             → Pipeline
ci.getLogs(id)                         → string
ci.rerun(id)                           → { success }
```

## Dependências
- Módulo Git existente (Task 020)
- GitHub REST API + GraphQL
- Task 022 (Rede/OAuth) — para autenticação na API

## Prioridade: Média
## Esforço Estimado: 4-5 semanas
## Impacto: Alto — centraliza revisão de código na ferramenta
