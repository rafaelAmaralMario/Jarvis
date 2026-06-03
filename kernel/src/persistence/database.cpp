#include "jarvis/persistence/database.h"
#include <QSqlError>
#include <QSqlQuery>
#include <QFileInfo>
#include <QDir>

namespace jarvis::persistence {

class Database : public IDatabase {
public:
    explicit Database() = default;

    ~Database() override {
        close();
    }

    bool open(const std::string& dbPath) override {
        std::lock_guard<std::recursive_mutex> lock(mtx_);
        if (db_.isOpen()) return true;

        QString path = QString::fromStdString(dbPath);
        QFileInfo fi(path);
        QDir().mkpath(fi.absolutePath());

        db_ = QSqlDatabase::addDatabase("QSQLITE", "persistence");
        db_.setDatabaseName(path);

        if (!db_.open()) {
            lastError_ = db_.lastError().text().toStdString();
            return false;
        }

        // WAL mode
        QSqlQuery q(db_);
        q.exec("PRAGMA journal_mode=WAL");
        q.exec("PRAGMA synchronous=NORMAL");
        q.exec("PRAGMA foreign_keys=ON");
        q.exec("PRAGMA busy_timeout=5000");

        return true;
    }

    void close() override {
        std::lock_guard<std::recursive_mutex> lock(mtx_);
        if (db_.isOpen()) {
            db_.close();
        }
        if (QSqlDatabase::contains("persistence")) {
            QSqlDatabase::removeDatabase("persistence");
        }
    }

    bool isOpen() const override {
        return db_.isOpen();
    }

    bool exec(const std::string& sql) override {
        std::lock_guard<std::recursive_mutex> lock(mtx_);
        QSqlQuery q(db_);
        if (!q.exec(QString::fromStdString(sql))) {
            lastError_ = q.lastError().text().toStdString();
            return false;
        }
        return true;
    }

    QSqlQuery prepare(const std::string& sql) override {
        std::lock_guard<std::recursive_mutex> lock(mtx_);
        QSqlQuery q(db_);
        q.prepare(QString::fromStdString(sql));
        return q;
    }

    std::optional<long long> lastInsertId() override {
        std::lock_guard<std::recursive_mutex> lock(mtx_);
        QSqlQuery q(db_);
        if (q.exec("SELECT last_insert_rowid()") && q.next()) {
            return q.value(0).toLongLong();
        }
        return std::nullopt;
    }

    bool beginTransaction() override {
        std::lock_guard<std::recursive_mutex> lock(mtx_);
        return db_.transaction();
    }

    bool commit() override {
        std::lock_guard<std::recursive_mutex> lock(mtx_);
        return db_.commit();
    }

    bool rollback() override {
        std::lock_guard<std::recursive_mutex> lock(mtx_);
        return db_.rollback();
    }

    bool checkpoint() override {
        std::lock_guard<std::recursive_mutex> lock(mtx_);
        QSqlQuery q(db_);
        return q.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    }

    std::recursive_mutex& mutex() override {
        return mtx_;
    }

    QSqlDatabase& qSqlDatabase() override {
        return db_;
    }

private:
    QSqlDatabase db_;
    mutable std::recursive_mutex mtx_;
    std::string lastError_;
};

IDatabase* createDatabase() {
    return new Database();
}

} // namespace jarvis::persistence
