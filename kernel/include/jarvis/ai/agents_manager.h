#ifndef JARVIS_AI_AGENTS_MANAGER_H
#define JARVIS_AI_AGENTS_MANAGER_H

#include <string>
#include <vector>

namespace jarvis::ai {

struct Agent {
    std::string id;
    std::string name;
    std::string description;
    std::string model;
    std::string systemPrompt;
    double temperature;
    int maxTokens;
    std::string specialty;
    std::vector<std::string> tools;
    bool isDefault;
    bool canOrchestrate;
    int priority;
    std::string createdAt;
    std::string updatedAt;
};

struct CreateAgentDTO {
    std::string name;
    std::string description;
    std::string model;
    std::string systemPrompt;
    double temperature = 0.7;
    int maxTokens = 2048;
    std::string specialty = "general";
    std::vector<std::string> tools;
    bool canOrchestrate = true;
    int priority = 5;
};

class IAgentsManager {
public:
    virtual ~IAgentsManager() = default;

    virtual std::vector<Agent> listAgents() = 0;
    virtual Agent getAgent(const std::string& id) = 0;
    virtual Agent createAgent(const CreateAgentDTO& dto) = 0;
    virtual Agent updateAgent(const std::string& id, const CreateAgentDTO& dto) = 0;
    virtual bool deleteAgent(const std::string& id) = 0;
    virtual bool setDefaultAgent(const std::string& id) = 0;
    virtual Agent getDefaultAgent() = 0;
    virtual std::vector<Agent> getOrchestrationPool() = 0;
};

// Factory function
IAgentsManager* createAgentsManager(const std::string& dbPath);

} // namespace jarvis::ai

#endif // JARVIS_AI_AGENTS_MANAGER_H
