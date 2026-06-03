# 022 — Rede & OAuth

## Metadados
- Status: a fazer
- Prioridade: 🟡 Média
- Fase: 3 — Produtividade Imediata
- Dependências: (nenhuma)
- Paralelizável com: 017, 018

## Descrição
Serviços de rede: HTTP client, OAuth flow (GitHub/Google), WebSocket client
e gerenciamento de API keys. Necessário para Git push/pull com OAuth (020).

## Especificação Técnica

### 1. C++ — NetworkManager

**Novo arquivo:** `kernel/include/jarvis/network/network_manager.h`
**Novo arquivo:** `kernel/src/network/network_manager.cpp`

```cpp
namespace jarvis::network {

struct HttpResponse {
    int statusCode;
    std::string body;
    std::map<std::string, std::string> headers;
};

class INetworkManager {
public:
    virtual ~INetworkManager() = default;
    
    // HTTP
    virtual HttpResponse get(const std::string& url, const std::map<std::string, std::string>& headers = {}) = 0;
    virtual HttpResponse post(const std::string& url, const std::string& body, const std::string& contentType = "application/json", const std::map<std::string, std::string>& headers = {}) = 0;
    
    // OAuth
    virtual std::string startOAuth(const std::string& provider) = 0;  // retorna URL
    virtual std::string completeOAuth(const std::string& provider, const std::string& code) = 0;  // retorna token
    virtual std::string getStoredToken(const std::string& provider) = 0;
    virtual bool clearToken(const std::string& provider) = 0;
    
    // WebSocket
    virtual void connectWebSocket(const std::string& url) = 0;
    virtual void sendWebSocket(const std::string& data) = 0;
    virtual void disconnectWebSocket() = 0;
    virtual void setWebSocketCallback(std::function<void(const std::string& data)> onMessage, std::function<void()> onConnected, std::function<void(const std::string& error)> onError) = 0;
    
    // API Keys
    virtual bool storeApiKey(const std::string& service, const std::string& key) = 0;
    virtual std::string getApiKey(const std::string& service) = 0;
    virtual bool deleteApiKey(const std::string& service) = 0;
    virtual std::vector<std::string> listApiKeys() = 0;
};

INetworkManager* createNetworkManager(jarvis::persistence::IDatabase* db);

}
```

**Implementação:**
- HTTP: `QNetworkAccessManager` com requests assíncronas (convertidas para síncronas via `QEventLoop`)
- OAuth: abre `QWebEngineView` popup apontando para URL de autorização do provedor
  - GitHub: `https://github.com/login/oauth/authorize?client_id=...&scope=...`
  - Intercepta redirect para `http://localhost/callback?code=...` via `QWebEnginePage::urlChanged`
  - Tokens armazenados na tabela `oauth_tokens`
- WebSocket: `QWebSocket` com callbacks registrados
- API Keys: tabela `api_keys` (valor criptografado)

### 2. Migration #8 — `oauth_tokens` e `api_keys`

```sql
CREATE TABLE IF NOT EXISTS oauth_tokens (
    provider TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS api_keys (
    service TEXT PRIMARY KEY,
    key_encrypted TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

### 3. Bridge handlers

```cpp
bridge.registerHandler("networkGet", [networkManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("networkPost", [networkManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("networkOAuthStart", [networkManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("networkOAuthComplete", [networkManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("networkGetApiKeys", [networkManager](const QVariantList&) -> QVariant { ... });
bridge.registerHandler("networkStoreApiKey", [networkManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("networkDeleteApiKey", [networkManager](const QVariantList& args) -> QVariant { ... });
```

### 4. React — Componentes

**OAuthDialog.tsx:**
- Modal que incorpora `QWebEngineView` ou abre popup separado
- Estados: Conectando, Aguardando autorização, Concluído, Erro
- Botões "Conectar GitHub", "Conectar Google"

**ApiKeyManager.tsx:**
- Tabela: Serviço | Chave (mascarada) | Ações (editar/deletar)
- Formulário: Nome do serviço + input de chave + salvar
- Integrado na SettingsPage como aba "API Keys"

### 5. Tratamento de Erros

- Timeout de 30s para requests HTTP
- Retry automático em caso de falha de rede (1 tentativa)
- Erros expostos via exceções C++ convertidas para mensagens no React
- OAuth com fallback se popup for bloqueado (mostrar URL manual)

## Critérios de Aceitação
- [ ] HTTP GET funciona com headers customizados
- [ ] HTTP POST funciona com body JSON
- [ ] OAuth GitHub: abre popup, captura code, troca por token
- [ ] Token OAuth é armazenado no banco
- [ ] API keys podem ser salvas, lidas e deletadas
- [ ] WebSocket conecta e recebe mensagens
- [ ] Timeout de rede é respeitado

## Test Cases

### TC-001: HTTP GET
- **Passos:** 1. Chamar `networkGet("https://api.github.com")`
- **Resultado:** Resposta 200 com body JSON
- **Cobertura:** normal

### TC-002: HTTP GET timeout
- **Passos:** 1. Chamar `networkGet("https://httpbin.org/delay/60")`
- **Resultado:** Timeout após 30s, erro retornado
- **Cobertura:** borda

### TC-003: OAuth GitHub
- **Passos:** 1. Chamar `networkOAuthStart("github")` 2. Autorizar no popup
- **Resultado:** Token armazenado no banco, `getStoredToken("github")` retorna token
- **Cobertura:** normal

### TC-004: API Key CRUD
- **Passos:** 1. Salvar chave "OPENAI_KEY=sk-xxx" 2. Listar 3. Deletar
- **Resultado:** Chave aparece na lista, depois some ao deletar
- **Cobertura:** normal

### TC-005: WebSocket connect
- **Passos:** 1. Conectar wss://echo.websocket.org 2. Enviar "hello"
- **Resultado:** Callback onMessage recebe "hello" de volta
- **Cobertura:** normal
