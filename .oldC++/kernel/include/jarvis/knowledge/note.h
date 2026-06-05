#ifndef JARVIS_KNOWLEDGE_NOTE_H
#define JARVIS_KNOWLEDGE_NOTE_H

#include <string>
#include <vector>

namespace jarvis::knowledge {

struct Note {
    std::string id;
    std::string title;
    std::string content;
    std::string folder;      // "/" for root
    std::vector<std::string> tags;
    std::string createdAt;   // ISO 8601
    std::string updatedAt;   // ISO 8601
    std::string metadata;    // JSON blob
};

struct CreateNoteDTO {
    std::string title;
    std::string content;
    std::string folder = "/";
    std::vector<std::string> tags;
    std::string metadata = "{}";
};

struct NoteLink {
    std::string sourceId;
    std::string targetId;
    std::string linkType;    // "wikilink", "tag"
};

struct GraphNode {
    std::string id;
    std::string label;
    std::string folder;
    std::vector<std::string> tags;
    int linkCount = 0;
};

struct GraphEdge {
    std::string source;
    std::string target;
    std::string linkType;
};

struct GraphData {
    std::vector<GraphNode> nodes;
    std::vector<GraphEdge> edges;
};

struct Backlink {
    std::string noteId;
    std::string title;
    std::string context;  // surrounding text snippet
};

struct SearchResult {
    std::string id;
    std::string title;
    std::string snippet;
    double score = 0.0;
};

struct FolderEntry {
    std::string path;      // full path like "/dev/cpp"
    std::string name;      // just "cpp"
    int noteCount = 0;
};

} // namespace jarvis::knowledge

#endif // JARVIS_KNOWLEDGE_NOTE_H
