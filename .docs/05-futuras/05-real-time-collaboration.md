# Proposta: Colaboração em Tempo Real

## Visão Geral
Permitir que múltiplos usuários colaborem no mesmo workspace simultaneamente, similar ao Google Docs ou VS Code Live Share, com edição concorrente, chat e presença visível.

## Componentes

### Sync Server Aprimorado
- **Base**: Sync Server Node.js existente (Task 012)
- **Novo**: WebSocket-based CRDT (Conflict-free Replicated Data Type)
- **Protocolo**: Operação transformacional (OT) ou CRDT (Yjs/Automerge)
- **Estruturas**: Yjs (Y.Text, Y.Array, Y.Map) para documentos colaborativos

### Edição Colaborativa
- Múltiplos cursores simultâneos no Monaco Editor
- Destaque por cor de cursor por usuário
- Nome do usuário no cursor
- Bloqueio opcional de linhas/seleções
- Operações undo/redo independentes por usuário

### Presença e Comunicação
- Lista de usuários conectados no workspace
- Avatar/nome online no StatusBar
- Chat integrado lateral
- @menções com notificação
- Compartilhamento de terminal (ver comando ao vivo)

### Compartilhamento de Workspace
- Convidar usuários por link/email
- Permissões: leitura, escrita, admin
- Workspaces compartilhados vs privados
- Histórico de alterações com autor

### Sincronização
- Sincronização em tempo real de arquivos via WebSocket
- Merge automático de alterações concorrentes
- Resolução de conflitos (ours/theirs/merge)
- Indicador de "salvando..." / "sincronizado"

## Arquitetura

```
┌──────────┐    WebSocket     ┌──────────┐    WebSocket     ┌──────────┐
│ JARVIS A │◀────────────────▶│   Sync   │◀────────────────▶│ JARVIS B │
│ (usuário1)│                  │  Server  │                  │(usuário2)│
└──────────┘                  │(Node.js) │                  └──────────┘
                              │  + CRDT  │
┌──────────┐                  │  + Redis │                  ┌──────────┐
│ JARVIS C │◀────────────────▶│(opcional)│◀────────────────▶│ JARVIS D │
│ (usuário3)│                  └──────────┘                  │(usuário4)│
└──────────┘                                                └──────────┘
```

## Interface
- Cursores coloridos no Monaco Editor
- Avatar circle no topo do editor
- Badge de "X usuários online" no Workspace
- Painel de membros do workspace
- Chat lateral colapsável

## Dependências
- Yjs ou Automerge library (JS side + C++ port ou WASM)
- Sync Server existente (Task 012) + Redis para pub/sub
- Task 023 (Segurança) — autenticação multiusuário
- Conta JARVIS Cloud (ou self-hosted)

## Tabelas SQLite/PostgreSQL
```sql
-- Server-side
CREATE TABLE collaborative_sessions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    document_path TEXT NOT NULL,
    yjs_snapshot BLOB,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE session_participants (
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    cursor_position JSON,
    joined_at TEXT NOT NULL,
    PRIMARY KEY (session_id, user_id)
);
```

## Prioridade: Baixa-Média
## Esforço Estimado: 8-10 semanas (complexo)
## Impacto: Muito Alto — transforma em ferramenta de equipe
