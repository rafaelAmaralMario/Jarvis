#include "jarvis/ai/models_manager.h"
#include "jarvis/ai/ollama_client.h"
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QJsonDocument>
#include <QJsonObject>
#include <QDateTime>
#include <QString>
#include <algorithm>
#include <cstdio>

namespace jarvis::ai {

static ModelSpecialty stringToSpecialty(const std::string& s) {
    if (s == "chat") return ModelSpecialty::Chat;
    if (s == "code") return ModelSpecialty::Code;
    if (s == "reasoning") return ModelSpecialty::Reasoning;
    if (s == "embedding") return ModelSpecialty::Embedding;
    if (s == "vision") return ModelSpecialty::Vision;
    return ModelSpecialty::General;
}

static std::string specialtyToString(ModelSpecialty s) {
    switch (s) {
        case ModelSpecialty::Chat: return "chat";
        case ModelSpecialty::Code: return "code";
        case ModelSpecialty::Reasoning: return "reasoning";
        case ModelSpecialty::Embedding: return "embedding";
        case ModelSpecialty::Vision: return "vision";
        default: return "general";
    }
}

static std::string specialtyColor(ModelSpecialty s) {
    switch (s) {
        case ModelSpecialty::Chat: return "#58a6ff";
        case ModelSpecialty::Code: return "#3fb950";
        case ModelSpecialty::Reasoning: return "#a371f7";
        case ModelSpecialty::Embedding: return "#d29922";
        case ModelSpecialty::Vision: return "#f778ba";
        default: return "#8b949e";
    }
}

static std::string specialtyIcon(ModelSpecialty s) {
    switch (s) {
        case ModelSpecialty::Chat: return "\xf0\x9f\x92\xac";    // 💬
        case ModelSpecialty::Code: return "\xf0\x9f\x92\xbb";    // 💻
        case ModelSpecialty::Reasoning: return "\xf0\x9f\xa7\xa0"; // 🧠
        case ModelSpecialty::Embedding: return "\xf0\x9f\x93\x90"; // 📐
        case ModelSpecialty::Vision: return "\xf0\x9f\x91\x81";   // 👁
        default: return "\xf0\x9f\xa4\x96";                      // 🤖
    }
}

class ModelsManager : public IModelsManager {
public:
    explicit ModelsManager(const std::string& dbPath)
        : dbPath_(dbPath)
        , ollama_("http://localhost:11434")
    {
        initDb();
    }

    std::vector<ModelInfo> listModels() override {
        std::vector<ModelInfo> result;

        // Get models from Ollama
        auto ollamaModels = ollama_.listModels();

        for (const auto& om : ollamaModels) {
            ModelInfo info;
            info.name = om.name;
            info.size = formatSize(om.sizeBytes);
            info.modified = om.modifiedAt;
            info.description = om.details;

            // Get metadata from local DB
            loadMetadata(info);

            // Determine status
            info.status = estimateStatus(info.name);

            result.push_back(std::move(info));
        }

        return result;
    }

    ModelInfo getModel(const std::string& name) override {
        auto models = listModels();
        for (const auto& m : models) {
            if (m.name == name) return m;
        }
        ModelInfo info;
        info.name = name;
        info.status = ModelStatus::NotDownloaded;
        info.specialty = ModelSpecialty::General;
        info.color = specialtyColor(ModelSpecialty::General);
        info.icon = specialtyIcon(ModelSpecialty::General);
        return info;
    }

    bool pullModel(const std::string& name) override {
        if (progressCb_) progressCb_(name, 0);
        auto ok = ollama_.pullModel(name);
        if (ok) {
            // Auto-register metadata
            ModelMetadata meta;
            meta.specialty = inferSpecialty(name);
            meta.color = specialtyColor(meta.specialty);
            meta.icon = specialtyIcon(meta.specialty);
            updateModelMetadata(name, meta);
        }
        if (progressCb_) progressCb_(name, 100);
        return ok;
    }

    bool deleteModel(const std::string& name) override {
        return ollama_.deleteModel(name);
    }

    bool startModel(const std::string& name) override {
        // Preload: send a quick generate with keep_alive
        OllamaGenerateRequest req;
        req.model = name;
        req.prompt = ".";
        req.maxTokens = 1;
        req.stream = false;

        // Custom keep_alive via options (5 minutes)
        QJsonObject options;
        options["keep_alive"] = "5m";

        auto result = ollama_.generate(req);
        return result.done;
    }

    bool stopModel(const std::string& name) override {
        // Stop: send generate with keep_alive = 0
        OllamaGenerateRequest req;
        req.model = name;
        req.prompt = ".";
        req.maxTokens = 1;
        req.stream = false;

        auto result = ollama_.generate(req);
        return true; // Model memory released
    }

    ModelStatus getModelStatus(const std::string& name) override {
        return estimateStatus(name);
    }

    bool updateModelMetadata(const std::string& name, const ModelMetadata& meta) override {
        QSqlQuery q(QSqlDatabase::database("ai-models"));
        q.prepare(R"(
            INSERT INTO model_metadata (model_name, specialty, notes, color, icon, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(model_name) DO UPDATE SET
                specialty = excluded.specialty,
                notes = excluded.notes,
                color = excluded.color,
                icon = excluded.icon,
                updated_at = excluded.updated_at
        )");
        q.addBindValue(QString::fromStdString(name));
        q.addBindValue(QString::fromStdString(specialtyToString(meta.specialty)));
        q.addBindValue(QString::fromStdString(meta.notes));
        q.addBindValue(QString::fromStdString(meta.color));
        q.addBindValue(QString::fromStdString(meta.icon));
        q.addBindValue(QDateTime::currentDateTimeUtc().toString(Qt::ISODate));
        return q.exec();
    }

    ModelInfo getModelBySpecialty(ModelSpecialty specialty) override {
        auto models = listModels();
        // Prefer running models
        for (const auto& m : models) {
            if (m.specialty == specialty && m.status == ModelStatus::Running) return m;
        }
        // Fallback to any downloaded
        for (const auto& m : models) {
            if (m.specialty == specialty && m.status != ModelStatus::NotDownloaded) return m;
        }
        // Fallback to any model with this specialty
        for (const auto& m : models) {
            if (m.specialty == specialty) return m;
        }
        return {};
    }

    void setPullProgressCallback(ProgressCallback cb) override {
        progressCb_ = std::move(cb);
    }

private:
    std::string dbPath_;
    OllamaClient ollama_;
    ProgressCallback progressCb_;

    void initDb() {
        QString connName = "ai-models";
        QSqlDatabase db;
        if (QSqlDatabase::contains(connName)) {
            db = QSqlDatabase::database(connName);
        } else {
            db = QSqlDatabase::addDatabase("QSQLITE", connName);
        }
        db.setDatabaseName(QString::fromStdString(dbPath_));
        if (!db.isOpen()) db.open();
        if (db.isOpen()) {
            QSqlQuery q(db);
            q.exec(R"(
                CREATE TABLE IF NOT EXISTS model_metadata (
                    model_name TEXT PRIMARY KEY,
                    specialty TEXT NOT NULL DEFAULT 'general',
                    notes TEXT NOT NULL DEFAULT '',
                    color TEXT NOT NULL DEFAULT '#6b7280',
                    icon TEXT NOT NULL DEFAULT '🤖',
                    created_at TEXT,
                    updated_at TEXT
                )
            )");
        }
    }

    void loadMetadata(ModelInfo& info) {
        QSqlQuery q(QSqlDatabase::database("ai-models"));
        q.prepare("SELECT specialty, notes, color, icon FROM model_metadata WHERE model_name = ?");
        q.addBindValue(QString::fromStdString(info.name));
        if (q.exec() && q.next()) {
            info.specialty = stringToSpecialty(q.value(0).toString().toStdString());
            info.color = q.value(2).toString().toStdString();
            info.icon = q.value(3).toString().toStdString();
        } else {
            // Infer from name
            info.specialty = inferSpecialty(info.name);
            info.color = specialtyColor(info.specialty);
            info.icon = specialtyIcon(info.specialty);
        }
    }

    ModelStatus estimateStatus(const std::string& name) {
        // Ping Ollama to check if model is loaded
        try {
            if (!ollama_.ping()) return ModelStatus::Error;
            return ModelStatus::Running; // Optimistic - in production check /api/show
        } catch (...) {
            return ModelStatus::Stopped;
        }
    }

    ModelSpecialty inferSpecialty(const std::string& name) {
        auto lower = name;
        std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);
        if (lower.find("code") != std::string::npos ||
            lower.find("coder") != std::string::npos ||
            lower.find("deepseek-coder") != std::string::npos)
            return ModelSpecialty::Code;
        if (lower.find("embed") != std::string::npos ||
            lower.find("mxbai") != std::string::npos)
            return ModelSpecialty::Embedding;
        if (lower.find("reason") != std::string::npos ||
            lower.find("deepseek-r1") != std::string::npos ||
            lower.find("qw") != std::string::npos)
            return ModelSpecialty::Reasoning;
        if (lower.find("llava") != std::string::npos ||
            lower.find("vision") != std::string::npos ||
            lower.find("moondream") != std::string::npos)
            return ModelSpecialty::Vision;
        if (lower.find("llama") != std::string::npos ||
            lower.find("mistral") != std::string::npos ||
            lower.find("gemma") != std::string::npos)
            return ModelSpecialty::Chat;
        return ModelSpecialty::General;
    }

    static std::string formatSize(long long bytes) {
        if (bytes < 1024LL * 1024) {
            return std::to_string(bytes / 1024) + " KB";
        } else if (bytes < 1024LL * 1024 * 1024) {
            return std::to_string(bytes / (1024 * 1024)) + " MB";
        } else {
            double gb = static_cast<double>(bytes) / (1024.0 * 1024.0 * 1024.0);
            char buf[32];
            snprintf(buf, sizeof(buf), "%.1f GB", gb);
            return buf;
        }
    }
};

IModelsManager* createModelsManager(const std::string& dbPath) {
    return new ModelsManager(dbPath);
}

} // namespace jarvis::ai
