# 002 — Estrutura C++ Kernel

## Metadados
- **Status:** ✅ Concluída
- **Prioridade:** 🔴 Alta
- **Dependências:** 001 (Fundação do Projeto)

## Descrição
Implementar o núcleo C++ do JARVIS: entry point, sistema de módulos, service locator,
permission manager, e a ponte WebChannel para comunicação com React.

## Especificação Técnica

### Arquivos Criados
```
kernel/
├── CMakeLists.txt
├── include/jarvis/
│   ├── api/
│   │   └── module_api.h           ← ABI pública (C-linkage)
│   └── core/
│       ├── module_loader.h         ← Descoberta/carga topológica
│       ├── service_locator.h       ← Service Locator com getService<T>()
│       └── permission_manager.h    ← Permission Manager
├── src/
│   ├── main.cpp                    ← QApplication + WebEngineView + Bridge
│   ├── module_loader.cpp           ← LoadLibrary/dlopen, init topológico
│   ├── lifecycle.cpp
│   ├── service_locator.cpp         ← Implementação
│   ├── permission_manager.cpp      ← Implementação
│   └── bridge/
│       └── web_channel.cpp         ← Handlers JSON-RPC
└── resources/
    ├── qml/main.qml                ← UI shell (substituído por WebEngine)
    └── jarvis.qrc                  ← Qt resource file
```

### Interfaces

**ModuleAPI (C ABI):**
```c
struct ModuleAPI {
    const char* (*id)();
    const char* (*version)();
    bool (*init)();
    void (*shutdown)();
    const struct ModuleManifest* (*manifest)();
};
```

**Service Locator:**
```cpp
class ServiceLocator {
    void registerService(const string& name, void* service);
    void* getService(const string& name);
    template<T> T* getService(const string& name);
    bool hasService(const string& name);
    void unregisterService(const string& name);
};
```

**Module Loader:**
```cpp
class ModuleLoader {
    vector<ModuleInfo> discover(const string& path);
    bool loadAll(vector<ModuleInfo>& modules);
    void shutdownAll();
    // Ordenação topológica por dependências
};
```

## Critérios de Aceitação
- [x] main.cpp com QApplication + QWebEngineView + WebChannel + ModuleLoader
- [x] ModuleAPI com C-linkage para .dll/.so
- [x] Service Locator com getService tipado
- [x] Module Loader com carga topológica (dependências)
- [x] Permission Manager
- [x] Bridge WebChannel com handlers JSON-RPC
- [x] CMake configurado com Qt6 (Core, Gui, WebEngine, WebChannel, Sql, Network)

---

## Test Cases

### TC-001: main.cpp inicializa corretamente
- **Pré-condições:** Qt 6.8+ instalado com WebEngine
- **Passos:**
  1. Compilar kernel: `cmake --preset default && cmake --build build/default`
  2. Executar `./build/default/jarvis`
- **Resultado esperado:** Janela aparece com WebEngineView carregando UI
- **Cobertura:** normal

### TC-002: Service Locator registra e recupera serviços
- **Pré-condições:** Kernel compilado
- **Passos:**
  1. Criar serviço mock `struct Foo : public IFoo { ... }`
  2. `locator.registerService("foo", new Foo())`
  3. `auto* foo = locator.getService<IFoo>("foo")`
- **Resultado esperado:** foo não é nullptr, métodos de IFoo funcionam
- **Cobertura:** normal

### TC-003: Service Locator retorna nullptr para serviço inexistente
- **Pré-condições:** ServiceLocator vazio
- **Passos:**
  1. `auto* svc = locator.getService("nao_existe")`
- **Resultado esperado:** svc == nullptr
- **Cobertura:** borda

### TC-004: Service Locator hasService funciona
- **Pré-condições:** "foo" registrado
- **Passos:**
  1. `locator.hasService("foo")` → true
  2. `locator.hasService("bar")` → false
  3. `locator.unregisterService("foo")`
  4. `locator.hasService("foo")` → false
- **Resultado esperado:** Comportamento correto
- **Cobertura:** normal | borda

### TC-005: Module Loader descobre módulos .dll/.so
- **Pré-condições:** Pasta modules/ com pelo menos um .dll/.so válido
- **Passos:**
  1. `auto modules = loader.discover("modules/")`
  2. Verificar que modules não está vazio
  3. Verificar que cada module tem id, name, version
- **Resultado esperado:** Módulos descobertos e parsed
- **Cobertura:** normal

### TC-006: Module Loader ordena topologicamente
- **Pré-condições:** Módulos A (dep: nenhuma), B (dep: A), C (dep: A, B)
- **Passos:**
  1. `loader.loadAll(modules)`
  2. Verificar ordem: A → B → C
- **Resultado esperado:** Init chamado na ordem correta de dependências
- **Cobertura:** normal

### TC-007: Module Loader detecta ciclo de dependências
- **Pré-condições:** Módulos A → B → A (ciclo)
- **Passos:**
  1. `loader.loadAll(modules)`
- **Resultado esperado:** Erro de ciclo detectado, módulos não carregados
- **Cobertura:** erro

### TC-008: Permission Manager concede/nega permissões
- **Pré-condições:** PermissionManager inicializado
- **Passos:**
  1. `pm.requestPermission("module-x", "read_file")` → Granted
  2. `pm.checkPermission("module-x", "read_file")` → Granted
  3. `pm.checkPermission("module-x", "network")` → Denied
- **Resultado esperado:** Permissões funcionam
- **Cobertura:** normal | borda

### TC-009: Bridge WebChannel responde a JSON-RPC
- **Pré-condições:** Kernel rodando com WebEngine
- **Passos:**
  1. Enviar `{"id":"1","method":"getModules","args":[]}`
  2. Aguardar resposta
- **Resultado esperado:** Resposta `{"id":"1","result":[...]}`
- **Cobertura:** normal

### TC-010: Bridge WebChannel retorna erro para método inválido
- **Pré-condições:** Kernel rodando
- **Passos:**
  1. Enviar `{"id":"1","method":"metodoInvalido","args":[]}`
- **Resultado esperado:** Resposta `{"id":"1","error":"Unknown method"}`
- **Cobertura:** erro
