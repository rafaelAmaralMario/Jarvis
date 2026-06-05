#ifndef JARVIS_KNOWLEDGE_GRAPH_BUILDER_H
#define JARVIS_KNOWLEDGE_GRAPH_BUILDER_H

#include "jarvis/knowledge/note.h"
#include <string>

namespace jarvis::knowledge {

class IGraphBuilder {
public:
    virtual ~IGraphBuilder() = default;

    virtual GraphData build() = 0;
    virtual std::string buildJson() = 0;
};

// Factory function
IGraphBuilder* createGraphBuilder(const std::string& dbPath);

} // namespace jarvis::knowledge

#endif // JARVIS_KNOWLEDGE_GRAPH_BUILDER_H
