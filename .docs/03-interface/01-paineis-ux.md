# Paineis da Interface

## Layout Geral

```
┌─────────────────────────────────────────────────────────────┐
│ [ActivityBar]  [Sidebar]  [       MainArea        ] [AiPanel]│
│                                                              │
│   ┌──────┐  ┌──────────┐  ┌──────────────────┐  ┌────────┐  │
│   │  🗣️  │  │ Knowledge │  │   Monaco Editor   │  │  Chat  │  │
│   │  📚  │  │ ▼         │  │                   │  │  com   │  │
│   │  📁  │  │ Notes     │  │  code here...     │  │   IA   │  │
│   │  ✏️  │  │ Search    │  │                   │  │        │  │
│   │  ⎇   │  │ Graph     │  │                   │  │        │  │
│   │  ⚙️  │  │           │  │                   │  │        │  │
│   │  >_  │  │           │  │                   │  │        │  │
│   └──────┘  └──────────┘  └──────────────────┘  └────────┘  │
│                                                              │
│  [TerminalPanel]  (toggle with Ctrl+`)                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ $ git status                                           │  │
│  │ $ npm run build                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [StatusBar]  🔵 Ollama online  |  main*  |  Ln 42, Col 8  │
└─────────────────────────────────────────────────────────────┘
```

## Painéis (7 no total)

| Ícone | Nome | Atalho | Descrição |
|-------|------|--------|-----------|
| 🗣️ | Assistente | `Ctrl+1` | Chat com IA, seleção de agente |
| 📚 | Conhecimento | `Ctrl+2` | Notas, busca, grafos, backlinks |
| 📁 | Workspace | `Ctrl+3` | Árvore de arquivos, projetos |
| ✏️ | Editor | `Ctrl+4` | Editor Monaco com abas |
| ⎇ | Git | `Ctrl+5` | Status, diff, commit, branches |
| ⚙️ | Config | `Ctrl+6` | Modelos, agentes, orquestração, API keys |
| >_ | Terminal | `` Ctrl+` `` | Terminal integrado (xterm.js) |

## ActivityBar

- Ícones verticais fixos à esquerda
- Destaque no ícone ativo
- Tooltip com atalho de teclado
- Framer Motion para transições suaves

## Sidebar

- Conteúdo contextual baseado na view ativa
- Largura redimensionável pelo usuário
- Suporte a arrastar para redimensionar

## MainArea

- Área central que exibe o conteúdo principal
- Editor Monaco (abas, split view)
- Preview de Markdown
- Visualização de grafos
- Animações de transição entre conteúdos

## AiPanel

- Painel de chat com IA no lado direito
- Mensagens com avatares (usuário vs IA)
- Suporte a markdown nas respostas
- Indicador de digitação
- Animações de entrada/saída

## TerminalPanel

- Painel redimensionável na parte inferior
- Múltiplas abas de terminal
- Toggle com `` Ctrl+` ``
- Suporte a temas de terminal
- Integração com QProcess

## StatusBar

- Status da conexão com IA
- Branch Git atual
- Posição do cursor no editor
- Modo de edição (insert/normal)
- Indicadores de operações em segundo plano
