#ifndef JARVIS_PERSISTENCE_QUERY_BUILDER_H
#define JARVIS_PERSISTENCE_QUERY_BUILDER_H

#include "database.h"
#include <string>
#include <vector>
#include <QVariant>
#include <QJsonObject>
#include <memory>

namespace jarvis::persistence {

class QueryBuilder {
public:
    explicit QueryBuilder(IDatabase* db);

    QueryBuilder& from(const std::string& table);
    QueryBuilder& select(const std::vector<std::string>& columns = {});
    QueryBuilder& where(const std::string& condition, const QVariant& bind = QVariant());
    QueryBuilder& orderBy(const std::string& column, const std::string& dir = "ASC");
    QueryBuilder& limit(int n);
    QueryBuilder& offset(int n);

    std::vector<QJsonObject> execute();
    std::optional<QJsonObject> first();
    int count();

    // INSERT
    long long insert(const QJsonObject& data);
    // UPDATE
    bool update(const QJsonObject& data);
    // DELETE
    bool del();

    std::string toSql() const;

private:
    IDatabase* db_;
    std::string table_;
    std::vector<std::string> columns_;
    std::vector<std::string> whereClauses_;
    std::vector<QVariant> bindings_;
    std::string orderColumn_;
    std::string orderDir_;
    int limit_ = -1;
    int offset_ = -1;
    std::string mode_; // SELECT, INSERT, UPDATE, DELETE
};

} // namespace jarvis::persistence

#endif // JARVIS_PERSISTENCE_QUERY_BUILDER_H
