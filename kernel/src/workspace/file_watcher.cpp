#include "jarvis/workspace/file_watcher.h"
#include <QFileSystemWatcher>
#include <QObject>
#include <QFileInfo>
#include <set>

namespace jarvis::workspace {

class FileWatcher : public QObject, public IFileWatcher {
    Q_OBJECT
public:
    FileWatcher()
        : QObject(nullptr)
    {
        connect(&watcher_, &QFileSystemWatcher::fileChanged,
                this, &FileWatcher::onFileChanged);
        connect(&watcher_, &QFileSystemWatcher::directoryChanged,
                this, &FileWatcher::onDirectoryChanged);
    }

    void watchPath(const std::string& path) override {
        QString qpath = QString::fromStdString(path);
        if (!watcher_.files().contains(qpath) && !watcher_.directories().contains(qpath)) {
            QFileInfo fi(qpath);
            if (fi.isDir())
                watcher_.addPath(qpath);
            else if (fi.exists())
                watcher_.addPath(qpath);
        }
    }

    void unwatchPath(const std::string& path) override {
        QString qpath = QString::fromStdString(path);
        watcher_.removePath(qpath);
    }

    void setEventCallback(EventCallback cb) override {
        callback_ = std::move(cb);
    }

    std::vector<std::string> watchedPaths() const override {
        std::vector<std::string> paths;
        for (const auto& p : watcher_.files())
            paths.push_back(p.toStdString());
        for (const auto& p : watcher_.directories())
            paths.push_back(p.toStdString());
        return paths;
    }

private:
    QFileSystemWatcher watcher_;
    EventCallback callback_;
    std::set<std::string> knownFiles_;

    void onFileChanged(const QString& path) {
        QFileInfo fi(path);
        FileEvent event;
        if (fi.exists()) {
            event.type = FileEventType::Modified;
            event.path = path.toStdString();
        } else {
            event.type = FileEventType::Deleted;
            event.path = path.toStdString();
            watcher_.removePath(path);
        }
        if (callback_) callback_(event);
    }

    void onDirectoryChanged(const QString& path) {
        QFileInfo fi(path);
        if (!fi.exists()) {
            FileEvent event;
            event.type = FileEventType::Deleted;
            event.path = path.toStdString();
            if (callback_) callback_(event);
            watcher_.removePath(path);
            return;
        }

        // Detect new files in directory
        QDir dir(path);
        for (const auto& entry : dir.entryInfoList(QDir::Files | QDir::Dirs | QDir::NoDotAndDotDot)) {
            std::string entryPath = entry.absoluteFilePath().toStdString();
            if (knownFiles_.find(entryPath) == knownFiles_.end()) {
                knownFiles_.insert(entryPath);
                FileEvent event;
                event.type = FileEventType::Created;
                event.path = entryPath;
                if (callback_) callback_(event);
                // Watch new files
                if (entry.isFile() && !watcher_.files().contains(entry.absoluteFilePath()))
                    watcher_.addPath(entry.absoluteFilePath());
            }
        }
    }

    void trackDirectory(const QString& path) {
        QDir dir(path);
        for (const auto& entry : dir.entryInfoList(QDir::Files | QDir::Dirs | QDir::NoDotAndDotDot)) {
            knownFiles_.insert(entry.absoluteFilePath().toStdString());
            if (entry.isFile())
                watcher_.addPath(entry.absoluteFilePath());
            if (entry.isDir())
                trackDirectory(entry.absoluteFilePath());
        }
    }

public:
    void scanAndWatch(const std::string& rootPath) {
        QString qPath = QString::fromStdString(rootPath);
        watcher_.addPath(qPath);
        trackDirectory(qPath);
    }
};

IFileWatcher* createFileWatcher() {
    return new FileWatcher();
}

} // namespace jarvis::workspace

// Include moc for Q_OBJECT
#include "file_watcher.moc"
