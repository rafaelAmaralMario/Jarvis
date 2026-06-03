---
name: context-generator
description: "Use to generate, update, or compact project context into .context/ files with proper ID, timestamp, and structure."
---

# Context Generator

Gera e mantem o contexto do projeto JARVIS em `.context/`.

## Estrutura do Contexto

```
.context/
├── INDEX.md              ← Tabela central com todos os contextos
├── TEMPLATE.md           ← Template para novos contextos
└── YYYY-MM-DD-NNN-titulo.md  ← Contextos individuais
```

## Formato de cada Contexto

Cada arquivo de contexto DEVE seguir este template:

```markdown
# Contexto: [Titulo Descritivo]

**ID:** CONTEXT-{NNN}
**Timestamp:** {YYYY-MM-DDTHH:MM:SS-03:00}
**Status:** `active` | `superseded` | `conflicted`
**Supersedes:** [IDs que este contexto substitui, ou "—"]
**Superseded by:** [ID que substituiu este, ou "—"]
**Skill usada:** [Skill usada para gerar, ou "—"]

## Decisao / Conteudo

[Descricao clara e concisa do que foi decidido, implementado ou discutido]

## Arquivos Afetados

- `caminho/para/arquivo` — o que mudou

## Proximos Passos

- [Acao pendente 1]
- [Acao pendente 2]

## Notas

[Informacoes adicionais relevantes]
```

## Quando Gerar Contexto

1. **Toda vez que uma decisao arquitetural for tomada**
2. **Ao final de cada sessao** (compactar o que foi feito)
3. **Quando uma informacao nova contradizer uma existente** (marcar como `conflicted`)
4. **Quando uma feature for completada**
5. **Antes de pausar o trabalho** (salvar estado atual)

## Regras de Conflito

Se um novo contexto contradizer um existente:

1. Crie o novo contexto com status `conflicted`
2. Atualize o contexto existente para status `conflicted`
3. No campo `Notas` de ambos, faca referencia ao ID conflitante
4. Adicione uma entrada no INDEX.md perguntando ao usuario qual e a fonte de verdade

## Compactacao de Contexto

Quando o `INDEX.md` tiver mais de 30 entradas ativas, ou o usuario solicitar:

1. Leia todos os contextos `active`
2. Gere um novo contexto "Contexto Compactado" que suma rize todos
3. Marque todos os contextos originais como `superseded` apontando para o compactado
4. Salve o compactado como novo arquivo

## INDEX.md

Mantenha a tabela do INDEX.md sempre atualizada:

```markdown
# INDICE DE CONTEXTO - JARVIS

| ID | Contexto | Timestamp | Status | Supersedes | Superseded by |
|----|----------|-----------|--------|------------|---------------|
| 001 | Fundacao do Projeto | 2026-06-03T10:54:00-03:00 | active | — | — |
```

## Comandos Uteis

```bash
# Listar contextos ativos
grep "active" .context/INDEX.md

# Ver ultimos 5 contextos
tail -5 .context/INDEX.md

# Buscar em todos os contextos
grep -r "palavra-chave" .context/*.md --include="*.md"
```
