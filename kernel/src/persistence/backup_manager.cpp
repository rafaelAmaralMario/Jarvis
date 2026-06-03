#include "jarvis/persistence/backup_manager.h"
#include <QSqlQuery>
#include <QSqlError>
#include <QFile>
#include <QFileInfo>
#include <QDir>

namespace jarvis::persistence {

class BackupManager : public IBackupManager {
public:
    explicit BackupManager(IDatabase* db)
        : db_(db)
    {}

    bool save(const std::string& backupPath) override {
        std::lock_guard<std::recursive_mutex> lock(db_->mutex());

        QDir().mkpath(QFileInfo(QString::fromStdString(backupPath)).absolutePath());

        QSqlQuery q(db_->qSqlDatabase());
        if (!q.exec(QString("VACUUM INTO '%1'").arg(QString::fromStdString(backupPath)))) {
            return false;
        }
        return true;
    }

    bool restore(const std::string& backupPath) override {
        std::lock_guard<std::recursive_mutex> lock(db_->mutex());

        QFileInfo fi(QString::fromStdString(backupPath));
        if (!fi.exists()) return false;

        QSqlQuery q(db_->qSqlDatabase());
        q.exec("PRAGMA database_list");
        QString dbPath;
        if (q.next()) {
            dbPath = q.value(2).toString();
        }
        if (dbPath.isEmpty()) return false;

        QString connName = "persistence";
        {
            QSqlDatabase db = QSqlDatabase::database(connName);
            db.close();
        }
        QSqlDatabase::removeDatabase(connName);

        if (!QFile::copy(QString::fromStdString(backupPath), dbPath)) {
            QSqlDatabase::addDatabase("QSQLITE", connName);
            QSqlDatabase::database(connName).setDatabaseName(dbPath);
            QSqlDatabase::database(connName).open();
            return false;
        }

        QSqlDatabase::addDatabase("QSQLITE", connName);
        QSqlDatabase::database(connName).setDatabaseName(dbPath);
        return QSqlDatabase::database(connName).open();
    }

private:
    IDatabase* db_;
};

IBackupManager* createBackupManager(IDatabase* db) {
    return new BackupManager(db);
}

} // namespace jarvis::persistence
