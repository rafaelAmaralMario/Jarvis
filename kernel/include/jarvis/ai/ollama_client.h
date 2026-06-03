#ifndef JARVIS_AI_OLLAMA_CLIENT_H
#define JARVIS_AI_OLLAMA_CLIENT_H

#include <string>
#include <vector>
#include <functional>

namespace jarvis::ai {

struct OllamaGenerateRequest {
    std::string model;
    std::string prompt;
    std::string system;
    double temperature = 0.7;
    int maxTokens = 2048;
    bool stream = false;
};

struct OllamaGenerateResponse {
    std::string response;
    bool done;
    int promptEvalCount;
    int evalCount;
    int latencyMs;
};

struct OllamaModel {
    std::string name;
    std::string modifiedAt;
    long long sizeBytes;
    std::string digest;
    std::string details;
};

class OllamaClient {
public:
    OllamaClient(const std::string& baseUrl = "http://localhost:11434");

    bool ping();
    std::vector<OllamaModel> listModels();
    bool pullModel(const std::string& name);
    bool deleteModel(const std::string& name);
    OllamaGenerateResponse generate(const OllamaGenerateRequest& req);
    bool generateStream(const OllamaGenerateRequest& req,
                        std::function<void(const std::string&)> onChunk);

private:
    std::string baseUrl_;
    std::string httpPost(const std::string& path, const std::string& body);
    std::string httpGet(const std::string& path);
    std::string httpDelete(const std::string& path);
};
    std::string name;
    std::string modifiedAt;
    long long sizeBytes;
    std::string digest;
    std::string details;
};

} // namespace jarvis::ai

#endif // JARVIS_AI_OLLAMA_CLIENT_H
