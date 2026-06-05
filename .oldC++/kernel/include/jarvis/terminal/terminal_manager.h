#pragma once

#include <string>
#include <vector>
#include <functional>
#include <memory>

namespace jarvis::terminal {

struct TerminalInstance {
    std::string id;
    void* process = nullptr;
    int cols = 80;
    int rows = 24;
    std::string shell;
    bool isRunning = false;
};

class ITerminalManager {
public:
    virtual ~ITerminalManager() = default;

    virtual std::string create() = 0;
    virtual void write(const std::string& id, const std::string& data) = 0;
    virtual void resize(const std::string& id, int cols, int rows) = 0;
    virtual void close(const std::string& id) = 0;
    virtual void closeAll() = 0;
    virtual std::vector<std::string> list() = 0;
    virtual void setOutputCallback(std::function<void(const std::string& id, const std::string& data)> cb) = 0;
    virtual void setExitCallback(std::function<void(const std::string& id, int exitCode)> cb) = 0;
};

ITerminalManager* createTerminalManager();

} // namespace jarvis::terminal
