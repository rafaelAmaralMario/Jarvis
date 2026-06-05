#include "jarvis/persistence/query_builder.h"
#include <QSqlQuery>
#include <QSqlRecord>
#include <QSqlError>
#include <QJsonDocument>
#include <sstream>

namespace jarvis::persistence {

QueryBuilder::QueryBuilder(IDatabase* db)
    : db_(db)
    , mode_("SELECT")
{}

QueryBuilder& QueryBuilder::from(const std::string& table) {
    table_ = table;
    return *this;
}

QueryBuilder& QueryBuilder::select(const std::vector<std::string>& columns) {
    columns_ = columns;
    mode_ = "SELECT";
    return *this;
}

QueryBuilder& QueryBuilder::where(const std::string& condition, const QVariant& bind) {
    whereClauses_.push_back(condition);
    bindings_.push_back(bind);
    return *this;
}

QueryBuilder& QueryBuilder::orderBy(const std::string& column, const std::string& dir) {
    orderColumn_ = column;
    orderDir_ = dir;
    return *this;
}

QueryBuilder& QueryBuilder::limit(int n) {
    limit_ = n;
    return *this;
}

QueryBuilder& QueryBuilder::offset(int n) {
    offset_ = n;
    return *this;
}

std::vector<QJsonObject> QueryBuilder::execute() {
    std::lock_guard<std::recursive_mutex> lock(db_->mutex());
    QSqlQuery q = db_->prepare(toSql());
    for (int i = 0; i < static_cast<int>(bindings_.size()); ++i) {
        if (bindings_[i].isValid())
            q.bindValue(i, bindings_[i]);
    }

    std::vector<QJsonObject> results;
    if (q.exec()) {
        while (q.next()) {
            QJsonObject obj;
            auto record = q.record();
            for (int i = 0; i < record.count(); ++i) {
                QVariant val = q.value(i);
                if (!val.isNull())
                    obj[record.fieldName(i)] = QJsonValue::fromVariant(val);
            }
            results.push_back(obj);
        }
    }
    return results;
}

std::optional<QJsonObject> QueryBuilder::first() {
    limit(1);
    auto results = execute();
    if (results.empty()) return std::nullopt;
    return results[0];
}

int QueryBuilder::count() {
    std::lock_guard<std::recursive_mutex> lock(db_->mutex());
    std::string sql = "SELECT COUNT(*) FROM " + table_;
    if (!whereClauses_.empty()) {
        sql += " WHERE ";
        for (size_t i = 0; i < whereClauses_.size(); ++i) {
            if (i > 0) sql += " AND ";
            sql += whereClauses_[i];
        }
    }

    QSqlQuery q = db_->prepare(sql);
    for (int i = 0; i < static_cast<int>(bindings_.size()); ++i) {
        if (bindings_[i].isValid())
            q.bindValue(i, bindings_[i]);
    }

    if (q.exec() && q.next())
        return q.value(0).toInt();
    return 0;
}

long long QueryBuilder::insert(const QJsonObject& data) {
    std::lock_guard<std::recursive_mutex> lock(db_->mutex());

    QStringList cols, ph;
    QVariantList vals;
    for (auto it = data.begin(); it != data.end(); ++it) {
        cols << QString::fromStdString(it.key().toStdString());
        ph << "?";
        vals << it.value().toVariant();
    }

    std::string sql = "INSERT INTO " + table_ + " (" +
        cols.join(", ").toStdString() + ") VALUES (" +
        ph.join(", ").toStdString() + ")";

    QSqlQuery q = db_->prepare(sql);
    for (int i = 0; i < vals.size(); ++i)
        q.bindValue(i, vals[i]);

    if (!q.exec()) return -1;
    return db_->lastInsertId().value_or(-1);
}

bool QueryBuilder::update(const QJsonObject& data) {
    std::lock_guard<std::recursive_mutex> lock(db_->mutex());

    QStringList sets;
    QVariantList vals;
    for (auto it = data.begin(); it != data.end(); ++it) {
        sets << QString("%1 = ?").arg(QString::fromStdString(it.key().toStdString()));
        vals << it.value().toVariant();
    }

    std::string sql = "UPDATE " + table_ + " SET " + sets.join(", ").toStdString();
    if (!whereClauses_.empty()) {
        sql += " WHERE ";
        for (size_t i = 0; i < whereClauses_.size(); ++i) {
            if (i > 0) sql += " AND ";
            sql += whereClauses_[i];
        }
    }

    QSqlQuery q = db_->prepare(sql);
    int idx = 0;
    for (; idx < vals.size(); ++idx)
        q.bindValue(idx, vals[idx]);
    for (int i = 0; i < static_cast<int>(bindings_.size()); ++i, ++idx) {
        if (bindings_[i].isValid())
            q.bindValue(idx, bindings_[i]);
    }

    return q.exec();
}

bool QueryBuilder::del() {
    std::lock_guard<std::recursive_mutex> lock(db_->mutex());

    std::string sql = "DELETE FROM " + table_;
    if (!whereClauses_.empty()) {
        sql += " WHERE ";
        for (size_t i = 0; i < whereClauses_.size(); ++i) {
            if (i > 0) sql += " AND ";
            sql += whereClauses_[i];
        }
    }

    QSqlQuery q = db_->prepare(sql);
    for (int i = 0; i < static_cast<int>(bindings_.size()); ++i) {
        if (bindings_[i].isValid())
            q.bindValue(i, bindings_[i]);
    }

    return q.exec();
}

std::string QueryBuilder::toSql() const {
    std::ostringstream sql;

    if (mode_ == "SELECT" || mode_.empty()) {
        sql << "SELECT ";
        if (columns_.empty()) sql << "*";
        else {
            for (size_t i = 0; i < columns_.size(); ++i) {
                if (i > 0) sql << ", ";
                sql << columns_[i];
            }
        }
        sql << " FROM " << table_;

        if (!whereClauses_.empty()) {
            sql << " WHERE ";
            for (size_t i = 0; i < whereClauses_.size(); ++i) {
                if (i > 0) sql << " AND ";
                sql << whereClauses_[i];
            }
        }

        if (!orderColumn_.empty()) {
            sql << " ORDER BY " << orderColumn_ << " " << orderDir_;
        }
        if (limit_ >= 0) sql << " LIMIT " << limit_;
        if (offset_ >= 0) sql << " OFFSET " << offset_;
    }

    return sql.str();
}

} // namespace jarvis::persistence
