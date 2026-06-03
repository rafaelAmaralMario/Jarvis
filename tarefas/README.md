# 📋 Kanban Local — JARVIS

Este diretório `tarefas/` contém o quadro Kanban do projeto JARVIS,
organizado em arquivos markdown com especificações detalhadas e **test cases**.

## Estrutura

```
tarefas/
├── INDEX.md                 ← Visão geral do quadro
├── 01-concluidas/           ← Tarefas finalizadas
├── 02-em-andamento/         ← Tarefas em progresso
└── 03-a-fazer/              ← Próximas tarefas
```

## Fluxo de Trabalho

1. **Escolha** uma tarefa de `03-a-fazer/`
2. **Mova** o arquivo para `02-em-andamento/`
3. **Implemente** seguindo a especificação e os test cases
4. **Execute** todos os test cases
5. **Mova** para `01-concluidas/` e **atualize** o `INDEX.md`

## Formato da Tarefa

Cada tarefa contém:

```markdown
# ID — Título

## Metadados
- Status: concluída | em andamento | a fazer
- Prioridade: 🔴 Alta | 🟡 Média | 🟢 Baixa
- Dependências: IDs das tarefas necessárias antes desta

## Descrição
O que precisa ser feito e por quê.

## Especificação Técnica
Arquivos envolvidos, interfaces, decisões de design.

## Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2

## Test Cases
### TC-001: [Nome do teste]
- **Pré-condições:** ...
- **Passos:** 1. ... 2. ...
- **Resultado esperado:** ...
- **Cobertura:** normal | borda | erro
```

## Convenções

- IDs sequenciais: `001`, `002`, ...
- Nomes em kebab-case: `modulo-conhecimento.md`
- Status no INDEX: ✅ 🔄 ⬜
- Prioridade nos metadados da tarefa
