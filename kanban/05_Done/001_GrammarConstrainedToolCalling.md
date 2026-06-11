# Grammar-Constrained Tool Calling

## Descrição
Implementar grammar-constrained decoding no NativeProvider usando o suporte nativo do llama-cpp-python a gramáticas GBNF. Isso garante que a saída do LLM seja JSON válido para tool calling, eliminando a necessidade de regex extraction frágil.

## Análise Técnica

### Arquitetura

O fluxo atual no `ToolAgent._extract_tool_call()` (`tool_agent.py:322`) usa regex para extrair `{"tool": "...", "args": {...}}` da saída do LLM. Isso falha quando o LLM produz JSON mal formatado.

A solução é aplicar uma gramática GBNF no `NativeLLMClient` que força a saída a ser JSON válido no formato esperado de tool call.

```
ToolAgent.execute()
  └→ LLMGateway.generate(req)        # req tem system prompt com tool descriptions
       └→ NativeLLMClient.generate(req)
            ├→ detecta se tool calling está ativo (pela presença de tool descriptions no system prompt)
            ├→ carrega gramática GBNF de tool_call.gbnf
            └→ llama.create_completion(prompt, grammar=grammar)
                 └→ saída sempre JSON válido → ToolAgent._extract_tool_call() nunca falha
```

A gramática GBNF define:
```
root ::= tool-call
tool-call ::= "{" ws "\"tool\"" ws ":" ws string "," ws "\"args\"" ws ":" ws object ws "}"
string ::= "\"" [^"]* "\""
object ::= "{" ws (pair ("," ws pair)*)? ws "}"
pair ::= string ws ":" ws value
value ::= string | number | object | array | "true" | "false" | "null"
array ::= "[" ws (value ("," ws value)*)? ws "]"
number ::= "-"? ("0" | [1-9] [0-9]*) ("." [0-9]+)? ([eE] [-+]? [0-9]+)?
ws ::= [ \t\n]*
```

### Implementação Detalhada

- File: `backend/jarvis/grammars/tool_call.gbnf` — **New file**: GBNF grammar definition for tool call JSON format
- File: `backend/jarvis/llm_gateway.py` — Modificar `NativeLLMClient` (a ser criado):
  - Adicionar atributo `self._tool_grammar: str | None` — carrega do arquivo `.gbnf`
  - Em `generate()`: verificar se `req.system` contém tool descriptions (checar por `"tool_descriptions"` ou `"Available tools"`). Se sim, passar `grammar=self._tool_grammar` para `llama.create_completion()`
  - Adicionar `force_tool_grammar: bool = False` ao `LLMRequest` (opcional, default False)
- File: `backend/jarvis/llm_gateway.py:22-36` — Opcionalmente adicionar campo `grammar: str = ""` ao `LLMRequest` para expor a API de forma genérica (futuro: outros providers podem usar `response_format`)
- File: `backend/jarvis/tool_agent.py:322-337` — **Modificar** `_extract_tool_call()`:
  - Fallback 1: tentar `json.loads()` direto na string inteira (gramática garante JSON puro)
  - Fallback 2: regex atual (para providers que não usam grammar)
  - Fallback 3: heurística de reparo (adicionar `}` faltante, corrigir aspas)
- File: `backend/jarvis/tool_agent.py:135-143` — Modificar construção do `LLMRequest` para detectar quando tool calling está ativo e setar flag
- File: `backend/pyproject.toml` — Sem novas dependências (gramática é string/arquivo estático)

### Dependências
- Nenhuma nova dependência externa (arquivo `.gbnf` é texto estático)
- Depende de `001_NativeProvider` (NativeLLMClient precisa existir)

### Riscos e Mitigações
| Risco | Mitigação |
|-------|-----------|
| Gramática GBNF muito restritiva → LLM não consegue gerar resposta | Fallback para regex extraction original + reparo heurístico |
| Gramática não funciona com todos os modelos | Apenas aplicada no NativeProvider; Ollama/OpenAI/Anthropic usam regex normal |
| GBNF sintaxe complexa de manter | Testes de aceitação com 5+ modelos GGUF diferentes |
| Output é JSON mas sem `tool` key | Fallback ainda tenta regex; se não achar, assume resposta normal |

## Use Cases
1. **Tool calling confiável**: Agent precisa chamar `execute_command` com JSON exato — gramática força saída válida, zero parse failures
2. **Modelos pequenos (3B-8B)**: Modelos menores produzem mais erros de formatação — grammar constraint compensa a incapacidade do modelo
3. **Ciclos longos de tool calling**: 25 rounds sem falha de parse — sem grammar, pelo menos 3-5 rounds falham por JSON inválido

## Test Cases
1. [ ] Gramática GBNF é carregada sem erro de sintaxe — `llama_cpp.Llama(grammar=...)` aceita sem exception
2. [ ] `NativeLLMClient.generate()` com tool prompt produz JSON válido 100% das vezes — 20 chamadas, `json.loads()` nunca falha
3. [ ] Fallback regex ainda funciona quando grammar não é fornecida — `_extract_tool_call()` com `ollama` provider
4. [ ] Fallback de reparo recupera JSON com chave faltando — adiciona `}` no final se necessário
5. [ ] Resposta normal (sem tool call) não é afetada pela gramática — grammar só aplicada quando `force_tool_grammar=True`

## Critérios de Aceitação
- [ ] Definir gramática GBNF para formato de tool call
- [ ] Integrar grammar no NativeLLMClient.generate()
- [ ] Fallback para regex extraction se grammar falhar
- [ ] 100% de tool calls em JSON válido

## Dependências
- [ ] 001_NativeProvider

## Fase
Fase 1 — LLM Dual Provider

## Prioridade
Média

## Esforço Estimado
Médio
