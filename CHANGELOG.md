# Changelog

## v0.2.0 (2026-06-09)

### ✨ Novos Agentes Nativos de Desenvolvimento de Software
- **10 agentes pré-configurados** com system prompts detalhados em português:
  - **Orquestrador Principal**: coordena todo o fluxo de desenvolvimento
  - **Analista de Requisitos**: especificação, histórias de usuário, critérios de aceitação
  - **Arquiteto de Software**: design de arquitetura, tecnologias, ADRs
  - **Designer de Software**: UI/UX, componentes, fluxos de navegação
  - **Engenheiro de Software**: planejamento técnico, estratégia de implementação
  - **Desenvolvedor Full-Stack**: implementação de código frontend/backend
  - **Especialista em Testes**: testes unitários, integração, e2e
  - **Revisor de Código**: code review, segurança, performance
  - **Especialista em DevOps**: CI/CD, Docker, deploy
  - **Documentador Técnico**: README, API docs, documentação de arquitetura
- Agentes nativos são carregados automaticamente na inicialização
- Proteção contra exclusão de agentes nativos
- Badge visual "Nativo" na interface com destaque roxo

### ✨ Novos Workflows Nativos de Desenvolvimento
- **5 workflows pré-configurados** para o ciclo completo de software:
  - **Ciclo Completo de Desenvolvimento**: requisitos → arquitetura → design → implementação → testes → revisão → documentação
  - **Análise e Planejamento**: requisitos, arquitetura, design, plano técnico
  - **Implementação e Desenvolvimento**: codificação, testes, revisão com loop de correção
  - **Testes e Garantia de Qualidade**: plano, implementação, execução, revisão
  - **Revisão e Documentação**: code review, docs, preparação para deploy
- Workflows nativos também protegidos contra exclusão

### ✨ Criação de Agentes/Workflows com IA
- Botão "✨ Criar com IA" nos painéis de Agentes e Workflows
- Diálogo unificado que envia descrição em linguagem natural para o modelo
- Geração automática de configuração via LLM
- Métodos `aiGenerateAgent` e `aiGenerateWorkflow` no bridge

### ✨ Diálogo de Criação Unificado
- Novo componente `CreateDialog` para criar notas, arquivos e pastas
- Interface com 3 modos (Nota, Arquivo, Pasta) em um único diálogo
- Integrado ao fluxo de trabalho do Knowledge Base e Workspace

### 🐛 Correções de Bugs
- **ModelServerStatus**: agora pinga a API do Ollama além de detectar o processo — elimina falso positivo "running" quando o processo está travado/iniciando
- **Chat travado**: `sendMessage` retorna string de erro em vez de `""` vazia; `AiPanel` tem timeout de 120s; tratamento amigável de erros de conexão Ollama
- **Listagem de modelos**: `ModelsPanel` recarrega automaticamente quando o servidor fica disponível
- **Criação de arquivos**: `FileTree` agora passa o nome digitado inline para os handlers — sem mais `prompt()` nativo bloqueante
- **Botão direito bloqueado**: handler global de contextmenu sempre previne o menu padrão do navegador
- **Favicon ausente**: adicionado `favicon.ico` ao `index.html` — elimina erro 404 no console
- **General Settings vazio**: painel completo com seletor de idioma, tema, tamanhos de fonte, auto-save e modelo padrão

### 🔧 Melhorias
- `is_builtin` adicionado aos modelos `Agent` e `Workflow` (DB + Python + TypeScript)
- Migration 11: colunas `is_builtin` nas tabelas `agents` e `workflows`
- Badge "Nativo" nos cards de agente e workflow na interface
- Botão Delete desabilitado para itens nativos com tooltip explicativo

### ✅ Testes
- 401 testes backend (+2 novos: `test_delete_builtin_agent_fails`, `test_delete_builtin_workflow_fails`)
- 179 testes UI (inalterado)
- Total: 580 testes

## v0.1.0 (2026-06-08)

### 🚀 Features
- Assistente AI com interface React moderna
- Sistema de módulos com carregamento dinâmico
- Gerenciamento de conhecimento (Obsidian-like notes com links, backlinks, graph)
- Editor de código com abas, syntax highlighting, busca
- Terminal integrado com suporte a múltiplas sessões
- Git manager (status, diff, commit, branch, log)
- Workspace manager com árvore de arquivos
- Chat com histórico por sessão
- MCP Server manager
- Orchestration manager (agentes coordenados)
- Workflow engine
- Security manager (permissões, audit log, secrets)
- LLM Gateway multi-provedor (Ollama, OpenAI, Anthropic, etc.)
- Network manager (HTTP client, OAuth)

### 🎨 Interface
- Context menus sensíveis ao contexto (FileTree, EditorTabs, Agent Panel)
- Model Server Status com indicador visual e botão de iniciar
- Seletor de pasta nativo (PowerShell/zenity/osascript)
- Painel de atualizações com verificação de versão e instalação
- StatusBar com contagem de módulos, modelo ativo, notificações de update

### 🔧 Sistema de Atualização
- `version.py`: parsing semântico, check via GitHub Releases API
- Auto-update runtime: download → batch updater → replace/installer → restart
- Suporte a instalador (Inno Setup) e portable .exe
- Badge de notificação na StatusBar

### 🏗 Build & Distribuição
- PyInstaller: executável único ~35MB
- Inno Setup: instalador Windows com shortcut
- GitHub Actions: release workflow automatizado
- Ícone do app: 64x64 ICO

### ✅ Testes
- 331 testes backend (pytest)
- 179 testes UI (Vitest + Testing Library)
- 5 testes server (Mocha)
- 9 testes E2E (Playwright)
- Total: 524 testes
