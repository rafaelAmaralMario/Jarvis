# Módulo Conhecimento

## O que faz
Sistema de notas Obsidian-like com suporte a Markdown, grafos de conhecimento, busca full-text e backlinks.

## Arquivos
```
kernel/src/knowledge/knowledge_manager.cpp — CRUD de notas e pastas
kernel/src/knowledge/search_engine.cpp     — Busca full-text
kernel/src/knowledge/graph_builder.cpp     — Grafo de conexões

ui/src/components/Knowledge/KnowledgePanel.tsx
ui/src/components/Knowledge/NoteEditor.tsx
ui/src/components/Knowledge/NotePreview.tsx
ui/src/components/Knowledge/SearchBar.tsx
ui/src/components/Knowledge/GraphView.tsx
ui/src/components/Knowledge/BacklinkPanel.tsx
```

## Funcionalidades

### Gerenciamento de Notas
- Criar nota com título e conteúdo Markdown
- Editar nota com preview em tempo real
- Organizar em pastas
- Tags por nota
- Busca full-text no conteúdo e título
- Autocomplete de links `[[wikilink]]`

### Grafos de Conhecimento
- Mapeamento automático de links entre notas
- Visualização interativa de grafos
- Expansão por profundidade
- Destaque de notas mais conectadas

### Backlinks
- Lista de notas que referenciam a nota atual
- Navegação bidirecional entre notas

### Busca
- Busca full-text no conteúdo e título
- Filtro por pasta
- Resultados com preview do trecho correspondente
- Ordenação por relevância

## Modelo de Dados
- `knowledge_notes`: id, title, content, folder_id, tags, created_at, updated_at
- `knowledge_links`: source_id, target_id, type
- `knowledge_tags`: id, name, color
- `note_tags`: note_id, tag_id
