#include <catch2/catch_test_macros.hpp>
#include <QCoreApplication>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QTemporaryDir>
#include <QDir>

namespace {
    struct AppSetup {
        int argc = 1;
        char arg0[32] = "kernel-tests.exe";
        char* argv[2] = {arg0, nullptr};
        QCoreApplication app;
        AppSetup() : app(argc, argv) {
            QCoreApplication::addLibraryPath("C:/Qt/6.8.0/msvc2022_64/plugins");
        }
    };
    static AppSetup setup;
}

TEST_CASE("SQLite database operations", "[persistence]") {
    QTemporaryDir tempDir;
    REQUIRE(tempDir.isValid());
    QString dbPath = tempDir.filePath("test.db");

    QString connName = "test_db";
    QSqlDatabase db = QSqlDatabase::addDatabase("QSQLITE", connName);
    REQUIRE(db.isValid());
    db.setDatabaseName(dbPath);
    REQUIRE(db.open());

    SECTION("WAL mode is enabled") {
        QSqlQuery q(db);
        REQUIRE(q.exec("PRAGMA journal_mode"));
        REQUIRE(q.next());
        QString mode = q.value(0).toString().toLower();
        REQUIRE((mode == "wal" || mode == "delete" || mode == "memory"));
    }

    SECTION("create table and insert") {
        QSqlQuery q(db);
        REQUIRE(q.exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)"));
        REQUIRE(q.exec("INSERT INTO test (name) VALUES ('hello')"));
        REQUIRE(q.exec("SELECT COUNT(*) FROM test"));
        REQUIRE(q.next());
        REQUIRE(q.value(0).toInt() == 1);
    }

    SECTION("transactions commit and rollback") {
        QSqlQuery q(db);
        REQUIRE(q.exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)"));

        REQUIRE(db.transaction());
        REQUIRE(q.exec("INSERT INTO test (name) VALUES ('a')"));
        REQUIRE(db.rollback());

        REQUIRE(q.exec("SELECT COUNT(*) FROM test"));
        REQUIRE(q.next());
        REQUIRE(q.value(0).toInt() == 0);

        REQUIRE(db.transaction());
        REQUIRE(q.exec("INSERT INTO test (name) VALUES ('b')"));
        REQUIRE(db.commit());

        REQUIRE(q.exec("SELECT COUNT(*) FROM test"));
        REQUIRE(q.next());
        REQUIRE(q.value(0).toInt() == 1);
    }

    db.close();
    QSqlDatabase::removeDatabase(connName);
}

TEST_CASE("SQLite thread safety basics", "[persistence][concurrency]") {
    QTemporaryDir tempDir;
    REQUIRE(tempDir.isValid());
    QString dbPath = tempDir.filePath("test_concurrent.db");

    QString connName = "test_concurrent";
    {
        QSqlDatabase db = QSqlDatabase::addDatabase("QSQLITE", connName);
        db.setDatabaseName(dbPath);
        REQUIRE(db.open());

        QSqlQuery q(db);
        REQUIRE(q.exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)"));
        for (int i = 0; i < 100; i++) {
            q.prepare("INSERT INTO test (name) VALUES (?)");
            q.addBindValue(QString("item-%1").arg(i));
            REQUIRE(q.exec());
        }
        db.close();
    }

    QSqlDatabase::removeDatabase(connName);
}
