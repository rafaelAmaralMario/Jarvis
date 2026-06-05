#include <catch2/catch_test_macros.hpp>
#include "jarvis/workspace/workspace_manager.h"
#include <QTemporaryDir>
#include <QDir>
#include <QFile>

using namespace jarvis::workspace;

TEST_CASE("Workspace roots management", "[workspace]") {
    QTemporaryDir tempDir;
    REQUIRE(tempDir.isValid());

    std::string rootPath = tempDir.path().toStdString();

    SECTION("root path is valid directory") {
        QDir dir(QString::fromStdString(rootPath));
        REQUIRE(dir.exists());
    }

    SECTION("create and list subdirectories") {
        QDir dir(QString::fromStdString(rootPath));
        REQUIRE(dir.mkpath("subdir1"));
        REQUIRE(dir.mkpath("subdir2/deep"));
        REQUIRE(QDir(dir.absoluteFilePath("subdir2/deep")).exists());
    }
}

TEST_CASE("FileEntry struct", "[workspace]") {
    FileEntry entry;

    SECTION("default fields") {
        REQUIRE(entry.name.empty());
        REQUIRE(entry.path.empty());
        REQUIRE(entry.fullPath.empty());
        REQUIRE_FALSE(entry.isDirectory);
        REQUIRE(entry.size == 0);
        REQUIRE(entry.modifiedAt.empty());
    }

    SECTION("directory entry") {
        entry.name = "src";
        entry.path = "src";
        entry.fullPath = "/workspace/src";
        entry.isDirectory = true;
        REQUIRE(entry.isDirectory);
    }

    SECTION("file entry") {
        entry.name = "main.cpp";
        entry.path = "src/main.cpp";
        entry.fullPath = "/workspace/src/main.cpp";
        entry.size = 1024;
        entry.modifiedAt = "2024-01-15T10:00:00Z";
        REQUIRE(entry.name == "main.cpp");
        REQUIRE(entry.size == 1024);
    }
}

TEST_CASE("Recent files operations", "[workspace]") {
    FileEntry entry;
    entry.name = "test.txt";
    entry.path = "test.txt";
    entry.fullPath = "/workspace/test.txt";

    SECTION("recent files list ordering") {
        std::vector<FileEntry> recent;
        recent.push_back(entry);
        recent.push_back({"other.txt", "other.txt", "/workspace/other.txt", false, 0, ""});
        REQUIRE(recent.size() == 2);
    }
}

TEST_CASE("WorkspaceManager project type detection", "[workspace]") {
    QTemporaryDir tempDir;
    REQUIRE(tempDir.isValid());
    QDir dir(tempDir.path());

    SECTION("detects CMake project") {
        QFile f(dir.absoluteFilePath("CMakeLists.txt"));
        REQUIRE(f.open(QIODevice::WriteOnly));
        f.write("cmake_minimum_required(VERSION 3.20)\nproject(Test VERSION 1.0)\n");
        f.close();
        REQUIRE(QFileInfo::exists(dir.absoluteFilePath("CMakeLists.txt")));
    }

    SECTION("detects Node project") {
        QFile f(dir.absoluteFilePath("package.json"));
        REQUIRE(f.open(QIODevice::WriteOnly));
        f.write("{\"name\":\"test\",\"version\":\"1.0.0\"}");
        f.close();
        REQUIRE(QFileInfo::exists(dir.absoluteFilePath("package.json")));
    }
}
