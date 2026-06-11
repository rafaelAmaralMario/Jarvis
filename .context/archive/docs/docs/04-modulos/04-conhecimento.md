# Modulo Conhecimento ("Cerebro")

**ID:** `jarvis.knowledge`
**Prioridade:** 🔴 Alta
**Depende de:** Kernel
**Status:** Nao iniciado

## Visao Geral

O Modulo Conhecimento e a **feature principal e nativa** do JARVIS. Inspirado no Obsidian, oferece um sistema de armazenamento, organizacao e busca de conhecimento pessoal e do projeto.

Diferente do Obsidian que e uma ferramenta separada, no JARVIS o conhecimento e **parte integrante do ecossistema** — todos os outros modulos (AI Engine, IDE, Automacao) consomem e enriquecem este conhecimento automaticamente.

## Funcionalidades

### 1. Vault de Conhecimento (Obsidian-like)
- Notas em Markdown com suporte a wiki links (`[[link]]`)
- Pastas e subpastas para organizacao
- Tags com cores
- Editor de notas integrado (QML)
- Preview ao vivo do Markdown renderizado
- Frontmatter YAML para metadados (titulo, tags, data, etc.)

### 2. Grafos de Conhecimento
- Grafo interativo de backlinks entre notas
- Visualizacao de conexoes (forca, distancia, clusters)
- Filtro por tags, pastas, data
- Exportacao do grafo como imagem

### 3. Busca
- Full-text search com FTS5 (SQLite)
- Busca por tags
- Busca semantica (futuro: embeddings + sqlite-vec)
- Resultados com preview e highlighting

### 4. Memoria para AI Engine
- Contexto enriquecido para prompts do LLM
- Recuperacao automatica de notas relevantes para a conversa atual
- Memoria de curto prazo (sessao) e longo prazo (banco)
- Embeddings das notas para RAG (futuro)

### 5. Automacao e Integracao
- Criacao automatica de notas por agentes (ex.: "Cerebro do Projeto")
- Vinculacao automatica de notas de codigo, decisoes tecnicas, bugs
- Sugestao de conexoes entre notas baseada em similaridade
- WebSocket para sync em tempo real (futuro: sync mobile)

## Interface (QML)

```
┌─────────────────────────────────────────┐
│ [Vault: Meu Cohecimento]    [Busca...] │
├──────────┬──────────────────────────────┤
│ Explorer │  Editor de Nota              │
│ 📁 docs/ │  # Titulo da Nota           │
│   ├─ arq │                             │
│   ├─ tec │  Conteudo em Markdown...     │
│   └─ dec │  [[link]] para outra nota   │
│          │                              │
│ Tags     │  [Salvar] [Grafo] [Deletar] │
│ #cpp     ├──────────────────────────────┤
│ #qt      │  Backlinks                   │
│ #ai      │  ← Ligada a: Nota X         │
└──────────┴──────────────────────────────┘
```

## Esquema do Banco

```sql
-- notes: armazenamento principal
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    folder TEXT DEFAULT '/',
    tags TEXT DEFAULT '[]',        -- JSON array
    frontmatter TEXT DEFAULT '{}',  -- YAML parsed to JSON
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0
);

-- links: backlinks entre notas
CREATE TABLE links (
    source_id TEXT NOT NULL REFERENCES notes(id),
    target_id TEXT NOT NULL REFERENCES notes(id),
    link_type TEXT DEFAULT 'wiki',
    created_at TEXT NOT NULL
);

-- tags: dicionario de tags
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT
);

-- FTS5 para busca full-text
CREATE VIRTUAL TABLE notes_fts USING fts5(
    title, content, tags,
    content='notes',
    content_rowid='rowid'
);
```

## API Publica do Modulo

```cpp
class KnowledgeService {
public:
    // Notas
    virtual std::vector<Note> listNotes(const std::string& folder = "/") = 0;
    virtual std::optional<Note> getNote(const std::string& id) = 0;
    virtual Note createNote(const std::string& title, const std::string& folder = "/") = 0;
    virtual bool updateNote(const Note& note) = 0;
    virtual bool deleteNote(const std::string& id) = 0;
    
    // Busca
    virtual std::vector<SearchResult> search(const std::string& query) = 0;
    
    // Grafos
    virtual std::vector<Link> getBacklinks(const std::string& noteId) = 0;
    virtual std::vector<Link> getForwardLinks(const std::string& noteId) = 0;
    virtual GraphData getFullGraph() = 0;
    
    // Tags
    virtual std::vector<Tag> listTags() = 0;
    virtual std::vector<Note> getNotesByTag(const std::string& tagName) = 0;
    
    // Contexto para AI
    virtual std::vector<Note> getRelevantNotes(const std::string& context) = 0;
};
```

## Arquivos do Modulo

```
modules/conhecimento/
├── CMakeLists.txt
├── module.json                    # Manifesto
├── include/jarvis/knowledge/
│   ├── api.h                      # KnowledgeService interface + types
│   └── module.h                   # create_module entry
├── src/
│   ├── module.cpp                 # Implementacao do ModuleAPI
│   ├── knowledge_service_impl.cpp
│   ├── note_repository.cpp        # SQL queries
│   ├── graph_builder.cpp          # Grafo de backlinks
│   ├── search_engine.cpp          # FTS5 search
│   ├── markdown_parser.cpp        # Parse de wiki links, frontmatter
│   └── markdown_renderer.cpp      # MD -> HTML para preview
├── qml/
│   ├── KnowledgePanel.qml
│   ├── NoteEditor.qml
│   ├── NoteExplorer.qml
│   ├── GraphView.qml
│   └── SearchBar.qml
└── tests/
    ├── test_note_repository.cpp
    ├── test_graph.cpp
    ├── test_search.cpp
    └── test_markdown.cpp
```
