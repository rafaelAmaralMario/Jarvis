#include <catch2/catch_test_macros.hpp>
#include "jarvis/git/git_manager.h"
#include <string>
#include <vector>
#include <sstream>

using namespace jarvis::git;

TEST_CASE("GitStatus struct and status parsing", "[git]") {
    SECTION("default git status fields") {
        GitStatus s;
        REQUIRE(s.path.empty());
        REQUIRE(s.status == ' ');
        REQUIRE_FALSE(s.staged);
        REQUIRE_FALSE(s.isUntracked);
    }

    SECTION("untracked file") {
        GitStatus s;
        s.path = "newfile.txt";
        s.status = '?';
        s.isUntracked = true;
        REQUIRE(s.status == '?');
        REQUIRE(s.isUntracked);
        REQUIRE_FALSE(s.staged);
    }

    SECTION("staged modification") {
        GitStatus s;
        s.path = "file.cpp";
        s.status = 'M';
        s.staged = true;
        REQUIRE(s.staged);
        REQUIRE(s.status == 'M');
    }

    SECTION("unstaged modification") {
        GitStatus s;
        s.path = "file.cpp";
        s.status = 'M';
        s.staged = false;
        REQUIRE_FALSE(s.staged);
    }
}

TEST_CASE("GitBranch struct", "[git]") {
    SECTION("default branch") {
        GitBranch b;
        REQUIRE(b.name.empty());
        REQUIRE_FALSE(b.isCurrent);
    }

    SECTION("current branch") {
        GitBranch b;
        b.name = "main";
        b.isCurrent = true;
        REQUIRE(b.name == "main");
        REQUIRE(b.isCurrent);
    }

    SECTION("non-current branch") {
        GitBranch b;
        b.name = "feature-x";
        b.isCurrent = false;
        REQUIRE_FALSE(b.isCurrent);
    }
}

TEST_CASE("GitLogEntry struct", "[git]") {
    SECTION("default log entry") {
        GitLogEntry e;
        REQUIRE(e.hash.empty());
        REQUIRE(e.author.empty());
        REQUIRE(e.message.empty());
    }

    SECTION("populated log entry") {
        GitLogEntry e;
        e.hash = "abc123def456";
        e.author = "John Doe";
        e.email = "john@example.com";
        e.message = "Fix critical bug";
        e.date = "2024-01-15";
        REQUIRE(e.hash == "abc123def456");
        REQUIRE(e.message == "Fix critical bug");
    }

    SECTION("hash is 40 chars for SHA-1 or shorter") {
        std::string shortHash = "abc1234";
        std::string fullHash = "9d3a900d1f4b2e5c6a7b8c9d0e1f2a3b4c5d6e7f";
        REQUIRE(shortHash.size() >= 7);
        REQUIRE(fullHash.size() == 40);
    }
}

TEST_CASE("GitDiffHunk and GitGutterLine structs", "[git]") {
    SECTION("diff hunk defaults") {
        GitDiffHunk h;
        REQUIRE(h.oldStart == 0);
        REQUIRE(h.newStart == 0);
        REQUIRE(h.type == ' ');
    }

    SECTION("gutter line types") {
        GitGutterLine added{42, 'a'};
        GitGutterLine modified{10, 'm'};
        GitGutterLine deleted{5, 'd'};
        REQUIRE(added.type == 'a');
        REQUIRE(modified.type == 'm');
        REQUIRE(deleted.type == 'd');
    }
}

TEST_CASE("Git status parsing from raw output", "[git]") {
    // Simulate parsing `git status --porcelain` output
    auto parseStatus = [](const std::string& line) -> GitStatus {
        GitStatus s;
        s.staged = (line[0] != ' ' && line[0] != '?');
        s.isUntracked = (line[0] == '?' || line[1] == '?');
        s.status = (line[1] != ' ') ? line[1] : line[0];
        s.path = line.substr(3);
        return s;
    };

    SECTION("parses staged file") {
        auto s = parseStatus("M  src/main.cpp");
        REQUIRE(s.path == "src/main.cpp");
        REQUIRE(s.staged);
        REQUIRE(s.status == 'M');
    }

    SECTION("parses unstaged modification") {
        auto s = parseStatus(" M src/main.cpp");
        REQUIRE(s.path == "src/main.cpp");
        REQUIRE_FALSE(s.staged);
        REQUIRE(s.status == 'M');
    }

    SECTION("parses untracked file") {
        auto s = parseStatus("?? newfile.txt");
        REQUIRE(s.path == "newfile.txt");
        REQUIRE(s.isUntracked);
        REQUIRE(s.status == '?');
    }

    SECTION("parses added file") {
        auto s = parseStatus("A  added.txt");
        REQUIRE(s.path == "added.txt");
        REQUIRE(s.staged);
    }

    SECTION("parses deleted file") {
        auto s = parseStatus(" D deleted.txt");
        REQUIRE(s.path == "deleted.txt");
        REQUIRE_FALSE(s.staged);
        REQUIRE(s.status == 'D');
    }
}

TEST_CASE("Branch name validation", "[git]") {
    auto isValidBranchName = [](const std::string& name) -> bool {
        if (name.empty()) return false;
        if (name.find("..") != std::string::npos) return false;
        if (name.find(" ") != std::string::npos) return false;
        if (name.front() == '-' || name.back() == '-') return false;
        if (name.find("//") != std::string::npos) return false;
        return true;
    };

    SECTION("valid branch names") {
        REQUIRE(isValidBranchName("main"));
        REQUIRE(isValidBranchName("feature/xyz"));
        REQUIRE(isValidBranchName("fix-123"));
        REQUIRE(isValidBranchName("v1.2.3"));
    }

    SECTION("invalid branch names") {
        REQUIRE_FALSE(isValidBranchName(""));
        REQUIRE_FALSE(isValidBranchName("has space"));
        REQUIRE_FALSE(isValidBranchName("contains..dots"));
        REQUIRE_FALSE(isValidBranchName("-starts-with-dash"));
        REQUIRE_FALSE(isValidBranchName("ends-with-dash-"));
    }
}
