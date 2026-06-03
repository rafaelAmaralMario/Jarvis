#ifndef JARVIS_WORKSPACE_PROJECT_H
#define JARVIS_WORKSPACE_PROJECT_H

#include <string>
#include <vector>

namespace jarvis::workspace {

struct Project {
    std::string id;
    std::string name;
    std::string rootPath;
    std::string version;
    std::string type;       // "cpp", "node", "python", etc.
    std::vector<std::string> folders;
};

} // namespace jarvis::workspace

#endif // JARVIS_WORKSPACE_PROJECT_H
