# Skill: Contexto do Projeto JARVIS

## Descricao

Skill para preservar contexto do projeto JARVIS entre sessoes. Carrega informacoes essenciais sobre a arquitetura, stack, estado atual e tarefas pendentes.

## Instrucoes

Ao carregar esta skill, voce deve:

1. **Ler o arquivo de indice de tarefas** em `tarefas/README.md` para entender a estrutura atual
2. **Verificar o estado das pastas** `tarefas/epico-*/README.md` para saber o progresso
3. **Consultar `docs/context/14-funcionalidades-atuais.md`** para entender o que ja foi implementado
4. **Consultar `docs/context/17-ai-handoff.md`** para instrucoes de handoff entre sessoes
5. **Consultar skills externas** em `C:\Users\Rafae\Documents\Ai-Dashboard\agent-skills-main\skills\` — antes de comecar qualquer tarefa, verifique se alguma skill la pode ajudar a desempenhar melhor o trabalho (ex: brainstorming, writing-plans, skill-creator, mcp-builder, playwright-skill, etc.)

## Diretorios Chave

```
docs/                    - Documentacao completa do projeto
tarefas/                 - Tarefas organizadas por epico
tarefas/done/            - Tarefas concluidas (mover para ca)
src/                     - Codigo fonte frontend TypeScript
src-tauri/               - Codigo fonte backend Rust
```

## Stack Resumida

| Tecnologia | Detalhe |
|-----------|---------|
| Desktop | Tauri 2.11.2 |
| Frontend | React 19 + TypeScript 5.9 + Vite 7 |
| Editor | Monaco Editor 0.55 |
| Testes | Vitest 4 + @testing-library/react |
| Backend | Rust (edition 2021) |
| Icones | Lucide React 1.17 |

## Tarefas Proximas (Ordem Recomendada)

1. **Primeiro:** Testes de hooks e componentes (Epic 1 T1) — pre-requisito para refatoracoes
2. **Segundo:** ChatService refactor (Epic 5 T1) — resolve violacao DIP
3. **Terceiro:** Terminal integrado (Epic 1 T3) — funcionalidade mais criticas faltante
4. **Quarto:** Git push/pull (Epic 2 T2) — completa ciclo Git
5. **Quinto:** Status Bar + Quick Open (Epic 3 T1, T2) — maior impacto de produtividade
