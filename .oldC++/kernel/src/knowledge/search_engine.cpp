#include "jarvis/knowledge/search_engine.h"
#include <QSqlQuery>
#include <QSqlError>
#include <QString>

namespace jarvis::knowledge {

class SearchEngine : public ISearchEngine {
public:
    explicit SearchEngine(persistence::IDatabase* db)
        : db_(db)
    {}

    std::vector<SearchResult> search(const std::string& query) override {
        std::vector<SearchResult> results;
        if (query.empty()) return results;

        QSqlQuery q(db_->qSqlDatabase());
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
        QSqlQuery q(db_->qSqlDatabase());
        q.exec("INSERT INTO notes_fts(notes_fts) VALUES('rebuild')");
        return q.exec(
            "INSERT INTO notes_fts(notes_fts, rowid, title, content, tags) "
            "SELECT rowid, title, content, tags FROM notes"
        );
    }

    bool addToIndex(const std::string& noteId) override {
        QSqlQuery q(db_->qSqlDatabase());
        q.prepare(R"(
            INSERT INTO notes_fts(rowid, title, content, tags)
            SELECT rowid, title, content, tags FROM notes WHERE id = ?
        )");
        q.addBindValue(QString::fromStdString(noteId));
        return q.exec();
    }

    bool removeFromIndex(const std::string& noteId) override {
        QSqlQuery q(db_->qSqlDatabase());
        q.prepare("INSERT INTO notes_fts(notes_fts, rowid) VALUES('delete', (SELECT rowid FROM notes WHERE id = ?))");
        q.addBindValue(QString::fromStdString(noteId));
        return q.exec();
    }

private:
    persistence::IDatabase* db_;

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

ISearchEngine* createSearchEngine(persistence::IDatabase* db) {
    return new SearchEngine(db);
}

} // namespace jarvis::knowledge
