#ifndef JARVIS_PERSISTENCE_DATABASE_H
#define JARVIS_PERSISTENCE_DATABASE_H

#include <string>
#include <vector>
#include <QVariant>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <mutex>
#include <optional>

namespace jarvis::persistence {

struct Row {
    std::vector<QVariant> values;
};

class IDatabase {
public:
    virtual ~IDatabase() = default;

    virtual bool open(const std::string& dbPath) = 0;
    virtual void close() = 0;
    virtual bool isOpen() const = 0;

    virtual bool exec(const std::string& sql) = 0;
    virtual QSqlQuery prepare(const std::string& sql) = 0;
    virtual std::optional<long long> lastInsertId() = 0;

    virtual bool beginTransaction() = 0;
    virtual bool commit() = 0;
    virtual bool rollback() = 0;
    virtual bool checkpoint() = 0;

    virtual std::recursive_mutex& mutex() = 0;
    virtual QSqlDatabase& qSqlDatabase() = 0;
};

IDatabase* createDatabase();

} // namespace jarvis::persistence

#endif // JARVIS_PERSISTENCE_DATABASE_H
