#include "jarvis/terminal/terminal_manager.h"

#include <QProcess>
#include <QByteArray>
#include <QDebug>
#include <QDir>
#include <QFileInfo>
#include <QCoreApplication>
#include <QUuid>
#include <unordered_map>

namespace jarvis::terminal {

class TerminalManager : public ITerminalManager {
public:
    TerminalManager() = default;
    ~TerminalManager() override { closeAll(); }

    std::string create() override {
        auto* proc = new QProcess();

        QString shell = detectShell();
        QStringList args;
        if (shell.endsWith("cmd.exe")) {
#ifdef Q_OS_WIN
            args << "/Q";
#endif
        } else {
            args << "-i";
        }

        proc->setProcessChannelMode(QProcess::SeparateChannels);
        proc->setReadChannel(QProcess::StandardOutput);

        QObject::connect(proc, &QProcess::readyReadStandardOutput, proc, [this, proc]() {
            auto id = findIdByProcess(proc);
            if (!id.empty()) {
                QByteArray data = proc->readAllStandardOutput();
                if (outputCallback_) {
                    outputCallback_(id, data.toStdString());
                }
            }
        });

        QObject::connect(proc, &QProcess::readyReadStandardError, proc, [this, proc]() {
            auto id = findIdByProcess(proc);
            if (!id.empty()) {
                QByteArray data = proc->readAllStandardError();
                if (outputCallback_) {
                    outputCallback_(id, data.toStdString());
                }
            }
        });

        QObject::connect(proc, QOverload<int, QProcess::ExitStatus>::of(&QProcess::finished),
                proc, [this, proc](int exitCode, QProcess::ExitStatus) {
            auto id = findIdByProcess(proc);
            if (!id.empty()) {
                instances_.erase(id);
                if (exitCallback_) {
                    exitCallback_(id, exitCode);
                }
            }
            proc->deleteLater();
        });

        proc->start(shell, args);
        if (!proc->waitForStarted(3000)) {
            qWarning() << "Terminal: failed to start shell:" << shell;
            proc->deleteLater();
            return "";
        }

        QString id = QUuid::createUuid().toString(QUuid::Id128);
        TerminalInstance inst;
        inst.id = id.toStdString();
        inst.process = proc;
        inst.shell = shell.toStdString();
        inst.isRunning = true;

        std::string idStr = id.toStdString();
        instances_[idStr] = inst;

        qDebug() << "Terminal created:" << idStr.c_str() << "shell:" << shell;
        return idStr;
    }

    void write(const std::string& id, const std::string& data) override {
        auto it = instances_.find(id);
        if (it == instances_.end()) return;

        auto* proc = static_cast<QProcess*>(it->second.process);
        if (!proc || proc->state() != QProcess::Running) return;

        proc->write(QByteArray::fromStdString(data));
    }

    void resize(const std::string& id, int cols, int rows) override {
        auto it = instances_.find(id);
        if (it == instances_.end()) return;

        it->second.cols = cols;
        it->second.rows = rows;

#ifdef Q_OS_UNIX
        auto* proc = static_cast<QProcess*>(it->second.process);
        if (proc && proc->state() == QProcess::Running) {
            struct winsize ws;
            ws.ws_col = static_cast<unsigned short>(cols);
            ws.ws_row = static_cast<unsigned short>(rows);
            ws.ws_xpixel = 0;
            ws.ws_ypixel = 0;
            ioctl(proc->processId(), TIOCSWINSZ, &ws);
        }
#endif
    }

    void close(const std::string& id) override {
        auto it = instances_.find(id);
        if (it == instances_.end()) return;

        auto* proc = static_cast<QProcess*>(it->second.process);
        if (proc) {
            proc->terminate();
            if (!proc->waitForFinished(3000)) {
                proc->kill();
                proc->waitForFinished(1000);
            }
        }
        instances_.erase(it);
    }

    void closeAll() override {
        auto ids = list();
        for (const auto& id : ids) {
            close(id);
        }
    }

    std::vector<std::string> list() override {
        std::vector<std::string> result;
        for (const auto& [id, _] : instances_) {
            result.push_back(id);
        }
        return result;
    }

    void setOutputCallback(std::function<void(const std::string&, const std::string&)> cb) override {
        outputCallback_ = std::move(cb);
    }

    void setExitCallback(std::function<void(const std::string&, int)> cb) override {
        exitCallback_ = std::move(cb);
    }

private:
    std::string findIdByProcess(QProcess* proc) const {
        for (const auto& [id, inst] : instances_) {
            if (inst.process == proc) return id;
        }
        return "";
    }

    QString detectShell() const {
#ifdef Q_OS_WIN
        QString shell = qEnvironmentVariable("COMSPEC");
        if (shell.isEmpty()) shell = "cmd.exe";
        return shell;
#else
        QString shell = qEnvironmentVariable("SHELL");
        if (shell.isEmpty()) {
#ifdef Q_OS_MACOS
            shell = "/bin/zsh";
#else
            shell = "/bin/bash";
#endif
        }
        return shell;
#endif
    }

    std::unordered_map<std::string, TerminalInstance> instances_;
    std::function<void(const std::string&, const std::string&)> outputCallback_;
    std::function<void(const std::string&, int)> exitCallback_;
};

ITerminalManager* createTerminalManager() {
    return new TerminalManager();
}

} // namespace jarvis::terminal
