# Épico 1 — Infraestrutura e Qualidade (v0.1 Beta)

**Prioridade:** 🔴 Alta  
**Objetivo:** Garantir que os fluxos essenciais da IDE funcionem de forma previsível, com testes automatizados, terminal real e pipeline CI.

## Tarefas

| # | Tarefa | Prioridade | Status |
|---|--------|-----------|--------|
| 1 | Testes de hooks e componentes React | 🔴 Alta | Pendente |
| 2 | Testes de integração e E2E | 🟡 Média | Pendente |
| 3 | Terminal integrado real | 🔴 Alta | Pendente |
| 4 | Migrar secrets para keyring/Stronghold | 🔴 Alta | Pendente |
| 5 | Pipeline CI/CD | 🟡 Média | Pendente |

## Critérios de Aceite do Épico

- 
pm test passa com mínimo de 70+ testes
- Terminal funcional no Bottom Panel com execução de comandos
- Secrets armazenados de forma segura (keyring/Stronghold)
- CI roda build, lint e testes em todo PR
- Nenhuma ação sensível ocorre sem registro de auditoria
