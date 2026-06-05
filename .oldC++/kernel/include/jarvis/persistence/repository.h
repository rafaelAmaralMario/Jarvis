#ifndef JARVIS_PERSISTENCE_REPOSITORY_H
#define JARVIS_PERSISTENCE_REPOSITORY_H

#include "database.h"
#include "query_builder.h"
#include <string>
#include <vector>
#include <optional>
#include <functional>
#include <QJsonObject>

namespace jarvis::persistence {

class IRepository {
public:
    virtual ~IRepository() = default;

    virtual std::string tableName() const = 0;
    virtual std::string idColumn() const = 0;

    virtual std::optional<long long> insert(const QJsonObject& data) = 0;
    virtual bool update(const std::string& id, const QJsonObject& data) = 0;
    virtual bool remove(const std::string& id) = 0;
    virtual std::optional<QJsonObject> getById(const std::string& id) = 0;
    virtual std::vector<QJsonObject> list(const std::string& where = "", const std::vector<QVariant>& bindings = {}) = 0;
    virtual int count(const std::string& where = "") = 0;
};

IRepository* createRepository(IDatabase* db, const std::string& tableName, const std::string& idColumn = "id");

} // namespace jarvis::persistence

#endif // JARVIS_PERSISTENCE_REPOSITORY_H
