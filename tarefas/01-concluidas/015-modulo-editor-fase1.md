# 015 — Módulo Editor — Fase 1 (Core)

## Metadados
- Status: em andamento
- Prioridade: 🔴 Alta
- Dependências: 001, 002, 003, 007, 009, 010

## Descrição
Implementar o módulo Editor completo com Monaco, abas, atalhos de teclado e mouse, e integração com Workspace.

## Especificação Técnica

### C++ — EditorService

**Interface** (`kernel/include/jarvis/editor/editor_manager.h`)
```cpp
#pragma once
#include <string>
#include <vector>
#include <optional>

struct EditorTabInfo {
    std::string path;
    std::string language;
    int64_t size;
    int64_t lastModified;
    bool isDirty;
};

struct IEditorService {
    virtual ~IEditorService() = default;
    virtual std::optional<EditorTabInfo> openFile(const std::string& path) = 0;
    virtual bool saveFile(const std::string& path, const std::string& content) = 0;
    virtual bool closeFile(const std::string& path) = 0;
    virtual std::vector<EditorTabInfo> getOpenFiles() = 0;
    virtual std::string detectLanguage(const std::string& filename) = 0;
    virtual void updateTabState(const std::string& path, bool isDirty) = 0;
};

IEditorService* createEditorService();
```

**Implementação** (`kernel/src/editor/editor_manager.cpp`)
- `EditorManager` implementa `IEditorService`
- `openFile`: lê arquivo do disco via `std::ifstream`, detecta linguagem por extensão, retorna `EditorTabInfo`
- `saveFile`: escreve conteúdo no disco via `std::ofstream`
- `closeFile`: remove da lista de abertos
- `getOpenFiles`: retorna abas abertas
- `detectLanguage`: mapeia extensão → Monaco language ID
- `updateTabState`: atualiza flag isDirty

**Bridge handlers** (em `main.cpp`):
- `editorOpenFile(path)` → `IEditorService::openFile` → retorna `{path, language, content, size, lastModified}`
- `editorSaveFile(path, content)` → `IEditorService::saveFile` → retorna `{success}`
- `editorCloseFile(path)` → `IEditorService::closeFile`
- `editorGetOpenFiles()` → `IEditorService::getOpenFiles`
- `editorDetectLanguage(filename)` → `IEditorService::detectLanguage`

**Mapeamento de linguagens** (extensão → Monaco ID):
```
.js/.jsx → javascript
.ts/.tsx → typescript
.py → python
.cpp/.cc/.cxx → cpp
.hpp/.hh/.hxx → cpp
.h → c
.java → java
.rs → rust
.go → go
.json → json
.md → markdown
.html → html
.css → css
.scss → scss
.xml → xml
.yaml/.yml → yaml
.toml → toml
.sql → sql
.sh → shell
.bat/.cmd → bat
.md → markdown
.txt → plaintext
```

**DB Migration #7** — recent_files:
```sql
CREATE TABLE IF NOT EXISTS recent_files (
    path TEXT PRIMARY KEY,
    language TEXT NOT NULL DEFAULT 'plaintext',
    last_opened TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_recent_files_opened ON recent_files(last_opened DESC);
```

### React — EditorPanel

**Dependência:** adicionar `@monaco-editor/react` no `ui/package.json`

**Componentes:**

1. **EditorPanel.tsx** — Orquestrador
   - Estado: `tabs: Map<string, TabState>`, `activeTab: string | null`
   - `TabState = { path, content, originalContent, language, isDirty }`
   - Ao receber `editorOpenFile` do bridge, cria nova aba (ou foca se já existe)
   - Ao trocar de aba, salva conteúdo atual no estado e carrega o da nova aba
   - Ao fechar aba, verifica `isDirty` → confirma se quer descartar alterações
   - Registra listeners de bridge: `editor-opened`, `editor-saved`

2. **EditorTabs.tsx** — Barra de abas
   - Lista horizontal de abas, scrollável
   - Cada aba: ícone de arquivo, nome do arquivo, × para fechar, ● se isDirty
   - Clique na aba → torna ativa
   - Clique no × → fecha (com confirmação se dirty)
   - Ctrl+Tab → próxima aba
   - Ctrl+Shift+Tab → aba anterior
   - Clique do meio (mouse wheel) → fecha aba
   - Duplo clique em área vazia → (futuro: novo arquivo)

3. **MonacoWrapper.tsx** — Wrapper do Monaco Editor
   - Usa `@monaco-editor/react` com `Editor` component
   - Props: `value`, `language`, `onChange`, `path` (para Monaco track changes)
   - Configurações:
     - Tema: `vs-dark`
     - Minimapa: habilitado
     - Line numbers: on
     - Gutter: on
     - Code folding: on
     - Bracket pair colorization: on
     - Auto-indentation: advanced
     - Tab size: 4
     - Word wrap: off
     - Smooth scrolling: on
     - Cursor blinking: smooth
     - Cursor style: line
     - Font size: 14
     - Font family: 'Cascadia Code', 'Fira Code', monospace
     - Render whitespace: selection
     - Context menu: habilitado
   - Atalhos customizados (via `editor.addAction`):
     - `Ctrl+S` → salvar (dispara `saveFile` no bridge)
     - `Ctrl+W` → fechar aba atual
     - `Ctrl+Tab` → próxima aba
     - `Ctrl+Shift+Tab` → aba anterior

   - **Context Menu (clique direito)** — extensão do Monaco:
     - "Salvar" (Ctrl+S)
     - "Fechar" (Ctrl+W)
     - "Copiar caminho do arquivo"
     - "Revelar na árvore" → chama bridge para focar no FileTree
     - Separador
     - Ações padrão do Monaco (copiar, colar, etc.)

4. **EditorContextMenu.tsx** — Provedor de ações customizadas
   - Registra ações no Monaco via `editor.addAction`
   - Cada ação aparece no context menu com label + atalho

5. **EditorStatusBar.tsx** — Componente para StatusBar
   - Exibe: `{linha}:{col} · {linguagem} · {encoding}`
   - Escuta eventos de cursor position do Monaco
   - Injeta no `StatusBar.tsx` existente

**Integração Workspace:**
- `WorkspacePanel.tsx`: duplo clique em arquivo → `bridge.send('editorOpenFile', path)`
- `WorkspacePanel.tsx`: context menu "Abrir no Editor"

**Registro no MainArea:**
- `types/index.ts`: adicionar `'editor'` no `ActivityView`
- `MainArea.tsx`: rota `case 'editor': return <EditorPanel />`
- `ActivityBar.tsx`: adicionar botão Editor com ícone `</>` (ou código SVG)

### Atalhos

**Teclado:**
| Atalho | Ação |
|--------|------|
| Ctrl+S | Salvar arquivo atual |
| Ctrl+W | Fechar aba atual |
| Ctrl+Tab | Próxima aba |
| Ctrl+Shift+Tab | Aba anterior |
| Ctrl+N | Novo arquivo (futuro) |
| Ctrl+P | Quick open (fase 2) |

**Mouse:**
| Ação | Efeito |
|------|--------|
| Clique na aba | Ativa a aba |
| × na aba | Fecha aba |
| Clique do meio na aba | Fecha aba |
| Duplo clique vazio nas abas | Novo arquivo (futuro) |
| **Clique direito no editor** | Context menu com Salvar, Fechar, Copiar caminho, Revelar na árvore |
| Clique direito na aba | Context menu: Fechar, Fechar outras, Salvar todos |
| **Clique direito no FileTree** | Context menu: Novo Arquivo, Nova Pasta, Renomear, Excluir |
| Inline rename no FileTree | Input inline para renomear sem prompt |
| Inline create no FileTree | Input inline com suporte a batch: `pasta/arquivo.txt` cria estrutura |
| Botões + / ✎ / ✕ no hover do FileTree | Ações rápidas de create, rename, delete |

### Batch Creation (FileTree)
- Ao criar arquivo via input inline, se o nome contiver `/`, cria diretórios automaticamente
- Exemplo: `src/components/Button.tsx` → cria `src/`, `src/components/`, `src/components/Button.tsx`
- Exemplo: `test/arquivo` → cria `test/` e `arquivo` (sem extensão)
- Usa bridge `createFileWithPath(fullPath)` que chama `std::filesystem::create_directories` no C++
- Input inline com placeholder descritivo: `"arquivo.txt ou pasta/arquivo.txt"`

## Critérios de Aceitação
- [ ] Monaco Editor renderiza com syntax highlighting e minimapa
- [ ] Abrir arquivo por duplo clique no FileTree cria aba
- [ ] Múltiplas abas com navegação Ctrl+Tab
- [ ] Ctrl+S salva conteúdo no disco via bridge
- [ ] Ctrl+W fecha aba atual
- [ ] Indicador ● em abas não salvas
- [ ] Confirmação ao fechar aba com alterações não salvas
- [ ] Detecta linguagem por extensão do arquivo
- [ ] Context menu (clique direito) com Salvar, Fechar, Copiar caminho, Revelar na árvore
- [ ] StatusBar exibe linha:col e linguagem
- [ ] Abrir mesma aba não duplica (foca existente)
- [ ] Tabs barra com scroll para muitas abas
- [ ] Fechar com clique do meio na aba

## Test Cases

### TC-001: Abrir arquivo no editor
- **Pré-condições:** Workspace com arquivos, Monaco carregado
- **Passos:** 1. Dar duplo clique em arquivo.js no FileTree
- **Resultado:** Nova aba com nome do arquivo, Monaco com syntax highlighting JS, minimapa visível
- **Cobertura:** normal

### TC-002: Múltiplas abas
- **Pré-condições:** Workspace com múltiplos arquivos de linguagens diferentes
- **Passos:** 1. Abrir arquivo A 2. Abrir arquivo B 3. Abrir arquivo C 4. Clicar em cada aba
- **Resultado:** 3 abas visíveis, cada uma com syntax highlighting correto, troca de aba exibe conteúdo correto
- **Cobertura:** normal

### TC-003: Ctrl+Tab navegação
- **Pré-condições:** 3+ abas abertas
- **Passos:** 1. Pressionar Ctrl+Tab 2. Pressionar novamente
- **Resultado:** Alterna entre as abas na ordem
- **Cobertura:** normal

### TC-004: Salvar arquivo (Ctrl+S)
- **Pré-condições:** Aba aberta com arquivo existente
- **Passos:** 1. Editar conteúdo 2. Pressionar Ctrl+S
- **Resultado:** Bridge salva no disco, indicador ● desaparece
- **Cobertura:** normal

### TC-005: Fechar aba sem alterações (Ctrl+W / × / clique do meio)
- **Pré-condições:** Aba aberta sem alterações
- **Passos:** 1. Pressionar Ctrl+W (ou clicar ×, ou clique do meio)
- **Resultado:** Aba fechada imediatamente
- **Cobertura:** normal

### TC-006: Fechar aba com alterações não salvas
- **Pré-condições:** Aba com conteúdo modificado
- **Passos:** 1. Pressionar Ctrl+W
- **Resultado:** Modal "Salvar alterações antes de fechar?" com opções Salvar / Descartar / Cancelar
- **Cobertura:** borda

### TC-007: Context menu (clique direito)
- **Pré-condições:** Arquivo aberto no editor
- **Passos:** 1. Clicar com botão direito no editor
- **Resultado:** Menu aparece com Salvar, Fechar, Copiar caminho, Revelar na árvore
- **Cobertura:** normal

### TC-008: Revelar na árvore
- **Pré-condições:** Aba ativa com arquivo
- **Passos:** 1. Clique direito 2. Clicar "Revelar na árvore"
- **Resultado:** FileTree expande e destaca o arquivo
- **Cobertura:** normal

### TC-009: StatusBar atualiza cursor
- **Pré-condições:** Editor aberto com conteúdo
- **Passos:** 1. Mover cursor para linha 5, coluna 10
- **Resultado:** StatusBar exibe "5:10 · JavaScript"
- **Cobertura:** normal

### TC-010: Abrir mesmo arquivo não duplica aba
- **Pré-condições:** Aba já aberta para arquivo X
- **Passos:** 1. Dar duplo clique no mesmo arquivo X
- **Resultado:** Aba existente é focada, nenhuma nova aba criada
- **Cobertura:** borda

### TC-011: Detecção de linguagem por extensão
- **Pré-condições:** Arquivos .ts, .py, .cpp, .rs, .md
- **Passos:** 1. Abrir cada arquivo
- **Resultado:** Cada aba com syntax highlighting correto da linguagem
- **Cobertura:** múltiplas

### TC-012: Muitas abas com scroll
- **Pré-condições:** 15+ arquivos no workspace
- **Passos:** 1. Abrir todos 2. Scrollar a barra de abas
- **Resultado:** Tabs container com scroll horizontal, abas visíveis conforme scroll
- **Cobertura:** borda

### TC-013: Ponteiro do meio fecha aba
- **Pré-condições:** Aba aberta
- **Passos:** 1. Clicar com scroll do mouse na aba
- **Resultado:** Aba fechada
- **Cobertura:** normal

### TC-014: Context menu no FileTree
- **Pré-condições:** Workspace com arquivos
- **Passos:** 1. Clicar direito em um arquivo 2. Clicar "Renomear"
- **Resultado:** Input inline aparece no lugar do nome, permite renomear sem prompt
- **Cobertura:** normal

### TC-015: Batch create com path
- **Pré-condições:** Workspace aberto
- **Passos:** 1. Clicar direito em uma pasta 2. "Novo Arquivo" 3. Digitar "src/components/Button.tsx" 4. Enter
- **Resultado:** Pastas `src/` e `src/components/` criadas, arquivo `Button.tsx` dentro
- **Cobertura:** normal

### TC-016: Inline create file no FileTree
- **Pré-condições:** Workspace aberto
- **Passos:** 1. Clicar no botão + ao lado de uma pasta no hover 2. Digitar nome 3. Enter
- **Resultado:** Arquivo criado, FileTree atualizado
- **Cobertura:** normal

### TC-017: Inline rename no FileTree
- **Pré-condições:** Workspace com arquivos
- **Passos:** 1. Clicar no botão ✎ ao lado de um arquivo 2. Digitar novo nome 3. Enter
- **Resultado:** Arquivo renomeado, FileTree atualizado
- **Cobertura:** normal

### TC-018: Delete via context menu
- **Pré-condições:** Arquivo no workspace
- **Passos:** 1. Clicar direito no arquivo 2. Clicar "Excluir" 3. Confirmar no diálogo
- **Resultado:** Arquivo deletado, FileTree atualizado
- **Cobertura:** normal

### TC-019: Abrir arquivo do FileTree redireciona para Editor
- **Pré-condições:** Workspace com arquivos
- **Passos:** 1. Clicar em arquivo no FileTree
- **Resultado:** View muda para EditorPanel com Monaco exibindo o arquivo
- **Cobertura:** normal
