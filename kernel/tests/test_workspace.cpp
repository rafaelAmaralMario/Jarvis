#include <catch2/catch_test_macros.hpp>
#include <QTemporaryDir>
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QJsonDocument>
#include <QJsonObject>

TEST_CASE("File system operations", "[workspace]") {
    QTemporaryDir tempDir;
    REQUIRE(tempDir.isValid());
    QString dirPath = tempDir.path();

    SECTION("create and list files") {
        QDir dir(dirPath);

        // Create a file
        QFile file(dir.absoluteFilePath("test.txt"));
        REQUIRE(file.open(QIODevice::WriteOnly));
        file.write("hello");
        file.close();

        // Create a subdir
        REQUIRE(dir.mkdir("subdir"));

        // List files
        auto entries = dir.entryInfoList(QDir::Files | QDir::Dirs | QDir::NoDotAndDotDot,
                                          QDir::DirsFirst | QDir::Name);
        REQUIRE(entries.size() == 2);

        bool hasDir = false, hasFile = false;
        for (const auto& e : entries) {
            if (e.isDir()) hasDir = true;
            if (e.isFile()) hasFile = true;
        }
        REQUIRE(hasDir);
        REQUIRE(hasFile);
    }

    SECTION("file rename") {
        QDir dir(dirPath);
        QFile file(dir.absoluteFilePath("old.txt"));
        REQUIRE(file.open(QIODevice::WriteOnly));
        file.close();

        REQUIRE(QFile::rename(dir.absoluteFilePath("old.txt"), dir.absoluteFilePath("new.txt")));
        REQUIRE(QFileInfo::exists(dir.absoluteFilePath("new.txt")));
        REQUIRE_FALSE(QFileInfo::exists(dir.absoluteFilePath("old.txt")));
    }

    SECTION("file delete") {
        QDir dir(dirPath);
        QFile file(dir.absoluteFilePath("todelete.txt"));
        REQUIRE(file.open(QIODevice::WriteOnly));
        file.close();

        REQUIRE(QFile::remove(dir.absoluteFilePath("todelete.txt")));
        REQUIRE_FALSE(QFileInfo::exists(dir.absoluteFilePath("todelete.txt")));
    }

    SECTION("recursive directory delete") {
        QDir dir(dirPath);
        REQUIRE(dir.mkpath("a/b/c"));
        REQUIRE(QDir(dir.absoluteFilePath("a/b/c")).exists());

        QDir(dir.absoluteFilePath("a")).removeRecursively();
        REQUIRE_FALSE(QDir(dir.absoluteFilePath("a")).exists());
    }
}

TEST_CASE("Project type detection", "[workspace]") {
    QTemporaryDir tempDir;
    REQUIRE(tempDir.isValid());
    QDir dir(tempDir.path());

    SECTION("detects C++ project") {
        QFile cmake(dir.absoluteFilePath("CMakeLists.txt"));
        REQUIRE(cmake.open(QIODevice::WriteOnly));
        cmake.write("cmake_minimum_required(VERSION 3.20)\nproject(MyApp VERSION 1.2.3)\n");
        cmake.close();

        REQUIRE(QFileInfo::exists(dir.absoluteFilePath("CMakeLists.txt")));

        // Read version from CMakeLists.txt
        QFile readCmake(dir.absoluteFilePath("CMakeLists.txt"));
        REQUIRE(readCmake.open(QIODevice::ReadOnly | QIODevice::Text));
        QTextStream in(&readCmake);
        QString line;
        std::string version;
        while (in.readLineInto(&line)) {
            if (line.contains("project(", Qt::CaseInsensitive) && line.contains("VERSION")) {
                auto start = line.indexOf("VERSION") + 7;
                auto end = line.indexOf(')', start);
                if (end > start)
                    version = line.mid(start, end - start).trimmed().toStdString();
                break;
            }
        }
        REQUIRE(version == "1.2.3");
    }

    SECTION("detects Node project") {
        QFile pkg(dir.absoluteFilePath("package.json"));
        REQUIRE(pkg.open(QIODevice::WriteOnly));
        pkg.write("{\"name\":\"test\",\"version\":\"2.0.0\"}");
        pkg.close();

        QFile readPkg(dir.absoluteFilePath("package.json"));
        REQUIRE(readPkg.open(QIODevice::ReadOnly));
        auto doc = QJsonDocument::fromJson(readPkg.readAll());
        REQUIRE(doc.object()["version"].toString().toStdString() == "2.0.0");
    }
}
