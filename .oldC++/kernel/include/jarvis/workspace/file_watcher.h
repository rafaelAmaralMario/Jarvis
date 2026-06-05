#ifndef JARVIS_WORKSPACE_FILE_WATCHER_H
#define JARVIS_WORKSPACE_FILE_WATCHER_H

#include <string>
#include <vector>
#include <functional>

namespace jarvis::workspace {

enum class FileEventType {
    Created,
    Modified,
    Deleted,
    Renamed
};

struct FileEvent {
    FileEventType type;
    std::string path;
    std::string oldPath;  // for Renamed
};

class IFileWatcher {
public:
    virtual ~IFileWatcher() = default;

    using EventCallback = std::function<void(const FileEvent&)>;

    virtual void watchPath(const std::string& path) = 0;
    virtual void unwatchPath(const std::string& path) = 0;
    virtual void setEventCallback(EventCallback cb) = 0;
    virtual std::vector<std::string> watchedPaths() const = 0;
};

// Factory function
IFileWatcher* createFileWatcher();

} // namespace jarvis::workspace

#endif // JARVIS_WORKSPACE_FILE_WATCHER_H
