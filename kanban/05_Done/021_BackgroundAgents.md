# Agentes Autônomos em Background

## Descrição
Agentes que rodam em background sem supervisão: monitorar diretórios, fazer análises periódicas, sugerir melhorias, executar tarefas agendadas. Agendador de tarefas (schedule_task). Notificações quando algo relevante é encontrado.

## Critérios de Aceitação
- [x] Agendador de tarefas recorrentes (TaskScheduler com intervalos configuráveis)
- [x] Agente de monitoramento de diretório (DirectoryWatcher com callback)
- [x] Agente de análise periódica (git log check, workspace cleanup)
- [ ] Notificações no frontend — *postergado (fila de notificações pronta)*
- [x] Log de atividades dos agentes (agent_log tool)

## Dependências
- [x] 004_SelfImprovement — lógica similar reutilizada

## Fase
Fase 7 — Avançado

## Prioridade
Baixa

## Esforço Estimado
Grande
