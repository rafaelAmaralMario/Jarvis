#ifndef JARVIS_WORKSPACE_FILE_UTILS_H
#define JARVIS_WORKSPACE_FILE_UTILS_H

#include <string>
#include <vector>

namespace jarvis::workspace {

struct FileEntry {
    std::string name;
    std::string path;      // relative to workspace root
    std::string fullPath;  // absolute
    bool isDirectory = false;
    long long size = 0;
    std::string modifiedAt;
};

bool isValidFileName(const std::string& name);
std::string joinPath(const std::string& base, const std::string& name);
std::string normalizePath(const std::string& path);
std::string getExtension(const std::string& path);
std::string getMimeType(const std::string& path);
bool isBinaryExtension(const std::string& ext);

} // namespace jarvis::workspace

#endif // JARVIS_WORKSPACE_FILE_UTILS_H
