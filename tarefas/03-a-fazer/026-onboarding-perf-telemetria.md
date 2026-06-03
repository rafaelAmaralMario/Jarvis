# 026 — Onboarding + Empty States + Performance + Telemetria

## Metadados
- Status: a fazer
- Prioridade: 🟢 Baixa
- Fase: 7 — Polimento
- Dependências: (nenhuma)
- Paralelizável com: 025

## Descrição
Refinamentos de experiência do usuário: tour de onboarding na primeira execução,
empty states para todas as views, otimizações de performance e telemetria opt-in.

## Especificação Técnica

### 1. Onboarding Tour

**Detecção de primeira execução:**
```sql
-- Já existe na system_config
SELECT value FROM system_config WHERE key = 'onboarding_completed';
```

**TourOverlay.tsx:**
- Overlay com spotlight no elemento alvo
- 5 steps sequenciais com "Próximo" / "Pular tour" / "Anterior"
- Steps:

| Step | Alvo | Mensagem |
|------|------|----------|
| 1 | ActivityBar | "Bem-vindo ao JARVIS! Navegue entre as seções: IA, Conhecimento, Workspace, Editor, Automação e Configurações." |
| 2 | KnowledgePanel | "Este é seu sistema de conhecimento. Crie notas em Markdown com links [[wiki]] entre elas." |
| 3 | AiPanel | "Converse com assistentes de IA. Selecione modelos e agentes especializados para cada tarefa." |
| 4 | Editor | "Editor de código com Monaco, split view, busca rápida (Ctrl+P) e terminal integrado." |
| 5 | StatusBar | "Atalhos essenciais: Ctrl+P busca, Ctrl+Shift+P comandos, Ctrl+` terminal, Ctrl+S salvar." |

**TourState:**
- `onboarding_completed` = "true" na system_config
- Botão "Reiniciar Tour" no Settings > Sobre
- Barra de progresso no overlay (step 1/5, 2/5...)

**Implementação:**
- Overlay fixo com `pointer-events: none` no fundo, ponteiro habilitado no card do tour
- Spotlight: outline animado ao redor do elemento alvo
- Scroll automático para elemento alvo se necessário
- Framer Motion para transições entre steps

### 2. Empty States

Cada view principal deve ter um estado vazio com ícone, mensagem e call-to-action.

**Componente reutilizável — EmptyState.tsx:**
```tsx
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}
```

**Mensagens por view:**

| View | Icon | Title | Description | Action |
|------|------|-------|-------------|--------|
| Editor | `</>` | Nenhum arquivo aberto | Selecione um arquivo na árvore ou pressione Ctrl+P para busca rápida | — |
| Conhecimento | 📝 | Nenhuma nota ainda | Crie sua primeira nota para começar a construir seu conhecimento. | "Criar Nota" |
| AI Chat | 💬 | Faça uma pergunta | Selecione um modelo de IA e comece a conversar. | "Ir para Configurações" |
| Workspace | 📂 | Nenhum workspace aberto | Abra uma pasta para começar a trabalhar com arquivos. | "Abrir Pasta" |
| Git | 🔀 | Sem repositório Git | Este workspace não tem um repositório Git. | "Iniciar Repositório" |
| Automação | ⚡ | Nenhum workflow | Crie seu primeiro workflow para automatizar tarefas. | "Criar Workflow" |
| Plugins | 🧩 | Nenhum plugin instalado | Instale plugins para estender as funcionalidades do JARVIS. | "Instalar Plugin" |

### 3. Performance

**Virtualização de listas:**
```bash
npm install react-window @types/react-window
```
- FileTree virtualizado (pastas com muitos arquivos)
- Git log virtualizado
- Audit log virtualizado
- Lista de notas no KnowledgePanel virtualizada

**Lazy Loading:**
```tsx
const AiPanel = React.lazy(() => import('./AiPanel'));
const EditorPanel = React.lazy(() => import('./Editor/EditorPanel'));
const KnowledgePanel = React.lazy(() => import('./Knowledge/KnowledgePanel'));
const SettingsPage = React.lazy(() => import('./Settings/SettingsPage'));
```

**Memoização:**
- `React.memo` em componentes que renderizam listas (FileTree, EditorTabs, GitStatusList)
- `useMemo` para computações pesadas (filtros, busca)
- `useCallback` para handlers passados como props (já usando em vários lugares)

**Monaco:**
- Lazy import do Monaco (`await import('monaco-editor')`) — já implementado
- Apenas 1 instância do Monaco por painel (reutilizar em vez de destroy/criar)

**Debounce:**
- Auto-save: já implementado com delay configurável
- Busca no QuickOpen: debounce de 150ms
- Git Gutter polling: 5s (não a cada keystroke)

### 4. Telemetria (opt-in)

**Sistema de telemetria:**
- Coleta: comandos executados, erros, performance (tempo de resposta), uso de features
- NÃO coleta: conteúdo de arquivos, mensagens de chat, dados pessoais
- Storage: arquivo JSON local em `~/.jarvis/telemetry.json`
- Envio: POST para endpoint configurável (ou desligado)

**Configuração:**
```sql
INSERT INTO system_config (key, value) VALUES ('telemetry_enabled', 'false');
INSERT INTO system_config (key, value) VALUES ('telemetry_endpoint', '');
```

**UI — PrivacySettings.tsx:**
- Toggle "Compartilhar dados anônimos de uso"
- Descrição: "Ajuda a melhorar o JARVIS enviando dados anônimos de uso e erros."
- Link para política de privacidade
- Botão "Exibir dados coletados" (mostra JSON local)
- Botão "Limpar dados locais"

**Eventos coletados:**
- `app_start`, `app_close`
- `view_open` (qual view)
- `command_executed` (qual comando)
- `file_opened`, `file_saved`
- `ai_query` (apenas duração, modelo, sem conteúdo)
- `error` (tipo do erro, sem stack trace)
- `git_commit`, `git_push`

## Critérios de Aceitação
- [ ] Tour de onboarding aparece na primeira execução do app
- [ ] Tour tem 5 steps com spotlight no elemento alvo
- [ ] Tour pode ser pulado ou revisitado
- [ ] Todas as views têm empty states com ícone + mensagem + CTA
- [ ] FileTree com virtualização para pastas grandes
- [ ] Componentes pesados carregam via React.lazy
- [ ] Debounce aplicado em busca e auto-save
- [ ] Telemetria opt-in com toggle em Settings
- [ ] Dados coletados são anônimos (sem conteúdo de arquivos/chats)

## Test Cases

### TC-001: Onboarding na primeira execução
- **Pré:** system_config.onboarding_completed não existe
- **Passos:** 1. Iniciar app
- **Resultado:** Tour overlay aparece com step 1 "Bem-vindo ao JARVIS"
- **Cobertura:** normal

### TC-002: Pular tour
- **Passos:** 1. Abrir app 2. Clicar "Pular tour" no step 1
- **Resultado:** Tour desaparece, app funciona normalmente, onboarding_completed = true
- **Cobertura:** normal

### TC-003: Revisitar tour
- **Passos:** 1. Settings > Sobre > "Reiniciar Tour"
- **Resultado:** Tour reaparece no próximo reload
- **Cobertura:** normal

### TC-004: Empty state Workspace
- **Pré:** Nenhum workspace aberto
- **Passos:** 1. Clicar em Workspace no ActivityBar
- **Resultado:** Empty state com ícone 📂, mensagem e botão "Abrir Pasta"
- **Cobertura:** normal

### TC-005: Empty state Conhecimento
- **Pré:** Nenhuma nota criada
- **Passos:** 1. Clicar em Conhecimento
- **Resultado:** Empty state com mensagem e botão "Criar Nota"
- **Cobertura:** normal

### TC-006: Telemetria opt-in
- **Passos:** 1. Settings > Privacidade 2. Ativar telemetria
- **Resultado:** Eventos começam a ser coletados localmente
- **Cobertura:** normal

### TC-007: Telemetria desligada
- **Passos:** 1. Settings > Privacidade 2. Desativar telemetria
- **Resultado:** Nenhum evento é coletado
- **Cobertura:** normal
