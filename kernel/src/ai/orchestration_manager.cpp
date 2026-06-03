#include "jarvis/ai/orchestration_manager.h"
#include "jarvis/ai/agents_manager.h"
#include "jarvis/ai/models_manager.h"
#include "jarvis/ai/ollama_client.h"
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QUuid>
#include <chrono>
#include <sstream>
#include <mutex>
#include <unordered_map>

namespace jarvis::ai {

class OrchestrationManager : public IOrchestrationManager {
public:
    OrchestrationManager(IModelsManager* models, IAgentsManager* agents,
                         const std::string& dbPath)
        : models_(models)
        , agents_(agents)
        , dbPath_(dbPath)
        , ollama_("http://localhost:11434")
    {
        initDb();
        loadConfig();
    }

    std::string executeQuery(const std::string& query) override {
        if (!config_.enabled || !streamCb_) {
            // Single agent mode
            return executeSingleAgent(query);
        }

        // Multi-agent mode
        auto queryId = QUuid::createUuid().toString(QUuid::Id128).toStdString();
        AgentTrace trace;
        trace.queryId = queryId;
        trace.query = query;

        emitChunk("\n");
        emitChunk("🧠 **Orquestrador**: Analisando sua pergunta...\n\n");

        // Step 1: Orchestrator decides which agents to use
        auto plan = orchestratorPlan(query);
        trace.orchestratorReasoning = plan.reasoning;

        emitChunk(plan.reasoning + "\n\n---\n\n");

        // Step 2: Execute specialist agents
        for (const auto& agentName : plan.agentNames) {
            auto agent = findAgent(agentName);
            if (agent.id.empty()) continue;

            emitChunk("**" + agentIcon(agent.specialty) + " " + agent.name + "**: trabalhando...\n\n");

            auto t1 = std::chrono::steady_clock::now();
            auto response = executeAgent(agent, query);
            auto t2 = std::chrono::steady_clock::now();

            AgentResult result;
            result.agentName = agent.name;
            result.specialty = agent.specialty;
            result.model = agent.model;
            result.response = response;
            result.tokensUsed = 0; // Would come from Ollama response
            result.latencyMs = std::chrono::duration_cast<std::chrono::milliseconds>(t2 - t1).count();
            trace.agentsConsulted.push_back(result);

            emitChunk(response + "\n\n---\n\n");
        }

        // Step 3: Critic review
        if (config_.criticEnabled) {
            emitChunk("🧠 **Critic Agent**: Revisando resposta...\n\n");
            auto review = criticReview(query, trace);
            trace.criticReview = review;
            emitChunk(review + "\n\n");
        }

        // Step 4: Consolidate final response
        auto finalResponse = consolidateResponse(query, trace);

        trace.finalResponse = finalResponse;
        {
            std::lock_guard<std::mutex> lock(mutex_);
            traces_[queryId] = trace;
        }

        return finalResponse;
    }

    AgentTrace getTrace(const std::string& queryId) override {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = traces_.find(queryId);
        if (it != traces_.end()) return it->second;
        return {};
    }

    OrchestrationConfig getConfig() override {
        return config_;
    }

    bool updateConfig(const OrchestrationConfig& config) override {
        config_ = config;
        QSqlQuery q(QSqlDatabase::database("ai-orchestration"));
        q.prepare(R"(
            UPDATE orchestration_config SET
                enabled = ?, orchestrator_model = ?, critic_enabled = ?,
                critic_temperature = ?, max_agents_per_query = ?,
                show_trace = ?, updated_at = ?
            WHERE id = 1
        )");
        q.addBindValue(config_.enabled ? 1 : 0);
        q.addBindValue(QString::fromStdString(config_.orchestratorModel));
        q.addBindValue(config_.criticEnabled ? 1 : 0);
        q.addBindValue(config_.criticTemperature);
        q.addBindValue(config_.maxAgentsPerQuery);
        q.addBindValue(config_.showTrace ? 1 : 0);
        q.addBindValue(QDateTime::currentDateTimeUtc().toString(Qt::ISODate));
        return q.exec();
    }

    void setStreamCallback(StreamCallback cb) override {
        streamCb_ = std::move(cb);
    }

private:
    IModelsManager* models_;
    IAgentsManager* agents_;
    std::string dbPath_;
    OllamaClient ollama_;
    OrchestrationConfig config_;
    StreamCallback streamCb_;
    std::mutex mutex_;
    std::unordered_map<std::string, AgentTrace> traces_;

    struct OrchestratorPlan {
        std::string reasoning;
        std::vector<std::string> agentNames;
    };

    void initDb() {
        QString connName = "ai-orchestration";
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
            CREATE TABLE IF NOT EXISTS orchestration_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                enabled INTEGER NOT NULL DEFAULT 1,
                orchestrator_model TEXT NOT NULL DEFAULT '',
                critic_enabled INTEGER NOT NULL DEFAULT 1,
                critic_temperature REAL NOT NULL DEFAULT 0.1,
                max_agents_per_query INTEGER NOT NULL DEFAULT 3,
                show_trace INTEGER NOT NULL DEFAULT 1,
                updated_at TEXT
            )
        )");
        q.exec("INSERT OR IGNORE INTO orchestration_config (id, enabled) VALUES (1, 1)");
    }

    void loadConfig() {
        QSqlQuery q(QSqlDatabase::database("ai-orchestration"));
        if (q.exec("SELECT * FROM orchestration_config WHERE id = 1") && q.next()) {
            config_.enabled = q.value("enabled").toBool();
            config_.orchestratorModel = q.value("orchestrator_model").toString().toStdString();
            config_.criticEnabled = q.value("critic_enabled").toBool();
            config_.criticTemperature = q.value("critic_temperature").toDouble();
            config_.maxAgentsPerQuery = q.value("max_agents_per_query").toInt();
            config_.showTrace = q.value("show_trace").toBool();
        }
    }

    std::string executeSingleAgent(const std::string& query) {
        auto agent = agents_->getDefaultAgent();
        if (agent.id.empty()) return "No agent configured.";

        return executeAgent(agent, query);
    }

    std::string executeAgent(const Agent& agent, const std::string& query) {
        OllamaGenerateRequest req;
        req.model = agent.model;
        req.prompt = query;
        req.system = agent.systemPrompt + "\n\nResponda em markdown.";
        req.temperature = agent.temperature;
        req.maxTokens = agent.maxTokens;
        req.stream = false;

        auto result = ollama_.generate(req);
        return result.response;
    }

    OrchestratorPlan orchestratorPlan(const std::string& query) {
        OrchestratorPlan plan;
        auto pool = agents_->getOrchestrationPool();

        if (pool.empty()) {
            plan.reasoning = "Nenhum agent especializado disponivel. Usando assistente padrao.";
            auto def = agents_->getDefaultAgent();
            if (!def.id.empty()) plan.agentNames.push_back(def.name);
            return plan;
        }

        // Build a prompt for the orchestrator to decide routing
        std::string agentList;
        for (size_t i = 0; i < pool.size() && i < 5; i++) {
            agentList += "- " + pool[i].name + " (" + pool[i].specialty + "): " +
                         pool[i].description + "\n";
        }

        std::string routingPrompt =
            "You are an orchestrator. Analyze this user query and decide which specialist "
            "agent(s) to route it to. Available agents:\n" + agentList +
            "\nUser query: " + query +
            "\n\nRespond with ONLY a comma-separated list of agent names that should handle this. "
            "If none match, respond with 'default'.";

        OllamaGenerateRequest req;
        req.model = config_.orchestratorModel.empty() ? pool[0].model : config_.orchestratorModel;
        req.prompt = routingPrompt;
        req.temperature = 0.1;
        req.maxTokens = 256;
        req.stream = false;

        try {
            auto result = ollama_.generate(req);
            auto response = result.response;

            // Parse comma-separated agent names
            std::stringstream ss(response);
            std::string name;
            while (std::getline(ss, name, ',')) {
                name.erase(0, name.find_first_not_of(" \n\r\t"));
                name.erase(name.find_last_not_of(" \n\r\t") + 1);
                if (!name.empty()) {
                    plan.agentNames.push_back(name);
                }
            }

            plan.reasoning = "📋 **Roteamento**: " + response;
        } catch (const std::exception& e) {
            plan.reasoning = "⚠️ Orchestrator error: " + std::string(e.what()) +
                             ". Usando agente padrao.";
            auto def = agents_->getDefaultAgent();
            if (!def.id.empty()) plan.agentNames.push_back(def.name);
        }

        if (plan.agentNames.empty()) {
            plan.agentNames.push_back("default");
        }

        return plan;
    }

    std::string criticReview(const std::string& query, const AgentTrace& trace) {
        // Build consolidated response for review
        std::string combined;
        for (const auto& r : trace.agentsConsulted) {
            combined += "Agent: " + r.agentName + "\n" + r.response + "\n\n";
        }

        std::string criticPrompt =
            "You are a critic agent. Review this response for:\n"
            "1. Does it fully answer the user's query?\n"
            "2. Is the information accurate?\n"
            "3. Is it well-formatted?\n"
            "4. Any improvements needed?\n\n"
            "User query: " + query + "\n\n"
            "Response to review:\n" + combined + "\n\n"
            "If approved, start with '✅ Aprovado'. If changes needed, start with '🔄 Refinar'.";

        OllamaGenerateRequest req;
        auto pool = agents_->getOrchestrationPool();
        req.model = pool.empty() ? "llama3.2:3b" : pool[0].model;
        req.prompt = criticPrompt;
        req.temperature = config_.criticTemperature;
        req.maxTokens = 512;
        req.stream = false;

        try {
            auto result = ollama_.generate(req);
            return result.response;
        } catch (...) {
            return "✅ Aprovado (critico indisponivel)";
        }
    }

    std::string consolidateResponse(const std::string& query, const AgentTrace& trace) {
        // For now, return the last agent's response or combine
        if (trace.agentsConsulted.empty()) return "Nenhuma resposta gerada.";
        return trace.agentsConsulted.back().response;
    }

    Agent findAgent(const std::string& name) {
        auto agents = agents_->listAgents();
        for (const auto& a : agents) {
            if (a.name == name || a.id == name) return a;
        }
        // Fallback to default
        return agents_->getDefaultAgent();
    }

    void emitChunk(const std::string& chunk) {
        if (streamCb_) streamCb_(chunk);
    }

    static std::string agentIcon(const std::string& specialty) {
        if (specialty == "code") return "\xf0\x9f\x92\xbb";
        if (specialty == "reasoning") return "\xf0\x9f\xa7\xa0";
        if (specialty == "embedding") return "\xf0\x9f\x93\x90";
        if (specialty == "chat") return "\xf0\x9f\x92\xac";
        return "\xf0\x9f\xa4\x96";
    }
};

IOrchestrationManager* createOrchestrationManager(
    IModelsManager* models, IAgentsManager* agents, const std::string& dbPath)
{
    return new OrchestrationManager(models, agents, dbPath);
}

} // namespace jarvis::ai
