#pragma once

#include <string>
#include <vector>
#include <optional>
#include <functional>

namespace jarvis::editor {

struct EditorTabInfo {
    std::string path;
    std::string language;
    std::string content;
    int64_t size;
    int64_t lastModified;
    bool isDirty;
};

class IEditorService {
public:
    virtual ~IEditorService() = default;

    virtual std::optional<EditorTabInfo> openFile(const std::string& path) = 0;
    virtual bool saveFile(const std::string& path, const std::string& content) = 0;
    virtual bool closeFile(const std::string& path) = 0;
    virtual std::vector<EditorTabInfo> getOpenFiles() = 0;
    virtual std::string detectLanguage(const std::string& filename) = 0;
    virtual void updateTabState(const std::string& path, bool isDirty) = 0;
};

IEditorService* createEditorService();

} // namespace jarvis::editor
