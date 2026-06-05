#ifndef JARVIS_AI_MODELS_MANAGER_H
#define JARVIS_AI_MODELS_MANAGER_H

#include <string>
#include <vector>
#include <functional>

namespace jarvis::ai {

enum class ModelStatus {
    NotDownloaded,
    Downloaded,
    Running,
    Stopped,
    Error
};

enum class ModelSpecialty {
    Chat,
    Code,
    Reasoning,
    Embedding,
    Vision,
    General
};

struct ModelInfo {
    std::string name;           // "llama3.2:3b"
    ModelSpecialty specialty = ModelSpecialty::General;
    ModelStatus status = ModelStatus::NotDownloaded;
    std::string size;           // "2.0 GB"
    std::string modified;       // ISO date
    std::string description;
    std::string color;          // hex
    std::string icon;           // emoji
    std::string errorMessage;
};

struct ModelMetadata {
    ModelSpecialty specialty = ModelSpecialty::General;
    std::string notes;
    std::string color;
    std::string icon;
};

class IModelsManager {
public:
    virtual ~IModelsManager() = default;

    virtual std::vector<ModelInfo> listModels() = 0;
    virtual ModelInfo getModel(const std::string& name) = 0;
    virtual bool pullModel(const std::string& name) = 0;
    virtual bool deleteModel(const std::string& name) = 0;
    virtual bool startModel(const std::string& name) = 0;
    virtual bool stopModel(const std::string& name) = 0;
    virtual ModelStatus getModelStatus(const std::string& name) = 0;
    virtual bool updateModelMetadata(const std::string& name, const ModelMetadata& meta) = 0;
    virtual ModelInfo getModelBySpecialty(ModelSpecialty specialty) = 0;

    using ProgressCallback = std::function<void(const std::string& model, int percent)>;
    virtual void setPullProgressCallback(ProgressCallback cb) = 0;
};

// Factory function
IModelsManager* createModelsManager(const std::string& dbPath);

} // namespace jarvis::ai

#endif // JARVIS_AI_MODELS_MANAGER_H
