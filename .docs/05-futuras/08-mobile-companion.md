# Proposta: Aplicativo Mobile Companion

## Visão Geral
Aplicativo mobile (Flutter/React Native) que funciona como companheiro do JARVIS desktop, permitindo acesso a notas, chat com IA, e notificações em qualquer lugar.

## Funcionalidades

### Core
- **Autenticação**: QR code scaneado no desktop → login no mobile
- **Notas**: Visualizar, criar e editar notas do Knowledge Module
- **Chat com IA**: Conversar com agentes do JARVIS (via sync server)
- **Notificações**: Push notifications para eventos (build completo, menção, lembretes)

### Sincronização
- Sync bidirecional de notas via Sync Server
- Resolução de conflitos LWW (Last Writer Wins)
- Modo offline com sync ao reconectar
- Anexos (imagens, arquivos) com compressão automática

### Funcionalidades Mobile-Nativas
- **Câmera**: Escanear documento → criar nota
- **Microfone**: Dictation para notas (STT local no mobile)
- **Compartilhar**: Share sheet → salvar link/texto como nota
- **Widget**: Atalho na home screen para nota rápida
- **Biometria**: Desbloqueio com fingerprint/face

### Interface Mobile
- Bottom navigation: Notes, Chat, Recent, Settings
- Swipe gestures (arquivar, deletar)
- Dark mode automático
- Suporte a tablets com layout adaptativo

## Stack Técnica

| Aspecto | Escolha | Motivo |
|---------|---------|--------|
| Framework | Flutter 3.x | Performance quase nativa, uma codebase |
| State | Riverpod | Testável, escalável |
| Sync | WebSocket + REST | Mesmo Sync Server do desktop |
| Local DB | SQLite (drift) | Offline-first |
| Push | Firebase Cloud Messaging | Cross-platform |
| Auth | JWT + refresh token | Mesmo do Sync Server |

## API Sync Server (novos endpoints)
```
POST   /api/v2/auth/mobile/login   — Login com QR code
POST   /api/v2/auth/mobile/refresh — Refresh token
GET    /api/v2/knowledge/sync      — Delta sync de notas
POST   /api/v2/push/register       — Registrar device push
GET    /api/v2/notifications       — Listar notificações
WS     /ws/v2/mobile               — Tempo real (chat + eventos)
```

## Tabelas Adicionais (Sync Server)
```sql
CREATE TABLE mobile_devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    push_token TEXT,
    platform TEXT NOT NULL,  -- ios, android
    last_sync_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE push_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSON,
    read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);
```

## Dependências
- Sync Server existente (Task 012) — precisa de novos endpoints
- Conta JARVIS Cloud (ou self-hosted)
- Firebase/APNs account para push notifications

## Prioridade: Baixa
## Esforço Estimado: 6-8 semanas
## Impacto: Médio-Alto — acesso mobile para usuários frequentes
