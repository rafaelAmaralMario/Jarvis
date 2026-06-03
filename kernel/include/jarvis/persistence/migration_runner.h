#ifndef JARVIS_PERSISTENCE_MIGRATION_RUNNER_H
#define JARVIS_PERSISTENCE_MIGRATION_RUNNER_H

#include "database.h"
#include <string>
#include <vector>

namespace jarvis::persistence {

struct Migration {
    int version;
    std::string name;
    std::string sql;
};

class IMigrationRunner {
public:
    virtual ~IMigrationRunner() = default;

    virtual void addMigration(int version, const std::string& name, const std::string& sql) = 0;
    virtual int currentVersion() = 0;
    virtual bool runPending() = 0;
    virtual std::vector<Migration> pending() const = 0;
};

IMigrationRunner* createMigrationRunner(IDatabase* db);

} // namespace jarvis::persistence

#endif // JARVIS_PERSISTENCE_MIGRATION_RUNNER_H
