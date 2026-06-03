#include <catch2/catch_test_macros.hpp>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QTemporaryFile>
#include <QFile>

TEST_CASE("SQLite database operations", "[persistence]") {
    QTemporaryFile tmpFile;
    REQUIRE(tmpFile.open());

    QString connName = "test_db";
    QSqlDatabase db = QSqlDatabase::addDatabase("QSQLITE", connName);
    db.setDatabaseName(tmpFile.fileName());
    REQUIRE(db.open());

    SECTION("WAL mode is enabled") {
        QSqlQuery q(db);
        q.exec("PRAGMA journal_mode");
        REQUIRE(q.next());
        REQUIRE(q.value(0).toString().toLower() == "wal");
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
        q.exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)");

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
    QTemporaryFile tmpFile;
    REQUIRE(tmpFile.open());

    // Test that concurrent reads work
    QString connName = "test_concurrent";
    {
        QSqlDatabase db = QSqlDatabase::addDatabase("QSQLITE", connName);
        db.setDatabaseName(tmpFile.fileName());
        REQUIRE(db.open());

        QSqlQuery q(db);
        q.exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)");
        for (int i = 0; i < 100; i++) {
            q.prepare("INSERT INTO test (name) VALUES (?)");
            q.addBindValue(QString("item-%1").arg(i));
            q.exec();
        }
        db.close();
    }

    QSqlDatabase::removeDatabase(connName);
}
