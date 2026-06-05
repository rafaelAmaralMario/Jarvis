#include <catch2/catch_test_macros.hpp>
#include "jarvis/persistence/query_builder.h"
#include "jarvis/persistence/database.h"
#include <QJsonObject>
#include <memory>

using namespace jarvis::persistence;

namespace {
class StubDB : public IDatabase {
public:
    bool open(const std::string&) override { return true; }
    void close() override {}
    bool isOpen() const override { return true; }
    bool exec(const std::string& sql) override { lastSql_ = QString::fromStdString(sql); return true; }
    QSqlQuery prepare(const std::string& sql) override {
        lastSql_ = QString::fromStdString(sql);
        return QSqlQuery();
    }
    std::optional<long long> lastInsertId() override { return 42; }
    bool beginTransaction() override { return true; }
    bool commit() override { return true; }
    bool rollback() override { return true; }
    bool checkpoint() override { return true; }
    std::recursive_mutex& mutex() override { static std::recursive_mutex m; return m; }
    QSqlDatabase& qSqlDatabase() override { static QSqlDatabase db; return db; }
    QString lastSql_;
};
}

TEST_CASE("QueryBuilder::toSql SELECT", "[persistence][query_builder]") {
    auto db = std::make_shared<StubDB>();
    QueryBuilder qb(db.get());

    SECTION("basic select all") {
        qb.from("notes");
        REQUIRE(qb.toSql() == "SELECT * FROM notes");
    }

    SECTION("select specific columns") {
        qb.from("notes").select({"id", "title", "content"});
        REQUIRE(qb.toSql() == "SELECT id, title, content FROM notes");
    }

    SECTION("select with where") {
        qb.from("notes").where("folder = ?");
        REQUIRE(qb.toSql() == "SELECT * FROM notes WHERE folder = ?");
    }

    SECTION("select with multiple where") {
        qb.from("notes")
            .where("folder = ?")
            .where("is_pinned = ?");
        REQUIRE(qb.toSql() == "SELECT * FROM notes WHERE folder = ? AND is_pinned = ?");
    }

    SECTION("select with order") {
        qb.from("notes").orderBy("created_at", "DESC");
        REQUIRE(qb.toSql() == "SELECT * FROM notes ORDER BY created_at DESC");
    }

    SECTION("select with limit and offset") {
        qb.from("notes").limit(10).offset(20);
        REQUIRE(qb.toSql() == "SELECT * FROM notes LIMIT 10 OFFSET 20");
    }

    SECTION("full query") {
        qb.from("notes")
            .select({"id", "title"})
            .where("folder = ?")
            .orderBy("title", "ASC")
            .limit(5);
        REQUIRE(qb.toSql() == "SELECT id, title FROM notes WHERE folder = ? ORDER BY title ASC LIMIT 5");
    }
}

TEST_CASE("QueryBuilder INSERT / UPDATE / DELETE SQL", "[persistence][query_builder]") {
    auto db = std::make_shared<StubDB>();
    QJsonObject data;
    data["title"] = "Test";
    data["folder"] = "inbox";

    SECTION("insert builds correct SQL") {
        QueryBuilder qb(db.get());
        qb.from("notes");
        qb.insert(data);
        REQUIRE(db->lastSql_.contains("INSERT INTO notes"));
    }

    SECTION("delete builds correct SQL") {
        QueryBuilder qb(db.get());
        qb.from("notes").where("id = ?");
        qb.del();
        REQUIRE(db->lastSql_.contains("DELETE FROM notes"));
        REQUIRE(db->lastSql_.contains("WHERE id = ?"));
    }

    SECTION("update builds correct SQL") {
        QueryBuilder qb(db.get());
        qb.from("notes").where("id = ?");
        qb.update(data);
        REQUIRE(db->lastSql_.contains("UPDATE notes"));
        REQUIRE(db->lastSql_.contains("SET"));
        REQUIRE(db->lastSql_.contains("WHERE id = ?"));
    }

    SECTION("count builds correct SQL") {
        QueryBuilder qb(db.get());
        qb.from("notes").where("folder = ?");
        qb.count();
        REQUIRE(db->lastSql_.contains("SELECT COUNT(*)"));
        REQUIRE(db->lastSql_.contains("folder = ?"));
    }

    SECTION("first applies limit 1") {
        QueryBuilder qb(db.get());
        qb.from("notes");
        qb.first();
        REQUIRE(db->lastSql_.contains("LIMIT 1"));
    }
}
