#include "jarvis/core/module_loader.h"
#include "jarvis/core/service_locator.h"
#include "jarvis/api/module_api.h"

#include <algorithm>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <functional>

#include <nlohmann/json.hpp>

#ifdef _WIN32
    #include <windows.h>
#else
    #include <dlfcn.h>
#endif

namespace jarvis::core {

using json = nlohmann::json;

// ---- Static callbacks for ModuleHost ----

struct HostContext {
    ServiceLocator* locator;
    std::string moduleId;
    std::string modulePath;
};

static void* hostGetService(void* ctx, const char* name) {
    auto* hc = static_cast<HostContext*>(ctx);
    return hc->locator->getService(name ? name : "");
}

static bool hostCheckPermission(void* ctx, const char* moduleId, const char* permission) {
    // Default: allow all. Permission manager will override later.
    return true;
}

static void hostLog(void* ctx, LogLevel level, const char* message) {
    auto* hc = static_cast<HostContext*>(ctx);
    const char* levelStr = "";
    switch (level) {
        case LogLevel::Trace:   levelStr = "TRACE"; break;
        case LogLevel::Debug:   levelStr = "DEBUG"; break;
        case LogLevel::Info:    levelStr = "INFO";  break;
        case LogLevel::Warn:    levelStr = "WARN";  break;
        case LogLevel::Error:   levelStr = "ERROR"; break;
        case LogLevel::Critical:levelStr = "CRIT";  break;
    }
    std::cout << "[" << levelStr << "][" << hc->moduleId << "] " << message << std::endl;
}

static void hostRegisterService(void* ctx, const char* name, void* service) {
    auto* hc = static_cast<HostContext*>(ctx);
    hc->locator->registerService(name ? name : "", service);
}

static const char* hostGetModulePath(void* ctx) {
    auto* hc = static_cast<HostContext*>(ctx);
    return hc->modulePath.c_str();
}

// ---- ModuleLoader implementation ----

ModuleLoader::ModuleLoader() = default;

ModuleLoader::~ModuleLoader() {
    shutdownAll();
    unloadAll();
}

void ModuleLoader::discoverModules(const std::string& directoryPath) {
    discovered_.clear();

    if (!std::filesystem::exists(directoryPath)) {
        return;
    }

    namespace fs = std::filesystem;
    for (const auto& entry : fs::directory_iterator(directoryPath)) {
        if (!entry.is_regular_file()) continue;

        auto ext = entry.path().extension().string();
#ifdef _WIN32
        if (ext != ".dll") continue;
#elif __APPLE__
        if (ext != ".dylib") continue;
#else
        if (ext != ".so") continue;
#endif
        auto manifest = readModuleManifest(entry.path().string());
        discovered_.push_back({entry.path().string(), manifest});
    }
}

bool ModuleLoader::loadModule(const std::string& path, ServiceLocator* locator) {
    void* handle = nullptr;
    CreateModuleFn createFn = nullptr;
    DestroyModuleFn destroyFn = nullptr;

#ifdef _WIN32
    handle = LoadLibraryA(path.c_str());
    if (!handle) {
        std::cerr << "Failed to LoadLibrary: " << path << std::endl;
        return false;
    }
    createFn = reinterpret_cast<CreateModuleFn>(GetProcAddress(
        static_cast<HMODULE>(handle), "create_module"));
    destroyFn = reinterpret_cast<DestroyModuleFn>(GetProcAddress(
        static_cast<HMODULE>(handle), "destroy_module"));
#else
    handle = dlopen(path.c_str(), RTLD_NOW | RTLD_LOCAL);
    if (!handle) {
        std::cerr << "Failed to dlopen: " << path << " - " << dlerror() << std::endl;
        return false;
    }
    createFn = reinterpret_cast<CreateModuleFn>(dlsym(handle, "create_module"));
    destroyFn = reinterpret_cast<DestroyModuleFn>(dlsym(handle, "destroy_module"));
#endif

    if (!createFn || !destroyFn) {
        std::cerr << "Module missing create_module or destroy_module: " << path << std::endl;
#ifdef _WIN32
        FreeLibrary(static_cast<HMODULE>(handle));
#else
        dlclose(handle);
#endif
        return false;
    }

    // Determine module ID from manifest
    std::string moduleId;
    for (const auto& entry : discovered_) {
        if (entry.path == path && entry.manifest.id) {
            moduleId = entry.manifest.id;
            break;
        }
    }
    if (moduleId.empty()) {
        moduleId = "unknown:" + std::filesystem::path(path).stem().string();
    }

    // Create host context
    auto* hostCtx = new HostContext{locator, moduleId, path};

    ModuleHost host;
    host.context = hostCtx;
    host.get_service = hostGetService;
    host.check_permission = hostCheckPermission;
    host.log = hostLog;
    host.register_service = hostRegisterService;
    host.get_module_path = hostGetModulePath;

    ModuleAPI* api = createFn(&host);
    if (!api) {
        std::cerr << "create_module returned null: " << path << std::endl;
        delete hostCtx;
#ifdef _WIN32
        FreeLibrary(static_cast<HMODULE>(handle));
#else
        dlclose(handle);
#endif
        return false;
    }

    auto module = std::make_unique<LoadedModule>();
    module->handle = handle;
    module->api = api;
    module->host = host;
    module->state = ModuleState::Loaded;
    module->path = path;

    if (api->manifest) {
        module->manifest = *api->manifest();
    }

    std::string id = api->id ? std::string(api->id()) : moduleId;
    loaded_[id] = std::move(module);

    return true;
}

void ModuleLoader::loadAll(ServiceLocator* locator) {
    for (const auto& entry : discovered_) {
        loadModule(entry.path, locator);
    }
}

bool ModuleLoader::initModule(const std::string& id) {
    auto it = loaded_.find(id);
    if (it == loaded_.end()) return false;

    auto* module = it->second.get();
    if (!module->api->init) {
        module->state = ModuleState::Initialized;
        return true;
    }

    if (module->api->init()) {
        module->state = ModuleState::Initialized;
        return true;
    }

    module->state = ModuleState::Error;
    return false;
}

bool ModuleLoader::initAll() {
    auto order = resolveDependencyOrder();
    for (const auto& id : order) {
        if (!initModule(id)) return false;
    }
    return true;
}

void ModuleLoader::shutdownAll() {
    auto order = resolveDependencyOrder();
    std::reverse(order.begin(), order.end());

    for (const auto& id : order) {
        auto it = loaded_.find(id);
        if (it != loaded_.end() && it->second->api->shutdown) {
            it->second->api->shutdown();
            it->second->state = ModuleState::Shutdown;
        }
    }
}

void ModuleLoader::unloadAll() {
    for (auto& [id, module] : loaded_) {
        if (module->state != ModuleState::Shutdown && module->api->shutdown) {
            module->api->shutdown();
        }

        // Free host context
        auto* ctx = static_cast<HostContext*>(module->host.context);
        delete ctx;

#ifdef _WIN32
        FreeLibrary(static_cast<HMODULE>(module->handle));
#else
        dlclose(module->handle);
#endif
    }
    loaded_.clear();
}

ModuleAPI* ModuleLoader::getModule(const std::string& id) const {
    auto it = loaded_.find(id);
    return it != loaded_.end() ? it->second->api : nullptr;
}

std::vector<const LoadedModule*> ModuleLoader::getLoadedModules() const {
    std::vector<const LoadedModule*> modules;
    for (const auto& [id, module] : loaded_) {
        modules.push_back(module.get());
    }
    return modules;
}

std::vector<std::string> ModuleLoader::resolveDependencyOrder() {
    std::unordered_map<std::string, std::vector<std::string>> deps;
    for (const auto& [id, module] : loaded_) {
        std::vector<std::string> moduleDeps;
        if (module->manifest.dependencies) {
            for (const char** dep = module->manifest.dependencies; *dep; ++dep) {
                moduleDeps.push_back(*dep);
            }
        }
        deps[id] = std::move(moduleDeps);
    }

    std::vector<std::string> order;
    std::unordered_map<std::string, bool> visited;
    std::unordered_map<std::string, bool> inStack;

    std::function<bool(const std::string&)> visit = [&](const std::string& id) -> bool {
        if (inStack[id]) return false;
        if (visited[id]) return true;
        inStack[id] = true;
        visited[id] = true;
        for (const auto& dep : deps[id]) {
            if (loaded_.count(dep) && !visit(dep)) return false;
        }
        inStack[id] = false;
        order.push_back(id);
        return true;
    };

    for (const auto& [id, _] : loaded_) {
        if (!visited[id]) visit(id);
    }

    return order;
}

ModuleManifest ModuleLoader::readModuleManifest(const std::string& modulePath) {
    ModuleManifest manifest{};
    manifest.id = "";
    manifest.name = "";
    manifest.version = "";
    manifest.description = "";
    manifest.dependencies = nullptr;
    manifest.permissions = nullptr;

    auto manifestPath = std::filesystem::path(modulePath).replace_extension(".json");
    if (!std::filesystem::exists(manifestPath)) return manifest;

    try {
        std::ifstream file(manifestPath);
        json data;
        file >> data;

        static std::string id, name, version, desc;
        id = data.value("id", "");
        name = data.value("name", "");
        version = data.value("version", "");
        desc = data.value("description", "");

        manifest.id = id.c_str();
        manifest.name = name.c_str();
        manifest.version = version.c_str();
        manifest.description = desc.c_str();

        static std::vector<std::string> deps, perms;
        if (data.contains("dependencies")) {
            deps.clear();
            for (const auto& dep : data["dependencies"]) {
                deps.push_back(dep.get<std::string>());
            }
            // Note: this is fragile — pointer lifetime.
            // In production, use a proper manifest object.
        }
    } catch (...) {}

    return manifest;
}

} // namespace jarvis::core
