#pragma once

#include <string>
#include <vector>
#include <functional>

namespace jarvis::git {

struct GitStatus {
    std::string path;
    char status = ' ';
    bool staged = false;
    bool isUntracked = false;
};

struct GitBranch {
    std::string name;
    bool isCurrent = false;
};

struct GitLogEntry {
    std::string hash;
    std::string author;
    std::string email;
    std::string message;
    std::string date;
};

struct GitDiffHunk {
    int oldStart = 0;
    int oldLines = 0;
    int newStart = 0;
    int newLines = 0;
    char type = ' '; // ' ' context, '+' added, '-' removed
};

struct GitGutterLine {
    int line;
    char type; // 'a' added, 'm' modified, 'd' deleted
};

class IGitManager {
public:
    virtual ~IGitManager() = default;

    virtual bool isRepo(const std::string& path) = 0;
    virtual bool init(const std::string& path) = 0;
    virtual bool clone(const std::string& url, const std::string& path) = 0;

    virtual std::vector<GitStatus> status(const std::string& repoPath) = 0;
    virtual std::string diff(const std::string& repoPath, const std::string& filePath) = 0;
    virtual std::vector<GitGutterLine> diffGutter(const std::string& repoPath, const std::string& filePath) = 0;

    virtual bool stage(const std::string& repoPath, const std::string& filePath) = 0;
    virtual bool unstage(const std::string& repoPath, const std::string& filePath) = 0;
    virtual bool stageAll(const std::string& repoPath) = 0;
    virtual bool commit(const std::string& repoPath, const std::string& message) = 0;

    virtual std::vector<GitBranch> branches(const std::string& repoPath) = 0;
    virtual bool checkout(const std::string& repoPath, const std::string& branch) = 0;
    virtual bool createBranch(const std::string& repoPath, const std::string& branch) = 0;
    virtual bool deleteBranch(const std::string& repoPath, const std::string& branch) = 0;

    virtual bool push(const std::string& repoPath, const std::string& remote = "origin", const std::string& branch = "") = 0;
    virtual bool pull(const std::string& repoPath, const std::string& remote = "origin", const std::string& branch = "") = 0;
    virtual bool fetch(const std::string& repoPath, const std::string& remote = "origin") = 0;

    virtual std::vector<GitLogEntry> log(const std::string& repoPath, int count = 50) = 0;

    virtual void setCredentials(const std::string& remote, const std::string& username, const std::string& token) = 0;

    virtual std::string currentBranch(const std::string& repoPath) = 0;
};

IGitManager* createGitManager();

} // namespace jarvis::git
