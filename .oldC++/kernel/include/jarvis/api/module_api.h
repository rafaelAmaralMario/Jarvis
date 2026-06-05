#ifndef JARVIS_API_MODULE_API_H
#define JARVIS_API_MODULE_API_H

#include <cstdint>

#ifdef _WIN32
    #define JARVIS_EXPORT __declspec(dllexport)
    #define JARVIS_IMPORT __declspec(dllimport)
#else
    #define JARVIS_EXPORT __attribute__((visibility("default")))
    #define JARVIS_IMPORT
#endif

#if defined(JARVIS_MODULE_BUILD)
    #define JARVIS_API JARVIS_EXPORT
#else
    #define JARVIS_API JARVIS_IMPORT
#endif

extern "C" {

// Every module must export these two functions
JARVIS_API struct ModuleAPI* create_module(struct ModuleHost* host);
JARVIS_API void destroy_module(struct ModuleAPI* api);

// Typedefs for dynamic loading
typedef struct ModuleAPI* (*CreateModuleFn)(struct ModuleHost*);
typedef void (*DestroyModuleFn)(struct ModuleAPI*);

} // extern "C"

enum class LogLevel : uint8_t {
    Trace = 0,
    Debug,
    Info,
    Warn,
    Error,
    Critical
};

enum class PermissionResult : uint8_t {
    Granted = 0,
    Denied,
    NotRequested
};

enum class ModuleState : uint8_t {
    Discovered = 0,
    Loaded,
    Initialized,
    Active,
    Shutdown,
    Error
};

struct ModuleManifest {
    const char* id;
    const char* name;
    const char* version;
    const char* description;
    const char** dependencies;   // null-terminated array
    const char** permissions;    // null-terminated array
};

struct ModuleHost {
    void* context;  // Opaque context passed to every callback
    void* (*get_service)(void* ctx, const char* name);
    bool (*check_permission)(void* ctx, const char* module_id, const char* permission);
    void (*log)(void* ctx, LogLevel level, const char* message);
    void (*register_service)(void* ctx, const char* name, void* service);
    const char* (*get_module_path)(void* ctx);
};

// Helper macros to use from module code:
#define MODULE_GET_SERVICE(host, name)      (host)->get_service((host)->context, (name))
#define MODULE_CHECK_PERM(host, mid, perm)  (host)->check_permission((host)->context, (mid), (perm))
#define MODULE_LOG(host, level, msg)        (host)->log((host)->context, (level), (msg))
#define MODULE_REG_SVC(host, name, svc)     (host)->register_service((host)->context, (name), (svc))
#define MODULE_GET_PATH(host)               (host)->get_module_path((host)->context)

struct ModuleAPI {
    const char* (*id)();
    const char* (*version)();
    const char* (*description)();
    
    bool (*init)();
    void (*shutdown)();
    
    // Optional
    bool (*on_activate)();
    void (*on_deactivate)();
    
    // Optional: return manifest for dependency resolution
    const struct ModuleManifest* (*manifest)();
};

#endif // JARVIS_API_MODULE_API_H
