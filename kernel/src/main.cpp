#include <QApplication>
#include <QWebEngineView>
#include <QWebChannel>
#include <QDir>
#include <QFile>
#include <QTimer>
#include <QDebug>
#include <QJsonArray>
#include <QJsonObject>
#include <QJsonDocument>
#include <QVariantMap>
#include <QStandardPaths>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>

#include "jarvis/core/module_loader.h"
#include "jarvis/core/service_locator.h"
#include "jarvis/core/permission_manager.h"
#include "jarvis/bridge/web_channel.h"
#include "jarvis/ai/models_manager.h"
#include "jarvis/ai/agents_manager.h"
#include "jarvis/ai/orchestration_manager.h"
#include "jarvis/knowledge/knowledge_manager.h"
#include "jarvis/workspace/workspace_manager.h"

using namespace jarvis::core;
using namespace jarvis::bridge;
using namespace jarvis::ai;
using namespace jarvis::knowledge;
using namespace jarvis::workspace;

// ---------------------------------------------------------------------------
// JSON serialization helpers
// ---------------------------------------------------------------------------

static QJsonObject modelInfoToJson(const ModelInfo& m) {
    QJsonObject obj;
    obj["name"] = QString::fromStdString(m.name);
    switch (m.specialty) {
        case ModelSpecialty::Chat:       obj["specialty"] = "chat"; break;
        case ModelSpecialty::Code:       obj["specialty"] = "code"; break;
        case ModelSpecialty::Reasoning:  obj["specialty"] = "reasoning"; break;
        case ModelSpecialty::Embedding:  obj["specialty"] = "embedding"; break;
        case ModelSpecialty::Vision:     obj["specialty"] = "vision"; break;
        default:                         obj["specialty"] = "general"; break;
    }
    switch (m.status) {
        case ModelStatus::Running:      obj["status"] = "running"; break;
        case ModelStatus::Stopped:
        case ModelStatus::Downloaded:   obj["status"] = "stopped"; break;
        case ModelStatus::NotDownloaded: obj["status"] = "not_downloaded"; break;
        case ModelStatus::Error:        obj["status"] = "error"; break;
        default:                        obj["status"] = "stopped"; break;
    }
    obj["size"] = QString::fromStdString(m.size);
    obj["modified"] = QString::fromStdString(m.modified);
    obj["description"] = QString::fromStdString(m.description);
    obj["color"] = QString::fromStdString(m.color);
    obj["icon"] = QString::fromStdString(m.icon);
    if (!m.errorMessage.empty())
        obj["errorMessage"] = QString::fromStdString(m.errorMessage);
    return obj;
}

static QJsonObject agentToJson(const Agent& a) {
    QJsonObject obj;
    obj["id"] = QString::fromStdString(a.id);
    obj["name"] = QString::fromStdString(a.name);
    obj["description"] = QString::fromStdString(a.description);
    obj["model"] = QString::fromStdString(a.model);
    obj["systemPrompt"] = QString::fromStdString(a.systemPrompt);
    obj["temperature"] = a.temperature;
    obj["maxTokens"] = a.maxTokens;
    obj["specialty"] = QString::fromStdString(a.specialty);
    QJsonArray tools;
    for (const auto& t : a.tools)
        tools.append(QString::fromStdString(t));
    obj["tools"] = tools;
    obj["isDefault"] = a.isDefault;
    obj["canOrchestrate"] = a.canOrchestrate;
    obj["priority"] = a.priority;
    obj["createdAt"] = QString::fromStdString(a.createdAt);
    obj["updatedAt"] = QString::fromStdString(a.updatedAt);
    return obj;
}

static QJsonObject agentResultToJson(const AgentResult& r) {
    QJsonObject obj;
    obj["agentName"] = QString::fromStdString(r.agentName);
    obj["specialty"] = QString::fromStdString(r.specialty);
    obj["model"] = QString::fromStdString(r.model);
    obj["response"] = QString::fromStdString(r.response);
    obj["tokensUsed"] = r.tokensUsed;
    obj["latencyMs"] = r.latencyMs;
    return obj;
}

static QJsonObject traceToJson(const AgentTrace& t) {
    QJsonObject obj;
    obj["queryId"] = QString::fromStdString(t.queryId);
    obj["query"] = QString::fromStdString(t.query);
    obj["orchestratorReasoning"] = QString::fromStdString(t.orchestratorReasoning);
    QJsonArray agents;
    for (const auto& a : t.agentsConsulted)
        agents.append(agentResultToJson(a));
    obj["agentsConsulted"] = agents;
    obj["criticReview"] = QString::fromStdString(t.criticReview);
    obj["finalResponse"] = QString::fromStdString(t.finalResponse);
    return obj;
}

static QJsonObject configToJson(const OrchestrationConfig& c) {
    QJsonObject obj;
    obj["enabled"] = c.enabled;
    obj["orchestratorModel"] = QString::fromStdString(c.orchestratorModel);
    obj["criticEnabled"] = c.criticEnabled;
    obj["criticTemperature"] = c.criticTemperature;
    obj["maxAgentsPerQuery"] = c.maxAgentsPerQuery;
    obj["showTrace"] = c.showTrace;
    return obj;
}

static OrchestrationConfig jsonToConfig(const QJsonObject& obj) {
    OrchestrationConfig c;
    c.enabled = obj["enabled"].toBool(true);
    c.orchestratorModel = obj["orchestratorModel"].toString().toStdString();
    c.criticEnabled = obj["criticEnabled"].toBool(true);
    c.criticTemperature = obj["criticTemperature"].toDouble(0.1);
    c.maxAgentsPerQuery = obj["maxAgentsPerQuery"].toInt(3);
    c.showTrace = obj["showTrace"].toBool(true);
    return c;
}

static CreateAgentDTO jsonToCreateAgentDTO(const QJsonObject& obj) {
    CreateAgentDTO dto;
    dto.name = obj["name"].toString().toStdString();
    dto.description = obj["description"].toString().toStdString();
    dto.model = obj["model"].toString().toStdString();
    dto.systemPrompt = obj["systemPrompt"].toString().toStdString();
    dto.temperature = obj["temperature"].toDouble(0.7);
    dto.maxTokens = obj["maxTokens"].toInt(2048);
    dto.specialty = obj["specialty"].toString("general").toStdString();
    if (obj.contains("canOrchestrate"))
        dto.canOrchestrate = obj["canOrchestrate"].toBool(true);
    if (obj.contains("priority"))
        dto.priority = obj["priority"].toInt(5);
    if (obj.contains("tools")) {
        for (const auto& t : obj["tools"].toArray())
            dto.tools.push_back(t.toString().toStdString());
    }
    return dto;
}

// ---------------------------------------------------------------------------
// Knowledge JSON serialization helpers
// ---------------------------------------------------------------------------

static QJsonObject noteToJson(const Note& n) {
    QJsonObject obj;
    obj["id"] = QString::fromStdString(n.id);
    obj["title"] = QString::fromStdString(n.title);
    obj["content"] = QString::fromStdString(n.content);
    obj["folder"] = QString::fromStdString(n.folder);
    QJsonArray tags;
    for (const auto& t : n.tags)
        tags.append(QString::fromStdString(t));
    obj["tags"] = tags;
    obj["createdAt"] = QString::fromStdString(n.createdAt);
    obj["updatedAt"] = QString::fromStdString(n.updatedAt);
    obj["metadata"] = QString::fromStdString(n.metadata);
    return obj;
}

static CreateNoteDTO jsonToCreateNoteDTO(const QJsonObject& obj) {
    CreateNoteDTO dto;
    dto.title = obj["title"].toString().toStdString();
    dto.content = obj["content"].toString().toStdString();
    dto.folder = obj["folder"].toString("/").toStdString();
    if (obj.contains("tags")) {
        for (const auto& t : obj["tags"].toArray())
            dto.tags.push_back(t.toString().toStdString());
    }
    dto.metadata = obj["metadata"].toString("{}").toStdString();
    return dto;
}

static QJsonObject searchResultToJson(const SearchResult& r) {
    QJsonObject obj;
    obj["id"] = QString::fromStdString(r.id);
    obj["title"] = QString::fromStdString(r.title);
    obj["snippet"] = QString::fromStdString(r.snippet);
    obj["score"] = r.score;
    return obj;
}

static QJsonObject backlinkToJson(const Backlink& bl) {
    QJsonObject obj;
    obj["noteId"] = QString::fromStdString(bl.noteId);
    obj["title"] = QString::fromStdString(bl.title);
    obj["context"] = QString::fromStdString(bl.context);
    return obj;
}

static QJsonObject folderEntryToJson(const FolderEntry& fe) {
    QJsonObject obj;
    obj["path"] = QString::fromStdString(fe.path);
    obj["name"] = QString::fromStdString(fe.name);
    obj["noteCount"] = fe.noteCount;
    return obj;
}

static QJsonObject graphDataToJson(const GraphData& gd) {
    QJsonObject root;
    QJsonArray nodes;
    for (const auto& n : gd.nodes) {
        QJsonObject node;
        node["id"] = QString::fromStdString(n.id);
        node["label"] = QString::fromStdString(n.label);
        node["folder"] = QString::fromStdString(n.folder);
        QJsonArray tags;
        for (const auto& t : n.tags)
            tags.append(QString::fromStdString(t));
        node["tags"] = tags;
        node["linkCount"] = n.linkCount;
        nodes.append(node);
    }
    root["nodes"] = nodes;
    QJsonArray edges;
    for (const auto& e : gd.edges) {
        QJsonObject edge;
        edge["source"] = QString::fromStdString(e.source);
        edge["target"] = QString::fromStdString(e.target);
        edge["linkType"] = QString::fromStdString(e.linkType);
        edges.append(edge);
    }
    root["edges"] = edges;
    return root;
}

// ---------------------------------------------------------------------------
// Workspace JSON serialization helpers
// ---------------------------------------------------------------------------

static QJsonObject fileEntryToJson(const FileEntry& fe) {
    QJsonObject obj;
    obj["name"] = QString::fromStdString(fe.name);
    obj["path"] = QString::fromStdString(fe.path);
    obj["fullPath"] = QString::fromStdString(fe.fullPath);
    obj["isDirectory"] = fe.isDirectory;
    obj["size"] = static_cast<double>(fe.size);
    obj["modifiedAt"] = QString::fromStdString(fe.modifiedAt);
    return obj;
}

static QJsonObject projectToJson(const Project& p) {
    QJsonObject obj;
    obj["id"] = QString::fromStdString(p.id);
    obj["name"] = QString::fromStdString(p.name);
    obj["rootPath"] = QString::fromStdString(p.rootPath);
    obj["version"] = QString::fromStdString(p.version);
    obj["type"] = QString::fromStdString(p.type);
    QJsonArray folders;
    for (const auto& f : p.folders)
        folders.append(QString::fromStdString(f));
    obj["folders"] = folders;
    return obj;
}

// ---------------------------------------------------------------------------
// Error response helper
// ---------------------------------------------------------------------------

static QJsonObject makeError(const QString& id, int code, const QString& message) {
    QJsonObject err;
    err["id"] = id;
    QJsonObject errObj;
    errObj["code"] = code;
    errObj["message"] = message;
    err["error"] = errObj;
    return err;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

int main(int argc, char* argv[]) {
    QApplication app(argc, argv);
    app.setApplicationName("JARVIS");
    app.setApplicationVersion(JARVIS_VERSION);
    app.setOrganizationName("JARVIS");

    // ---- Initialize kernel services ----
    ServiceLocator serviceLocator;
    ModuleLoader moduleLoader;
    PermissionManager permissionManager;

    serviceLocator.registerService("module-loader", &moduleLoader);
    serviceLocator.registerService("permissions", &permissionManager);

    // ---- Initialize AI kernel ----
    QString dbDir = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(dbDir);
    QString dbPath = dbDir + "/jarvis-ai.db";
    qDebug() << "AI database:" << dbPath;

    auto* modelsManager = createModelsManager(dbPath.toStdString());
    auto* agentsManager = createAgentsManager(dbPath.toStdString());
    auto* orchestrationManager = createOrchestrationManager(modelsManager, agentsManager, dbPath.toStdString());
    auto* knowledgeManager = createKnowledgeManager(dbPath.toStdString());
    auto* workspaceManager = createWorkspaceManager(dbPath.toStdString());

    serviceLocator.registerService("ai-models", modelsManager);
    serviceLocator.registerService("ai-agents", agentsManager);
    serviceLocator.registerService("ai-orchestration", orchestrationManager);
    serviceLocator.registerService("knowledge", knowledgeManager);
    serviceLocator.registerService("workspace", workspaceManager);

    // ---- Load modules ----
    QString modulesDir = qApp->applicationDirPath() + "/modules";
    if (!QDir(modulesDir).exists()) {
        modulesDir = JARVIS_MODULES_DIR;
    }

    qDebug() << "Scanning modules in:" << modulesDir;
    moduleLoader.discoverModules(modulesDir.toStdString());
    moduleLoader.loadAll(&serviceLocator);
    moduleLoader.initAll();
    qDebug() << "Loaded" << moduleLoader.getLoadedModules().size() << "modules";

    // ---- Setup WebEngine view ----
    QWebEngineView view;
    view.setWindowTitle("JARVIS");
    view.resize(1280, 800);
    view.setMinimumSize(900, 600);

    // ---- Setup WebChannel bridge ----
    WebEngineBridge bridge(&view);

    // ======================================================================
    // BRIDGE HANDLERS
    // ======================================================================

    // --- Module handlers ---
    bridge.registerHandler("getModules", [&](const QVariantList&) -> QVariant {
        QJsonArray modules;
        auto loaded = moduleLoader.getLoadedModules();
        for (const auto* m : loaded) {
            QJsonObject mod;
            mod["id"] = m->api && m->api->id ? m->api->id() : "unknown";
            mod["name"] = m->manifest.name ? m->manifest.name : mod["id"];
            mod["version"] = m->manifest.version ? m->manifest.version : "";
            mod["state"] = static_cast<int>(m->state);
            modules.append(mod);
        }
        return modules;
    });

    bridge.registerHandler("getModule", [&](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QVariant();
        QString id = args[0].toString();
        auto loaded = moduleLoader.getLoadedModules();
        for (const auto* m : loaded) {
            if (m->api && m->api->id() && id == m->api->id()) {
                QJsonObject obj;
                obj["id"] = m->api->id();
                obj["name"] = m->manifest.name ? m->manifest.name : obj["id"];
                obj["version"] = m->api->version() ? m->api->version() : "";
                return obj;
            }
        }
        return QVariant();
    });

    // --- File handlers (placeholder until workspace module is ready) ---
    bridge.registerHandler("readFile", [&](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QVariant();
        return QString("File content placeholder");
    });

    bridge.registerHandler("writeFile", [&](const QVariantList& args) -> QVariant {
        return false;
    });

    bridge.registerHandler("listDirectory", [&](const QVariantList&) -> QVariant {
        return QJsonArray();
    });

    // --- Model handlers ---
    bridge.registerHandler("listModels", [modelsManager](const QVariantList&) -> QVariant {
        try {
            auto models = modelsManager->listModels();
            QJsonArray arr;
            for (const auto& m : models)
                arr.append(modelInfoToJson(m));
            return arr;
        } catch (const std::exception& e) {
            qWarning() << "listModels error:" << e.what();
            return QJsonArray();
        }
    });

    bridge.registerHandler("getModel", [modelsManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QVariant();
        try {
            auto model = modelsManager->getModel(args[0].toString().toStdString());
            if (model.name.empty()) return QVariant();
            return modelInfoToJson(model);
        } catch (...) {
            return QVariant();
        }
    });

    bridge.registerHandler("pullModel", [modelsManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return modelsManager->pullModel(args[0].toString().toStdString());
        } catch (...) {
            return false;
        }
    });

    bridge.registerHandler("deleteModel", [modelsManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return modelsManager->deleteModel(args[0].toString().toStdString());
        } catch (...) {
            return false;
        }
    });

    bridge.registerHandler("startModel", [modelsManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return modelsManager->startModel(args[0].toString().toStdString());
        } catch (...) {
            return false;
        }
    });

    bridge.registerHandler("stopModel", [modelsManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return modelsManager->stopModel(args[0].toString().toStdString());
        } catch (...) {
            return false;
        }
    });

    bridge.registerHandler("updateModelMetadata", [modelsManager](const QVariantList& args) -> QVariant {
        if (args.size() < 2) return false;
        try {
            QString name = args[0].toString();
            QJsonObject meta = QJsonObject::fromVariantMap(args[1].toMap());
            ModelMetadata m;
            QString spec = meta["specialty"].toString("general");
            if (spec == "chat") m.specialty = ModelSpecialty::Chat;
            else if (spec == "code") m.specialty = ModelSpecialty::Code;
            else if (spec == "reasoning") m.specialty = ModelSpecialty::Reasoning;
            else if (spec == "embedding") m.specialty = ModelSpecialty::Embedding;
            else if (spec == "vision") m.specialty = ModelSpecialty::Vision;
            else m.specialty = ModelSpecialty::General;
            m.notes = meta["notes"].toString().toStdString();
            m.color = meta["color"].toString().toStdString();
            m.icon = meta["icon"].toString().toStdString();
            return modelsManager->updateModelMetadata(name.toStdString(), m);
        } catch (...) {
            return false;
        }
    });

    bridge.registerHandler("getModelBySpecialty", [modelsManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QVariant();
        try {
            QString spec = args[0].toString();
            ModelSpecialty s = ModelSpecialty::General;
            if (spec == "chat") s = ModelSpecialty::Chat;
            else if (spec == "code") s = ModelSpecialty::Code;
            else if (spec == "reasoning") s = ModelSpecialty::Reasoning;
            else if (spec == "embedding") s = ModelSpecialty::Embedding;
            else if (spec == "vision") s = ModelSpecialty::Vision;
            auto model = modelsManager->getModelBySpecialty(s);
            if (model.name.empty()) return QVariant();
            return modelInfoToJson(model);
        } catch (...) {
            return QVariant();
        }
    });

    // --- Agent handlers ---
    bridge.registerHandler("listAgents", [agentsManager](const QVariantList&) -> QVariant {
        try {
            auto agents = agentsManager->listAgents();
            QJsonArray arr;
            for (const auto& a : agents)
                arr.append(agentToJson(a));
            return arr;
        } catch (...) {
            return QJsonArray();
        }
    });

    bridge.registerHandler("getAgent", [agentsManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QVariant();
        try {
            auto agent = agentsManager->getAgent(args[0].toString().toStdString());
            if (agent.id.empty()) return QVariant();
            return agentToJson(agent);
        } catch (...) {
            return QVariant();
        }
    });

    bridge.registerHandler("createAgent", [agentsManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) {
            throw std::runtime_error("Missing required field: name");
        }
        QJsonObject obj = QJsonObject::fromVariantMap(args[0].toMap());
        if (!obj.contains("name") || obj["name"].toString().isEmpty()) {
            throw std::runtime_error("Missing required field: name");
        }
        if (!obj.contains("model") || obj["model"].toString().isEmpty()) {
            throw std::runtime_error("Missing required field: model");
        }
        auto dto = jsonToCreateAgentDTO(obj);
        auto agent = agentsManager->createAgent(dto);
        return agentToJson(agent);
    });

    bridge.registerHandler("updateAgent", [agentsManager](const QVariantList& args) -> QVariant {
        if (args.size() < 2) {
            throw std::runtime_error("Missing required fields: id and data");
        }
        QString id = args[0].toString();
        QJsonObject obj = QJsonObject::fromVariantMap(args[1].toMap());
        auto dto = jsonToCreateAgentDTO(obj);
        auto agent = agentsManager->updateAgent(id.toStdString(), dto);
        return agentToJson(agent);
    });

    bridge.registerHandler("deleteAgent", [agentsManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return agentsManager->deleteAgent(args[0].toString().toStdString());
        } catch (...) {
            return false;
        }
    });

    bridge.registerHandler("setDefaultAgent", [agentsManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return agentsManager->setDefaultAgent(args[0].toString().toStdString());
        } catch (...) {
            return false;
        }
    });

    bridge.registerHandler("getDefaultAgent", [agentsManager](const QVariantList&) -> QVariant {
        try {
            auto agent = agentsManager->getDefaultAgent();
            if (agent.id.empty()) return QVariant();
            return agentToJson(agent);
        } catch (...) {
            return QVariant();
        }
    });

    bridge.registerHandler("getOrchestrationPool", [agentsManager](const QVariantList&) -> QVariant {
        try {
            auto agents = agentsManager->getOrchestrationPool();
            QJsonArray arr;
            for (const auto& a : agents)
                arr.append(agentToJson(a));
            return arr;
        } catch (...) {
            return QJsonArray();
        }
    });

    // --- Orchestration handlers ---
    bridge.registerHandler("getOrchestrationConfig", [orchestrationManager](const QVariantList&) -> QVariant {
        try {
            return configToJson(orchestrationManager->getConfig());
        } catch (...) {
            return configToJson(OrchestrationConfig{});
        }
    });

    bridge.registerHandler("updateOrchestrationConfig", [orchestrationManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            QJsonObject obj = QJsonObject::fromVariantMap(args[0].toMap());
            auto config = jsonToConfig(obj);
            return orchestrationManager->updateConfig(config);
        } catch (...) {
            return false;
        }
    });

    bridge.registerHandler("sendMessage", [orchestrationManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) {
            return QString("No input provided");
        }
        try {
            QString query = args[0].toString();
            return QString::fromStdString(orchestrationManager->executeQuery(query.toStdString()));
        } catch (const std::exception& e) {
            return QString("Error: %1").arg(e.what());
        }
    });

    bridge.registerHandler("executeOrchestratedQuery", [orchestrationManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) {
            return QString("No query provided");
        }
        try {
            QString query = args[0].toString();
            return QString::fromStdString(orchestrationManager->executeQuery(query.toStdString()));
        } catch (const std::exception& e) {
            return QString("Error: %1").arg(e.what());
        }
    });

    bridge.registerHandler("getAgentTrace", [orchestrationManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QVariant();
        try {
            auto trace = orchestrationManager->getTrace(args[0].toString().toStdString());
            if (trace.queryId.empty()) return QVariant();
            return traceToJson(trace);
        } catch (...) {
            return QVariant();
        }
    });

    // --- Workspace handlers ---
    bridge.registerHandler("openWorkspace", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return workspaceManager->openWorkspace(args[0].toString().toStdString());
        } catch (...) { return false; }
    });

    bridge.registerHandler("addRoot", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return workspaceManager->addRoot(args[0].toString().toStdString());
        } catch (...) { return false; }
    });

    bridge.registerHandler("removeRoot", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return workspaceManager->removeRoot(args[0].toString().toStdString());
        } catch (...) { return false; }
    });

    bridge.registerHandler("getRoots", [workspaceManager](const QVariantList&) -> QVariant {
        try {
            auto roots = workspaceManager->getRoots();
            QJsonArray arr;
            for (const auto& r : roots)
                arr.append(QString::fromStdString(r));
            return arr;
        } catch (...) { return QJsonArray(); }
    });

    bridge.registerHandler("listFiles", [workspaceManager](const QVariantList& args) -> QVariant {
        try {
            std::string path = args.isEmpty() ? workspaceManager->getRoots().front() : args[0].toString().toStdString();
            auto entries = workspaceManager->listFiles(path);
            QJsonArray arr;
            for (const auto& e : entries)
                arr.append(fileEntryToJson(e));
            return arr;
        } catch (...) { return QJsonArray(); }
    });

    bridge.registerHandler("readFile", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QVariant();
        try {
            return QString::fromStdString(workspaceManager->readFile(args[0].toString().toStdString()));
        } catch (...) { return QVariant(); }
    });

    bridge.registerHandler("writeFile", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.size() < 2) return false;
        try {
            return workspaceManager->writeFile(args[0].toString().toStdString(), args[1].toString().toStdString());
        } catch (...) { return false; }
    });

    bridge.registerHandler("createFile", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.size() < 2) return false;
        try {
            return workspaceManager->createFile(args[0].toString().toStdString(), args[1].toString().toStdString());
        } catch (...) { return false; }
    });

    bridge.registerHandler("createDirectory", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.size() < 2) return false;
        try {
            return workspaceManager->createDirectory(args[0].toString().toStdString(), args[1].toString().toStdString());
        } catch (...) { return false; }
    });

    bridge.registerHandler("deletePath", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return workspaceManager->deleteFile(args[0].toString().toStdString());
        } catch (...) { return false; }
    });

    bridge.registerHandler("renamePath", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.size() < 2) return false;
        try {
            return workspaceManager->rename(args[0].toString().toStdString(), args[1].toString().toStdString());
        } catch (...) { return false; }
    });

    bridge.registerHandler("movePath", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.size() < 2) return false;
        try {
            return workspaceManager->move(args[0].toString().toStdString(), args[1].toString().toStdString());
        } catch (...) { return false; }
    });

    bridge.registerHandler("getRecentFiles", [workspaceManager](const QVariantList& args) -> QVariant {
        try {
            int limit = args.isEmpty() ? 20 : args[0].toInt();
            auto files = workspaceManager->getRecentFiles(limit);
            QJsonArray arr;
            for (const auto& f : files)
                arr.append(fileEntryToJson(f));
            return arr;
        } catch (...) { return QJsonArray(); }
    });

    bridge.registerHandler("getProjectInfo", [workspaceManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QVariant();
        try {
            auto proj = workspaceManager->getProjectInfo(args[0].toString().toStdString());
            return projectToJson(proj);
        } catch (...) { return QVariant(); }
    });

    // --- Cancel generation (placeholder - single thread) ---
    bridge.registerHandler("cancelGeneration", [&](const QVariantList&) -> QVariant {
        // In a full implementation this would abort the current Ollama request
        // For now it's a no-op since our current implementation is synchronous
        qDebug() << "cancelGeneration called (no-op in sync mode)";
        return true;
    });

    // --- Knowledge handlers ---
    bridge.registerHandler("createNote", [knowledgeManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) throw std::runtime_error("Missing required field: title");
        QJsonObject obj = QJsonObject::fromVariantMap(args[0].toMap());
        if (!obj.contains("title") || obj["title"].toString().isEmpty())
            throw std::runtime_error("Missing required field: title");
        auto dto = jsonToCreateNoteDTO(obj);
        auto note = knowledgeManager->createNote(dto);
        return noteToJson(note);
    });

    bridge.registerHandler("getNote", [knowledgeManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QVariant();
        try {
            auto note = knowledgeManager->getNote(args[0].toString().toStdString());
            return noteToJson(note);
        } catch (...) {
            return QVariant();
        }
    });

    bridge.registerHandler("listNotes", [knowledgeManager](const QVariantList& args) -> QVariant {
        try {
            std::string folder = args.isEmpty() ? "" : args[0].toString().toStdString();
            auto notes = knowledgeManager->listNotes(folder);
            QJsonArray arr;
            for (const auto& n : notes)
                arr.append(noteToJson(n));
            return arr;
        } catch (...) {
            return QJsonArray();
        }
    });

    bridge.registerHandler("updateNote", [knowledgeManager](const QVariantList& args) -> QVariant {
        if (args.size() < 2)
            throw std::runtime_error("Missing required fields: id and data");
        QString id = args[0].toString();
        QJsonObject obj = QJsonObject::fromVariantMap(args[1].toMap());
        auto dto = jsonToCreateNoteDTO(obj);
        auto note = knowledgeManager->updateNote(id.toStdString(), dto);
        return noteToJson(note);
    });

    bridge.registerHandler("deleteNote", [knowledgeManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return false;
        try {
            return knowledgeManager->deleteNote(args[0].toString().toStdString());
        } catch (...) {
            return false;
        }
    });

    bridge.registerHandler("searchNotes", [knowledgeManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QJsonArray();
        try {
            auto results = knowledgeManager->search(args[0].toString().toStdString());
            QJsonArray arr;
            for (const auto& r : results)
                arr.append(searchResultToJson(r));
            return arr;
        } catch (...) {
            return QJsonArray();
        }
    });

    bridge.registerHandler("getBacklinks", [knowledgeManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QJsonArray();
        try {
            auto backlinks = knowledgeManager->getBacklinks(args[0].toString().toStdString());
            QJsonArray arr;
            for (const auto& bl : backlinks)
                arr.append(backlinkToJson(bl));
            return arr;
        } catch (...) {
            return QJsonArray();
        }
    });

    bridge.registerHandler("getGraph", [knowledgeManager](const QVariantList&) -> QVariant {
        try {
            auto graph = knowledgeManager->buildGraph();
            return graphDataToJson(graph);
        } catch (...) {
            return graphDataToJson(GraphData{});
        }
    });

    bridge.registerHandler("getFolders", [knowledgeManager](const QVariantList&) -> QVariant {
        try {
            auto folders = knowledgeManager->getFolders();
            QJsonArray arr;
            for (const auto& f : folders)
                arr.append(folderEntryToJson(f));
            return arr;
        } catch (...) {
            return QJsonArray();
        }
    });

    bridge.registerHandler("moveNote", [knowledgeManager](const QVariantList& args) -> QVariant {
        if (args.size() < 2) return false;
        try {
            return knowledgeManager->moveNote(args[0].toString().toStdString(), args[1].toString().toStdString());
        } catch (...) {
            return false;
        }
    });

    bridge.registerHandler("importNote", [knowledgeManager](const QVariantList& args) -> QVariant {
        if (args.isEmpty()) return QVariant();
        try {
            auto note = knowledgeManager->importMd(args[0].toString().toStdString());
            return noteToJson(note);
        } catch (...) {
            return QVariant();
        }
    });

    bridge.registerHandler("exportNote", [knowledgeManager](const QVariantList& args) -> QVariant {
        if (args.size() < 2) return false;
        try {
            return knowledgeManager->exportMd(args[0].toString().toStdString(), args[1].toString().toStdString());
        } catch (...) {
            return false;
        }
    });

    qDebug() << "Registered" << 48 << "bridge handlers";

    // ---- Load web UI ----
    QString webuiPath = qApp->applicationDirPath() + "/webui/index.html";
    if (!QFile::exists(webuiPath)) {
        webuiPath = QDir::currentPath() + "/kernel/resources/webui/index.html";
    }

    if (QFile::exists(webuiPath)) {
        view.load(QUrl::fromLocalFile(webuiPath));
        qDebug() << "Loading UI from:" << webuiPath;
    } else {
        qWarning() << "WebUI not found at:" << webuiPath;
        qWarning() << "Run 'cd ui && npm run build' first";
        view.setHtml(R"(
            <html><body style="background:#1e1e1e;color:#ccc;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
            <div style="text-align:center">
                <h1 style="color:#007acc">JARVIS</h1>
                <p>Execute <code style="background:#333;padding:4px 8px;border-radius:4px;">cd ui && npm install && npm run build</code></p>
            </div>
            </body></html>
        )");
    }

    view.show();

    // Emit event when modules are ready
    QTimer::singleShot(1000, [&]() {
        bridge.emitEvent("modules-ready", QVariantMap{
            {"count", static_cast<int>(moduleLoader.getLoadedModules().size())},
            {"ai", true}
        });
    });

    int result = app.exec();

    // ---- Shutdown ----
    moduleLoader.shutdownAll();
    moduleLoader.unloadAll();

    delete modelsManager;
    delete agentsManager;
    delete orchestrationManager;
    delete knowledgeManager;
    delete workspaceManager;

    return result;
}
