#include "jarvis/workspace/workspace_manager.h"
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QDateTime>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QTextStream>
#include <QJsonDocument>
#include <QJsonObject>
#include <algorithm>

namespace jarvis::workspace {

class WorkspaceManager : public IWorkspaceManager {
public:
    explicit WorkspaceManager(const std::string& dbPath)
        : dbPath_(dbPath)
        , watcher_(createFileWatcher())
    {
        initDb();
        watcher_->setEventCallback([this](const FileEvent& event) {
            if (fileEventCb_) fileEventCb_(event);
        });
    }

    ~WorkspaceManager() override {
        delete watcher_;
    }

    // ---- Workspace roots ----

    bool openWorkspace(const std::string& path) override {
        QDir dir(QString::fromStdString(path));
        if (!dir.exists()) return false;

        std::string normalized = QDir::cleanPath(dir.absolutePath()).toStdString();

        // Check if already a root
        auto roots = getRoots();
        if (std::find(roots.begin(), roots.end(), normalized) != roots.end())
            return true;

        return addRoot(normalized);
    }

    bool addRoot(const std::string& path) override {
        QDir dir(QString::fromStdString(path));
        if (!dir.exists()) return false;

        std::string normalized = QDir::cleanPath(dir.absolutePath()).toStdString();

        QSqlQuery q(QSqlDatabase::database("workspace"));
        q.prepare("INSERT OR IGNORE INTO workspaces (id, name) VALUES (?, ?)");
        q.addBindValue(QString::fromStdString(normalized));
        q.addBindValue(dir.dirName());

        // Get or create workspace
        if (!q.exec()) return false;

        // Add folder
        q.prepare("INSERT OR IGNORE INTO workspace_folders (workspace_id, path) VALUES (?, ?)");
        q.addBindValue(QString::fromStdString(normalized));
        q.addBindValue(QString::fromStdString(normalized));

        if (!q.exec()) return false;

        // Watch the root
        watcher_->watchPath(normalized);

        // Scan existing files
        scanDirectory(normalized);

        return true;
    }

    bool removeRoot(const std::string& path) override {
        std::string normalized = QDir::cleanPath(QString::fromStdString(path)).toStdString();
        watcher_->unwatchPath(normalized);

        QSqlQuery q(QSqlDatabase::database("workspace"));
        q.prepare("DELETE FROM workspace_folders WHERE workspace_id = ?");
        q.addBindValue(QString::fromStdString(normalized));
        q.exec();

        q.prepare("DELETE FROM workspaces WHERE id = ?");
        q.addBindValue(QString::fromStdString(normalized));
        return q.exec();
    }

    std::vector<std::string> getRoots() const override {
        std::vector<std::string> roots;
        QSqlQuery q(QSqlDatabase::database("workspace"));
        q.exec("SELECT DISTINCT path FROM workspace_folders ORDER BY path");
        while (q.next())
            roots.push_back(q.value(0).toString().toStdString());
        return roots;
    }

    // ---- File operations ----

    std::vector<FileEntry> listFiles(const std::string& path) override {
        std::vector<FileEntry> entries;
        QDir dir(QString::fromStdString(path));
        if (!dir.exists()) return entries;

        for (const auto& fi : dir.entryInfoList(QDir::Files | QDir::Dirs | QDir::NoDotAndDotDot,
                                                 QDir::DirsFirst | QDir::Name)) {
            FileEntry entry;
            entry.name = fi.fileName().toStdString();
            entry.path = fi.absoluteFilePath().toStdString();
            entry.fullPath = fi.absoluteFilePath().toStdString();
            entry.isDirectory = fi.isDir();
            entry.size = fi.size();
            entry.modifiedAt = fi.lastModified().toString(Qt::ISODate).toStdString();
            entries.push_back(std::move(entry));
        }
        return entries;
    }

    bool createFile(const std::string& name, const std::string& parentDir) override {
        if (!isValidFileName(name)) return false;

        QString fullPath = QDir(QString::fromStdString(parentDir)).absoluteFilePath(QString::fromStdString(name));
        QFile file(fullPath);
        if (file.exists()) return false;

        if (!file.open(QIODevice::WriteOnly)) return false;
        file.close();
        return true;
    }

    bool createDirectory(const std::string& name, const std::string& parentDir) override {
        if (!isValidFileName(name)) return false;

        QDir dir(QString::fromStdString(parentDir));
        return dir.mkdir(QString::fromStdString(name));
    }

    bool deleteFile(const std::string& path) override {
        QFileInfo fi(QString::fromStdString(path));
        if (!fi.exists()) return false;

        if (fi.isDir()) {
            QDir dir(fi.absoluteFilePath());
            return dir.removeRecursively();
        }
        return QFile::remove(fi.absoluteFilePath());
    }

    bool deleteDirectory(const std::string& path) override {
        return deleteFile(path);
    }

    bool rename(const std::string& oldPath, const std::string& newName) override {
        if (!isValidFileName(newName)) return false;

        QFileInfo fi(QString::fromStdString(oldPath));
        if (!fi.exists()) return false;

        QString newPath = fi.dir().absoluteFilePath(QString::fromStdString(newName));
        if (QFileInfo::exists(newPath)) return false;

        return QFile::rename(QString::fromStdString(oldPath), newPath);
    }

    bool move(const std::string& path, const std::string& targetDir) override {
        QFileInfo fi(QString::fromStdString(path));
        if (!fi.exists()) return false;

        QDir target(QString::fromStdString(targetDir));
        if (!target.exists()) return false;

        QString newPath = target.absoluteFilePath(fi.fileName());
        if (QFileInfo::exists(newPath)) return false;

        return QFile::rename(QString::fromStdString(path), newPath);
    }

    // ---- File content ----

    std::string readFile(const std::string& path) override {
        QFile file(QString::fromStdString(path));
        if (!file.open(QIODevice::ReadOnly | QIODevice::Text))
            throw std::runtime_error("Cannot open file: " + path);

        QTextStream in(&file);
        std::string content = in.readAll().toStdString();
        file.close();
        trackFileOpen(path);
        return content;
    }

    bool writeFile(const std::string& path, const std::string& content) override {
        QFile file(QString::fromStdString(path));
        if (!file.open(QIODevice::WriteOnly | QIODevice::Text))
            return false;

        QTextStream out(&file);
        out << QString::fromStdString(content);
        file.close();
        return true;
    }

    // ---- Recent files ----

    std::vector<FileEntry> getRecentFiles(int limit) override {
        std::vector<FileEntry> entries;
        QSqlQuery q(QSqlDatabase::database("workspace"));
        q.prepare("SELECT path, name, last_opened FROM recent_files ORDER BY last_opened DESC LIMIT ?");
        q.addBindValue(limit);
        if (q.exec()) {
            while (q.next()) {
                FileEntry entry;
                entry.path = q.value(0).toString().toStdString();
                entry.name = q.value(1).toString().toStdString();
                entry.modifiedAt = q.value(2).toString().toStdString();
                QFileInfo fi(QString::fromStdString(entry.path));
                entry.isDirectory = fi.isDir();
                entry.size = fi.size();
                entries.push_back(std::move(entry));
            }
        }
        return entries;
    }

    void trackFileOpen(const std::string& path) override {
        QFileInfo fi(QString::fromStdString(path));
        if (!fi.exists()) return;

        QSqlQuery q(QSqlDatabase::database("workspace"));
        q.prepare(R"(
            INSERT INTO recent_files (path, name, last_opened, open_count)
            VALUES (?, ?, ?, 1)
            ON CONFLICT(path) DO UPDATE SET
                last_opened = excluded.last_opened,
                open_count = open_count + 1
        )");
        q.addBindValue(QString::fromStdString(path));
        q.addBindValue(fi.fileName());
        q.addBindValue(QDateTime::currentDateTimeUtc().toString(Qt::ISODate));
        q.exec();
    }

    // ---- Watcher ----

    IFileWatcher* watcher() override {
        return watcher_;
    }

    void setFileEventCallback(FileEventCallback cb) override {
        fileEventCb_ = std::move(cb);
    }

    // ---- Project ----

    Project getProjectInfo(const std::string& rootPath) override {
        Project proj;
        proj.rootPath = rootPath;
        QDir dir(QString::fromStdString(rootPath));
        proj.name = dir.dirName().toStdString();

        // Detect project type
        if (dir.exists("CMakeLists.txt")) {
            proj.type = "cpp";
            // Read version from CMakeLists.txt
            QFile cmake(dir.absoluteFilePath("CMakeLists.txt"));
            if (cmake.open(QIODevice::ReadOnly | QIODevice::Text)) {
                QTextStream in(&cmake);
                QString line;
                while (in.readLineInto(&line)) {
                    if (line.contains("project(", Qt::CaseInsensitive) && line.contains("VERSION")) {
                        auto start = line.indexOf("VERSION") + 7;
                        auto end = line.indexOf(')', start);
                        if (end > start)
                            proj.version = line.mid(start, end - start).trimmed().toStdString();
                        break;
                    }
                }
            }
        } else if (dir.exists("package.json")) {
            proj.type = "node";
            QFile pkg(dir.absoluteFilePath("package.json"));
            if (pkg.open(QIODevice::ReadOnly)) {
                auto doc = QJsonDocument::fromJson(pkg.readAll());
                proj.version = doc.object()["version"].toString().toStdString();
            }
        } else if (dir.exists("Cargo.toml")) {
            proj.type = "rust";
        } else if (dir.exists("pyproject.toml") || dir.exists("setup.py")) {
            proj.type = "python";
        } else {
            proj.type = "unknown";
        }

        proj.id = rootPath;
        proj.folders.push_back(rootPath);
        return proj;
    }

private:
    std::string dbPath_;
    IFileWatcher* watcher_;
    FileEventCallback fileEventCb_;

    void initDb() {
        QString connName = "workspace";
        QSqlDatabase db;
        if (QSqlDatabase::contains(connName)) {
            db = QSqlDatabase::database(connName);
        } else {
            db = QSqlDatabase::addDatabase("QSQLITE", connName);
        }
        db.setDatabaseName(QString::fromStdString(dbPath_));
        if (!db.isOpen()) db.open();
        if (db.isOpen()) {
            QSqlQuery q(db);
            q.exec(R"(
                CREATE TABLE IF NOT EXISTS workspaces (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL DEFAULT 'workspace',
                    created_at TEXT NOT NULL,
                    last_opened TEXT NOT NULL
                )
            )");
            q.exec(R"(
                CREATE TABLE IF NOT EXISTS workspace_folders (
                    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
                    path TEXT NOT NULL,
                    PRIMARY KEY (workspace_id, path)
                )
            )");
            q.exec(R"(
                CREATE TABLE IF NOT EXISTS recent_files (
                    path TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    last_opened TEXT NOT NULL,
                    open_count INTEGER NOT NULL DEFAULT 1
                )
            )");
            q.exec("CREATE INDEX IF NOT EXISTS idx_recent_files_opened ON recent_files(last_opened DESC)");
        }
    }

    void scanDirectory(const std::string& dirPath) {
        QDir dir(QString::fromStdString(dirPath));
        if (!dir.exists()) return;

        // Watch subdirectories
        for (const auto& fi : dir.entryInfoList(QDir::Dirs | QDir::NoDotAndDotDot)) {
            watcher_->watchPath(fi.absoluteFilePath().toStdString());
            scanDirectory(fi.absoluteFilePath().toStdString());
        }
    }
};

IWorkspaceManager* createWorkspaceManager(const std::string& dbPath) {
    return new WorkspaceManager(dbPath);
}

} // namespace jarvis::workspace
