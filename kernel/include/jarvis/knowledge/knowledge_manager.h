#ifndef JARVIS_KNOWLEDGE_KNOWLEDGE_MANAGER_H
#define JARVIS_KNOWLEDGE_KNOWLEDGE_MANAGER_H

#include "jarvis/knowledge/note.h"
#include <string>
#include <vector>
#include <functional>

namespace jarvis::knowledge {

class IKnowledgeManager {
public:
    virtual ~IKnowledgeManager() = default;

    // Note CRUD
    virtual Note createNote(const CreateNoteDTO& dto) = 0;
    virtual Note getNote(const std::string& id) = 0;
    virtual std::vector<Note> listNotes(const std::string& folder = "") = 0;
    virtual Note updateNote(const std::string& id, const CreateNoteDTO& dto) = 0;
    virtual bool deleteNote(const std::string& id) = 0;

    // Folder operations
    virtual std::vector<FolderEntry> getFolders() = 0;
    virtual bool moveNote(const std::string& id, const std::string& targetFolder) = 0;

    // Wikilinks & backlinks
    virtual std::vector<Backlink> getBacklinks(const std::string& noteId) = 0;
    virtual std::vector<std::string> parseWikilinks(const std::string& content) = 0;

    // Graph
    virtual GraphData buildGraph() = 0;

    // Import/Export
    virtual Note importMd(const std::string& filePath) = 0;
    virtual bool exportMd(const std::string& noteId, const std::string& outputPath) = 0;

    // Search
    virtual std::vector<SearchResult> search(const std::string& query) = 0;
};

// Factory function
IKnowledgeManager* createKnowledgeManager(const std::string& dbPath);

} // namespace jarvis::knowledge

#endif // JARVIS_KNOWLEDGE_KNOWLEDGE_MANAGER_H
