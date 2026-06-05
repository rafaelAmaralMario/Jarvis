#include <catch2/catch_test_macros.hpp>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QTemporaryFile>

TEST_CASE("Migration schema version tracking", "[persistence]") {
    QTemporaryFile tmpFile;
    REQUIRE(tmpFile.open());

    QString connName = "test_migrations";
    QSqlDatabase db = QSqlDatabase::addDatabase("QSQLITE", connName);
    db.setDatabaseName(tmpFile.fileName());
    REQUIRE(db.open());

    // Create schema_version table manually (same as migration runner does)
    QSqlQuery q(db);
    REQUIRE(q.exec(
        "CREATE TABLE IF NOT EXISTS schema_version ("
        "  version INTEGER PRIMARY KEY,"
        "  name TEXT NOT NULL,"
        "  applied_at TEXT NOT NULL DEFAULT (datetime('now'))"
        ")"
    ));

    SECTION("starts at version 0") {
        q.exec("SELECT MAX(version) FROM schema_version");
        REQUIRE(q.next());
        REQUIRE(q.value(0).isNull());
    }

    SECTION("tracks applied migrations") {
        REQUIRE(q.exec("INSERT INTO schema_version (version, name) VALUES (1, 'core')"));
        REQUIRE(q.exec("INSERT INTO schema_version (version, name) VALUES (2, 'permissions')"));

        q.exec("SELECT MAX(version) FROM schema_version");
        REQUIRE(q.next());
        REQUIRE(q.value(0).toInt() == 2);
    }

    SECTION("does not re-apply same version") {
        REQUIRE(q.exec("INSERT INTO schema_version (version, name) VALUES (1, 'core')"));
        // Insertion of same version should fail (PRIMARY KEY)
        REQUIRE_FALSE(q.exec("INSERT INTO schema_version (version, name) VALUES (1, 'core')"));
    }

    db.close();
    QSqlDatabase::removeDatabase(connName);
}
