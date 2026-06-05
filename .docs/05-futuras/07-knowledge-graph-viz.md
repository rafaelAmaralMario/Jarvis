# Proposta: Visualização Avançada de Grafos de Conhecimento

## Visão Geral
Evoluir o GraphView atual para uma visualização interativa 3D/2D rica, permitindo exploração visual do conhecimento com filtros, agrupamento, timeline e análise de conexões.

## Funcionalidades Avançadas

### Renderização 3D (Three.js / WebGL)
- Grafo 3D rotacionável com orbit controls
- Nós com tamanho proporcional a número de conexões
- Cores por tag/categoria
- Arestas animadas
- Agrupamento Force-directed (simulação física)
- Clusters automáticos

### Interação
- Zoom para nota específica
- Clique no nó → mostra preview da nota
- Duplo clique → navega para nota
- Arrastar nó para reposicionar manualmente
- Selection box para selecionar múltiplos nós
- Filtro por tag, data, texto

### Filtros e Busca
- Barra de busca destaca nós correspondentes
- Filtro por tags (checkboxes)
- Filtro por data (slider timeline)
- Filtro por tipo de conexão (link, backlink, tag)
- "Foco em nó" — expande vizinhança até N níveis

### Timeline
- Slider temporal mostra criação de notas no tempo
- Animação de "construção do conhecimento"
- Destaque de períodos de atividade

### Layouts de Grafo
- Force-directed (padrão)
- Árvore (hierarquia de pastas)
- Radial (centralizado em nó)
- Grid (tags lado a lado)
- Mapa mental (mind map)

### Análise
- Hub score: notas mais conectadas
- Community detection: grupos de notas relacionadas
- Path finding: menor caminho entre duas notas
- Notas órfãs: sem conexões (sugerir links)

### Exportação
- Exportar imagem PNG/SVG do grafo
- Exportar dados JSON do grafo
- Compartilhar grafo como link

## Stack Técnica
- **3D**: Three.js com @react-three/fiber
- **2D**: vis-network ou react-force-graph-2d
- **Layout**: d3-force (simulação física)
- **Performance**: WebGL, instancing para muitos nós

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    GraphView.tsx                         │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Controls    │  │  Canvas  │  │  SidePanel       │   │
│  │  • Filtros   │  │ (3D/2D)  │  │  • Preview nota  │   │
│  │  • Layout    │  │          │  │  • Estatísticas  │   │
│  │  • Timeline  │  │          │  │  • Conexões      │   │
│  └──────────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## API Extensions
```typescript
// Novos endpoints bridge
knowledge.getGraphStats()  → { total, orphans, hubs, clusters }
knowledge.getPath(a, b)    → Node[]
knowledge.findOrphans()    → Note[]
knowledge.suggestLinks(id) → { noteId, score, reason }
knowledge.getTimeline()    → { date, count }[]
```

## Dependências
- Three.js + @react-three/fiber (novas dependências npm)
- graph_builder.cpp já implementa busca de grafo

## Prioridade: Média
## Esforço Estimado: 3-4 semanas
## Impacto: Alto — visualização é diferencial competitivo
