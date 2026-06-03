# 013 — Testes Integrados

## Metadados
- **Status:** ⬜ A Fazer
- **Prioridade:** 🟢 Baixa
- **Dependências:** 002 (Estrutura C++ Kernel), 003 (UI React Base), 005 (Models & Agents C++), 007 (Bridge WebChannel)

## Descrição
Implementar suíte de testes automatizados para C++ (Catch2) e React
(Vitest + React Testing Library), cobrindo unit tests, integration tests,
e mocks para dependências externas (Ollama, sistema de arquivos).

## Especificação Técnica

### Stack de Testes
- **C++:** Catch2 v3 (header-only ou CMake fetch)
- **React:** Vitest + @testing-library/react + msw
- **Cobertura:** gcovr (C++) + c8/v8 (React)

### Arquivos de Teste C++
```
kernel/tests/
├── CMakeLists.txt
├── test_main.cpp               ← Catch2 main
├── test_service_locator.cpp    ← Já existe
├── test_module_loader.cpp      ← Já existe
├── test_models_manager.cpp     ← Mock Ollama HTTP
├── test_agents_manager.cpp     ← In-memory SQLite
├── test_orchestration.cpp      ← Mock agents
├── test_ollama_client.cpp      ← Mock HTTP server
├── test_permission_manager.cpp ← Já existe
├── test_database.cpp           ← In-memory SQLite
├── test_migration_runner.cpp   ← Temp DB
├── test_knowledge.cpp          ← Test notes CRUD
├── test_workspace.cpp          ← Temp dirs
└── mocks/
    ├── mock_ollama_server.hpp   ← HTTP mock server
    └── mock_agent.hpp           ← Agent mock
```

### Arquivos de Teste React
```
ui/src/
├── __tests__/
│   ├── ActivityBar.test.tsx
│   ├── AiPanel.test.tsx
│   ├── Sidebar.test.tsx
│   ├── Settings/
│   │   ├── ModelsPanel.test.tsx
│   │   ├── AgentsPanel.test.tsx
│   │   ├── AgentFormDialog.test.tsx
│   │   └── OrchestrationPanel.test.tsx
│   └── hooks/
│       └── use-jarvis.test.ts
├── setup.ts                    ← Test setup (jsdom, mocks)
└── mocks/
    └── bridge.ts               ← Mock window.jarvis
```

### CMake Integration
```cmake
# Fetch Catch2
include(FetchContent)
FetchContent_Declare(Catch2 GIT_REPOSITORY ...)
FetchContent_MakeAvailable(Catch2)

# Test target
add_executable(jarvis-tests ${TEST_SRC})
target_link_libraries(jarvis-tests PRIVATE jarvis Catch2::Catch2)
add_test(NAME jarvis-tests COMMAND jarvis-tests)
```

## Critérios de Aceitação
- [ ] Catch2 configurado no CMake
- [ ] Vitest configurado no React
- [ ] Mocks para HTTP (Ollama), filesystem, SQLite
- [ ] Testes unitários para cada módulo C++
- [ ] Testes de componentes React
- [ ] Testes de bridge (integração)
- [ ] Cobertura mínima 70%

---

## Test Cases

### TC-001: Testes C++ rodam sem erro
- **Pré-condições:** CMake configurado com Catch2
- **Passos:**
  1. `ctest --preset test` ou `./build/default/tests/jarvis-tests`
- **Resultado esperado:** Todos os testes passam (green)
- **Cobertura:** normal

### TC-002: Testes React rodam sem erro
- **Pré-condições:** Dependências npm instaladas
- **Passos:**
  1. `cd ui && npx vitest run`
- **Resultado esperado:** Todos os testes passam
- **Cobertura:** normal

### TC-003: Mock Ollama server responde
- **Pré-condições:** Mock server configurado
- **Passos:**
  1. MockOllamaServer espera GET /api/tags
  2. ModelsManager.listModels()
  3. Verificar que mock foi chamado
- **Resultado esperado:** Mock intercepta chamada, resposta controlada
- **Cobertura:** normal

### TC-004: Mock Ollama server simula erro
- **Pré-condições:** Mock configurado para retornar 500
- **Passos:**
  1. ModelsManager.listModels()
- **Resultado esperado:** Erro tratado, não crash
- **Cobertura:** erro

### TC-005: Teste de componente AiPanel
- **Pré-condições:** Bridge mockada
- **Passos:**
  1. Renderizar `<AiPanel />`
  2. Simular input e submit
- **Resultado esperado:** Mensagem aparece no DOM
- **Cobertura:** normal

### TC-006: Teste de formulário AgentFormDialog
- **Pré-condições:** Bridge mockada
- **Passos:**
  1. Renderizar AgentFormDialog
  2. Preencher campos inválidos
  3. Clicar Salvar
- **Resultado esperado:** Erros de validação visíveis
- **Cobertura:** borda | erro

### TC-007: Teste de ActivityBar navegação
- **Pré-condições:** App renderizado
- **Passos:**
  1. Clicar em cada ícone
  2. Verificar activeView mudou
- **Resultado esperado:** activeView atualiza, componente correspondente aparece
- **Cobertura:** normal

### TC-008: Report de cobertura C++
- **Pré-condições:** Compilado com --coverage
- **Passos:**
  1. Rodar testes
  2. `gcovr -r . --html --output coverage.html`
- **Resultado esperado:** HTML gerado com % por arquivo
- **Cobertura:** normal

### TC-009: Report de cobertura React
- **Pré-condições:** vitest configurado com coverage
- **Passos:**
  1. `cd ui && npx vitest run --coverage`
- **Resultado esperado:** Report de cobertura (text + HTML)
- **Cobertura:** normal

### TC-010: Teste de bridge (integração mock)
- **Pré-condições:** Bridge mock registrada
- **Passos:**
  1. `window.jarvis.sendMessage("test", "agent-1")`
  2. Verificar retorno
- **Resultado esperado:** Resposta mock retorna sem erro
- **Cobertura:** normal
