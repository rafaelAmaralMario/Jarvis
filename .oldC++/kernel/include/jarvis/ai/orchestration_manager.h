#ifndef JARVIS_AI_ORCHESTRATION_MANAGER_H
#define JARVIS_AI_ORCHESTRATION_MANAGER_H

#include <string>
#include <vector>
#include <functional>

namespace jarvis::ai {
class IModelsManager;
class IAgentsManager;

struct AgentResult {
    std::string agentName;
    std::string specialty;
    std::string model;
    std::string response;
    int tokensUsed;
    int latencyMs;
};

struct AgentTrace {
    std::string queryId;
    std::string query;
    std::string orchestratorReasoning;
    std::vector<AgentResult> agentsConsulted;
    std::string criticReview;
    std::string finalResponse;
};

struct OrchestrationConfig {
    bool enabled = true;
    std::string orchestratorModel;
    bool criticEnabled = true;
    double criticTemperature = 0.1;
    int maxAgentsPerQuery = 3;
    bool showTrace = true;
};

class IOrchestrationManager {
public:
    virtual ~IOrchestrationManager() = default;

    virtual std::string executeQuery(const std::string& query) = 0;
    virtual AgentTrace getTrace(const std::string& queryId) = 0;
    virtual OrchestrationConfig getConfig() = 0;
    virtual bool updateConfig(const OrchestrationConfig& config) = 0;

    // Callbacks for streaming
    using StreamCallback = std::function<void(const std::string& chunk)>;
    virtual void setStreamCallback(StreamCallback cb) = 0;
};

// Factory function
IOrchestrationManager* createOrchestrationManager(
    IModelsManager* models, IAgentsManager* agents, const std::string& dbPath);

} // namespace jarvis::ai

#endif // JARVIS_AI_ORCHESTRATION_MANAGER_H
