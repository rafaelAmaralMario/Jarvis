#include "jarvis/knowledge/search_engine.h"
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QString>

namespace jarvis::knowledge {

class SearchEngine : public ISearchEngine {
public:
    explicit SearchEngine(const std::string& dbPath)
        : dbPath_(dbPath)
    {
        initDb();
    }

    std::vector<SearchResult> search(const std::string& query) override {
        std::vector<SearchResult> results;
        if (query.empty()) return results;

        QSqlQuery q(QSqlDatabase::database("knowledge-search"));
        q.prepare(R"(
            SELECT n.id, n.title, snippet(notes_fts, 1, '<mark>', '</mark>', '...', 40) AS snippet,
                   rank
            FROM notes_fts
            JOIN notes n ON n.rowid = notes_fts.rowid
            WHERE notes_fts MATCH ?
            ORDER BY rank
            LIMIT 50
        )");
        q.addBindValue(QString::fromStdString(escapeQuery(query)));

        if (q.exec()) {
            while (q.next()) {
                SearchResult r;
                r.id = q.value(0).toString().toStdString();
                r.title = q.value(1).toString().toStdString();
                r.snippet = q.value(2).toString().toStdString();
                r.score = q.value(3).toDouble();
                results.push_back(std::move(r));
            }
        }

        return results;
    }

    bool rebuildIndex() override {
        QSqlQuery q(QSqlDatabase::database("knowledge-search"));
        // Delete all content
        q.exec("INSERT INTO notes_fts(notes_fts) VALUES('rebuild')");
        // Re-populate
        return q.exec(
            "INSERT INTO notes_fts(notes_fts, rowid, title, content, tags) "
            "SELECT rowid, title, content, tags FROM notes"
        );
    }

    bool addToIndex(const std::string& noteId) override {
        QSqlQuery q(QSqlDatabase::database("knowledge-search"));
        q.prepare(R"(
            INSERT INTO notes_fts(rowid, title, content, tags)
            SELECT rowid, title, content, tags FROM notes WHERE id = ?
        )");
        q.addBindValue(QString::fromStdString(noteId));
        return q.exec();
    }

    bool removeFromIndex(const std::string& noteId) override {
        QSqlQuery q(QSqlDatabase::database("knowledge-search"));
        q.prepare("INSERT INTO notes_fts(notes_fts, rowid) VALUES('delete', (SELECT rowid FROM notes WHERE id = ?))");
        q.addBindValue(QString::fromStdString(noteId));
        return q.exec();
    }

private:
    std::string dbPath_;

    void initDb() {
        QString connName = "knowledge-search";
        QSqlDatabase db;
        if (QSqlDatabase::contains(connName)) {
            db = QSqlDatabase::database(connName);
        } else {
            db = QSqlDatabase::addDatabase("QSQLITE", connName);
        }
        db.setDatabaseName(QString::fromStdString(dbPath_));
        if (!db.isOpen()) db.open();
    }

    static std::string escapeQuery(const std::string& query) {
        std::string escaped;
        for (char c : query) {
            if (c == '"' || c == '*' || c == '^' || c == '(' || c == ')' ||
                c == '+' || c == '-' || c == '~' || c == ':' || c == '!') {
                escaped += ' ';
            } else {
                escaped += c;
            }
        }
        if (escaped.empty()) return "";
        return escaped + "*";
    }
};

ISearchEngine* createSearchEngine(const std::string& dbPath) {
    return new SearchEngine(dbPath);
}

} // namespace jarvis::knowledge
