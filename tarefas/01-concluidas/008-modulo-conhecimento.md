# 008 — Módulo Conhecimento (Obsidian-like Notes)

## Metadados
- **Status:** ⬜ A Fazer
- **Prioridade:** 🔴 Alta
- **Dependências:** 002 (Estrutura C++ Kernel), 010 (Módulo Persistência)

## Descrição
Implementar o módulo **Conhecimento**, a feature principal do JARVIS — um sistema
de notas Markdown estilo Obsidian com backlinks, busca FTS5, grafos de conhecimento,
e integração com IA. Este é o "cérebro" do assistente.

## Especificação Técnica

### Arquivos Planejados
```
kernel/include/jarvis/knowledge/
├── note.h                     ← Note model (id, title, content, tags, links,
│                                  backlinks, createdAt, updatedAt, metadata)
├── knowledge_manager.h        ← IKnowledgeManager
├── note_renderer.h            ← Markdown → HTML renderer
├── backlink_index.h           ← Backlink graph index
├── search_engine.h            ← FTS5 full-text search
└── graph_builder.h            ← Knowledge graph (nodes + edges)

kernel/src/knowledge/
├── knowledge_manager.cpp      ← CRUD notas, organize, import/export
├── note_renderer.cpp          ← Markdown parsing (cmark-gfm or custom)
├── backlink_index.cpp         ← [[wikilink]] parser, backlink graph
├── search_engine.cpp          ← SQLite FTS5 queries
└── graph_builder.cpp          ← Graph JSON for UI visualization

ui/src/components/Knowledge/
├── KnowledgePanel.tsx         ← Folder tree + note list
├── NoteEditor.tsx             ← Monaco Editor for .md editing
├── NotePreview.tsx            ← Rendered HTML preview
├── BacklinkPanel.tsx          ← Incoming/outgoing links
├── GraphView.tsx              ← D3.js/vis.js knowledge graph
└── SearchBar.tsx              ← FTS5 search with results

kernel/resources/sql/
└── 005-knowledge.sql          ← notes, note_links, note_tags, note_fts tables
```

### SQL Schema
```sql
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    folder TEXT DEFAULT '/',
    tags TEXT DEFAULT '',         -- comma-separated
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    metadata TEXT DEFAULT '{}'    -- JSON metadata
);

CREATE TABLE note_links (
    source_id TEXT NOT NULL REFERENCES notes(id),
    target_id TEXT NOT NULL REFERENCES notes(id),
    link_type TEXT DEFAULT 'wikilink',
    PRIMARY KEY (source_id, target_id)
);

CREATE VIRTUAL TABLE notes_fts USING fts5(
    title, content, tags,
    content='notes',
    content_rowid='rowid'
);

-- Triggers para manter FTS sincronizado
```

### Funcionalidades
- Criar/editar notas em Markdown com preview HTML
- `[[wikilinks]]` entre notas com backlinks automáticos
- Busca full-text via FTS5 (título, conteúdo, tags)
- Pastas e organização em árvore
- Tags coloridas
- Grafo de conhecimento interativo (força direcionada)
- Templates de nota
- Import/Export Markdown

## Critérios de Aceitação
- [ ] CRUD de notas com persistência SQLite
- [ ] Editor Monaco com syntax highlight Markdown
- [ ] Preview HTML lado a lado
- [ ] `[[wikilink]]` parsing com autocomplete
- [ ] Backlinks mostrados para cada nota
- [ ] FTS5 search com highlight e snippets
- [ ] Grafo de conhecimento com D3.js/vis.js
- [ ] Organização em pastas (árvore)
- [ ] Tags por nota
- [ ] Import/Export de arquivos .md

---

## Test Cases

### TC-001: Criar nota via C++
- **Pré-condições:** KnowledgeManager initDB
- **Passos:**
  1. `noteManager.createNote({title:"SOLID", content:"Os 5 princípios...", folder:"/dev", tags:"cpp,arquitetura"})`
  2. `noteManager.getNote(id)`
- **Resultado esperado:** Nota criada com id, timestamps, conteúdo intacto
- **Cobertura:** normal

### TC-002: Editar nota
- **Pré-condições:** Nota existe
- **Passos:**
  1. `noteManager.updateNote(id, {title:"SOLID - Atualizado", content:"Novo conteúdo"})`
  2. `noteManager.getNote(id)`
- **Resultado esperado:** Título e conteúdo atualizados, updatedAt mudou
- **Cobertura:** normal

### TC-003: Deletar nota
- **Pré-condições:** Nota existe
- **Passos:**
  1. `noteManager.deleteNote(id)`
  2. `noteManager.getNote(id)`
- **Resultado esperado:** Nota removida, backlinks atualizados
- **Cobertura:** normal

### TC-004: Deletar nota inexistente
- **Pré-condições:** Nenhuma
- **Passos:**
  1. `noteManager.deleteNote("id-inexistente")`
- **Resultado esperado:** false ou erro tratado (não crash)
- **Cobertura:** erro

### TC-005: [[wikilink]] parsing detecta links
- **Pré-condições:** Nota A com conteúdo "Veja [[Nota B]] e [[Nota C]]"
- **Passos:**
  1. Salvar Nota A
  2. `noteManager.getBacklinks("Nota B")`
- **Resultado esperado:** Nota A aparece como fonte de backlink para Nota B
- **Cobertura:** normal

### TC-006: [[wikilink]] para nota inexistente
- **Pré-condições:** Nota A com "[[Nota Inexistente]]"
- **Passos:**
  1. Salvar Nota A
  2. Verificar link registrado
- **Resultado esperado:** Link registrado mesmo sem target (broken link detectado)
- **Cobertura:** borda

### TC-007: FTS5 search por título
- **Pré-condições:** Notas com títulos variados
- **Passos:**
  1. `searchEngine.search("SOLID")`
- **Resultado esperado:** Retorna notas com "SOLID" no título, ranked por relevância
- **Cobertura:** normal

### TC-008: FTS5 search por conteúdo
- **Pré-condições:** Notas com conteúdo variado
- **Passos:**
  1. `searchEngine.search("princípios de design")`
- **Resultado esperado:** Retorna notas relevantes com snippets
- **Cobertura:** normal

### TC-009: FTS5 search sem resultados
- **Pré-condições:** Nenhuma nota com "xyz123naoexiste"
- **Passos:**
  1. `searchEngine.search("xyz123naoexiste")`
- **Resultado esperado:** Lista vazia, sem erro
- **Cobertura:** borda

### TC-010: FTS5 search com caracteres especiais
- **Pré-condições:** Nenhuma
- **Passos:**
  1. `searchEngine.search("C++")`
  2. `searchEngine.search("#tag")`
  3. `searchEngine.search("")` (vazio)
- **Resultado esperado:** Busca sanitizada sem crash
- **Cobertura:** borda | erro

### TC-011: Grafo de conhecimento construído
- **Pré-condições:** 5 notas com links entre si
- **Passos:**
  1. `auto graph = graphBuilder.buildGraph()`
- **Resultado esperado:** Graph JSON com nodes array + edges array, sem duplicatas
- **Cobertura:** normal

### TC-012: Grafo vazio
- **Pré-condições:** Nenhuma nota
- **Passos:**
  1. `auto graph = graphBuilder.buildGraph()`
- **Resultado esperado:** nodes=[], edges=[]
- **Cobertura:** borda

### TC-013: Import arquivo .md avulso
- **Pré-condições:** Arquivo .md válido no sistema
- **Passos:**
  1. `noteManager.importMd("caminho/arquivo.md")`
  2. Verificar nota criada com título do filename
- **Resultado esperado:** Nota importada com conteúdo
- **Cobertura:** normal

### TC-014: Import .md com metadata YAML front matter
- **Pré-condições:** Arquivo .md com `---\ntitle: Custom\ntags: [a,b]\n---`
- **Passos:**
  1. Importar
- **Resultado esperado:** Front matter parsed como metadata, título/tags extraídos
- **Cobertura:** normal | borda

### TC-015: Export nota para .md
- **Pré-condições:** Nota existe
- **Passos:**
  1. `noteManager.exportMd(id, "caminho/export.md")`
  2. Abrir arquivo exportado
- **Resultado esperado:** Arquivo .md com front matter + conteúdo
- **Cobertura:** normal

### TC-016: Organização em pastas
- **Pré-condições:** Notas em "/dev", "/dev/cpp", "/pessoal"
- **Passos:**
  1. `noteManager.listByFolder("/dev")` → notas em /dev e /dev/cpp
  2. `noteManager.getFolders()` → ["/dev", "/dev/cpp", "/pessoal"]
- **Resultado esperado:** Hierarquia de pastas funcional
- **Cobertura:** normal

### TC-017: Mover nota entre pastas
- **Pré-condições:** Nota em "/dev"
- **Passos:**
  1. `noteManager.moveNote(id, "/arquitetura")`
- **Resultado esperado:** Nota agora em "/arquitetura"
- **Cobertura:** normal

### TC-018: NoteRenderer renderiza Markdown
- **Pré-condições:** Nota com Markdown (headers, lists, code blocks, [[links]])
- **Passos:**
  1. `auto html = renderer.render(note.content)`
- **Resultado esperado:** HTML válido, [[links]] convertidos para `<a>` internos
- **Cobertura:** normal

### TC-019: NoteRenderer XSS sanitization
- **Pré-condições:** Nota com `<script>alert('xss')</script>`
- **Passos:**
  1. `auto html = renderer.render(conteudo_malicioso)`
- **Resultado esperado:** Script tags escapadas ou removidas
- **Cobertura:** segurança

### TC-020: Bridge endpoints do Conhecimento
- **Pré-condições:** Módulo carregado
- **Passos:**
  1. `window.jarvis.listNotes(folder)` → array
  2. `window.jarvis.createNote({title,content,folder,tags})` → note
  3. `window.jarvis.updateNote(id, changes)` → note
  4. `window.jarvis.deleteNote(id)` → void
  5. `window.jarvis.searchNotes(query)` → array
  6. `window.jarvis.getBacklinks(noteId)` → array
  7. `window.jarvis.getGraph()` → {nodes, edges}
- **Resultado esperado:** Todos os endpoints respondem
- **Cobertura:** normal
