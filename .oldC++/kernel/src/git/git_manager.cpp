#include "jarvis/git/git_manager.h"

#include <QProcess>
#include <QDir>
#include <QFileInfo>
#include <QRegularExpression>
#include <QStringList>

namespace jarvis::git {

namespace {

QString runGit(const QString& repoPath, const QStringList& args, QString* workDir = nullptr) {
    QProcess proc;
    proc.setProcessChannelMode(QProcess::MergedChannels);
    if (workDir) proc.setWorkingDirectory(*workDir);
    else proc.setWorkingDirectory(repoPath);
    proc.start("git", args);
    proc.waitForFinished(30000);
    return QString::fromUtf8(proc.readAllStandardOutput()).trimmed();
}

QString runGitErr(const QString& repoPath, const QStringList& args) {
    QProcess proc;
    proc.setWorkingDirectory(repoPath);
    proc.start("git", args);
    proc.waitForFinished(30000);
    QString out = QString::fromUtf8(proc.readAllStandardOutput()).trimmed();
    QString err = QString::fromUtf8(proc.readAllStandardError()).trimmed();
    return out + (err.isEmpty() ? "" : "\n" + err);
}

} // anonymous namespace

class GitManager : public IGitManager {
public:
    bool isRepo(const std::string& path) override {
        QDir dir(QString::fromStdString(path) + "/.git");
        return dir.exists();
    }

    bool init(const std::string& path) override {
        auto result = runGitErr(QString::fromStdString(path), {"init"});
        return !result.isEmpty();
    }

    bool clone(const std::string& url, const std::string& path) override {
        auto result = runGitErr(QString::fromStdString(path), {"clone", QString::fromStdString(url), QString::fromStdString(path)});
        return !result.contains("fatal:");
    }

    std::vector<GitStatus> status(const std::string& repoPath) override {
        std::vector<GitStatus> result;
        QString rp = QString::fromStdString(repoPath);
        QString out = runGit(rp, {"status", "--porcelain"});

        for (const auto& line : out.split('\n', Qt::SkipEmptyParts)) {
            if (line.length() < 3) continue;
            GitStatus s;
            s.staged = (line[0] != ' ');
            s.status = line[0] != ' ' ? line[0].toLatin1() : line[1].toLatin1();
            s.isUntracked = (line[1] == '?' || line[0] == '?');
            s.path = line.mid(3).trimmed().toStdString();

            if (s.path.find(" -> ") != std::string::npos) {
                auto parts = s.path.substr(s.path.find(" -> ") + 4);
                if (!parts.empty()) s.path = parts;
            }

            result.push_back(s);
        }
        return result;
    }

    std::string diff(const std::string& repoPath, const std::string& filePath) override {
        QString rp = QString::fromStdString(repoPath);
        QString fp = QString::fromStdString(filePath);
        return runGit(rp, {"diff", "--", fp}).toStdString();
    }

    std::vector<GitGutterLine> diffGutter(const std::string& repoPath, const std::string& filePath) override {
        std::vector<GitGutterLine> result;
        QString rp = QString::fromStdString(repoPath);
        QString fp = QString::fromStdString(filePath);
        QString out = runGit(rp, {"diff", "--unified=0", "--", fp});

        QRegularExpression hunkRe(R"(@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@)");
        QRegularExpression addedRe(R"(^\+([^+].*)$)");
        QRegularExpression removedRe(R"(^\-([^-].*)$)");

        int oldLine = 0, newLine = 0;
        bool inHunk = false;

        for (const auto& line : out.split('\n')) {
            auto m = hunkRe.match(line);
            if (m.hasMatch()) {
                oldLine = m.captured(1).toInt();
                newLine = m.captured(2).toInt();
                inHunk = true;
                continue;
            }
            if (!inHunk) continue;

            if (line.startsWith("---") || line.startsWith("+++")) continue;

            if (line.startsWith(" ")) {
                oldLine++;
                newLine++;
            } else if (line.startsWith("+") && !line.startsWith("+++")) {
                GitGutterLine gl;
                gl.line = newLine;
                gl.type = 'a';
                result.push_back(gl);
                newLine++;
            } else if (line.startsWith("-") && !line.startsWith("---")) {
                // For deletions, mark the line in the new file where something was removed
                GitGutterLine gl;
                gl.line = (newLine > 0) ? newLine - 1 : 0;
                gl.type = 'd';
                result.push_back(gl);
                oldLine++;
            }
        }
        return result;
    }

    bool stage(const std::string& repoPath, const std::string& filePath) override {
        QString rp = QString::fromStdString(repoPath);
        QString fp = QString::fromStdString(filePath);
        auto result = runGitErr(rp, {"add", "--", fp});
        return !result.contains("fatal:");
    }

    bool unstage(const std::string& repoPath, const std::string& filePath) override {
        QString rp = QString::fromStdString(repoPath);
        QString fp = QString::fromStdString(filePath);
        auto result = runGitErr(rp, {"reset", "HEAD", "--", fp});
        return !result.contains("fatal:");
    }

    bool stageAll(const std::string& repoPath) override {
        QString rp = QString::fromStdString(repoPath);
        auto result = runGitErr(rp, {"add", "-A"});
        return !result.contains("fatal:");
    }

    bool commit(const std::string& repoPath, const std::string& message) override {
        QString rp = QString::fromStdString(repoPath);
        auto result = runGitErr(rp, {"commit", "-m", QString::fromStdString(message)});
        return !result.contains("fatal:") && !result.contains("nothing to commit");
    }

    std::vector<GitBranch> branches(const std::string& repoPath) override {
        std::vector<GitBranch> result;
        QString rp = QString::fromStdString(repoPath);
        QString out = runGit(rp, {"branch", "--list"});

        for (const auto& line : out.split('\n', Qt::SkipEmptyParts)) {
            GitBranch b;
            b.isCurrent = line.startsWith('*');
            b.name = line.mid(2).trimmed().toStdString();
            result.push_back(b);
        }
        return result;
    }

    bool checkout(const std::string& repoPath, const std::string& branch) override {
        QString rp = QString::fromStdString(repoPath);
        auto result = runGitErr(rp, {"checkout", QString::fromStdString(branch)});
        return !result.contains("fatal:");
    }

    bool createBranch(const std::string& repoPath, const std::string& branch) override {
        QString rp = QString::fromStdString(repoPath);
        auto result = runGitErr(rp, {"branch", QString::fromStdString(branch)});
        return !result.contains("fatal:");
    }

    bool deleteBranch(const std::string& repoPath, const std::string& branch) override {
        QString rp = QString::fromStdString(repoPath);
        auto result = runGitErr(rp, {"branch", "-d", QString::fromStdString(branch)});
        return !result.contains("fatal:");
    }

    bool push(const std::string& repoPath, const std::string& remote, const std::string& branch) override {
        QString rp = QString::fromStdString(repoPath);
        QStringList args = {"push", QString::fromStdString(remote)};
        if (!branch.empty()) args << QString::fromStdString(branch);

        // Set credentials if stored
        if (!_username.empty() && !_token.empty()) {
            QString remoteUrl = runGit(rp, {"remote", "get-url", QString::fromStdString(remote)});
            if (!remoteUrl.isEmpty()) {
                QString authUrl = remoteUrl;
                authUrl.replace("https://", QString("https://%1:%2@").arg(
                    QString::fromStdString(_username), QString::fromStdString(_token)));
                args.prepend("push");
                args.prepend(authUrl);
                args.removeAt(2); // remove the remote name, replaced by authUrl
            }
        }

        auto result = runGitErr(rp, args);
        return !result.contains("fatal:") && !result.contains("error:");
    }

    bool pull(const std::string& repoPath, const std::string& remote, const std::string& branch) override {
        QString rp = QString::fromStdString(repoPath);
        QStringList args = {"pull", QString::fromStdString(remote)};
        if (!branch.empty()) args << QString::fromStdString(branch);
        auto result = runGitErr(rp, args);
        return !result.contains("fatal:");
    }

    bool fetch(const std::string& repoPath, const std::string& remote) override {
        QString rp = QString::fromStdString(repoPath);
        auto result = runGitErr(rp, {"fetch", QString::fromStdString(remote)});
        return !result.contains("fatal:");
    }

    std::vector<GitLogEntry> log(const std::string& repoPath, int count) override {
        std::vector<GitLogEntry> result;
        QString rp = QString::fromStdString(repoPath);
        QString fmt = "--format=%H%n%an%n%ae%n%s%n%ai%n---";
        QStringList args = {"log", fmt, QString("-%1").arg(count)};
        QString out = runGit(rp, args);

        for (const auto& entry : out.split("\n---\n", Qt::SkipEmptyParts)) {
            auto lines = entry.split('\n', Qt::SkipEmptyParts);
            if (lines.size() < 5) continue;
            GitLogEntry e;
            e.hash = lines[0].trimmed().toStdString();
            e.author = lines[1].trimmed().toStdString();
            e.email = lines[2].trimmed().toStdString();
            e.message = lines[3].trimmed().toStdString();
            e.date = lines[4].trimmed().toStdString();
            result.push_back(e);
        }
        return result;
    }

    void setCredentials(const std::string& remote, const std::string& username, const std::string& token) override {
        _username = username;
        _token = token;
    }

    std::string currentBranch(const std::string& repoPath) override {
        QString rp = QString::fromStdString(repoPath);
        return runGit(rp, {"rev-parse", "--abbrev-ref", "HEAD"}).toStdString();
    }

private:
    std::string _username;
    std::string _token;
};

IGitManager* createGitManager() {
    return new GitManager();
}

} // namespace jarvis::git
