#ifndef JARVIS_WORKSPACE_WORKSPACE_MANAGER_H
#define JARVIS_WORKSPACE_WORKSPACE_MANAGER_H

#include "jarvis/workspace/file_utils.h"
#include "jarvis/workspace/file_watcher.h"
#include "jarvis/workspace/project.h"
#include <string>
#include <vector>
#include <functional>

namespace jarvis::workspace {

class IWorkspaceManager {
public:
    virtual ~IWorkspaceManager() = default;

    // Workspace roots
    virtual bool openWorkspace(const std::string& path) = 0;
    virtual bool addRoot(const std::string& path) = 0;
    virtual bool removeRoot(const std::string& path) = 0;
    virtual std::vector<std::string> getRoots() const = 0;

    // File operations
    virtual std::vector<FileEntry> listFiles(const std::string& path) = 0;
    virtual bool createFile(const std::string& name, const std::string& parentDir) = 0;
    virtual bool createDirectory(const std::string& name, const std::string& parentDir) = 0;
    virtual bool deleteFile(const std::string& path) = 0;
    virtual bool deleteDirectory(const std::string& path) = 0;
    virtual bool rename(const std::string& oldPath, const std::string& newName) = 0;
    virtual bool move(const std::string& path, const std::string& targetDir) = 0;

    // File content
    virtual std::string readFile(const std::string& path) = 0;
    virtual bool writeFile(const std::string& path, const std::string& content) = 0;

    // Recent files
    virtual std::vector<FileEntry> getRecentFiles(int limit = 20) = 0;
    virtual void trackFileOpen(const std::string& path) = 0;

    // Watcher
    virtual IFileWatcher* watcher() = 0;

    // Events
    using FileEventCallback = std::function<void(const FileEvent&)>;
    virtual void setFileEventCallback(FileEventCallback cb) = 0;

    // Project
    virtual Project getProjectInfo(const std::string& rootPath) = 0;
};

// Factory function
IWorkspaceManager* createWorkspaceManager(const std::string& dbPath);

} // namespace jarvis::workspace

#endif // JARVIS_WORKSPACE_WORKSPACE_MANAGER_H
