#include "jarvis/knowledge/knowledge_manager.h"
#include <QSqlQuery>
#include <QSqlError>
#include <QSqlRecord>
#include <QDateTime>
#include <QString>
#include <QFile>
#include <QFileInfo>
#include <QTextStream>
#include <QJsonDocument>
#include <QJsonObject>
#include <QRegularExpression>
#include <algorithm>
#include <set>

namespace jarvis::knowledge {

// ---------------------------------------------------------------------------
// Wikilink parsing helpers
// ---------------------------------------------------------------------------

static std::vector<std::string> extractWikilinks(const std::string& content) {
    std::vector<std::string> links;
    static QRegularExpression re(R"(\[\[([^\]]+)\]\])");
    auto it = re.globalMatch(QString::fromStdString(content));
    while (it.hasNext()) {
        auto match = it.next();
        QString target = match.captured(1).trimmed();
        int pipe = target.indexOf('|');
        if (pipe >= 0) target = target.left(pipe);
        links.push_back(target.trimmed().toStdString());
    }
    return links;
}

static std::string extractContextSnippet(const std::string& content, const std::string& target) {
    auto pos = content.find("[[" + target + "]]");
    if (pos == std::string::npos) return "";
    size_t start = (pos > 80) ? pos - 80 : 0;
    size_t end = std::min(pos + target.size() + 4 + 80, content.size());
    std::string snippet = content.substr(start, end - start);
    if (start > 0) snippet = "..." + snippet;
    if (end < content.size()) snippet += "...";
    return snippet;
}

// ---------------------------------------------------------------------------
// YAML front matter parsing
// ---------------------------------------------------------------------------

struct FrontMatter {
    std::string title;
    std::vector<std::string> tags;
    std::string metadata;
};

static FrontMatter parseFrontMatter(const std::string& content) {
    FrontMatter fm;
    if (content.size() < 4 || content.substr(0, 3) != "---") return fm;
    auto end = content.find("---", 3);
    if (end == std::string::npos) return fm;

    std::string yaml = content.substr(3, end - 3);
    fm.metadata = "{";

    static QRegularExpression titleRe(R"(^title:\s*(.+)$)");
    static QRegularExpression tagsRe(R"(^tags:\s*\[?(.*?)\]?$)");

    QString qYaml = QString::fromStdString(yaml);
    QTextStream stream(&qYaml, QIODevice::ReadOnly);
    QString line;
    while (stream.readLineInto(&line)) {
        auto tMatch = titleRe.match(line.trimmed());
        if (tMatch.hasMatch()) {
            fm.title = tMatch.captured(1).trimmed().toStdString();
            continue;
        }
        auto tagMatch = tagsRe.match(line.trimmed());
        if (tagMatch.hasMatch()) {
            QStringList parts = tagMatch.captured(1).split(',');
            for (const auto& p : parts) {
                QString t = p.trimmed();
                if (!t.isEmpty()) fm.tags.push_back(t.toStdString());
            }
        }
    }

    fm.metadata += "}";
    return fm;
}

static std::string stripFrontMatter(const std::string& content) {
    if (content.size() < 4 || content.substr(0, 3) != "---") return content;
    auto end = content.find("---", 3);
    if (end == std::string::npos) return content;
    auto rest = content.substr(end + 3);
    auto start = rest.find_first_not_of(" \t\r\n");
    return (start == std::string::npos) ? "" : rest.substr(start);
}

static std::string buildFrontMatter(const Note& note) {
    std::string fm;
    fm += "---\n";
    fm += "title: " + note.title + "\n";
    if (!note.tags.empty()) {
        fm += "tags:\n";
        for (const auto& t : note.tags)
            fm += "  - " + t + "\n";
    }
    fm += "created_at: " + note.createdAt + "\n";
    fm += "updated_at: " + note.updatedAt + "\n";
    fm += "---\n";
    return fm;
}

// ---------------------------------------------------------------------------
// KnowledgeManager implementation
// ---------------------------------------------------------------------------

class KnowledgeManager : public IKnowledgeManager {
public:
    explicit KnowledgeManager(persistence::IDatabase* db)
        : db_(db)
    {
        rebuildFtsIfEmpty();
    }

    // ---- Note CRUD ----

    Note createNote(const CreateNoteDTO& dto) override {
        Note note;
        note.id = generateId();
        note.title = dto.title;
        note.folder = normalizeFolder(dto.folder);
        note.tags = dto.tags;
        note.metadata = dto.metadata;
        note.createdAt = now();
        note.updatedAt = note.createdAt;
        note.content = dto.content;
        std::string tagsStr = joinTags(note.tags);

        QSqlQuery q(db_->qSqlDatabase());
        q.prepare(R"(
            INSERT INTO notes (id, title, content, folder, tags, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        )");
        q.addBindValue(QString::fromStdString(note.id));
        q.addBindValue(QString::fromStdString(note.title));
        q.addBindValue(QString::fromStdString(note.content));
        q.addBindValue(QString::fromStdString(note.folder));
        q.addBindValue(QString::fromStdString(tagsStr));
        q.addBindValue(QString::fromStdString(note.metadata));
        q.addBindValue(QString::fromStdString(note.createdAt));
        q.addBindValue(QString::fromStdString(note.updatedAt));

        if (!q.exec()) {
            throw std::runtime_error("Failed to create note: " +
                q.lastError().text().toStdString());
        }

        updateWikilinks(note.id, note.content);
        updateTags(note.id, note.tags);
        return note;
    }

    Note getNote(const std::string& id) override {
        QSqlQuery q(db_->qSqlDatabase());
        q.prepare("SELECT id, title, content, folder, tags, metadata, created_at, updated_at FROM notes WHERE id = ?");
        q.addBindValue(QString::fromStdString(id));
        if (!q.exec() || !q.next()) {
            throw std::runtime_error("Note not found: " + id);
        }
        return rowToNote(q);
    }

    std::vector<Note> listNotes(const std::string& folder) override {
        std::vector<Note> result;
        QSqlQuery q(db_->qSqlDatabase());

        if (folder.empty()) {
            q.prepare("SELECT id, title, content, folder, tags, metadata, created_at, updated_at FROM notes ORDER BY updated_at DESC");
        } else {
            q.prepare("SELECT id, title, content, folder, tags, metadata, created_at, updated_at FROM notes WHERE folder = ? OR folder LIKE ? ORDER BY updated_at DESC");
            q.addBindValue(QString::fromStdString(folder));
            q.addBindValue(QString::fromStdString(folder + "/%"));
        }

        if (q.exec()) {
            while (q.next())
                result.push_back(rowToNote(q));
        }
        return result;
    }

    Note updateNote(const std::string& id, const CreateNoteDTO& dto) override {
        Note existing = getNote(id);

        std::string title = dto.title.empty() ? existing.title : dto.title;
        std::string content = dto.content.empty() ? existing.content : dto.content;
        std::string folder = dto.folder.empty() ? existing.folder : normalizeFolder(dto.folder);
        std::vector<std::string> tags = dto.tags.empty() ? existing.tags : dto.tags;
        std::string meta = dto.metadata.empty() ? existing.metadata : dto.metadata;
        std::string updatedAt = now();

        QSqlQuery q(db_->qSqlDatabase());
        q.prepare(R"(
            UPDATE notes SET title = ?, content = ?, folder = ?, tags = ?, metadata = ?, updated_at = ?
            WHERE id = ?
        )");
        q.addBindValue(QString::fromStdString(title));
        q.addBindValue(QString::fromStdString(content));
        q.addBindValue(QString::fromStdString(folder));
        q.addBindValue(QString::fromStdString(joinTags(tags)));
        q.addBindValue(QString::fromStdString(meta));
        q.addBindValue(QString::fromStdString(updatedAt));
        q.addBindValue(QString::fromStdString(id));

        if (!q.exec()) {
            throw std::runtime_error("Failed to update note: " +
                q.lastError().text().toStdString());
        }

        if (content != existing.content)
            updateWikilinks(id, content);
        updateTags(id, tags);

        return getNote(id);
    }

    bool deleteNote(const std::string& id) override {
        QSqlQuery q(db_->qSqlDatabase());
        q.prepare("DELETE FROM notes WHERE id = ?");
        q.addBindValue(QString::fromStdString(id));
        return q.exec() && q.numRowsAffected() > 0;
    }

    // ---- Folder operations ----

    std::vector<FolderEntry> getFolders() override {
        std::set<std::string> folderSet;
        QSqlQuery q(db_->qSqlDatabase());
        q.exec("SELECT DISTINCT folder FROM notes ORDER BY folder");
        while (q.next()) {
            std::string path = q.value(0).toString().toStdString();
            folderSet.insert(path);
            auto pos = path.find_last_of('/');
            while (pos != std::string::npos && pos > 0) {
                folderSet.insert(path.substr(0, pos));
                pos = path.substr(0, pos).find_last_of('/');
            }
        }

        std::vector<FolderEntry> result;
        for (const auto& f : folderSet) {
            FolderEntry fe;
            fe.path = f;
            fe.name = f.substr(f.find_last_of('/') + 1);
            if (fe.name.empty()) fe.name = "root";
            QSqlQuery cq(db_->qSqlDatabase());
            cq.prepare("SELECT COUNT(*) FROM notes WHERE folder = ? OR folder LIKE ?");
            cq.addBindValue(QString::fromStdString(f));
            cq.addBindValue(QString::fromStdString(f + "/%"));
            if (cq.exec() && cq.next())
                fe.noteCount = cq.value(0).toInt();
            result.push_back(fe);
        }
        return result;
    }

    bool moveNote(const std::string& id, const std::string& targetFolder) override {
        QSqlQuery q(db_->qSqlDatabase());
        q.prepare("UPDATE notes SET folder = ?, updated_at = ? WHERE id = ?");
        q.addBindValue(QString::fromStdString(normalizeFolder(targetFolder)));
        q.addBindValue(QString::fromStdString(now()));
        q.addBindValue(QString::fromStdString(id));
        return q.exec() && q.numRowsAffected() > 0;
    }

    // ---- Wikilinks & backlinks ----

    std::vector<Backlink> getBacklinks(const std::string& noteId) override {
        std::vector<Backlink> result;
        QSqlQuery q(db_->qSqlDatabase());
        q.prepare(R"(
            SELECT n.id, n.title, l.context
            FROM note_links l
            JOIN notes n ON n.id = l.source_id
            WHERE l.target_id = ?
            ORDER BY n.title
        )");
        q.addBindValue(QString::fromStdString(noteId));
        if (q.exec()) {
            while (q.next()) {
                Backlink bl;
                bl.noteId = q.value(0).toString().toStdString();
                bl.title = q.value(1).toString().toStdString();
                bl.context = q.value(2).toString().toStdString();
                result.push_back(std::move(bl));
            }
        }
        return result;
    }

    std::vector<std::string> parseWikilinks(const std::string& content) override {
        return extractWikilinks(content);
    }

    // ---- Graph ----

    GraphData buildGraph() override {
        GraphData graph;
        std::set<std::string> addedNodes;

        QSqlQuery nq(db_->qSqlDatabase());
        nq.exec("SELECT id, title, folder, tags FROM notes");
        while (nq.next()) {
            GraphNode node;
            node.id = nq.value(0).toString().toStdString();
            node.label = nq.value(1).toString().toStdString();
            node.folder = nq.value(2).toString().toStdString();
            auto tagsStr = nq.value(3).toString().toStdString();
            if (!tagsStr.empty()) {
                QStringList parts = QString::fromStdString(tagsStr).split(',', Qt::SkipEmptyParts);
                for (const auto& p : parts)
                    node.tags.push_back(p.trimmed().toStdString());
            }

            QSqlQuery lcq(db_->qSqlDatabase());
            lcq.prepare("SELECT COUNT(*) FROM note_links WHERE source_id = ? OR target_id = ?");
            lcq.addBindValue(QString::fromStdString(node.id));
            lcq.addBindValue(QString::fromStdString(node.id));
            if (lcq.exec() && lcq.next())
                node.linkCount = lcq.value(0).toInt();

            graph.nodes.push_back(std::move(node));
            addedNodes.insert(graph.nodes.back().id);
        }

        QSqlQuery eq(db_->qSqlDatabase());
        eq.exec("SELECT source_id, target_id, link_type FROM note_links");
        while (eq.next()) {
            GraphEdge edge;
            edge.source = eq.value(0).toString().toStdString();
            edge.target = eq.value(1).toString().toStdString();
            edge.linkType = eq.value(2).toString().toStdString();
            graph.edges.push_back(std::move(edge));
        }

        return graph;
    }

    // ---- Import/Export ----

    Note importMd(const std::string& filePath) override {
        QFile file(QString::fromStdString(filePath));
        if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
            throw std::runtime_error("Cannot open file: " + filePath);
        }

        QString content = file.readAll();
        file.close();
        std::string raw = content.toStdString();

        auto fm = parseFrontMatter(raw);
        std::string body = stripFrontMatter(raw);

        QFileInfo fi(file);
        CreateNoteDTO dto;
        dto.title = fm.title.empty() ? fi.baseName().toStdString() : fm.title;
        dto.content = body;
        dto.tags = fm.tags;

        return createNote(dto);
    }

    bool exportMd(const std::string& noteId, const std::string& outputPath) override {
        auto note = getNote(noteId);
        std::string fullContent = buildFrontMatter(note) + note.content;

        QFile file(QString::fromStdString(outputPath));
        if (!file.open(QIODevice::WriteOnly | QIODevice::Text)) {
            return false;
        }
        QTextStream out(&file);
        out << QString::fromStdString(fullContent);
        file.close();
        return true;
    }

    // ---- Search ----

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
        q.addBindValue(QString::fromStdString(escapeFtsQuery(query)));

        if (q.exec()) {
            while (q.next()) {
                SearchResult sr;
                sr.id = q.value(0).toString().toStdString();
                sr.title = q.value(1).toString().toStdString();
                sr.snippet = q.value(2).toString().toStdString();
                sr.score = q.value(3).toDouble();
                results.push_back(std::move(sr));
            }
        }

        return results;
    }

private:
    persistence::IDatabase* db_;

    void rebuildFtsIfEmpty() {
        QSqlQuery cq(db_->qSqlDatabase());
        cq.exec("SELECT COUNT(*) FROM notes_fts");
        if (cq.next() && cq.value(0).toInt() == 0) {
            QSqlQuery q(db_->qSqlDatabase());
            q.exec("INSERT INTO notes_fts(notes_fts, rowid, title, content, tags) SELECT rowid, title, content, tags FROM notes");
        }
    }

    Note rowToNote(const QSqlQuery& q) {
        Note note;
        note.id = q.value("id").toString().toStdString();
        note.title = q.value("title").toString().toStdString();
        note.content = q.value("content").toString().toStdString();
        note.folder = q.value("folder").toString().toStdString();
        note.createdAt = q.value("created_at").toString().toStdString();
        note.updatedAt = q.value("updated_at").toString().toStdString();
        note.metadata = q.value("metadata").toString().toStdString();

        std::string tagsStr = q.value("tags").toString().toStdString();
        if (!tagsStr.empty()) {
            QStringList parts = QString::fromStdString(tagsStr).split(',', Qt::SkipEmptyParts);
            for (const auto& p : parts)
                note.tags.push_back(p.trimmed().toStdString());
        }

        return note;
    }

    void updateWikilinks(const std::string& noteId, const std::string& content) {
        auto links = extractWikilinks(content);

        QSqlQuery delQ(db_->qSqlDatabase());
        delQ.prepare("DELETE FROM note_links WHERE source_id = ?");
        delQ.addBindValue(QString::fromStdString(noteId));
        delQ.exec();

        for (const auto& linkTitle : links) {
            QSqlQuery findQ(db_->qSqlDatabase());
            findQ.prepare("SELECT id FROM notes WHERE title = ?");
            findQ.addBindValue(QString::fromStdString(linkTitle));
            std::string targetId;
            if (findQ.exec() && findQ.next()) {
                targetId = findQ.value(0).toString().toStdString();
            } else {
                CreateNoteDTO placeholder;
                placeholder.title = linkTitle;
                placeholder.content = "_Broken link_";
                auto targetNote = createNote(placeholder);
                targetId = targetNote.id;
            }

            std::string ctx = extractContextSnippet(content, linkTitle);

            QSqlQuery insQ(db_->qSqlDatabase());
            insQ.prepare("INSERT OR IGNORE INTO note_links (source_id, target_id, link_type, context) VALUES (?, ?, 'wikilink', ?)");
            insQ.addBindValue(QString::fromStdString(noteId));
            insQ.addBindValue(QString::fromStdString(targetId));
            insQ.addBindValue(QString::fromStdString(ctx));
            insQ.exec();
        }
    }

    void updateTags(const std::string& noteId, const std::vector<std::string>& tags) {
        QSqlQuery delQ(db_->qSqlDatabase());
        delQ.prepare("DELETE FROM note_tags WHERE note_id = ?");
        delQ.addBindValue(QString::fromStdString(noteId));
        delQ.exec();

        for (const auto& tag : tags) {
            if (tag.empty()) continue;
            QSqlQuery insQ(db_->qSqlDatabase());
            insQ.prepare("INSERT OR IGNORE INTO note_tags (note_id, tag) VALUES (?, ?)");
            insQ.addBindValue(QString::fromStdString(noteId));
            insQ.addBindValue(QString::fromStdString(tag));
            insQ.exec();
        }
    }

    static std::string generateId() {
        static const char hex[] = "0123456789abcdef";
        std::string id(32, '0');
        for (int i = 0; i < 32; ++i) {
            id[i] = hex[rand() % 16];
        }
        id.insert(8, 1, '-');
        id.insert(13, 1, '-');
        id.insert(18, 1, '-');
        id.insert(23, 1, '-');
        return id;
    }

    static std::string now() {
        return QDateTime::currentDateTimeUtc().toString(Qt::ISODate).toStdString();
    }

    static std::string normalizeFolder(const std::string& folder) {
        std::string f = folder;
        if (f.empty()) f = "/";
        if (f[0] != '/') f = "/" + f;
        if (f.size() > 1 && f.back() == '/') f.pop_back();
        return f;
    }

    static std::string joinTags(const std::vector<std::string>& tags) {
        std::string result;
        for (size_t i = 0; i < tags.size(); ++i) {
            if (i > 0) result += ",";
            result += tags[i];
        }
        return result;
    }

    static std::string escapeFtsQuery(const std::string& query) {
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

IKnowledgeManager* createKnowledgeManager(persistence::IDatabase* db) {
    return new KnowledgeManager(db);
}

} // namespace jarvis::knowledge
