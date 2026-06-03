#include "jarvis/ai/agents_manager.h"
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QJsonDocument>
#include <QJsonArray>
#include <QDateTime>
#include <algorithm>

namespace jarvis::ai {

static std::vector<std::string> jsonToStringVec(const std::string& json) {
    std::vector<std::string> result;
    auto arr = QJsonDocument::fromJson(QByteArray::fromStdString(json)).array();
    for (const auto& v : arr) {
        result.push_back(v.toString().toStdString());
    }
    return result;
}

static std::string vecToJson(const std::vector<std::string>& vec) {
    QJsonArray arr;
    for (const auto& s : vec) {
        arr.append(QString::fromStdString(s));
    }
    return QJsonDocument(arr).toJson(QJsonDocument::Compact).toStdString();
}

static Agent rowToAgent(QSqlQuery& q) {
    Agent a;
    a.id = q.value("id").toString().toStdString();
    a.name = q.value("name").toString().toStdString();
    a.description = q.value("description").toString().toStdString();
    a.model = q.value("model").toString().toStdString();
    a.systemPrompt = q.value("system_prompt").toString().toStdString();
    a.temperature = q.value("temperature").toDouble();
    a.maxTokens = q.value("max_tokens").toInt();
    a.specialty = q.value("specialty").toString().toStdString();
    a.tools = jsonToStringVec(q.value("tools").toString().toStdString());
    a.isDefault = q.value("is_default").toBool();
    a.canOrchestrate = q.value("can_orchestrate").toBool();
    a.priority = q.value("priority").toInt();
    a.createdAt = q.value("created_at").toString().toStdString();
    a.updatedAt = q.value("updated_at").toString().toStdString();
    return a;
}

class AgentsManager : public IAgentsManager {
public:
    explicit AgentsManager(const std::string& dbPath)
        : dbPath_(dbPath)
    {
        initDb();
    }

    std::vector<Agent> listAgents() override {
        std::vector<Agent> result;
        QSqlQuery q(QSqlDatabase::database("ai-agents"));
        q.exec("SELECT * FROM agents ORDER BY priority DESC, name ASC");
        while (q.next()) {
            result.push_back(rowToAgent(q));
        }
        return result;
    }

    Agent getAgent(const std::string& id) override {
        QSqlQuery q(QSqlDatabase::database("ai-agents"));
        q.prepare("SELECT * FROM agents WHERE id = ?");
        q.addBindValue(QString::fromStdString(id));
        if (q.exec() && q.next()) {
            return rowToAgent(q);
        }
        return {};
    }

    Agent createAgent(const CreateAgentDTO& dto) override {
        QSqlQuery q(QSqlDatabase::database("ai-agents"));
        q.prepare(R"(
            INSERT INTO agents (name, description, model, system_prompt, temperature,
                                max_tokens, specialty, tools, can_orchestrate, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        )");
        q.addBindValue(QString::fromStdString(dto.name));
        q.addBindValue(QString::fromStdString(dto.description));
        q.addBindValue(QString::fromStdString(dto.model));
        q.addBindValue(QString::fromStdString(dto.systemPrompt));
        q.addBindValue(dto.temperature);
        q.addBindValue(dto.maxTokens);
        q.addBindValue(QString::fromStdString(dto.specialty));
        q.addBindValue(QString::fromStdString(vecToJson(dto.tools)));
        q.addBindValue(dto.canOrchestrate ? 1 : 0);
        q.addBindValue(dto.priority);
        if (!q.exec()) {
            throw std::runtime_error("Failed to create agent: " +
                                     q.lastError().text().toStdString());
        }

        // Fetch the newly created agent
        auto id = q.lastInsertId().toString().toStdString();
        return getAgent(id);
    }

    Agent updateAgent(const std::string& id, const CreateAgentDTO& dto) override {
        QSqlQuery q(QSqlDatabase::database("ai-agents"));
        q.prepare(R"(
            UPDATE agents SET
                name = ?, description = ?, model = ?, system_prompt = ?,
                temperature = ?, max_tokens = ?, specialty = ?, tools = ?,
                can_orchestrate = ?, priority = ?,
                updated_at = ?
            WHERE id = ?
        )");
        q.addBindValue(QString::fromStdString(dto.name));
        q.addBindValue(QString::fromStdString(dto.description));
        q.addBindValue(QString::fromStdString(dto.model));
        q.addBindValue(QString::fromStdString(dto.systemPrompt));
        q.addBindValue(dto.temperature);
        q.addBindValue(dto.maxTokens);
        q.addBindValue(QString::fromStdString(dto.specialty));
        q.addBindValue(QString::fromStdString(vecToJson(dto.tools)));
        q.addBindValue(dto.canOrchestrate ? 1 : 0);
        q.addBindValue(dto.priority);
        q.addBindValue(QDateTime::currentDateTimeUtc().toString(Qt::ISODate));
        q.addBindValue(QString::fromStdString(id));
        if (!q.exec()) {
            throw std::runtime_error("Failed to update agent: " +
                                     q.lastError().text().toStdString());
        }
        return getAgent(id);
    }

    bool deleteAgent(const std::string& id) override {
        QSqlQuery q(QSqlDatabase::database("ai-agents"));
        q.prepare("DELETE FROM agents WHERE id = ?");
        q.addBindValue(QString::fromStdString(id));
        return q.exec();
    }

    bool setDefaultAgent(const std::string& id) override {
        QSqlDatabase db = QSqlDatabase::database("ai-agents");
        db.transaction();

        QSqlQuery q(db);
        // Clear current default
        q.exec("UPDATE agents SET is_default = 0, updated_at = '" +
               QDateTime::currentDateTimeUtc().toString(Qt::ISODate) + "'");

        // Set new default
        q.prepare("UPDATE agents SET is_default = 1, updated_at = ? WHERE id = ?");
        q.addBindValue(QDateTime::currentDateTimeUtc().toString(Qt::ISODate));
        q.addBindValue(QString::fromStdString(id));
        bool ok = q.exec();

        if (ok) db.commit();
        else db.rollback();

        return ok;
    }

    Agent getDefaultAgent() override {
        QSqlQuery q(QSqlDatabase::database("ai-agents"));
        q.exec("SELECT * FROM agents WHERE is_default = 1 LIMIT 1");
        if (q.next()) {
            return rowToAgent(q);
        }
        // Fallback to first agent
        q.exec("SELECT * FROM agents LIMIT 1");
        if (q.next()) {
            return rowToAgent(q);
        }
        return {};
    }

    std::vector<Agent> getOrchestrationPool() override {
        std::vector<Agent> result;
        QSqlQuery q(QSqlDatabase::database("ai-agents"));
        q.exec("SELECT * FROM agents WHERE can_orchestrate = 1 ORDER BY priority DESC, name ASC");
        while (q.next()) {
            result.push_back(rowToAgent(q));
        }
        return result;
    }

private:
    std::string dbPath_;

    void initDb() {
        QString connName = "ai-agents";
        QSqlDatabase db;
        if (QSqlDatabase::contains(connName)) {
            db = QSqlDatabase::database(connName);
        } else {
            db = QSqlDatabase::addDatabase("QSQLITE", connName);
        }
        db.setDatabaseName(QString::fromStdString(dbPath_));
        if (!db.isOpen()) db.open();
        QSqlQuery q(db);
        q.exec(R"(
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                model TEXT NOT NULL,
                system_prompt TEXT NOT NULL DEFAULT '',
                temperature REAL NOT NULL DEFAULT 0.7,
                max_tokens INTEGER NOT NULL DEFAULT 2048,
                specialty TEXT NOT NULL DEFAULT 'general',
                tools TEXT NOT NULL DEFAULT '[]',
                is_default INTEGER NOT NULL DEFAULT 0,
                can_orchestrate INTEGER NOT NULL DEFAULT 1,
                priority INTEGER NOT NULL DEFAULT 5,
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            )
        )");
        // Seed default agents if table is empty
        q.exec("SELECT COUNT(*) AS cnt FROM agents");
        if (q.next() && q.value("cnt").toInt() == 0) {
            q.exec(R"(
                INSERT INTO agents (name, description, model, system_prompt, temperature, max_tokens, specialty, is_default, can_orchestrate, priority)
                VALUES ('Assistant Geral', 'Assistente geral para tarefas do dia a dia', 'llama3.2:3b',
                        'Voce e o JARVIS, um assistente de IA util, amigavel e preciso. Responda em portugues brasileiro. Use markdown para formatar respostas.',
                        0.7, 2048, 'general', 1, 1, 5)
            )");
            q.exec(R"(
                INSERT INTO agents (name, description, model, system_prompt, temperature, max_tokens, specialty, can_orchestrate, priority)
                VALUES ('Code Expert', 'Especialista em revisao de codigo e arquitetura', 'codellama:7b',
                        'Voce e um engenheiro de software senior especializado em C++, arquitetura limpa e design patterns. Revise codigo, sugira melhorias e explique conceitos complexos.',
                        0.2, 4096, 'code', 1, 8)
            )");
        }
    }
};

IAgentsManager* createAgentsManager(const std::string& dbPath) {
    return new AgentsManager(dbPath);
}

} // namespace jarvis::ai
