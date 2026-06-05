#include "jarvis/persistence/migration_runner.h"
#include <QSqlQuery>
#include <QSqlError>
#include <algorithm>

namespace jarvis::persistence {

class MigrationRunner : public IMigrationRunner {
public:
    explicit MigrationRunner(IDatabase* db)
        : db_(db)
    {
        ensureSchemaTable();
    }

    void addMigration(int version, const std::string& name, const std::string& sql) override {
        migrations_.push_back({version, name, sql});
        std::sort(migrations_.begin(), migrations_.end(),
            [](const Migration& a, const Migration& b) { return a.version < b.version; });
    }

    int currentVersion() override {
        std::lock_guard<std::recursive_mutex> lock(db_->mutex());
        auto q = db_->prepare("SELECT MAX(version) FROM schema_version");
        if (q.exec() && q.next()) {
            return q.value(0).toInt();
        }
        return 0;
    }

    bool runPending() override {
        std::lock_guard<std::recursive_mutex> lock(db_->mutex());
        int current = currentVersion();

        for (const auto& m : migrations_) {
            if (m.version <= current) continue;

            if (!applyMigration(m)) {
                return false;
            }
        }
        return true;
    }

    std::vector<Migration> pending() const override {
        int current = 0;
        {
            auto q = db_->prepare("SELECT MAX(version) FROM schema_version");
            if (q.exec() && q.next()) {
                current = q.value(0).toInt();
            }
        }

        std::vector<Migration> result;
        for (const auto& m : migrations_) {
            if (m.version > current) {
                result.push_back(m);
            }
        }
        return result;
    }

private:
    IDatabase* db_;
    std::vector<Migration> migrations_;

    void ensureSchemaTable() {
        db_->exec(
            "CREATE TABLE IF NOT EXISTS schema_version ("
            "  version INTEGER PRIMARY KEY,"
            "  name TEXT NOT NULL,"
            "  applied_at TEXT NOT NULL DEFAULT (datetime('now'))"
            ")"
        );
    }

    bool applyMigration(const Migration& m) {
        if (!db_->exec(m.sql)) {
            return false;
        }

        auto q = db_->prepare("INSERT INTO schema_version (version, name) VALUES (?, ?)");
        QSqlQuery query = q;
        query.bindValue(0, m.version);
        query.bindValue(1, QString::fromStdString(m.name));
        if (!query.exec()) {
            return false;
        }
        return true;
    }
};

IMigrationRunner* createMigrationRunner(IDatabase* db) {
    return new MigrationRunner(db);
}

} // namespace jarvis::persistence
