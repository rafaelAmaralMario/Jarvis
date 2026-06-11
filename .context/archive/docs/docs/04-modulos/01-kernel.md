# Modulo Kernel

**ID:** `jarvis.kernel`
**Prioridade:** 🔴 Alta
**Depende de:** —
**Status:** Em design

## Responsabilidades

O Kernel e o modulo mais basico do sistema. Ele nao e uma .dll carregavel — e o executavel principal que:

1. Inicializa o runtime C++ e Qt
2. Carrega todos os modulos (.dll/.so)
3. Gerencia o lifecycle dos modulos (init, shutdown)
4. Mantem o Service Locator (registro e descoberta de servicos)
5. Gerencia permissoes (verificacao basica)
6. Providencia logging centralizado

## Estrutura

```
kernel/
├── CMakeLists.txt
├── include/jarvis/
│   ├── api/
│   │   ├── module_api.h       # ABI publica (C-linkage)
│   │   ├── module_host.h      # Interface que o modulo recebe
│   │   └── service_locator.h  # Service Locator (descobre servicos)
│   └── core/
│       ├── module_loader.h    # Carrega .dll/.so do disco
│       ├── lifecycle.h        # Gerencia init/shutdown
│       └── permission_manager.h
├── src/
│   ├── main.cpp               # Entry point
│   ├── module_loader.cpp      # LoadLibrary/dlopen wrapper
│   ├── lifecycle.cpp          # Orquestracao de init/shutdown
│   ├── service_locator.cpp    # Mapa <string, void*>
│   └── permission_manager.cpp
├── resources/
│   ├── jarvis.qrc             # Qt resources
│   └── main.qml               # UI principal
└── tests/
    ├── test_module_loader.cpp
    ├── test_service_locator.cpp
    └── test_lifecycle.cpp
```

## Fluxo de Inicializacao

```cpp
int main(int argc, char* argv[]) {
    // 1. Init Qt Application
    QGuiApplication app(argc, argv);
    
    // 2. Init kernel services
    ServiceLocator locator;
    PermissionManager permissions;
    ModuleLoader loader;
    
    // 3. Register kernel services
    locator.registerService("permissions", &permissions);
    locator.registerService("module-loader", &loader);
    
    // 4. Load modules
    loader.discoverModules("modules/");
    loader.loadAll(&locator);
    
    // 5. Init all modules
    loader.initAll();
    
    // 6. Load UI
    QQmlApplicationEngine engine;
    engine.load(QUrl("qrc:/main.qml"));
    
    // 7. Event loop
    int result = app.exec();
    
    // 8. Shutdown
    loader.shutdownAll();
    loader.unloadAll();
    
    return result;
}
```

## Module Loader

```cpp
class ModuleLoader {
public:
    void discoverModules(const std::string& path);
    // Escaneia path/*.dll e le module.json ao lado
    
    bool loadModule(const std::string& path);
    // LoadLibrary/dlopen, create_module(host)
    
    void loadAll(ServiceLocator* locator);
    // Carrega todos os modulos descobertos
    
    bool initModule(const std::string& id);
    // Chama module->init()
    
    void initAll();
    // Init todos em ordem de dependencia (topologica)
    
    void shutdownAll();
    // Inverso de init
    
    void unloadAll();
    // destroy_module + FreeLibrary
    
    ModuleAPI* getModule(const std::string& id);
    std::vector<ModuleInfo> getLoadedModules();
    
private:
    struct LoadedModule {
        void* handle;           // HMODULE / void*
        ModuleAPI* api;         // Ponteiro para a API do modulo
        ModuleHost host;        // Host configurado para este modulo
        ModuleManifest manifest; // module.json
        bool initialized;
    };
    
    std::unordered_map<std::string, LoadedModule> modules_;
};
```

## Service Locator

```cpp
class ServiceLocator {
public:
    void registerService(const std::string& name, void* service);
    void* getService(const std::string& name);
    
    template<typename T>
    T* getService(const std::string& name) {
        return static_cast<T*>(getService(name));
    }
    
    bool hasService(const std::string& name);
    void unregisterService(const std::string& name);
    
private:
    std::unordered_map<std::string, void*> services_;
};
```

## Permission Manager

```cpp
class PermissionManager {
public:
    // Modulo solicita permissao
    PermissionResult checkPermission(
        const std::string& moduleId,
        const std::string& permission
    );
    
    // Usuario concede/revoga permissao
    void grantPermission(const std::string& moduleId, const std::string& permission);
    void revokePermission(const std::string& moduleId, const std::string& permission);
    
    // Persistencia
    void loadPermissions();
    void savePermissions();
    
private:
    struct ModulePermissions {
        std::unordered_map<std::string, bool> granted; // permission -> granted
    };
    
    std::unordered_map<std::string, ModulePermissions> permissions_;
};
```
