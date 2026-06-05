# Proposta: Integração com MCP (Model Context Protocol)

## Visão Geral
Implementar o protocolo MCP (Model Context Protocol) da Anthropic no JARVIS, permitindo que os agentes de IA acessem ferramentas externas de forma padronizada — arquivos, bancos de dados, APIs, serviços cloud.

## O que é MCP?
O Model Context Protocol é um padrão aberto que define como modelos de IA se conectam a ferramentas e fontes de dados externas. É como um "USB-C para IA" — um protocolo universal de integração.

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    AI Agent                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  MCP Client (dentro do AI Engine)                │   │
│  │  • Descoberta de servers disponíveis              │   │
│  │  • Invocação de tools                             │   │
│  │  • Acesso a resources                             │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────┘
                         │ MCP Protocol (JSON-RPC over stdio/SSE)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              MCP Servers Locais                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Filesys  │ │ Database │ │  GitHub  │ │   Fetch    │  │
│  │ Server   │ │ Server   │ │  Server  │ │   Server   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Browser  │ │ Terminal │ │  Custom  │ │   Cloud    │  │
│  │ Server   │ │ Server   │ │ Plugins  │ │  Services  │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Funcionalidades

### MCP Client (Integrado ao AI Engine)
- Descoberta de MCP servers (configurados pelo usuário)
- Negociação de protocolo (versão, capabilities)
- Listagem de ferramentas disponíveis
- Chamada de ferramentas com validação de parâmetros
- Acesso a resources (arquivos, dados, contexto)
- Streaming de resultados

### Gerenciamento de MCP Servers
- UI para adicionar/remover/configurar MCP servers
- Suporte a transportes: stdio (processo filho), SSE (HTTP), WebSocket
- Configuração por JSON ou UI visual
- Templates de servidores comuns (filesystem, fetch, github, etc)
- Monitoramento: status, logs, latência

### MCP Tools Registry
- Ferramentas expostas pelos servers aparecem como capacidades do agente
- Agente pode escolher qual ferramenta usar baseado na tarefa
- Histórico de uso de ferramentas
- Cache de resultados de ferramentas (quando seguro)

### Segurança MCP
- Permissões por servidor (quais tools pode chamar)
- Confirmação do usuário para operações perigosas
- Sandbox: servidores rodam em processos separados
- Rate limiting por servidor

## Configuração (JSON)
```json
{
    "mcpServers": {
        "filesystem": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
            "transport": "stdio",
            "permissions": ["read", "write"]
        },
        "github": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github"],
            "transport": "stdio",
            "env": { "GITHUB_TOKEN": "${secrets.github_token}" }
        },
        "database": {
            "url": "http://localhost:3001/mcp",
            "transport": "sse",
            "permissions": ["read"]
        }
    }
}
```

## UI de Configuração
- Aba "MCP Servers" no painel Config
- Lista de servers com status (🟢 ativo, 🔴 erro, ⚪ desligado)
- Adicionar server: preencher comando/args ou URL
- Editor de variáveis de ambiente (com suporte a secrets)
- Logs de cada server (stdout/stderr)
- Test connection: lista tools disponíveis

## Ferramentas Padrão (Built-in)
- **filesystem**: ler, escrever, editar arquivos, listar diretórios
- **fetch**: fazer requisições HTTP
- **github**: issues, PRs, commits, code search
- **terminal**: executar comandos
- **database**: queries SQL (read-only configurável)
- **search**: busca na web

## Dependências
- AI Engine existente
- Rede (Task 022) — para servers remotos (SSE)
- Segurança (Task 023) — para sandbox e permissões
- Plugins (Task 024) — para servers customizados

## Prioridade: Média
## Esforço Estimado: 3-4 semanas
## Impacto: Muito Alto — agente ganha acesso ilimitado ao ecossistema de ferramentas
