#ifndef JARVIS_KNOWLEDGE_SEARCH_ENGINE_H
#define JARVIS_KNOWLEDGE_SEARCH_ENGINE_H

#include "jarvis/knowledge/note.h"
#include "jarvis/persistence/database.h"
#include <string>
#include <vector>

namespace jarvis::knowledge {

class ISearchEngine {
public:
    virtual ~ISearchEngine() = default;

    virtual std::vector<SearchResult> search(const std::string& query) = 0;
    virtual bool rebuildIndex() = 0;
    virtual bool addToIndex(const std::string& noteId) = 0;
    virtual bool removeFromIndex(const std::string& noteId) = 0;
};

// Factory function
ISearchEngine* createSearchEngine(jarvis::persistence::IDatabase* db);

} // namespace jarvis::knowledge

#endif // JARVIS_KNOWLEDGE_SEARCH_ENGINE_H
