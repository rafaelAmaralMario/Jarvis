---
name: skill-finder
description: "Use this BEFORE any task to ensure the ideal skill is loaded. Searches local skills, then web, then creates new ones."
---

# Skill Finder

Sempre que uma tarefa for solicitada, use esta skill PRIMEIRO para garantir que a skill ideal esta disponivel.

## Processo Obrigatorio

### Passo 1: Verificar skills locais

Liste todas as skills em `.agents/skills/` e verifique se alguma corresponde a tarefa atual.

```bash
ls .agents/skills/
```

Para cada skill candidata, leia seu `SKILL.md` e veja se e relevante:

```bash
cat .agents/skills/<candidata>/SKILL.md
```

### Passo 2: Se encontrar skill local

Carregue a skill e siga suas instrucoes. Registre no contexto que a skill foi usada.

### Passo 3: Se NAO encontrar skill local

Busque na internet por skills que atendam a tarefa. Procure em:
- Repositorios de skills (Command Code, cursor.directory, etc.)
- GitHub: `site:github.com <tema> skill SKILL.md`
- Documentacoes oficiais das tecnologias envolvidas

Se encontrar uma skill online:
1. Copie para `.agents/skills/<nome>/`
2. Certifique-se de que tem um `SKILL.md` com YAML frontmatter valido
3. Carregue e use a skill

### Passo 4: Se NAO existir skill alguma

Crie uma nova skill do zero em `.agents/skills/<tema>/SKILL.md` seguindo o template:

```markdown
---
name: <nome>
description: "<descricao clara de quando usar esta skill>"
---

# <Nome da Skill>

## Visao Geral

[Propósito da skill em 2-3 frases]

## Quando Usar

- [Criterio 1]
- [Criterio 2]

## Instrucoes

[Passo a passo detalhado com comandos, exemplos de codigo, e expected output]

## Estrutura de Arquivos

```
caminho/para/arquivos
```

## Exemplos

[Exemplos reais de uso]
```

### Passo 5: Atualizar este documento

Se criou uma skill nova ou encontrou uma online que seja util, adicione-a a lista abaixo.

## Skills Disponiveis Atualmente

(Atualizar automaticamente ao listar `.agents/skills/`)

## Notas

- Skills sao especificas do contexto. Nao use uma skill so porque existe — use porque e RELEVANTE.
- Se uma skill for parcialmente relevante, carregue-a e adapte as instrucoes.
- Prefira criar skills genericas e reutilizaveis em vez de especificas demais.
