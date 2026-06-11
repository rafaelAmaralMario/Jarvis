# Catalogo de Modulos — JARVIS

**Versao:** 0.1  
**Data:** 2026-06-03  
**Objetivo:** Catalogar todos os modulos do sistema com suas responsabilidades, interfaces, dependencias e principios SOLID aplicados.

---

## 1. Arquitetura em Camadas com SOLID

### Mapeamento SOLID

| Principio | Como se aplica |
|-----------|---------------|
| **S** — Single Responsibility | Cada modulo tem **uma razao** para mudar. Um modulo que faz "editor + git + terminal" viola SRP — deve ser tres modulos separados. |
| **O** — Open/Closed | Modulos sao **abertos para extensao** (novo modulo = nova .dll) e **fechados para modificacao** (kernel nunca precisa mudar ao adicionar modulo). |
| **L** — Liskov Substitution | Toda interface de servico deve ser **substituivel** por outra implementacao sem quebrar consumidores. Ex: `OllamaProvider` ↔ `OpenAIProvider`. |
| **I** — Interface Segregation | Interfaces **pequenas e especificas**. `ModuleAPI` nao deve ter `on_activate` opcional — melhor ter `ActivatableModule` separado. |
| **D** — Dependency Inversion | Modulos dependem de **abstracoes** (interfaces), nao de implementacoes concretas. Service Locator com `void*` viola DIP — precisa de interfaces tipadas. |

### Pirâmide de Camadas

```
                    ┌──────────────────────────────────────┐
 Layer 4            │           Extensao                   │
 (Extension)        │     Plugins (API publica 3rd party)  │
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
 Layer 3            │        Apresentacao (UI)             │
 (Presentation)     │  IDE · Voz · Perifericos            │
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
 Layer 2            │         Dominio (Core Logic)         │
 (Domain)           │  Conhecimento · AI Engine · Automacao│
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
 Layer 1            │      Infraestrutura (Servicos)       │
 (Infrastructure)   │  Workspace · Seguranca · Rede ·      │
                    │  Persistencia (SQLite)               │
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
 Layer 0            │      Kernel (Plataforma)             │
 (Platform)         │  Module Loader · Service Locator ·   │
                    │  WebEngine Bridge · Permission Mgmt   │
                    └──────────────────────────────────────┘
```

**Regra de Dependencia:** Um modulo so pode depender de modulos em camadas **inferiores** a sua. Kernel (L0) nao depende de ninguem. Plugins (L4) dependem de todos.

---

## 2. Catalogo de Modulos por Camada

### Layer 0 — Kernel (Plataforma)

| Modulo | ID | Depende de | SRP? | Status |
|--------|----|-----------|------|--------|
| **Kernel** | `jarvis.kernel` | — | ✅ | Em andamento |

**Responsabilidade:** Carregar modulos, gerenciar lifecycle, prover Service Locator tipado, bridge WebChannel.

**Interfaces que fornece:**
```cpp
// ISP: interfaces segregadas em vez de ModuleAPI gigante
struct IModule {
    virtual const char* id() = 0;
    virtual const char* version() = 0;
};

struct IInitializable : IModule {
    virtual bool init() = 0;         // OBRIGATORIO
    virtual void shutdown() = 0;     // OBRIGATORIO
};

struct IActivatable : IModule {      // OPCIONAL — so se tiver ativacao
    virtual bool onActivate() = 0;
    virtual void onDeactivate() = 0;
};

struct IServiceProvider : IModule {  // OPCIONAL — so se oferecer servicos
    virtual void registerServices(IServiceRegistry* registry) = 0;
};

struct IConfigurable : IModule {     // OPCIONAL — so se tiver config
    virtual QWidget* createConfigWidget() = 0;
};
```

**DIP aplicado:** Service Locator deixa de ser `map<string, void*>` e passa a ser:
```cpp
struct IServiceRegistry {
    template<typename T>
    void registerService(T* service) = 0;       // Tipado!

    template<typename T>
    T* getService() = 0;                         // Tipado!
};
```

---

### Layer 1 — Infraestrutura

#### 1.1 Modulo Workspace

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.workspace` |
**Depende de** | Kernel (IServiceRegistry) |
| **SRP** | ✅ Apenas operacoes de sistema de arquivos |
| **Status** | Nao iniciado |

**Interfaces:**
```cpp
// ISP: separado em interfaces coesas
struct IFileSystemService {
    virtual std::vector<FileEntry> listDirectory(const std::string& path, int maxDepth = 8) = 0;
    virtual std::string readFile(const std::string& path) = 0;
    virtual bool writeFile(const std::string& path, const std::string& content) = 0;
    virtual bool createFile(const std::string& path) = 0;
    virtual bool createDirectory(const std::string& path) = 0;
    virtual bool deleteEntry(const std::string& path) = 0;
    virtual bool renameEntry(const std::string& oldPath, const std::string& newPath) = 0;
};

struct ISearchService {
    virtual std::vector<SearchResult> search(const std::string& query, const std::string& rootPath) = 0;
};

struct IFileWatcher {
    using Callback = std::function<void(const std::string& path, ChangeType type)>;
    virtual void watch(const std::string& path) = 0;
    virtual void unwatch(const std::string& path) = 0;
    virtual void setCallback(Callback cb) = 0;
};
```

**OCP:** Novo sistema de arquivos (ex: SFTP, cloud) = nova implementacao de `IFileSystemService`. Nada existente muda.

---

#### 1.2 Modulo Seguranca

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.security` |
| **Depende de** | Kernel, Persistencia |
| **SRP** | ✅ Apenas seguranca, permissoes, criptografia |
| **Status** | Nao iniciado |

**Interfaces segregadas:**
```cpp
struct IPermissionService {
    virtual PermissionResult checkPermission(const std::string& moduleId, const std::string& permission) = 0;
    virtual void grantPermission(const std::string& moduleId, const std::string& permission) = 0;
    virtual void revokePermission(const std::string& moduleId, const std::string& permission) = 0;
    virtual std::vector<std::string> listGranted(const std::string& moduleId) = 0;
};

struct ICredentialService {
    virtual void storeSecret(const std::string& key, const std::string& value) = 0;
    virtual std::optional<std::string> loadSecret(const std::string& key) = 0;
    virtual void deleteSecret(const std::string& key) = 0;
};

struct IAuditService {
    virtual void logEvent(const std::string& actor, const std::string& action,
                          const std::string& target, AuditResult result) = 0;
    virtual std::vector<AuditEvent> queryEvents(const AuditFilter& filter) = 0;
};

struct IEncryptionService {
    virtual std::vector<uint8_t> encrypt(const std::vector<uint8_t>& data) = 0;
    virtual std::vector<uint8_t> decrypt(const std::vector<uint8_t>& ciphertext) = 0;
};
```

---

#### 1.3 Modulo Rede

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.network` |
| **Depende de** | Kernel, Seguranca |
| **SRP** | ✅ Apenas comunicacao em rede |
| **Status** | Nao iniciado |

**Interfaces segregadas:**
```cpp
struct IHttpClient {
    virtual HttpResponse get(const std::string& url, const HttpHeaders& headers = {}) = 0;
    virtual HttpResponse post(const std::string& url, const std::string& body,
                              const HttpHeaders& headers = {}) = 0;
    // LSP: metodos que todo HTTP client precisa, nada mais
};

struct IWebSocketServer {
    virtual void start(int port) = 0;
    virtual void stop() = 0;
    virtual void broadcast(const std::string& message) = 0;
    // LSP: qualquer implementacao de WebSocket server pode substituir
};

struct IOAuthService {
    virtual void startFlow(const std::string& provider) = 0;
    virtual std::optional<std::string> getAccessToken(const std::string& provider) = 0;
    virtual void refreshToken(const std::string& provider) = 0;
};
```

---

#### 1.4 Modulo Persistencia

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.persistence` |
| **Depende de** | Kernel, Seguranca |
| **SRP** | ✅ Apenas banco de dados e storage |
| **Status** | Nao iniciado |

```cpp
// ISP: separado por dominio de dados
struct INoteRepository {
    virtual std::vector<Note> listNotes(const std::string& folder) = 0;
    virtual std::optional<Note> getNote(const std::string& id) = 0;
    virtual Note createNote(const std::string& title, const std::string& folder) = 0;
    virtual bool updateNote(const Note& note) = 0;
    virtual bool deleteNote(const std::string& id) = 0;
};

struct ISettingsRepository {
    virtual std::optional<std::string> getSetting(const std::string& key) = 0;
    virtual void setSetting(const std::string& key, const std::string& value) = 0;
};

struct IConversationRepository {
    virtual std::vector<Conversation> listConversations() = 0;
    virtual Conversation createConversation(const std::string& title) = 0;
    virtual bool addMessage(const Message& message) = 0;
    virtual std::vector<Message> getMessages(const std::string& conversationId) = 0;
};
```

---

### Layer 2 — Dominio (Core Logic)

#### 2.1 Modulo Conhecimento **(FEATURE PRINCIPAL)**

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.knowledge` |
| **Depende de** | Kernel, Workspace, Persistencia |
| **SRP** | ✅ Apenas gestao de conhecimento (notas, grafos, busca) |
| **Status** | Nao iniciado |

```cpp
struct INoteService {
    virtual std::vector<NoteSummary> listNotes(const std::string& folder) = 0;
    virtual Note getNote(const std::string& id) = 0;
    virtual Note createNote(const std::string& title, const std::string& content,
                            const std::vector<std::string>& tags) = 0;
    virtual bool updateNote(const Note& note) = 0;
    virtual bool deleteNote(const std::string& id) = 0;
};

struct IGraphService {
    virtual std::vector<Link> getBacklinks(const std::string& noteId) = 0;
    virtual std::vector<Link> getForwardLinks(const std::string& noteId) = 0;
    virtual std::vector<GraphNode> getFullGraph() = 0;
};

struct ISearchService {
    virtual std::vector<SearchResult> search(const std::string& query) = 0;
    virtual std::vector<SearchResult> semanticSearch(const std::string& query) = 0; // futuro
};

struct IContextProvider {  // Para integrar com AI Engine
    virtual std::vector<ContextChunk> getRelevantContext(const std::string& query, int limit = 5) = 0;
};
```

**DIP:** `IContextProvider` e uma abstração que o Conhecimento implementa e o AI Engine consome. Nenhum dos dois conhece o outro diretamente.

---

#### 2.2 Modulo AI Engine

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.ai-engine` |
| **Depende de** | Kernel, Conhecimento, Rede |
| **SRP** | ⚠️ **ATENCAO:** Atualmente mistura modelos + chat + agentes |
| **Refatoracao SOLID** | Deve ser SEPARADO em 3 modulos (ou 3 servicos dentro do mesmo modulo) |
| **Status** | Nao iniciado |

**SRP — Deve ser dividido em:**

```
AI Engine (modulo) ── fornece:
  ├── IModelService     ← Gerenciamento de provedores de modelo
  ├── IChatService      ← Conversacao e streaming
  └── IAgentService     ← Orquestracao de agentes
```

```cpp
// SRP #1: Provedores de Modelo
struct IModelProvider {           // LSP: qualquer provedor e substituivel
    virtual std::string id() = 0;
    virtual std::string name() = 0;
    virtual bool isAvailable() = 0;
    virtual ModelResult sendMessage(const ModelRequest& request) = 0;
};

struct IModelRegistry {           // SRP: apenas gerenciar modelos
    virtual std::vector<ModelInfo> listModels() = 0;
    virtual void registerProvider(std::unique_ptr<IModelProvider> provider) = 0;
    virtual IModelProvider* getActiveProvider() = 0;
    virtual void setActiveProvider(const std::string& id) = 0;
};

// SRP #2: Conversa
struct IChatService {
    virtual std::string sendMessage(const std::string& input,
                                    StreamCallback onToken = nullptr) = 0;
    virtual void cancelGeneration() = 0;
    virtual std::vector<Message> getHistory() = 0;
    virtual void clearHistory() = 0;
};

// SRP #3: Agentes
struct IAgent {
    virtual std::string id() = 0;
    virtual std::string name() = 0;
    virtual AgentResult execute(const std::string& input) = 0;
};

struct IAgentRegistry {
    virtual std::vector<AgentInfo> listAgents() = 0;
    virtual void registerAgent(std::unique_ptr<IAgent> agent) = 0;
    virtual IAgent* getAgent(const std::string& id) = 0;
};
```

**LSP:** `OllamaProvider`, `OpenAIProvider`, `MockProvider` — todos implementam `IModelProvider`, intercambiaveis.

---

#### 2.3 Modulo Automacao

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.automation` |
| **Depende de** | Kernel, AI Engine, Rede |
| **SRP** | ⚠️ Browser + desktop + terminal juntos — precisa separar |
| **Status** | Nao iniciado |

**Separacao SRP:**

```cpp
struct IBrowserAutomation {
    virtual void navigate(const std::string& url) = 0;
    virtual void click(const std::string& selector) = 0;
    virtual void type(const std::string& selector, const std::string& text) = 0;
    virtual std::string getText(const std::string& selector) = 0;
    virtual std::vector<uint8_t> screenshot() = 0;
};

struct IDesktopAutomation {
    virtual void moveMouse(int x, int y) = 0;
    virtual void clickMouse(MouseButton button) = 0;
    virtual void typeText(const std::string& text) = 0;
    virtual std::vector<uint8_t> captureScreen() = 0;
};

struct ICommandExecution {
    virtual int execute(const std::string& command, std::string& output) = 0;
    virtual void terminate() = 0;
};
```

---

### Layer 3 — Apresentacao (UI)

#### 3.1 Modulo IDE

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.ide` |
| **Depende de** | Kernel, Workspace |
| **SRP** | ❌ **VIOLADO** — editor + git + terminal no mesmo modulo |
| **Refatoracao** | Separar em 3 modulos independentes |
| **Status** | Nao iniciado |

**Separacao SRP correta:**

```cpp
// Modulo: jarvis.editor
struct IEditorService {
    virtual bool openFile(const std::string& path) = 0;
    virtual bool saveFile() = 0;
    virtual bool closeFile(const std::string& path) = 0;
    virtual std::string getContent() = 0;
    virtual void setContent(const std::string& content) = 0;
    virtual void setLanguage(const std::string& language) = 0;
    virtual std::vector<std::string> getOpenFiles() = 0;
};

// Modulo: jarvis.git
struct IGitService {
    virtual GitStatus getStatus() = 0;
    virtual bool stageFile(const std::string& path) = 0;
    virtual bool unstageFile(const std::string& path) = 0;
    virtual bool commit(const std::string& message) = 0;
    virtual bool push() = 0;
    virtual bool pull() = 0;
    virtual std::vector<Branch> listBranches() = 0;
    virtual bool checkout(const std::string& branch) = 0;
    virtual std::string getDiff(const std::string& path) = 0;
};

// Modulo: jarvis.terminal
struct ITerminalService {
    virtual void open() = 0;
    virtual void write(const std::string& input) = 0;
    virtual void resize(int cols, int rows) = 0;
    virtual void close() = 0;
};
```

---

#### 3.2 Modulo Voz

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.voice` |
| **Depende de** | Kernel, AI Engine |
| **SRP** | ✅ STT + TTS sao relacionados (audio) |
| **Status** | Nao iniciado |

```cpp
struct ISTTService {
    virtual void startListening() = 0;
    virtual void stopListening() = 0;
    virtual std::string transcribe(const std::vector<uint8_t>& audioData) = 0;
};

struct ITTSService {
    virtual void speak(const std::string& text) = 0;
    virtual void stopSpeaking() = 0;
    virtual bool isSpeaking() = 0;
};
```

---

#### 3.3 Modulo Perifericos

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.peripherals` |
| **Depende de** | Kernel, Seguranca |
| **SRP** | ⚠️ Mic + webcam + notificacoes — separar |
| **Status** | Nao iniciado |

```cpp
// SRP: cada um separado
struct IMicrophoneService {
    virtual void startCapture() = 0;
    virtual void stopCapture() = 0;
    virtual std::vector<uint8_t> getAudioBuffer() = 0;
};

struct ICameraService {
    virtual void startCapture() = 0;
    virtual void stopCapture() = 0;
    virtual std::vector<uint8_t> captureFrame() = 0;
};

struct INotificationService {
    virtual void show(const std::string& title, const std::string& message) = 0;
};
```

---

### Layer 4 — Extensao

#### 4.1 Modulo Plugins

| Propriedade | Valor |
|------------|-------|
| **ID** | `jarvis.plugins` |
| **Depende de** | Kernel, Seguranca, todos os modulos (API limitada) |
| **SRP** | ✅ Apenas gerenciar plugins de terceiros |
| **Status** | Nao iniciado |

```cpp
struct IPluginHost {
    virtual const char* getPluginDirectory() = 0;
    virtual void registerService(const char* name, void* service) = 0;
};

struct IPlugin {
    virtual const char* id() = 0;
    virtual bool load(IPluginHost* host) = 0;
    virtual void unload() = 0;
};
```

**DIP:** Plugins nao acessam modulos internos diretamente — so a API publica que o kernel expoe via `IPluginHost`.

---

## 3. Resumo: Violacoes SOLID no Design Atual

| Modulo | Violacao | Correcao |
|--------|----------|---------|
| `ModuleAPI` (kernel) | **ISP** — interface grande com campos opcionais | Separar em `IInitializable`, `IActivatable`, `IServiceProvider`, `IConfigurable` |
| `ServiceLocator` (kernel) | **DIP** — `void*` sem tipo | Substituir por `IServiceRegistry` com template `getService<T>()` |
| `AI Engine` | **SRP** — modelos + chat + agentes | Separar em 3 servicos com interfaces distintas |
| `IDE` | **SRP** — editor + git + terminal | Separar em 3 modulos independentes |
| `Automacao` | **SRP** — browser + desktop + comandos | Separar em servicos segregados |
| `Perifericos` | **SRP** — mic + webcam + notificacoes | Separar em servicos segregados |

## 4. Tabela Final de Modulos (versao SOLID)

| # | Modulo | Camada | ID | SRP | Depende de |
|---|--------|--------|----|-----|-----------|
| 1 | **Kernel** | L0 | `jarvis.kernel` | ✅ | — |
| 2 | **Workspace** | L1 | `jarvis.workspace` | ✅ | L0 |
| 3 | **Seguranca** | L1 | `jarvis.security` | ✅ | L0 |
| 4 | **Rede** | L1 | `jarvis.network` | ✅ | L0, L1 |
| 5 | **Persistencia** | L1 | `jarvis.persistence` | ✅ | L0, L1 |
| 6 | **Conhecimento** | L2 | `jarvis.knowledge` | ✅ | L0, L1 |
| 7 | **AI Engine** | L2 | `jarvis.ai-engine` | ⚠️ Refatorar | L0, L1, L2 |
| 8 | **Automacao** | L2 | `jarvis.automation` | ⚠️ Refatorar | L0, L1, L2 |
| 9 | **Editor** | L3 | `jarvis.editor` | ✅ | L0, L1 |
| 10 | **Git** | L3 | `jarvis.git` | ✅ | L0, L1 |
| 11 | **Terminal** | L3 | `jarvis.terminal` | ✅ | L0 |
| 12 | **Voz** | L3 | `jarvis.voice` | ✅ | L0, L1, L2 |
| 13 | **Perifericos** (separado) | L3 | `jarvis.peripherals` | ✅ | L0, L1 |
| 14 | **Plugins** | L4 | `jarvis.plugins` | ✅ | L0, L1, L2, L3 |

**Total: 14 modulos** (vs 11 na versao anterior) — editor, git e terminal foram separados do IDE.

## 5. Ordem de Implementacao (com SOLID)

```
Fase 1 — Plataforma (L0 + L1 essenciais)
  Kernel → Workspace → Persistencia → Seguranca

Fase 2 — Feature Principal (L2)
  Conhecimento ← FEATURE PRINCIPAL (cerebro)
  
Fase 3 — IA (L2)
  AI Engine (modelos separados de chat separados de agentes)
  Rede

Fase 4 — Produtividade (L3)
  Editor → Git → Terminal

Fase 5 — Automacao (L2 + L3)
  Automacao → Voz → Perifericos

Fase 6 — Extensao (L4)
  Plugins
```

**Cada modulo novo deve:** implementar interfaces segregadas, registrar-se no Service Registry tipado, depender apenas de camadas inferiores.
