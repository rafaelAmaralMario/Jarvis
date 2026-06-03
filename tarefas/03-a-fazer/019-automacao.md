# 019 — Automação

## Metadados
- Status: a fazer
- Prioridade: 🟡 Média
- Fase: 5 — Inteligência & Automação
- Dependências: 018 (terminal para execução de comandos)
- Paralelizável com: 021
- Nota: Browser automation e desktop automation serão features futuras separadas

## Descrição
Workflow Engine + Painel de Automação no ActivityBar (⚡).
Permite criar, editar e executar workflows compostos por steps sequenciais.
Escopo reduzido: sem browser/desktop automation por enquanto.

## Especificação Técnica

### 1. C++ — AutomationManager

**Novo arquivo:** `kernel/include/jarvis/automation/automation_manager.h`
**Novo arquivo:** `kernel/src/automation/automation_manager.cpp`

```cpp
namespace jarvis::automation {

// Tipos de step
enum class StepType {
    RunCommand,     // Executa comando no terminal
    OpenFile,       // Abre arquivo no editor
    ApiCall,        // Faz requisição HTTP
    Wait,           // Aguarda N ms
    SendKeystroke,  // Envia tecla para o terminal ativo
    Notification,   // Mostra notificação
    Condition,      // If/else baseado em condição
};

struct WorkflowStep {
    std::string id;
    StepType type;
    std::map<std::string, std::string> params;
    // RunCommand: { command: "echo hello" }
    // OpenFile: { path: "/foo/bar.ts" }
    // ApiCall: { url: "...", method: "GET" }
    // Wait: { ms: "2000" }
    // Condition: { variable: "...", equals: "...", thenStep: "...", elseStep: "..." }
};

struct Workflow {
    std::string id;
    std::string name;
    std::string description;
    std::vector<WorkflowStep> steps;
    bool isEnabled;
    std::string lastRunAt;
    std::string lastRunStatus;  // "success" | "error" | "running"
};

class IAutomationManager {
public:
    virtual ~IAutomationManager() = default;

    // CRUD workflows
    virtual std::vector<Workflow> list() = 0;
    virtual Workflow get(const std::string& id) = 0;
    virtual Workflow create(const std::string& name, const std::string& description) = 0;
    virtual bool update(const Workflow& workflow) = 0;
    virtual bool remove(const std::string& id) = 0;

    // Execução
    virtual bool run(const std::string& id) = 0;
    virtual bool stop(const std::string& id) = 0;

    // Status
    virtual std::string getStatus(const std::string& id) = 0;  // "idle" | "running" | "error"
    virtual std::vector<std::string> getLog(const std::string& id) = 0;

    // Eventos
    virtual void setEventCallback(std::function<void(const std::string& workflowId, const std::string& event, const std::string& data)> cb) = 0;
};

IAutomationManager* createAutomationManager();

}
```

**Execução de steps:**
- Cada step executado em sequência (ou paralelo, se configurado)
- `RunCommand`: usa QProcess ou delega para o TerminalManager
- `OpenFile`: emite evento `open-file` que o React captura e abre no editor
- `ApiCall`: usa QNetworkAccessManager
- `Wait`: QThread::msleep em thread separada
- Workflows rodam em `QThread` separado para não bloquear a UI
- Eventos: `workflow-step-start`, `workflow-step-end`, `workflow-error`, `workflow-complete`

### 2. Migration #9 — `workflows`

```sql
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    steps_json TEXT NOT NULL DEFAULT '[]',
    is_enabled INTEGER NOT NULL DEFAULT 1,
    last_run_at TEXT,
    last_run_status TEXT DEFAULT 'idle',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

### 3. Bridge handlers

```cpp
bridge.registerHandler("automationList", [automationManager](const QVariantList&) -> QVariant { ... });
bridge.registerHandler("automationCreate", [automationManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("automationUpdate", [automationManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("automationDelete", [automationManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("automationRun", [automationManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("automationStop", [automationManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("automationGetLog", [automationManager](const QVariantList& args) -> QVariant { ... });
```

Eventos:
```cpp
automationManager->setEventCallback([&bridge](const std::string& id, const std::string& event, const std::string& data) {
    bridge.emitEvent(QString::fromStdString("automation-" + event), QVariantMap{
        {"id", QString::fromStdString(id)},
        {"data", QString::fromStdString(data)}
    });
});
```

### 4. React — Componentes

**AutomationPanel.tsx** — view ⚡ no ActivityBar:
- Lista de workflows com cards
- Cada card: nome, descrição, status (idle/running/error), última execução
- Botões: Run (▶), Edit (✏), Delete (🗑)
- Botão "Novo Workflow" abre WorkflowEditor
- Header: "Automação" + contagem de workflows

**WorkflowEditor.tsx** — editor de workflow:
- Nome + descrição
- Lista de steps com drag-and-drop para reordenar
- Cada step: tipo (dropdown) + parâmetros (inputs dinâmicos conforme tipo)
- Botão "Adicionar Step", "Salvar", "Executar"
- Validação: pelo menos 1 step, parâmetros obrigatórios preenchidos

**WorkflowStepCard.tsx** — card de step no editor:
- Ícone do tipo (▶ comando, 📄 arquivo, 🌐 api, ⏱ wait, 🔔 notificação)
- Nome do step
- Parâmetros resumidos
- Botões: editar, remover, mover para cima/baixo

**WorkflowLog.tsx** — log de execução:
- Abaixo do editor quando workflow está rodando
- Linhas: timestamp + mensagem (step iniciou, step concluiu, erro)
- Auto-scroll para últimas linhas

### 5. Integração com Terminal

Quando um step `RunCommand` executa:
1. AutomationManager cria terminal via TerminalManager (se não existir)
2. Escreve comando no stdin do terminal
3. Aguarda saída (timeout configurável)
4. Loga output no workflow log
5. Notifica React via evento

## Critérios de Aceitação
- [ ] Workflow pode ser criado com nome + descrição + steps
- [ ] Workflow pode ser editado (reordenar, adicionar, remover steps)
- [ ] Step tipo RunCommand executa comando no terminal
- [ ] Step tipo OpenFile abre arquivo no editor
- [ ] Step tipo Wait aguarda N ms
- [ ] Workflow executa steps em sequência
- [ ] Status do workflow é reportado em tempo real
- [ ] Workflow pode ser interrompido (stop)
- [ ] Painel ⚡ funciona no ActivityBar (antes era placeholder null)

## Test Cases

### TC-001: Criar workflow vazio
- **Passos:** 1. Abrir Automação 2. Clicar "Novo Workflow" 3. Nome "Teste" 4. Salvar
- **Resultado:** Workflow aparece na lista com status idle
- **Cobertura:** normal

### TC-002: Executar comando
- **Passos:** 1. Criar workflow com step RunCommand("echo hello") 2. Executar
- **Resultado:** Workflow completa com sucesso, log mostra "hello"
- **Cobertura:** normal

### TC-003: Executar OpenFile
- **Passos:** 1. Workflow com step OpenFile("caminho/arquivo.ts") 2. Executar
- **Resultado:** Arquivo abre no editor automaticamente
- **Cobertura:** normal

### TC-004: Workflow com múltiplos steps
- **Passos:** 1. Criar workflow: Wait(1s) → RunCommand("echo step2") → Wait(500ms) → RunCommand("echo step4")
- **Resultado:** Steps executam em ordem, logs mostram progresso
- **Cobertura:** normal

### TC-005: Interromper workflow
- **Passos:** 1. Executar workflow com Wait(30s) 2. Clicar Stop durante execução
- **Resultado:** Workflow para imediatamente, status = idle
- **Cobertura:** normal

### TC-006: View ⚡ deixa de ser placeholder
- **Pré:** ActivityBar com view ⚡ Automação
- **Passos:** 1. Clicar ⚡
- **Resultado:** AutomationPanel renderiza com lista de workflows (mesmo que vazia)
- **Cobertura:** normal
