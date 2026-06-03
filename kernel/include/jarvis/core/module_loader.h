#ifndef JARVIS_CORE_MODULE_LOADER_H
#define JARVIS_CORE_MODULE_LOADER_H

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

#include "jarvis/api/module_api.h"

namespace jarvis::core {

class ServiceLocator;

struct LoadedModule {
    void* handle;                       // HMODULE / void*
    ModuleAPI* api;                     // Ponteiro para a API do modulo
    ModuleHost host;                    // Host configurado para este modulo
    ModuleManifest manifest;            // module.json (se existir)
    ModuleState state;                  // Estado atual
    std::string path;                   // Caminho absoluto da .dll
};

class ModuleLoader {
public:
    ModuleLoader();
    ~ModuleLoader();

    // Escaneia diretorio por modulos (.dll/.so)
    void discoverModules(const std::string& directoryPath);

    // Carrega um modulo especifico
    bool loadModule(const std::string& path, ServiceLocator* locator);

    // Carrega todos os modulos descobertos
    void loadAll(ServiceLocator* locator);

    // Inicializa um modulo especifico
    bool initModule(const std::string& id);

    // Inicializa todos em ordem de dependencia (topologica)
    bool initAll();

    // Desliga todos os modulos (ordem inversa)
    void shutdownAll();

    // Descarrega todos os modulos
    void unloadAll();

    // Get/query
    ModuleAPI* getModule(const std::string& id) const;
    std::vector<const LoadedModule*> getLoadedModules() const;

private:
    struct ModuleEntry {
        std::string path;
        ModuleManifest manifest;
    };

    std::vector<ModuleEntry> discovered_;
    std::unordered_map<std::string, std::unique_ptr<LoadedModule>> loaded_;

    // Ordena dependencias para init (topological sort)
    std::vector<std::string> resolveDependencyOrder();

    ModuleManifest readModuleManifest(const std::string& modulePath);

    static ModuleHost createModuleHost(ServiceLocator* locator, const std::string& moduleId);

    // Callbacks estaticos para ModuleHost
    static void* s_getService(void* context, const char* name);
    static bool s_checkPermission(void* context, const char* moduleId, const char* permission);
    static void s_log(void* context, LogLevel level, const char* message);
};

} // namespace jarvis::core

#endif // JARVIS_CORE_MODULE_LOADER_H
