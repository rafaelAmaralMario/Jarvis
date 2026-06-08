# Contexto: LLM Gateway Multi-Provider + MCP Server Integration

**ID:** CONTEXT-017
**Timestamp:** 2026-06-08T07:00:00-03:00
**Status:** `active`
**Supersedes:** —
**Superseded by:** —
**Skill usada:** context-generator

## Decisao / Conteudo

Implementados dois novos modulos backend:

### LLM Gateway (`backend/jarvis/llm_gateway.py`)
- Suporte a 4 provedores: OpenAI, Anthropic, Ollama, AWS Bedrock (stub)
- ProviderConfig salvo em `llm_providers` (migration 9)
- Testes de conexao com timeout 10s
- LLMRequest/LLMMessage para requests tipados
- 12 testes unitarios

### MCP Manager (`backend/jarvis/mcp_manager.py`)
- Gerenciamento de servidores MCP (stdio/SSE/WebSocket)
- CRUD completo em `mcp_servers` (migration 9)
- Start/stop com cache de processos em memoria
- Tool listing e tool calling via subprocess ou HTTP
- 13 testes unitarios

## Arquivos Afetados

- `backend/jarvis/llm_gateway.py` — Novo arquivo (497 linhas)
- `backend/jarvis/mcp_manager.py` — Novo arquivo (424 linhas)
- `backend/jarvis/migration_runner.py` — Migration 9
- `backend/jarvis/bridge.py` — 30+ novos metodos bridge
- `backend/jarvis/main.py` — Injecao dos novos managers
- `backend/tests/test_llm_gateway.py` — 12 testes
- `backend/tests/test_mcp_manager.py` — 13 testes

## Proximos Passos

- Adicionar mais provedores (Google Gemini, Groq) ao LLM Gateway
- Implementar streaming para SSE/WebSocket no MCP Manager
- Adicionar rate limiting e caching ao LLM Gateway

## Notas

- LLMGateway separado do OllamaClient existente para compatibilidade retroativa
- MCP usa cache em memoria (`_servers` + `_processes` dicts)
- Bedrock implementado como stub — requer boto3 para implementacao completa
