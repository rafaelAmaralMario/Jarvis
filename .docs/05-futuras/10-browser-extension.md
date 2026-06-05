# Proposta: Extensão de Navegador

## Visão Geral
Extensão para Chrome/Edge/Firefox que permite clippar conteúdo da web diretamente para o JARVIS, pesquisar notas sem sair do navegador, e capturar páginas como contexto para IA.

## Funcionalidades

### Web Clipper
- Ícone na toolbar → clippa página atual como nota
- Seleção de texto → botão flutuante "Salvar no JARVIS"
- Screenshot da página como imagem na nota
- Extração automática: título, URL, meta description, domínio
- Tags sugeridas pela IA com base no conteúdo
- Organização em pasta do Knowledge Module

### Quick Search
- `Ctrl+Shift+J` → overlay de busca no JARVIS
- Busca full-text em notas
- Resultados com preview
- Abrir nota no JARVIS desktop com um clique
- Busca por atalho: "`jrvs search transformers`"

### AI Context
- Botão "Analisar com JARVIS" → envia página para agente ativo
- Resumo automático da página
- Perguntas sobre o conteúdo via chat inline
- Extração de dados estruturados (tabelas, listas, código)

### Sidebar JARVIS
- Abrir sidebar do JARVIS no navegador
- Chat com IA sem sair da página atual
- Contexto automático: URL atual + texto selecionado
- Notas recentes na sidebar

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Navegador                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Extensão JARVIS                          │   │
│  │  ┌────────────────┐ ┌────────────────────────┐    │   │
│  │  │  Content Script│ │    Background Script    │    │   │
│  │  │  (cada página) │ │    (persistente)        │    │   │
│  │  └────────────────┘ └────────────────────────┘    │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │  Popup UI (React micro-frontend)           │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ WebSocket / REST API
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Sync Server                           │
│              (autenticação + roteamento)                 │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    JARVIS Desktop                        │
│              (processa e armazena notas)                 │
└─────────────────────────────────────────────────────────┘
```

## Comunicação
- **Modo 1 — REST API**: Extensão → Sync Server → Desktop (via WebSocket)
- **Modo 2 — Direct**: Extensão → Desktop (via WebSocket local)
- **Auth**: Token JWT (mesmo do Sync Server) ou token local

## Instalação e Configuração
- Chrome Web Store / Firefox Add-ons / Edge Add-ons
- Setup wizard: digitar URL do JARVIS desktop ou Sync Server
- QR code na extensão → scaneia no JARVIS desktop para parear
- Status da conexão no ícone da extensão (verde=conectado, cinza=offline)

## Manifest (Chrome Extension)
```json
{
    "manifest_version": 3,
    "name": "JARVIS Clipper",
    "version": "1.0.0",
    "permissions": ["storage", "activeTab", "contextMenus", "clipboardWrite"],
    "host_permissions": ["http://localhost:8080/*", "https://api.jarvis.dev/*"],
    "action": { "default_popup": "popup/index.html" },
    "content_scripts": [
        { "matches": ["<all_urls>"], "js": ["content.js"] }
    ],
    "commands": {
        "search-jarvis": { "suggested_key": "Ctrl+Shift+J", "description": "Buscar no JARVIS" }
    }
}
```

## Dependências
- Sync Server existente (Task 012) — novos endpoints
- WebSocket server para comunicação em tempo real

## Prioridade: Baixa
## Esforço Estimado: 3-4 semanas
## Impacto: Médio — integração com fluxo de pesquisa web
