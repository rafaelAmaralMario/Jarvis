# JARVIS - Tarefas Organizadas

Baseado na documentação em /docs, este diretório contém todas as tarefas necessárias para evoluir o JARVIS do MVP atual até uma IDE profissional.

## Estrutura

`
tarefas/
├── done/                          # Tarefas finalizadas movidas para cá
├── epico-1-infraestrutura-qualidade/
├── epico-2-git-completo/
├── epico-3-editor-profissional/
├── epico-4-configuracoes-ux/
├── epico-5-ia-agentes/
├── epico-6-github-colaboracao/
├── epico-7-plugins-extensibilidade/
├── epico-8-contexto-obsidian/
├── epico-9-produto-distribuicao/
├── epico-10-lsp-intellisense/
└── README.md
`

## Convenção de Arquivos

Cada tarefa segue o padrão:

| Sufixo | Arquivo | Descrição |
|--------|---------|-----------|
| -tarefa.md | 
ome-da-tarefa-tarefa.md | Descrição detalhada, stack, roteiro de implementação |
| -test-case.md | 
ome-da-tarefa-test-case.md | Casos de teste para garantir 100% da funcionalidade |
| -mock-data.md | 
ome-da-tarefa-mock-data.md | Dados de teste/mock para uso nos testes |
| -interface.md | 
ome-da-tarefa-interface.md | Especificação visual da funcionalidade |

## Fluxo de Trabalho

1. Mover tarefa de pico-X/ para done/ quando finalizada
2. Manter README.md de cada épico atualizado
3. Executar 
pm test && npm run build && cargo test antes de marcar como done

## Legenda de Prioridade

| Prioridade | Descrição |
|------------|-----------|
| 🔴 Alta | Bloqueia outras tarefas ou é essencial para fluxo real |
| 🟡 Média | Funcionalidade significativa, mas não bloqueante |
| 🟢 Baixa | Melhoria incremental, pode esperar |

## Stack Tecnológica Atual

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Desktop Framework | Tauri | 2.11.2 |
| Frontend | React | 19.2.1 |
| Linguagem | TypeScript | 5.9.3 |
| Build | Vite | 7.2.4 |
| Editor | Monaco Editor | 0.55.1 |
| Ícones | Lucide React | 1.17.0 |
| Test Runner | Vitest | 4.1.8 |
| Test Library | @testing-library/react | 16.3.2 |
| Backend | Rust | edition 2021 |
