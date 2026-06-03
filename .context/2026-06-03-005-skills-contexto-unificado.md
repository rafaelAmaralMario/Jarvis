# Contexto: Skills e Contexto Unificado

**ID:** CONTEXT-005
**Timestamp:** 2026-06-03T11:36:00-03:00
**Status:** active
**Supersedes:** —
**Superseded by:** —
**Skill usada:** context-generator

## Decisao

Unificado o sistema de skills e contexto do projeto:

### Skills movidas para `.agents/skills/`

Todas as 40 skills do repositorio externo foram copiadas para dentro do projeto em `.agents/skills/`.

### Skill Finder criada

Skill em `.agents/skills/skill-finder/` que deve ser usada antes de qualquer tarefa:
1. Verifica se existe skill local relevante
2. Se nao, busca na internet
3. Se achar online, copia para `.agents/skills/`
4. Se nao existir, cria skill nova com maximo de detalhe

### Context Generator criada

Skill em `.agents/skills/context-generator/` que define:
- Formato padrao de contexto (ID, timestamp, status, supersede, skill usada)
- Quando gerar contexto (decisoes, fim de sessao, conflitos)
- Regras de conflito
- Compactacao de contexto

### Contexto movido para `.context/`

- `context/` renomeado para `.context/` (pasta oculta)
- Template criado em `.context/TEMPLATE.md`
- Contexto completo do projeto em `.context/CONTEXTO-COMPLETO.md`
- INDEX.md atualizado com tabela padrao

## Arquivos Afetados

- `.agents/skills/` — 40 skills copiadas
- `.agents/skills/skill-finder/SKILL.md` — skill nova
- `.agents/skills/context-generator/SKILL.md` — skill nova
- `.context/` — pasta movida de context/
- `.context/TEMPLATE.md` — template novo
- `.context/CONTEXTO-COMPLETO.md` — snapshot completo do projeto
- `.context/INDEX.md` — atualizado com coluna Skill
- `tarefas/skill-contexto-jarvis.md` — atualizado para apontar para `.agents/skills/`

## Proximos Passos

- Sempre usar `skill-finder` antes de comecar qualquer tarefa
- Usar `context-generator` para registrar decisoes
- Manter `.context/CONTEXTO-COMPLETO.md` atualizado

## Notas

- A skill `skill-finder` DEVE ser a primeira skill a ser carregada em toda sessa o
- A skill `context-generator` DEVE ser usada ao final de cada sessa o para compactar contexto
