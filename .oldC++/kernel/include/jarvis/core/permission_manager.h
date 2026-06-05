#ifndef JARVIS_CORE_PERMISSION_MANAGER_H
#define JARVIS_CORE_PERMISSION_MANAGER_H

#include <string>
#include <unordered_map>
#include <vector>

#include "jarvis/api/module_api.h"

namespace jarvis::core {

class PermissionManager {
public:
    PermissionResult checkPermission(const std::string& moduleId, const std::string& permission);
    
    void grantPermission(const std::string& moduleId, const std::string& permission);
    void revokePermission(const std::string& moduleId, const std::string& permission);
    bool isGranted(const std::string& moduleId, const std::string& permission) const;

    void loadPermissions(const std::string& dbPath);
    void savePermissions(const std::string& dbPath);

    std::vector<std::string> listPermissions(const std::string& moduleId) const;

private:
    struct ModulePermissions {
        std::unordered_map<std::string, bool> granted;
    };

    std::unordered_map<std::string, ModulePermissions> permissions_;
};

} // namespace jarvis::core

#endif // JARVIS_CORE_PERMISSION_MANAGER_H
