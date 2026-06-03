# Sistema de Modulos

## Conceito

Cada modulo e uma biblioteca dinamica (.dll no Windows, .so no Linux, .dylib no macOS) que implementa uma ABI estavel em C. O kernel carrega os modulos em runtime sem necessidade de recompilacao.

## ABI — Module API

```cpp
// module_api.h — ABI publica (C-linkage para estabilidade)
extern "C" {

typedef struct ModuleAPI ModuleAPI;
typedef struct ModuleHost ModuleHost;

ModuleAPI* create_module(ModuleHost* host);
void destroy_module(ModuleAPI* api);

}

struct ModuleAPI {
    const char* id() const;
    const char* version() const;
    const char* description() const;
    
    bool init();                // Chamado apos todos modulos carregados
    void shutdown();            // Chamado no encerramento
    
    // Opcionais
    bool (*on_activate)();      // Quando modulo e ativado pelo usuario
    void (*on_deactivate)();    // Quando modulo e desativado
};

struct ModuleHost {
    void* (*get_service)(const char* name);
    bool (*check_permission)(const char* permission);
    void (*log)(LogLevel level, const char* message);
    void (*register_service)(const char* name, void* service);
};
```

## Service Locator

Modulos nao se importam diretamente. Eles se registram e descobrem servicos via `ServiceLocator`:

```cpp
// Kernel oferece:
ServiceLocator::registerService("workspace", workspaceService);
ServiceLocator::registerService("ai-engine", aiService);

// Modulo consome:
auto* ws = static_cast<WorkspaceService*>(host->get_service("workspace"));
```

## Ciclo de Vida de um Modulo

```
Descoberta → Carga (LoadLibrary) → create_module() → init() → Uso → shutdown() → destroy_module() → Descarregamento
```

1. **Descoberta:** Kernel escaneia `modules/*.dll` (ou `plugins/*.dll`)
2. **Carga:** `LoadLibrary()` / `dlopen()`
3. **Criacao:** `create_module(host)` — modulo cria seus objetos, nao faz operacoes ainda
4. **Inicializacao:** `init()` — modulo se registra no Service Locator, inicia timers/threads
5. **Uso:** Modulo opera normalmente, responde a chamadas de outros modulos
6. **Desativacao:** `shutdown()` — modulo para operacoes, salva estado
7. **Destruicao:** `destroy_module()` — libera memoria
8. **Descarga:** `FreeLibrary()` / `dlclose()`

## Dependencias entre Modulos

As dependencias sao declaradas no manifesto do modulo (um JSON opcional ao lado da .dll):

```json
{
    "id": "ide",
    "name": "Modulo IDE",
    "version": "1.0.0",
    "dependencies": ["workspace"],
    "permissions": ["filesystem.read", "filesystem.write"]
}
```

O kernel verifica dependencias antes de carregar e reporta erros se faltar algo.
