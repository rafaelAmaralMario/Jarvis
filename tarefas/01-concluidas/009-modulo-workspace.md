# 009 — Módulo Workspace

## Metadados
- **Status:** ⬜ A Fazer
- **Prioridade:** 🔴 Alta
- **Dependências:** 002 (Estrutura C++ Kernel)

## Descrição
Implementar o módulo **Workspace** para gerenciamento de diretórios do projeto,
arquivos, multi-root workspaces, e watchers de file system. É a base para
o módulo Conhecimento e IDE.

## Especificação Técnica

### Arquivos Planejados
```
kernel/include/jarvis/workspace/
├── workspace_manager.h       ← IWorkspaceManager
├── file_watcher.h            ← IFileWatcher (QFileSystemWatcher wrapper)
├── project.h                 ← Project model
└── file_utils.h              ← File helpers

kernel/src/workspace/
├── workspace_manager.cpp     ← CRUD workspaces, multi-root
├── file_watcher.cpp          ← File system events
└── project.cpp               ← Project metadata

ui/src/components/Workspace/
├── WorkspacePanel.tsx        ← File tree + workspace switcher
├── FileTree.tsx              ← File explorer tree
└── FileTabs.tsx              ← Open files tabs

kernel/resources/sql/
└── 006-workspace.sql         ← workspaces, workspace_folders, recent_files
```

### Features
- Multi-root workspace (várias pastas raiz)
- File tree com ícones, expandir/colapsar
- Criar/deletar/renomear/mover arquivos e pastas
- File watcher com eventos: created, modified, deleted, renamed
- Recent files tracking
- Project metadata (name, version, type)

## Critérios de Aceitação
- [ ] Abrir workspace com N pastas raiz
- [ ] File tree com navegação completa
- [ ] CRUD de arquivos e pastas
- [ ] File watcher notifica mudanças
- [ ] Recent files list
- [ ] Multi-root switching

---

## Test Cases

### TC-001: Abrir workspace vazio
- **Pré-condições:** Pasta vazia existe
- **Passos:**
  1. `workspaceManager.open("/caminho/vazio")`
  2. `workspaceManager.getRoots()` → ["/caminho/vazio"]
  3. `workspaceManager.listFiles("/")` → []
- **Resultado esperado:** Workspace aberto, árvore vazia
- **Cobertura:** normal | borda

### TC-002: Abrir workspace com arquivos
- **Pré-condições:** Pasta com 3 arquivos, 1 subpasta
- **Passos:**
  1. `workspaceManager.open("/caminho")`
  2. `workspaceManager.listFiles("/")` → 4 entries
  3. `workspaceManager.listFiles("/subpasta")` → entries da subpasta
- **Resultado esperado:** Árvore completa
- **Cobertura:** normal

### TC-003: Criar arquivo
- **Pré-condições:** Workspace aberto
- **Passos:**
  1. `workspaceManager.createFile("novo.txt", "/")`
  2. `workspaceManager.listFiles("/")` contém "novo.txt"
- **Resultado esperado:** Arquivo criado no disco
- **Cobertura:** normal

### TC-004: Criar arquivo com nome inválido
- **Pré-condições:** Workspace aberto
- **Passos:**
  1. `workspaceManager.createFile("", "/")`
  2. `workspaceManager.createFile("a/b/c", "/")`
  3. `workspaceManager.createFile("con", "/")` (windows reserved)
- **Resultado esperado:** Erro retornado, arquivo não criado
- **Cobertura:** erro | borda

### TC-005: Deletar arquivo
- **Pré-condições:** Arquivo "novo.txt" existe
- **Passos:**
  1. `workspaceManager.deleteFile("/novo.txt")`
- **Resultado esperado:** Arquivo removido do disco e da árvore
- **Cobertura:** normal

### TC-006: Deletar arquivo inexistente
- **Pré-condições:** Nenhuma
- **Passos:**
  1. `workspaceManager.deleteFile("/nao-existe.txt")`
- **Resultado esperado:** Erro retornado
- **Cobertura:** erro

### TC-007: Renomear arquivo
- **Pré-condições:** Arquivo "velho.txt" existe
- **Passos:**
  1. `workspaceManager.rename("/velho.txt", "novo.txt")`
- **Resultado esperado:** Arquivo renomeado, novo nome na árvore
- **Cobertura:** normal

### TC-008: Renomear para nome existente
- **Pré-condições:** "a.txt" e "b.txt" existem
- **Passos:**
  1. `workspaceManager.rename("/a.txt", "b.txt")`
- **Resultado esperado:** Erro (conflito) ou sobrescrita (depende da config)
- **Cobertura:** borda

### TC-009: File watcher detecta criação externa
- **Pré-condições:** Workspace aberto, watcher ativo
- **Passos:**
  1. Criar arquivo externamente (ex: echo > test.txt)
- **Resultado esperado:** Callback/directSignal "fileCreated" com path
- **Cobertura:** normal

### TC-010: File watcher detecta modificação externa
- **Pré-condições:** Arquivo monitorado
- **Passos:**
  1. Modificar arquivo externamente
- **Resultado esperado:** Callback "fileModified"
- **Cobertura:** normal

### TC-011: File watcher detecta deleção externa
- **Pré-condições:** Arquivo monitorado
- **Passos:**
  1. Deletar arquivo externamente
- **Resultado esperado:** Callback "fileDeleted"
- **Cobertura:** normal

### TC-012: Multi-root workspace
- **Pré-condições:** 2 pastas existentes
- **Passos:**
  1. `workspaceManager.addRoot("/pasta1")`
  2. `workspaceManager.addRoot("/pasta2")`
  3. `workspaceManager.getRoots()` → ["/pasta1", "/pasta2"]
  4. `workspaceManager.removeRoot("/pasta1")`
  5. `workspaceManager.getRoots()` → ["/pasta2"]
- **Resultado esperado:** Multi-root funcional
- **Cobertura:** normal

### TC-013: Recent files tracking
- **Pré-condições:** Workspace aberto
- **Passos:**
  1. Abrir arquivo A, B, C via workspace
  2. `workspaceManager.getRecentFiles()` → [C, B, A] (mais recente primeiro)
- **Resultado esperado:** Recent files ordenados por data de acesso
- **Cobertura:** normal

### TC-014: Recent files máximo 20
- **Pré-condições:** 25 arquivos abertos
- **Passos:**
  1. Abrir 25 arquivos
  2. `workspaceManager.getRecentFiles()`
- **Resultado esperado:** Máximo 20 entries
- **Cobertura:** borda

### TC-015: FileWatcher com muitas mudanças simultâneas
- **Pré-condições:** Watcher ativo
- **Passos:**
  1. Criar 100 arquivos rapidamente
- **Resultado esperado:** Eventos coalescidos ou todos recebidos sem perder
- **Cobertura:** estresse

### TC-016: Bridge endpoints Workspace
- **Pré-condições:** Módulo carregado
- **Passos:**
  1. `window.jarvis.openWorkspace(path)` → roots
  2. `window.jarvis.listFiles(path)` → entries
  3. `window.jarvis.createFile(name, parent)` → void
  4. `window.jarvis.readFile(path)` → content
  5. `window.jarvis.writeFile(path, content)` → void
  6. `window.jarvis.deleteFile(path)` → void
  7. `window.jarvis.renameFile(oldPath, newName)` → void
  8. `window.jarvis.getRecentFiles()` → array
  9. `window.jarvis.onFileEvent(callback)` → subscription
- **Resultado esperado:** Todos respondem
- **Cobertura:** normal
