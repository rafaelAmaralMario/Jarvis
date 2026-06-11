# Modulo Workspace

**ID:** `jarvis.workspace`
**Prioridade:** 🔴 Alta
**Depende de:** Kernel
**Status:** Nao iniciado

## Funcionalidades
- Listagem recursiva de diretorios
- CRUD de arquivos e pastas
- Busca textual com respeita a .gitignore
- File System Watcher (QFileSystemWatcher) para mudancas externas
- Path validation (anti path traversal)

## API Publica

```cpp
class WorkspaceService {
public:
    virtual std::vector<FileEntry> listDirectory(const std::string& path, int maxDepth = 8) = 0;
    virtual std::string readFile(const std::string& path) = 0;
    virtual bool writeFile(const std::string& path, const std::string& content) = 0;
    virtual bool createFile(const std::string& path) = 0;
    virtual bool createDirectory(const std::string& path) = 0;
    virtual bool deleteEntry(const std::string& path) = 0;
    virtual bool renameEntry(const std::string& oldPath, const std::string& newPath) = 0;
    virtual std::vector<SearchResult> search(const std::string& query, const std::string& rootPath) = 0;
    
    Signal<std::function<void(const std::string& path)>> onFileChanged;
    Signal<std::function<void(const std::string& path)>> onFileCreated;
    Signal<std::function<void(const std::string& path)>> onFileDeleted;
};
```
