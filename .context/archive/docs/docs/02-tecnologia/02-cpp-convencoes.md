# Convencoes C++ do Projeto

## Padrao de Codigo

- **C++20** — usar recursos modernos (concepts, coroutines, modules onde possivel)
- **Clang-Format** baseado no estilo LLVM com indentacao 4 espacos
- **Clang-Tidy** para analise estatica

## Naming Convention

| Item | Convencao | Exemplo |
|------|-----------|---------|
| Classes | PascalCase | `ModuleLoader`, `KnowledgeService` |
| Metodos | camelCase | `loadModule()`, `getService()` |
| Variaveis | camelCase | `modulePath`, `loadedModules_` |
| Atributos privados | camelCase + _ sufixo | `modules_`, `handle_` |
| Constantes | kPascalCase | `kMaxDepth`, `kDefaultPort` |
| Enums | PascalCase | `LogLevel::Info`, `PermissionResult::Granted` |
| Macros | UPPER_SNAKE | `JARVIS_VERSION`, `JARVIS_API` |
| Namespaces | snake_case | `jarvis::core`, `jarvis::knowledge` |

## Estrutura de Arquivos

```
 include/jarvis/<modulo>/<arquivo>.h   // headers publicos
 src/<arquivo>.cpp                      // implementacao
 tests/test_<arquivo>.cpp              // testes
```

## Boas Praticas

- Preferir `std::unique_ptr` sobre raw pointers
- Nao usar `new`/`delete` explicitamente
- Usar `auto` quando o tipo for obvio da expressao
- Preferir `std::string_view` para parametros de leitura
- Usar `[[nodiscard]]` em funcoes que retornam valores que nao devem ser ignorados
- Usar `const` sempre que possivel
- Exceptions apenas para erros excepcionais (nao para fluxo normal)
- Logging com spdlog em vez de `printf`/`std::cout`

## Organizacao de Includes

```cpp
// 1. Header proprio (para .cpp)
#include "jarvis/kernel/module_loader.h"

// 2. Standards
#include <memory>
#include <string>
#include <vector>

// 3. Qt
#include <QString>
#include <QDir>

// 4. Projeto
#include "jarvis/api/module_api.h"
#include "jarvis/core/service_locator.h"

// 5. Biblioteca
#include <nlohmann/json.hpp>
#include <spdlog/spdlog.h>
```
