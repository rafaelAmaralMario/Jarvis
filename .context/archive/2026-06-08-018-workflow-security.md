# Contexto: Workflow Automation Engine + Security Manager

**ID:** CONTEXT-018
**Timestamp:** 2026-06-08T07:10:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** context-generator

## Decisao / Conteudo

Implementados dois modulos de infraestrutura:

### Workflow Engine (`backend/jarvis/workflow_engine.py`)
- 7 tipos de steps: run_command, api_call, ai_query, wait, condition, create_note, search_notes
- Steps com suporte a nextOnSuccess/nextOnFailure para controle de fluxo
- Execucao sincrona com retorno de resultados por step
- Armazenamento em `workflows` + `workflow_steps` (migration 9)
- 14 testes unitarios

### Security Manager (`backend/jarvis/security_manager.py`)
- 3 subsistemas: permissions, audit_log, secret_storage
- Permissions com upsert (ON CONFLICT DO UPDATE)
- Audit log com module/action/detail/timestamp
- Secret storage com encryptacao futura (atualmente plaintext)
- Defaults automaticos via `_ensure_defaults()`
- Tabela `secret_storage` (migration 10)
- 13 testes unitarios

## Arquivos Afetados

- `backend/jarvis/workflow_engine.py` — Novo arquivo (285 linhas)
- `backend/jarvis/security_manager.py` — Novo arquivo (199 linhas)
- `backend/jarvis/migration_runner.py` — Migrations 9 + 10
- `backend/jarvis/bridge.py` — Metodos workflow* e security*
- `backend/jarvis/main.py` — Injecao
- `backend/tests/test_workflow_engine.py` — 14 testes
- `backend/tests/test_security_manager.py` — 13 testes

## Proximos Passos

- Implementar execucao assincrona com fila para workflows longos
- Adicionar encryptacao AES para secret_storage
- Criar triggers/webhooks nativos para workflows schedule/webhook

## Notas

- Workflow Engine usa execucao sincrona — futuro: worker assincrono + fila
- Security Manager insere permissoes default para todos os modulos na init
- Secrets armazenados em plaintext — encryptacao pendente
