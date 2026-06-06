# Convencoes C++ (Historico — Preservado para Referencia)

> **AVISO:** Este documento descreve convencoes do codigo C++ original, que foi migrado para Python. O codigo C++ encontra-se em `.old/old-cpp/` para referencia historica. Toda a base ativa do JARVIS usa Python 3.14 com as convencoes descritas em CONTEXTO-COMPLETO.md.

## Padrão da Linguagem

- **C++20** (compilado com `/std:c++20` no MSVC, `-std=c++20` no GCC/Clang)
- Uso permitido: concepts, ranges, coroutines (se aplicável), modules (futuro)
- Uso proibido: exceções no hot path, RTTI (onde evitarável), casts estilo C

## Estilo de Código

- **Indentação**: 4 espaços (sem tabs)
- **Naming**:
  - Classes: `PascalCase` — `ServiceLocator`, `ModuleLoader`
  - Métodos: `snake_case` — `getService<T>()`, `load_module()`
  - Variáveis: `snake_case` — `module_path`, `active_count`
  - Constantes: `UPPER_SNAKE_CASE` — `MAX_MODULES`, `API_VERSION`
  - Namespaces: `jarvis::core`, `jarvis::persistence`
- **Headers**: extensão `.h`, implementations em `.cpp`
- **Include guards**: `#pragma once` (padrão)

## Convenções Qt

- **Q_OBJECT** em toda classe que usa signals/slots
- Preferir `connect()` com functor (5 args) em vez de macros `SIGNAL()`/`SLOT()`
- Usar `QString` em vez de `std::string` na interface com Qt
- Usar `QList`/`QVector` em vez de `std::vector` quando passar para Qt APIs
- `QJsonDocument`/`QJsonObject` para JSON (com nlohmann_json para parsing complexo)

## Serviços (Service Locator)

```cpp
// Registro
service_locator->registerService<IDatabase>(db);

// Obtenção
auto db = service_locator->getService<IDatabase>();
```

## Bridge Handlers

```cpp
bridge_handler->registerHandler("knowledge/search_notes",
    [this](const QJsonObject& args) -> QString {
        auto query = args["query"].toString();
        auto results = knowledge_manager_->search_notes(query);
        QJsonArray arr = ...;
        return QJsonDocument(arr).toJson(QJsonDocument::Compact);
    });
```

## Testes (Catch2)

```cpp
TEST_CASE("Service Locator deve retornar servico registrado", "[core]") {
    ServiceLocator locator;
    locator.registerService<IMockService>(std::make_shared<MockService>());
    auto svc = locator.getService<IMockService>();
    REQUIRE(svc != nullptr);
}
```
