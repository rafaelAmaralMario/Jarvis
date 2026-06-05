#include "jarvis/core/permission_manager.h"

namespace jarvis::core {

PermissionResult PermissionManager::checkPermission(
    const std::string& moduleId,
    const std::string& permission
) {
    auto it = permissions_.find(moduleId);
    if (it == permissions_.end()) {
        return PermissionResult::NotRequested;
    }

    auto permIt = it->second.granted.find(permission);
    if (permIt == it->second.granted.end()) {
        return PermissionResult::NotRequested;
    }

    return permIt->second ? PermissionResult::Granted : PermissionResult::Denied;
}

void PermissionManager::grantPermission(
    const std::string& moduleId,
    const std::string& permission
) {
    permissions_[moduleId].granted[permission] = true;
}

void PermissionManager::revokePermission(
    const std::string& moduleId,
    const std::string& permission
) {
    permissions_[moduleId].granted[permission] = false;
}

bool PermissionManager::isGranted(
    const std::string& moduleId,
    const std::string& permission
) const {
    auto it = permissions_.find(moduleId);
    if (it == permissions_.end()) return false;
    auto permIt = it->second.granted.find(permission);
    return permIt != it->second.granted.end() && permIt->second;
}

void PermissionManager::loadPermissions(const std::string& dbPath) {
    // TODO: Load from SQLite
    // QSqlDatabase db = QSqlDatabase::addDatabase("QSQLITE");
    // db.setDatabaseName(QString::fromStdString(dbPath));
    // db.open();
    // SELECT module_id, permission, granted FROM permissions
}

void PermissionManager::savePermissions(const std::string& dbPath) {
    // TODO: Save to SQLite
    // INSERT OR REPLACE INTO permissions (module_id, permission, granted)
}

std::vector<std::string> PermissionManager::listPermissions(
    const std::string& moduleId
) const {
    std::vector<std::string> result;
    auto it = permissions_.find(moduleId);
    if (it != permissions_.end()) {
        for (const auto& [perm, granted] : it->second.granted) {
            if (granted) {
                result.push_back(perm);
            }
        }
    }
    return result;
}

} // namespace jarvis::core
