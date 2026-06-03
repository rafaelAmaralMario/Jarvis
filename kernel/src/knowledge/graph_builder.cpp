#include "jarvis/knowledge/graph_builder.h"
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QString>
#include <set>

namespace jarvis::knowledge {

class GraphBuilder : public IGraphBuilder {
public:
    explicit GraphBuilder(const std::string& dbPath)
        : dbPath_(dbPath)
    {
        initDb();
    }

    GraphData build() override {
        GraphData graph;
        std::set<std::string> addedNodes;

        QSqlQuery nq(QSqlDatabase::database("knowledge-graph"));
        nq.exec("SELECT id, title, folder, tags FROM notes ORDER BY title");
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

            // Count links for this node
            QSqlQuery lcq(QSqlDatabase::database("knowledge-graph"));
            lcq.prepare("SELECT COUNT(*) FROM note_links WHERE source_id = ? OR target_id = ?");
            lcq.addBindValue(QString::fromStdString(node.id));
            lcq.addBindValue(QString::fromStdString(node.id));
            if (lcq.exec() && lcq.next())
                node.linkCount = lcq.value(0).toInt();

            graph.nodes.push_back(std::move(node));
            addedNodes.insert(graph.nodes.back().id);
        }

        QSqlQuery eq(QSqlDatabase::database("knowledge-graph"));
        eq.exec("SELECT source_id, target_id, link_type FROM note_links");
        while (eq.next()) {
            GraphEdge edge;
            edge.source = eq.value(0).toString().toStdString();
            edge.target = eq.value(1).toString().toStdString();
            edge.linkType = eq.value(2).toString().toStdString();

            // Only include edges where both nodes exist
            if (addedNodes.count(edge.source) && addedNodes.count(edge.target))
                graph.edges.push_back(std::move(edge));
        }

        return graph;
    }

    std::string buildJson() override {
        auto graph = build();

        QJsonObject root;
        QJsonArray nodesArr;
        for (const auto& n : graph.nodes) {
            QJsonObject nodeObj;
            nodeObj["id"] = QString::fromStdString(n.id);
            nodeObj["label"] = QString::fromStdString(n.label);
            nodeObj["folder"] = QString::fromStdString(n.folder);
            QJsonArray tagsArr;
            for (const auto& t : n.tags)
                tagsArr.append(QString::fromStdString(t));
            nodeObj["tags"] = tagsArr;
            nodeObj["linkCount"] = n.linkCount;
            nodesArr.append(nodeObj);
        }
        root["nodes"] = nodesArr;

        QJsonArray edgesArr;
        for (const auto& e : graph.edges) {
            QJsonObject edgeObj;
            edgeObj["source"] = QString::fromStdString(e.source);
            edgeObj["target"] = QString::fromStdString(e.target);
            edgeObj["linkType"] = QString::fromStdString(e.linkType);
            edgesArr.append(edgeObj);
        }
        root["edges"] = edgesArr;

        return QJsonDocument(root).toJson(QJsonDocument::Compact).toStdString();
    }

private:
    std::string dbPath_;

    void initDb() {
        QString connName = "knowledge-graph";
        QSqlDatabase db;
        if (QSqlDatabase::contains(connName)) {
            db = QSqlDatabase::database(connName);
        } else {
            db = QSqlDatabase::addDatabase("QSQLITE", connName);
        }
        db.setDatabaseName(QString::fromStdString(dbPath_));
        if (!db.isOpen()) db.open();
    }
};

IGraphBuilder* createGraphBuilder(const std::string& dbPath) {
    return new GraphBuilder(dbPath);
}

} // namespace jarvis::knowledge
