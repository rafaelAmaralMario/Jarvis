# Proposta: Ponte de Importação (Obsidian, Notion, Markdown)

## Visão Geral
Permitir que usuários importem seus dados de outras plataformas diretamente para o JARVIS, removendo a barreira de migração e tornando a adoção mais fácil.

## Plataformas Suportadas

| Plataforma | Dados | Formato | Complexidade |
|-----------|-------|---------|-------------|
| Obsidian | Notas Markdown, pastas, links, tags | Pasta local .md | Baixa |
| Notion | Páginas, databases, imagens | Export HTML/CSV | Média |
| Roam Research | Bloques, referências | JSON export | Média |
| Bear App | Notas, tags | SQLite backup | Média |
| Evernote | Notas, anexos, tags | ENEX export | Alta |
| Markdown | Arquivos .md soltos | Pasta local | Baixa |
| VS Code | Settings, snippets, keybindings | JSON files | Baixa |

## Funcionalidades

### Assistente de Importação
- Wizard passo a passo: selecionar plataforma → localizar arquivo → mapear campos
- Preview dos dados antes de importar
- Resolução de conflitos (nota já existe?)
- Progresso da importação com barra
- Log detalhado (sucessos, falhas, warnings)

### Mapeamento Inteligente
- Tags → Tags do JARVIS
- Pastas → Pastas do JARVIS
- Links `[[wikilink]]` → Links do grafo de conhecimento
- Anexos (imagens) → Importados para pasta de mídia
- Metadados (created_at, updated_at) → Preservados
- Favoritos/pins → Preservados

### Obsidian Import (Prioridade Máxima)
- Leitura de vault Obsidian (pasta com .md)
- Parsing de `[[wikilinks]]`
- Frontmatter YAML → Tags e metadados
- Pastas aninhadas preservadas
- Embeds `![[image.png]]` → resolvidos
- Plugins conhecidos: Dataview, Kanban → ignorados com aviso

### Notion Import
- Parsing de exportação HTML do Notion
- Databases → grupos de notas ou pastas
- Propriedades (select, date, text) → tags
- Imagens inline → baixadas e referenciadas localmente
- Relações entre databases → links no grafo

### Markdown Import
- Importar pasta com .md
- Detecção automática de título (primeiro H1 ou filename)
- Frontmatter → metadados
- Preservação de estrutura de pastas
- Gitignore para ignorar node_modules, etc

## Interface

```
┌────────────────────────────────────────────┐
│  Assistente de Importação                   │
│                                            │
│  1. Selecione a origem:                    │
│     [Obsidian] [Notion] [Markdown] [...]   │
│                                            │
│  2. Localize os arquivos:                  │
│     📁 C:/Users/me/Documents/vault/       │
│     [Selecionar Pasta]                     │
│                                            │
│  3. Preview (3.452 notas encontradas):     │
│     [📄 Machine Learning] [📄 React] ...  │
│                                            │
│  4. Opções:                                │
│     [x] Preservar timestamps               │
│     [x] Importar anexos                    │
│     [ ] Sobrescrever notas existentes      │
│                                            │
│  5. [Importar]                             │
└────────────────────────────────────────────┘
```

## Extensões Bridge
```typescript
import.preview({ source, path })     → ImportPreview
import.run({ source, path, options }) → ImportResult
import.getHistory()                   → ImportHistory[]
import.rollback(id)                   → { success }
```

## Tabelas SQLite
```sql
CREATE TABLE import_history (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,  -- 'obsidian', 'notion', 'markdown'
    source_path TEXT NOT NULL,
    total_notes INTEGER NOT NULL,
    imported_notes INTEGER NOT NULL,
    skipped_notes INTEGER,
    failed_notes INTEGER,
    options JSON,
    status TEXT NOT NULL,  -- completed, partial, failed
    error TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT
);
```

## Dependências
- Knowledge Module existente (CRUD de notas)
- Workspace (acesso a arquivos)
- Novo módulo C++: `kernel/src/import/*.cpp`

## Prioridade: Média-Alta
## Esforço Estimado: 3-4 semanas
## Impacto: Alto — remove barreira de entrada para novos usuários
