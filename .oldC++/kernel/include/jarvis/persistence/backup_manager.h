#ifndef JARVIS_PERSISTENCE_BACKUP_MANAGER_H
#define JARVIS_PERSISTENCE_BACKUP_MANAGER_H

#include "database.h"
#include <string>

namespace jarvis::persistence {

class IBackupManager {
public:
    virtual ~IBackupManager() = default;

    virtual bool save(const std::string& backupPath) = 0;
    virtual bool restore(const std::string& backupPath) = 0;
};

IBackupManager* createBackupManager(IDatabase* db);

} // namespace jarvis::persistence

#endif // JARVIS_PERSISTENCE_BACKUP_MANAGER_H
