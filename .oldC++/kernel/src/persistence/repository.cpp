#include "jarvis/persistence/repository.h"
#include <QSqlQuery>
#include <QSqlRecord>
#include <QSqlError>
#include <QJsonDocument>

namespace jarvis::persistence {

class Repository : public IRepository {
public:
    Repository(IDatabase* db, const std::string& tableName, const std::string& idColumn)
        : db_(db)
        , tableName_(tableName)
        , idColumn_(idColumn)
    {}

    std::string tableName() const override { return tableName_; }
    std::string idColumn() const override { return idColumn_; }

    std::optional<long long> insert(const QJsonObject& data) override {
        std::lock_guard<std::recursive_mutex> lock(db_->mutex());

        QStringList cols, placeholders;
        QVariantList vals;
        for (auto it = data.begin(); it != data.end(); ++it) {
            cols << QString::fromStdString(it.key().toStdString());
            placeholders << "?";
            vals << it.value().toVariant();
        }

        QString sql = QString("INSERT INTO %1 (%2) VALUES (%3)")
            .arg(QString::fromStdString(tableName_))
            .arg(cols.join(", "))
            .arg(placeholders.join(", "));

        QSqlQuery q = db_->prepare(sql.toStdString());
        for (int i = 0; i < vals.size(); ++i)
            q.bindValue(i, vals[i]);

        if (!q.exec()) return std::nullopt;
        return db_->lastInsertId();
    }

    bool update(const std::string& id, const QJsonObject& data) override {
        std::lock_guard<std::recursive_mutex> lock(db_->mutex());

        QStringList sets;
        QVariantList vals;
        for (auto it = data.begin(); it != data.end(); ++it) {
            sets << QString("%1 = ?").arg(QString::fromStdString(it.key().toStdString()));
            vals << it.value().toVariant();
        }

        QString sql = QString("UPDATE %1 SET %2 WHERE %3 = ?")
            .arg(QString::fromStdString(tableName_))
            .arg(sets.join(", "))
            .arg(QString::fromStdString(idColumn_));

        QSqlQuery q = db_->prepare(sql.toStdString());
        for (int i = 0; i < vals.size(); ++i)
            q.bindValue(i, vals[i]);
        q.bindValue(vals.size(), QString::fromStdString(id));

        return q.exec();
    }

    bool remove(const std::string& id) override {
        std::lock_guard<std::recursive_mutex> lock(db_->mutex());
        std::string sql = "DELETE FROM " + tableName_ + " WHERE " + idColumn_ + " = ?";
        QSqlQuery q = db_->prepare(sql);
        q.bindValue(0, QString::fromStdString(id));
        return q.exec();
    }

    std::optional<QJsonObject> getById(const std::string& id) override {
        std::lock_guard<std::recursive_mutex> lock(db_->mutex());
        std::string sql = "SELECT * FROM " + tableName_ + " WHERE " + idColumn_ + " = ?";
        QSqlQuery q = db_->prepare(sql);
        q.bindValue(0, QString::fromStdString(id));
        if (!q.exec() || !q.next()) return std::nullopt;
        return rowToJson(q);
    }

    std::vector<QJsonObject> list(const std::string& where, const std::vector<QVariant>& bindings) override {
        std::lock_guard<std::recursive_mutex> lock(db_->mutex());
        std::string sql = "SELECT * FROM " + tableName_;
        if (!where.empty()) sql += " WHERE " + where;

        QSqlQuery q = db_->prepare(sql);
        for (size_t i = 0; i < bindings.size(); ++i)
            q.bindValue(static_cast<int>(i), bindings[i]);

        std::vector<QJsonObject> results;
        if (q.exec()) {
            while (q.next())
                results.push_back(rowToJson(q));
        }
        return results;
    }

    int count(const std::string& where) override {
        std::lock_guard<std::recursive_mutex> lock(db_->mutex());
        std::string sql = "SELECT COUNT(*) FROM " + tableName_;
        if (!where.empty()) sql += " WHERE " + where;

        QSqlQuery q = db_->prepare(sql);
        if (q.exec() && q.next())
            return q.value(0).toInt();
        return 0;
    }

private:
    IDatabase* db_;
    std::string tableName_;
    std::string idColumn_;

    static QJsonObject rowToJson(const QSqlQuery& q) {
        QJsonObject obj;
        auto record = q.record();
        for (int i = 0; i < record.count(); ++i) {
            QString fieldName = record.fieldName(i);
            QVariant val = q.value(i);
            if (val.isNull()) continue;
            obj[fieldName] = QJsonValue::fromVariant(val);
        }
        return obj;
    }
};

IRepository* createRepository(IDatabase* db, const std::string& tableName, const std::string& idColumn) {
    return new Repository(db, tableName, idColumn);
}

} // namespace jarvis::persistence
