# 006 — Módulo Conhecimento (Obsidian-like Notes)

## Metadados
- **Timestamp:** 2026-06-03T12:55:00-03:00
- **Status:** active
- **Supersedes:** —
- **Superseded by:** —
- **Skill usada:** context-generator

## Resumo
Implementação completa do Módulo Conhecimento, a feature principal do JARVIS — sistema de notas Markdown estilo Obsidian com backlinks, busca FTS5, grafos de conhecimento, e integração com IA.

## Arquivos Criados

### C++ Headers (`kernel/include/jarvis/knowledge/`)
- `note.h` — Note, CreateNoteDTO, NoteLink, GraphNode, GraphEdge, GraphData, Backlink, SearchResult, FolderEntry
- `knowledge_manager.h` — IKnowledgeManager interface (CRUD, folders, backlinks, graph, import/export, search) + factory `createKnowledgeManager(dbPath)`
- `search_engine.h` — ISearchEngine interface (search, rebuildIndex, addToIndex, removeFromIndex) + factory
- `graph_builder.h` — IGraphBuilder interface (build, buildJson) + factory

### C++ Implementations (`kernel/src/knowledge/`)
- `knowledge_manager.cpp` — CRUD SQLite, wikilink parsing via regex `\[\[([^\]]+)\]\]`, backlink tracking em `note_links`, FTS5 sync triggers, YAML front matter parsing, import/export .md com front matter, graph building
- `search_engine.cpp` — FTS5 MATCH queries com escape de caracteres especiais, ranking por relevância, snippets com `<mark>`
- `graph_builder.cpp` — Graph JSON builder, força nós sem arestas também inclusos, linkCount por nó

### SQL (`kernel/resources/sql/005-knowledge.sql`)
- `notes` — id, title, content, folder, tags, metadata, created_at, updated_at
- `note_links` — source_id, target_id, link_type, context
- `note_tags` — note_id, tag
- `notes_fts` — FTS5 virtual table com triggers de sync (INSERT/UPDATE/DELETE)
- Indexes em folder, updated_at, source_id, target_id, tag

### React Components (`ui/src/components/Knowledge/`)
- `KnowledgePanel.tsx` — Main panel com sidebar (folder tree + note list + search), toolbar (edit/preview/graph modes), backlink panel lateral. Loads via `useJarvis().listNotes()` e `getFolders()`. Suporta criar/deletar/selecionar notas, navegação por wikilinks
- `NoteEditor.tsx` — Textarea com auto-resize, título editável, contagem de chars/wikilinks, save button quando há mudanças
- `NotePreview.tsx` — Markdown renderer caseiro: headers, bold/italic, code blocks, inline code, listas, blockquotes, `[[wikilinks]]` como spans clicáveis com navegação
- `BacklinkPanel.tsx` — Lista de backlinks carregados via `getBacklinks(id)`, contexto snippet, hover states
- `GraphView.tsx` — Canvas-based force-directed graph com simulação de física (repulsão + atração + damping), click para selecionar nó, hover highlight, labels
- `SearchBar.tsx` — FTS5 search com resultados dropdown, snippets com highlight, score

### Updated Files
- `kernel/CMakeLists.txt` — 3 novos sources de knowledge
- `kernel/src/main.cpp` — include `knowledge_manager.h`, 12 novos bridge handlers (createNote, getNote, listNotes, updateNote, deleteNote, searchNotes, getBacklinks, getGraph, getFolders, moveNote, importNote, exportNote) + JSON serializers para Note, SearchResult, Backlink, FolderEntry, GraphData
- `ui/src/types/index.ts` — CreateNoteDTO, Backlink, FolderEntry, GraphNode, GraphEdge, GraphData, NoteTreeItem; bridge métodos de knowledge
- `ui/src/hooks/use-jarvis.ts` — 11 novos métodos bridge (createNote, updateNote, deleteNote, getBacklinks, getGraph, getFolders, moveNote, importNote, exportNote)
- `ui/src/components/MainArea.tsx` — lazy import de KnowledgePanel, renderiza para activeView === 'knowledge'
- `ui/src/components/Sidebar.tsx` — usa SearchBar do knowledge na sidebar

## Decisões Técnicas
- **Wikilinks resolvidos automaticamente**: ao salvar nota com `[[Título]]`, o sistema cria ou encontra a nota alvo e registra o link em `note_links`. Se alvo não existe, cria placeholder
- **FTS5 nativo do SQLite**: triggers automáticos mantêm índice sincronizado. Busca usa `porter unicode61` tokenizer
- **Markdown rendering no React**: renderizador caseiro em NotePreview.tsx para evitar dependências externas. `[[wikilinks]]` viram spans clicáveis com navegação
- **Grafo com Canvas API**: simulação force-directed implementada do zero (repulsão entre todos nós, atração nas arestas, damping). Cada frame: simular → desenhar
- **Conexão SQLite nomeada**: `knowledge` (manager), `knowledge-search` (search engine), `knowledge-graph` (graph builder) — mesmo padrão dos módulos AI
- **KnowledgeManager centraliza tudo**: CRUD, wikilinks, backlinks, graph, import/export, search — todas as operações passam pelo mesmo manager que usa a mesma conexão SQLite

## Dependências
- Task 002 (Estrutura C++ Kernel) — ServiceLocator, ModuleLoader
- Qt 6.8+ Sql (SQLite)
- Nenhuma dependência externa de Markdown — renderizador caseiro no React

## Próximos Passos
1. Mover Task 008 para concluída quando verificado
2. Testar com `npm install && npm run build` na UI
3. Testar com compilação C++ (Qt 6.8+ necessário)
4. Task 009 — Módulo Workspace (dependência do Conhecimento para file operations reais)
5. Task 010 — Módulo Persistência (SQLite repositories genéricos)
