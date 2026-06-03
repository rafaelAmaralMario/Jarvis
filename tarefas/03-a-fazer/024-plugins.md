# 024 — Plugins

## Metadados
- Status: a fazer
- Prioridade: 🟢 Baixa
- Fase: 6 — Extensibilidade
- Dependências: 023 (segurança para sandbox de permissões)

## Descrição
Sistema de extensões third-party: API pública estável para plugins C++ (.dll/.so),
Plugin Manager com UI e sandbox de permissões.

## Especificação Técnica

### 1. Arquitetura

O `ModuleLoader` já existe em `kernel/src/module_loader.cpp` e carrega módulos via
`create_module` / `destroy_module`. O objetivo desta task é:

1. **Estabilizar a API pública** (`kernel/include/jarvis/api/module_api.h`)
2. **Criar Plugin Manager** que usa ModuleLoader com scan, enable/disable, permissões
3. **Criar React UI** para gerenciar plugins

### 2. API Pública — module_api.h (refinamento)

```cpp
// module_api.h — Interface estável para plugins third-party
#ifndef JARVIS_API_MODULE_API_H
#define JARVIS_API_MODULE_API_H

#include <cstdint>
#include <cstddef>

#ifdef __cplusplus
extern "C" {
#endif

// Versão da API (incrementar em breaking changes)
#define JARVIS_API_VERSION 1

// Host API — funções que o JARVIS oferece ao plugin
typedef struct JarvisHost {
    int32_t apiVersion;

    // Service locator
    void* (*getService)(const char* name);

    // Logging
    void (*logInfo)(const char* message);
    void (*logWarn)(const char* message);
    void (*logError)(const char* message);

    // Bridge (registrar handlers)
    bool (*registerHandler)(const char* method, void* callback);

    // Emitir eventos para a UI
    void (*emitEvent)(const char* event, const char* data);

    // Settings (ler/escrever config)
    char* (*getSetting)(const char* key);
    bool (*setSetting)(const char* key, const char* value);

    // Filesystem (com permissão)
    char* (*readFile)(const char* path);
    bool (*writeFile)(const char* path, const char* content);

    // HTTP (com permissão)
    char* (*httpGet)(const char* url);
    char* (*httpPost)(const char* url, const char* body, const char* contentType);
} JarvisHost;

// Plugin API — funções que o plugin precisa implementar
typedef struct JarvisPlugin {
    const char* name;
    const char* version;
    const char* author;
    const char* description;

    bool (*init)(JarvisHost* host);
    void (*shutdown)();
    void (*onEvent)(const char* event, const char* data);
} JarvisPlugin;

// Entry points — exportados pelo plugin
JarvisPlugin* create_plugin();
void destroy_plugin(JarvisPlugin* plugin);

#ifdef __cplusplus
}
#endif

#endif // JARVIS_API_MODULE_API_H
```

### 3. PluginManager

**PluginManager** — gerencia plugins instalados:

```cpp
class PluginManager {
    // Scan do diretório plugins/
    std::vector<PluginInfo> scan(const std::string& pluginsDir);
    
    // Carregar/descarregar
    bool load(const std::string& id);
    bool unload(const std::string& id);
    
    // Estado
    bool isLoaded(const std::string& id);
    std::vector<PluginInfo> list();
    PluginInfo getInfo(const std::string& id);
    
    // Permissões
    std::vector<std::string> getPermissions(const std::string& id);
    bool setPermission(const std::string& id, const std::string& permission, bool granted);
    
    // Eventos
    void broadcastEvent(const std::string& event, const std::string& data);
};
```

**plugin.json** (manifest):
```json
{
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "author": "John Doe",
    "description": "Does awesome things",
    "entry": "my_plugin.dll",
    "permissions": ["filesystem.read", "http.request", "ui.notification"],
    "minApiVersion": 1
}
```

**Diretório de plugins:**
```
plugins/
├── my-plugin/
│   ├── plugin.json
│   ├── my_plugin.dll     (ou .so / .dylib)
│   └── assets/
└── another-plugin/
    ├── plugin.json
    └── another.so
```

### 4. Bridge handlers

```cpp
bridge.registerHandler("pluginsList", [pluginManager](const QVariantList&) -> QVariant { ... });
bridge.registerHandler("pluginsLoad", [pluginManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("pluginsUnload", [pluginManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("pluginsToggle", [pluginManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("pluginsGetPermissions", [pluginManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("pluginsSetPermission", [pluginManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("pluginsInstall", [pluginManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("pluginsUninstall", [pluginManager](const QVariantList& args) -> QVariant { ... });
```

### 5. React — Componentes

**PluginManagerPanel.tsx:**
- Lista de plugins instalados
- Cada item: nome, versão, autor, toggle enable/disable, status (loaded/unloaded)
- Botão "Instalar Plugin" (file picker para selecionar .zip/.dll)
- Botão "Desinstalar"

**PluginCard.tsx:**
- Ícone (ou letra inicial) do plugin
- Nome, versão, autor
- Status badge: 🟢 Ativo, ⚪ Desativado, 🔴 Erro
- Toggle switch
- Botão "Permissões" → abre modal com permissões

**PluginPermissionsDialog.tsx:**
- Lista de permissões solicitadas com toggle
- Similar ao PermissionPanel

### 6. Segurança

- PluginManager verifica permissões antes de cada operação sensível
 - Se plugin tenta `httpGet()` sem permissão `http.request` → operação bloqueada
 - Erro reportado ao plugin via retorno e logado no audit trail
- Plugins rodam no mesmo processo (sem sandbox de memória por enquanto)
 - Isolamento via permissões apenas (não via processo separado)

## Critérios de Aceitação
- [ ] Plugin .dll/.so é carregado via PluginManager
- [ ] Plugin recebe JarvisHost com acesso a serviços
- [ ] Manifest plugin.json define metadados corretamente
- [ ] Plugin pode ser desativado/ativado via UI
- [ ] Permissões de plugin são verificadas e bloqueadas
- [ ] Plugin pode ser instalado/desinstalado
- [ ] Eventos do sistema são broadcastados para plugins ativos

## Test Cases

### TC-001: Carregar plugin válido
- **Pré:** Plugin .dll em plugins/ com plugin.json válido
- **Passos:** 1. Scanner plugins/ 2. Carregar plugin
- **Resultado:** Plugin aparece na lista com name, version, author, status "loaded"
- **Cobertura:** normal

### TC-002: Plugin sem permissão
- **Pré:** Plugin sem permissão http.request
- **Passos:** 1. Plugin tenta httpGet()
- **Resultado:** Operação bloqueada, erro logado
- **Cobertura:** borda

### TC-003: Desativar plugin
- **Passos:** 1. Toggle plugin para disabled
- **Resultado:** Plugin é descarregado, não recebe mais eventos
- **Cobertura:** normal

### TC-004: Desinstalar plugin
- **Passos:** 1. Clicar "Desinstalar" no plugin
- **Resultado:** Plugin removido da lista, diretório deletado
- **Cobertura:** normal
