# Modulo Conhecimento

## O que faz
Sistema de notas Obsidian-like com suporte a Markdown, grafos de conhecimento, busca full-text e backlinks.

## Arquivos
```
backend/jarvis/knowledge_manager.py     — CRUD de notas, pastas, FTS5, wikilinks, import/export
backend/jarvis/graph_builder.py         — Grafo de conexoes entre notas

ui/src/components/Knowledge/KnowledgePanel.tsx
ui/src/components/Knowledge/NoteEditor.tsx
ui/src/components/Knowledge/NotePreview.tsx
ui/src/components/Knowledge/SearchBar.tsx
ui/src/components/Knowledge/GraphView.tsx
ui/src/components/Knowledge/BacklinkPanel.tsx
```

## Funcionalidades

### Gerenciamento de Notas
- Criar nota com titulo e conteudo Markdown
- Editar nota com preview em tempo real
- Organizar em pastas
- Tags por nota
- Busca full-text no conteudo e titulo (FTS5)
- Autocomplete de links `[[wikilink]]`

### Grafos de Conhecimento
- Mapeamento automatico de links entre notas
- Visualizacao interativa de grafos
- Expansao por profundidade
- Destaque de notas mais conectadas

### Backlinks
- Lista de notas que referenciam a nota atual
- Navegacao bidirecional entre notas

### Busca
- Busca full-text no conteudo e titulo (FTS5)
- Filtro por pasta
- Resultados com preview do trecho correspondente
- Ordenacao por relevancia

### Import/Export
- Importar notas de arquivos Markdown (.md)
- Exportar notas para arquivos .md individuais
- Preservacao de metadados (front matter)

## Modelo de Dados
- `knowledge_notes`: id, title, content, folder_id, tags, created_at, updated_at
- `knowledge_links`: source_id, target_id, type
- `knowledge_tags`: id, name, color
- `note_tags`: note_id, tag_id

## Bridge API
- 12 metodos: `createNote`, `getNote`, `listNotes`, `updateNote`, `deleteNote`, `searchNotes`, `getBacklinks`, `getGraph`, `getFolders`, `moveNote`, `importNote`, `exportNote`
