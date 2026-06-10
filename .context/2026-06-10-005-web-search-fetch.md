---
id: 005
title: Web Search e Fetch Tools
timestamp: 2026-06-10T07:10:00-03:00
status: active
supersedes: —
superseded_by: —
---

## Resumo

Implementação dos tools `web_search` e `web_fetch` no sistema JARVIS para permitir que o agente autônomo consulte informações atualizadas da web via DuckDuckGo HTML search (sem API key) e baixe conteúdo de URLs.

## Decisões Técnicas

### web_search
- Usa scraping HTML do DuckDuckGo (duckduckgo.com/html/) com `requests.get`
- Parse via `BeautifulSoup` (parser `html.parser`)
- SSL `verify=False` para contornar problemas de certificado no ambiente local
- Argumentos: `query` (obrigatório), `max_results` (opcional, padrão 5)
- Risco: `safe` (leitura apenas, sem efeitos colaterais)
- Retorna `title` + `link` + `snippet` para cada resultado

### web_fetch
- Usa `requests.get` com timeout de 30s, `verify=False`
- Retorna conteúdo como texto (cabeçalhos HTTP, corpo)
- Risco: `safe`
- Argumentos: `url` (obrigatório)
- Erro tratado: URL inválida, timeout, erro HTTP

### Registro
- Tools registrados em `ToolManager._init_default_tools()` em `backend/jarvis/tool_manager.py`
- Bloco `web_search` e `web_fetch` com `"safe"` risk, parâmetros JSON Schema, exemplos em português
- Nenhuma dependência adicional (requests + bs4 já estavam no projeto)

## Arquivos Modificados
- `backend/jarvis/tool_manager.py` — registro dos dois novos tools

## Status
- Implementado e registrado, mas não testado funcionalmente (DNS/SSL blocking no ambiente de desenvolvimento)
- TypeScript compile: ✅
- Python import: ✅
- Testes: sem testes específicos (tools são testados via ToolAgent indiretamente)
