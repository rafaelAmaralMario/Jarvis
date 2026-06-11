# Reestruturação de Documentação e Contexto

## Descrição
Revisão completa de todas as tarefas do kanban, análise técnica e planejamento de cada tarefa, e reestruturação total da documentação do projeto: unificação de contexto, limpeza de docs obsoletas (C++/Qt), remoção de arquivos raiz desatualizados.

## O que foi feito

### 1. Revisão do Kanban
- Removidas duplicatas: `002_AutomaticFallback` e `026_LLMRouter` estavam em Backlog e Ready_For_Work simultaneamente
- Removidos cards de Ready_For_Work que já estavam implementados: `001_GrammarConstrainedToolCalling`, `002_ProviderSelectorUI`
- Total atual: 10 Done, 4 Ready, 24 Backlog

### 2. Contexto Unificado (`.context/CONTEXTO-COMPLETO.md`)
- Unificada informação de: Project.md, CONTEXTO-ATUAL.md, VISAO-JARVIS-COMPLETO.md, ANALISE-MIGRACAO-LLAMACPP.md
- Estrutura: Identidade, Stack, Arquitetura, Estado Atual, Estrutura do Projeto, Bridge API, Decisões Técnicas, Instruções para Agentes
- ~240 linhas (contra ~1200+ linhas dos documentos originais)
- Aponta para kanban como fonte de tarefas

### 3. Arquivos Raiz
- **Arquivados** (em `.context/archive/root/`): CONTEXTO-ATUAL.md, VISAO-JARVIS-COMPLETO.md, ANALISE-MIGRACAO-LLAMACPP.md, Project.md
- **Removidos** (obsoletos): MIGRACAO_PYTHON.md, migraçao-para-ollamacp.md, PLANO_IMPLEMENTACAO.md, INITIALIZE.md, bugs-ajustes-e-novas-features.md, ROADMAP.md, session-ses_14f1.md, Concepts.md
- **Mantidos** (atuais): README.md, HOW-TO-START.md, CHANGELOG.md

### 4. docs/
- Todo o diretório `docs/` (27 arquivos do C++/Qt) arquivado em `.context/archive/docs/`
- Removido do projeto ativo

### 5. tarefas/
- Todo o diretório `tarefas/` (sistema antigo, substituído por kanban) arquivado

### 6. `.context/` antigo
- 34 arquivos de contexto individuais arquivados em `.context/archive/`
- Substituídos por único `CONTEXTO-COMPLETO.md`

## Critérios de Aceitação
- [x] Todas as tarefas do kanban revisadas e duplicatas removidas
- [x] Contexto unificado em `.context/CONTEXTO-COMPLETO.md` (< 300 linhas)
- [x] Docs C++/Qt removidas do projeto ativo
- [x] Arquivos raiz obsoletos removidos
- [x] Qualquer agente consegue entender o projeto lendo `.context/CONTEXTO-COMPLETO.md`

## Dependências
Nenhuma

## Fase
Fase 0 — Estabilização

## Prioridade
Alta

## Concluído em
2026-06-11
