# Módulo Rede & OAuth

## O que faz
Cliente HTTP completo, autenticação OAuth (GitHub), WebSocket client e gerenciamento de chaves de API.

## Arquivos
```
kernel/src/network/network_manager.cpp — 350 linhas, implementação completa
kernel/include/jarvis/network/network_manager.h — Interface INetworkManager

ui/src/components/Settings/ApiKeyManager.tsx — Gerenciamento de API keys
ui/src/components/Settings/OAuthDialog.tsx   — Diálogo de autenticação OAuth
```

## Funcionalidades

### HTTP Client
- GET e POST com headers customizáveis
- Suporte a JSON e form data
- Timeout configurável
- Tratamento de erros HTTP
- Baseado em QNetworkAccessManager

### OAuth GitHub
- Iniciar fluxo OAuth (abre navegador)
- Callback URL configurável
- Troca de code por token
- Armazenamento seguro do token
- Refresh token automático

### WebSocket
- Conectar a URLs WebSocket
- Enviar mensagens (texto)
- Receber mensagens (evento `ws-message`)
- Fechar conexão
- Reconexão automática

### API Keys
- CRUD de chaves de API
- Armazenamento no SQLite (tabela api_keys)
- Integração com provedores de IA
- Máscara parcial na UI (mostrar só últimos 4 caracteres)

## Dependências
- Qt Network + Qt WebSockets
- Tabela SQLite: api_keys, webhook_configs, sessions
