# Modulo Rede & OAuth

## O que faz
Cliente HTTP completo, autenticacao OAuth (GitHub), e gerenciamento de chaves de API.

## Arquivos
```
backend/jarvis/network_manager.py        — HTTP client, OAuth, API key management

ui/src/components/Settings/ApiKeyManager.tsx — Gerenciamento de API keys
ui/src/components/Settings/OAuthDialog.tsx   — Dialogo de autenticacao OAuth
```

## Funcionalidades

### HTTP Client
- GET e POST com headers customizaveis
- Suporte a JSON e form data
- Timeout configuravel
- Tratamento de erros HTTP
- Baseado em httpx (HTTP/2, streaming)

### OAuth GitHub
- Iniciar fluxo OAuth (abre navegador)
- Callback URL configuravel
- Troca de code por token
- Armazenamento seguro do token (encriptado com `cryptography`)
- Refresh token automatico

### API Keys
- CRUD de chaves de API
- Armazenamento no SQLite (tabela api_keys) com encriptacao
- Integracao com provedores de IA
- Mascara parcial na UI (mostrar so ultimos 4 caracteres)

## Dependencias
- httpx (em vez de Qt Network)
- cryptography (para armazenamento seguro de chaves)
- Tabela SQLite: api_keys, webhook_configs, sessions

## Bridge API
- 10 metodos: `networkGet`, `networkPost`, `networkOAuthStart`, `networkOAuthComplete`, `networkGetStoredToken`, `networkClearToken`, `networkStoreApiKey`, `networkGetApiKey`, `networkDeleteApiKey`, `networkListApiKeys`
