# Roadmap e Próximos Passos

## ✅ O Que Foi Feito (MVP Completo)

### Infraestrutura
- [x] Scaffold Tauri desktop app
- [x] Frontend React + Vite + TypeScript configurado
- [x] Monaco Editor integrado
- [x] Tema dark/light com toggle
- [x] Painéis redimensionáveis (drag)

### File Explorer & Editor
- [x] Árvore de arquivos do workspace
- [x] CRUD de arquivos/pastas (criar, renomear, mover, deletar)
- [x] Busca textual no workspace
- [x] Monaco Editor com múltiplas tabs e dirty indicator
- [x] Salvamento de arquivos

### Git
- [x] Status, diff, stage/unstage
- [x] Commit
- [x] Branch management (list, checkout, create)
- [x] Geração de URL de PR

### AI Providers
- [x] Model registry com 8 modelos
- [x] Mock provider (teste/desenvolvimento)
- [x] Ollama provider (modelos locais)
- [x] OpenAI-compatible provider
- [x] Detecção de modelos Ollama do filesystem
- [x] Teste de saúde do modelo
- [x] Streaming de respostas
- [x] Cancelamento de requisição
- [x] Seletor de modelo ativo

### Chat
- [x] Chat panel com streaming
- [x] Histórico por workspace (localStorage)
- [x] Indicador de saúde do modelo

### Agentes
- [x] 4 agentes built-in (project-brain, developer, reviewer, documenter)
- [x] Criação de agentes customizados via UI
- [x] Execução de agente no chat

### Plugins
- [x] 3 plugins built-in (mock-provider, git, obsidian)
- [x] Carregamento de plugins locais do workspace
- [x] Ativação/desativação com verificação de permissões

### Permissões e Segurança
- [x] 5 permissões base (read-workspace, write-workspace, git, network, secrets)
- [x] Verificação de permissões por workspace
- [x] Audit trail
- [x] Validação de path traversal no Rust
- [x] API keys armazenadas no backend (secure-settings.json)

### Contexto e Obsidian
- [x] Configuração de vault Obsidian
- [x] Listagem de notas Markdown
- [x] Escrita de notas no vault
- [x] Memory entries (localStorage)

### UI/UX
- [x] Activity Bar com 8 views
- [x] Bottom Panel (Logs, Diff, Proposal, Audit)
- [x] Command Palette (Ctrl+Shift+P)
- [x] Modais de confirmação
- [x] Guias de ajuda (Ollama, OpenAI, LM Studio)

### Documentação
- [x] ADRs (4 registros)
- [x] Especificação completa do projeto
- [x] Arquitetura e estrutura de pastas
- [x] Guias de desenvolvimento, teste, código
- [x] Roadmaps MVP, pós-MVP, versão final
- [x] Backlog de issues

---

## 🔜 O Que Precisa Ser Feito

### Prioridade Alta — v0.1 Beta Funcional

- [ ] **Testes automatizados**
  - Unit tests para os providers
  - Testes de componente React
  - Testes de integração dos comandos Tauri
  - E2E smoke tests
- [ ] **Terminal integrado real**
  - Componente de terminal funcional no bottom panel
  - Suporte a processos longos e interrupção
- [ ] **Aplicar diffs de agentes com aprovação**
  - Revisão e aplicação seletiva de propostas de mudança
- [ ] **Migrar secrets para keyring/Stronghold**
  - Substituir JSON file por armazenamento seguro do SO
- [ ] **Git push/pull/fetch**
  - Operações remotas completas
- [ ] **Audit trail com filtros**
  - Busca e filtragem por tipo, data, actor

### Prioridade Média — v0.2 IDE com IA Aplicável

- [ ] **Redesign da UI**
  - Interface mais limpa e moderna
  - Melhor organização dos painéis
- [ ] **Busca semântica com embeddings**
  - Indexação do projeto para busca inteligente
- [ ] **Aplicação parcial de hunks**
  - Aceitar/rejeitar partes específicas de um diff
- [ ] **Diff side-by-side**
  - Visualização lado a lado no bottom panel
- [ ] **Módulo de voz (input/output)**
  - Comandos de voz e leitura de respostas

### Prioridade Média — v0.3 Colaboração e GitHub

- [ ] **Login/integração GitHub**
  - Autenticação OAuth
- [ ] **Criar PR da UI**
  - Fluxo completo de criação de Pull Request
- [ ] **Listar/Revisar PRs**
  - Visualização e gerenciamento de PRs
- [ ] **Resolução de conflitos**
  - Interface para resolver conflitos de merge
- [ ] **Commit messages geradas por IA**
  - Sugestão automática baseada no diff

### Prioridade Baixa — v0.4 Plugins Reais

- [ ] **Public plugin API**
  - Documentação e SDK para desenvolvedores
- [ ] **Sandbox de execução**
  - Execução segura de código de plugins
- [ ] **Plugin signing/verification**
  - Assinatura criptográfica de plugins
- [ ] **Permissões por plugin**
  - Granularidade fina de permissões

### Prioridade Baixa — v0.5 Produto Final

- [ ] **Ícones finais**
  - Substituir ícone temporário JARVIS
- [ ] **Binary signing (Windows/macOS)**
  - Assinatura de binários para distribuição
- [ ] **Auto-update**
  - Sistema de atualização automática
- [ ] **CI/CD pipeline**
  - GitHub Actions para build, teste, release
- [ ] **Telemetria opcional**
  - Coleta anônima de uso (opt-in)

---

## Melhorias Técnicas Identificadas

### Refatoração
- [ ] App.tsx (~2584 linhas) quebrar em componentes menores
- [ ] styles.css (~1197 linhas) organizar por componente
- [ ] Separar concerns: UI, state, lógica de negócio

### Qualidade
- [ ] Configurar ESLint
- [ ] Adicionar testes (jest, vitest, ou playwright)
- [ ] Configurar lint Rust (clippy)
- [ ] Adicionar CI com GitHub Actions

### Segurança
- [ ] Revisar validação de inputs nos comandos Tauri
- [ ] Implementar rate limiting
- [ ] Auditoria de segurança dos providers de IA
