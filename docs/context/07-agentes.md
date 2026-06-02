# Sistema de Agentes

## Definição (`src/agents/index.ts`)

### 4 Agentes Built-in

| ID | Nome | Objetivo | Permissões |
|----|------|----------|------------|
| `project-brain` | Cérebro do Projeto | Analisar projeto e gerar notas de contexto estruturadas para Obsidian | read-workspace |
| `developer` | Desenvolvedor | Propor mudanças de código em formato diff | read-workspace, write-workspace |
| `reviewer` | Revisor | Revisar mudanças, riscos e gaps de teste | read-workspace, git |
| `documenter` | Documentador | Sugerir documentação para features e decisões técnicas | read-workspace |

### Agentes Customizados

- Criados via UI no Agent Designer
- Usam o modelo ativo para refinar a definição
- Armazenados em `localStorage` (`jarvis.agents.custom`)

### Estrutura de um Agente

```typescript
interface AgentDefinition {
  id: string
  name: string
  goal: string
  permissions: Permission[]
  modelId?: string  // opcional; usa modelo ativo se não especificado
}
```

## Como os Agentes Funcionam

1. Usuário seleciona um agente no painel Agents
2. Define o contexto/task para o agente
3. Agente usa o modelo ativo para processar
4. Resultado é exibido no chat com formatação apropriada
5. Se `write-workspace` estiver habilitado, pode propor mudanças em diff

## Permissões por Agente

| Permissão | Agentes que usam |
|-----------|-----------------|
| read-workspace | project-brain, developer, reviewer, documenter |
| write-workspace | developer |
| git | reviewer |

## Pontos de Atenção

- Agentes não têm acesso real ao filesystem — usam os comandos Tauri via adaptadores
- A execução é síncrona com o chat (não há execução em background)
- O `project-brain` é o agente mais relevante para integração com Obsidian
- Agentes respeitam as permissões configuradas por workspace
