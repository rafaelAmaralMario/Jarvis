# Roadmap — JARVIS Project

Visão geral das fases de desenvolvimento. Cada fase é uma task no Kanban `tarefas/`.

## Fase 1 — Fundação ✅
Tasks 001–014. Kernel, UI base, módulos core (Knowledge, Workspace, AI Engine, Persistence), Bridge, testes, CI/CD, Sync Server.

## Fase 2 — Editor ✅
Tasks 015–016. Monaco Editor com abas, syntax highlighting, split view, quick open, breadcrumb, auto-save, settings persistentes.

---

## Fase 3 — Editor Profissional (017) ⬅️ Próximo
Tornar o editor uma ferramenta de desenvolvimento completa.

| Feature | Descrição |
|---------|-----------|
| Search/Replace | Ctrl+F find widget no Monaco, replace, regex |
| Command Palette | Ctrl+Shift+P com todos os comandos disponíveis |
| Markdown Preview | Preview lado a lado de arquivos .md |
| Format on Save | Auto-formatação ao salvar (Prettier via bridge) |
| Git Gutter | Indicadores visuais de diff na gutter (adicionado/modificado/removido) |
| Code Actions | Lightbulb com autofixes (quando LSP disponível) |

## Fase 4 — Terminal (018)
Terminal integrado no painel inferior.

| Feature | Descrição |
|---------|-----------|
| xterm.js | Emulador de terminal no navegador |
| Shell padrão | cmd/powershell/bash/zsh detectado automaticamente |
| Múltiplas abas | Vários terminais simultâneos |
| Atalhos | Ctrl+` para toggle, Ctrl+Shift+` nova aba |
| Integração IA | Enviar output do terminal para o chat, executar comandos sugeridos pela IA |

## Fase 5 — Automação (019)
Painel de automação com workflows e scripts.

| Feature | Descrição |
|---------|-----------|
| Workflow Engine | Execução de scripts/configurações definidas pelo usuário |
| Gatilhos | Event-driven (ao salvar arquivo, ao receber email, etc) |
| Browser Automation | Integração com Playwright para automação web |
| Desktop Automation | Simulação de teclado/mouse via C++ |
| UI | Painel ⚡ no ActivityBar com lista de workflows e status |

## Fase 6 — Git (020)
Controle de versão integrado.

| Feature | Descrição |
|---------|-----------|
| Diff View | Side-by-side diff de arquivos modificados |
| Stage/Unstage | Selecionar arquivos para commit |
| Commit | Mensagem + botão commit |
| Branch Manager | Criar, trocar, deletar branches |
| Push/Pull/Fetch | Sincronização com remote |
| Git Graph | Visualização do histórico de commits |
| AI Commits | Sugestão automática de mensagens de commit |

## Fase 7 — Voz (021)
Interface por voz com o assistente.

| Feature | Descrição |
|---------|-----------|
| STT | Speech-to-text via whisper.cpp (local) |
| TTS | Text-to-speech via biblioteca local ou API |
| Push-to-talk | Atalho para gravar voz |
| Comandos de voz | "Abra o editor", "Crie uma nota", etc |
| Status visual | Indicador de escuta/falando na StatusBar |

## Fase 8 — Rede & OAuth (022)
Comunicação com serviços externos.

| Feature | Descrição |
|---------|-----------|
| HTTP Client | Serviço para fazer requisições HTTP de forma segura |
| OAuth Flow | Login com GitHub, Google, etc via Qt WebEngine |
| API Keys | Armazenamento seguro de chaves de API |
| WebSocket Client | Conexão com serviços em tempo real |

## Fase 9 — Segurança (023)
Auditoria, permissões e criptografia.

| Feature | Descrição |
|---------|-----------|
| Permission Center | UI para gerenciar permissões de módulos/plugins |
| Audit Log Viewer | Visualização do log de auditoria |
| Secret Storage | Cofre de senhas/chaves (keyring/libsodium) |
| Criptografia | Criptografia de notas e dados sensíveis |

## Fase 10 — Plugins (024)
Sistema de extensões third-party.

| Feature | Descrição |
|---------|-----------|
| Plugin API | Interface estável para criar plugins |
| Manifest System | metadata.json com name, version, permissions |
| Plugin Manager | UI para instalar/desinstalar/ativar plugins |
| Sandbox | Execução isolada de plugins (segurança) |
| Plugin Store | Catálogo de plugins disponíveis |

## Fase 11 — Polimento & UX (025)
Refinamentos finais para lançamento.

| Feature | Descrição |
|---------|-----------|
| Custom Themes | Editor de temas, suporte a temas da comunidade |
| Custom Keybindings | UI para remapear atalhos do teclado |
| Onboarding | Tour guiado na primeira execução |
| Estado vazio | Telas de empty state para todas as views |
| Micro-animações | Transições suaves, loading states |
| Responsividade | Layout adaptável a diferentes tamanhos de janela |
| Performance | Virtualização de listas grandes, lazy loading |
| Telemetria (opt-in) | Métricas anônimas de uso |
