# 022 — Rede e OAuth

## Metadados
- Status: a fazer
- Prioridade: 🟡 Média
- Dependências: (nenhuma)

## Descrição
Serviços de rede: HTTP client, OAuth flow para GitHub/Google, WebSocket client e API keys seguras.

## Especificação Técnica

### C++ — NetworkManager
```cpp
class NetworkManager {
    HttpResponse get(const std::string& url, const Headers& headers);
    HttpResponse post(const std::string& url, const std::string& body, const Headers& headers);
    void startOAuth(const std::string& provider);  // GitHub, Google, etc
    OAuthResult completeOAuth(const std::string& code);
    WebSocketClient* createWebSocket(const std::string& url);
};
```

- HTTP via QNetworkAccessManager
- OAuth via QWebEngineView (abre popup para login)
- API keys armazenadas na tabela `api_keys` (criptografadas)
- WebSocket via QWebSocket

### Bridge handlers
- `networkGet(url, headers)` / `networkPost(url, body, headers)`
- `networkOAuthStart(provider)` → retorna URL de login
- `networkOAuthComplete(code)` → troca code por token
- `networkGetApiKeys()` / `networkSaveApiKey(provider, key)`

### React — Componentes
- `OAuthDialog.tsx` — popup para login OAuth
- `ApiKeyManager.tsx` — formulário de API keys (Settings > Rede)

## Critérios de Aceitação
- [ ] HTTP requests funcionam (GET/POST)
- [ ] OAuth GitHub funciona (login → token)
- [ ] API keys são salvas e lidas do banco
- [ ] WebSocket cliente conecta e recebe mensagens

## Test Cases

### TC-001: HTTP GET
- **Passos:** 1. Chamar networkGet("https://api.github.com")
- **Resultado:** Resposta JSON recebida
- **Cobertura:** normal

### TC-002: OAuth GitHub
- **Passos:** 1. Iniciar OAuth GitHub
- **Resultado:** Popup abre para login, após autorização token é salvo
- **Cobertura:** normal
