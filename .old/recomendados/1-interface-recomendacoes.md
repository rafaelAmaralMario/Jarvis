# Recomendacoes de Interface — JARVIS

## Filosofia de Design

O JARVIS deve parecer uma **IDE profissional com IA nativa**, nao um chat com editor acoplado. A interface deve ser moderna, densa o suficiente para trabalho tecnico, mas com espacos para respirar.

---

## 1. Layout Geral

```
┌────┬──────────────────┬───────────────────────┬──────────────────┐
│    │  Panel Header    │  Top Bar               │  Panel Header    │
│ A  ├──────────────────┤  (app + status info)   ├──────────────────┤
│ c  │  Sidebar         ├───────────────────────┤  AI Panel        │
│ t  │  (contextual:    │  Editor Tabs           │  (Chat +         │
│ i  │   files/search/  ├───────────────────────┤   Agentes +      │
│ v  │   git/settings/  │  Editor (Monaco)       │   Contexto)      │
│ i  │   plugins/       │  ou previews           │                  │
│ t  │   context/       ├───────────────────────┤                  │
│ y  │   agents/help)   │  Bottom Panel          │                  │
│    │                  │  (logs/diff/proposal/  │                  │
│    │                  │   audit/terminal)      │                  │
│    ├──────────────────┴───────────────────────┴──────────────────┤
│    │  Status Bar (branch, modelo, permissoes, encoding)           │
└────┴─────────────────────────────────────────────────────────────┘
```

## 2. Atalhos de Teclado Essenciais

| Atalho | Acao | Status |
|--------|------|--------|
| Ctrl+P | Quick Open (arquivos) | ❌ Implementar |
| Ctrl+Shift+P | Command Palette | ✅ Existe |
| Ctrl+S | Salvar | ✅ Existe |
| Ctrl+` | Abrir terminal | ❌ Implementar |
| Ctrl+B | Toggle sidebar | ❌ Implementar |
| Ctrl+J | Toggle bottom panel | ❌ Implementar |
| Ctrl+Shift+F | Busca no workspace | ❌ Implementar |
| Ctrl+Tab | Alternar abas | ❌ Implementar |
| Ctrl+W | Fechar aba | ❌ Implementar |
| F5 | Iniciar/parar geracao IA | ❌ Implementar |
| Ctrl+Shift+I | Alternar AI Panel | ❌ Implementar |
| Ctrl+L | Limpar console/chat | ❌ Implementar |

## 3. Novas Views na Activity Bar

| View | Icone | Funcao | Prioridade |
|------|-------|--------|-----------|
| Automacao | Terminal/Settings | Agentes de automacao de sistema | 🔴 Alta |
| Monitor | Activity | Status de processos, recursos | 🟡 Media |
| Voz | Mic | Interface de voz ativa | 🟡 Media |
| Navegador | Globe | Navegador embutido para automacao web | 🟢 Baixa |

## 4. Componentes de Interface a Implementar

### Top Bar Aprimorado
```tsx
<TopBar>
  <AppName>JARVIS</AppName>
  <QuickModelSelector>  // Seletor rapido de modelo
    <ModelBadge model={activeModel} onClick={openModelPicker} />
    <ProviderStatus health={modelHealth} />
  </QuickModelSelector>
  <ActiveAgentIndicator agent={runningAgent} />  // Indicador de agente ativo
  <PermissionBadge level={currentPermissions} />  // Badge de permissao
  <ConnectionStatus online={isOnline} />  // Online/offline
</TopBar>
```

### Chat Aprimorado (Tempo Real)
```tsx
<ChatPanel>
  <ChatHeader>
    <ModelSelector />
    <AgentSelector />
    <VoiceToggle />  // Microfone ativar/desativar
    <ContextUsedIndicator />  // Quais arquivos/notas foram usados
  </ChatHeader>
  <ChatMessages virtualized />  // Virtualizacao para muitas mensagens
  <ChatInput>
    <TextArea autoResize />
    <AttachContextButton />  // Anexar arquivos como contexto
    <SendButton />
    <VoiceInputButton />  // Entrada de voz
    <StopGenerationButton />
  </ChatInput>
</ChatPanel>
```

### Notifications / Toast System
```tsx
<ToastContainer position="bottom-right">
  <Toast type="success">Arquivo salvo</Toast>
  <Toast type="error">Falha ao conectar Ollama</Toast>
  <Toast type="info">Agente concluiu revisao</Toast>
  <Toast type="warning">Permissao necessaria</Toast>
</ToastContainer>
```

### Painel de Automacao
```tsx
<AutomationPanel>
  <AutomationScripts>
    <ScriptCard name="Login GitHub" status="ready" />
    <ScriptCard name="Executar Prova" status="running" />
    <ScriptCard name="Abrir Site" status="idle" />
  </AutomationScripts>
  <AutomationLog>
    <LogEntry timestamp="..." action="Navegando para..." />
    <LogEntry timestamp="..." action="Preenchendo formulario..." />
    <LogEntry timestamp="..." action="Acao concluida com sucesso" />
  </AutomationLog>
  <PermissionRequestBanner>
    O agente precisa acessar: [Navegador] [Arquivos] [Teclado]
    [Permitir] [Permitir sempre] [Negar]
  </PermissionRequestBanner>
</AutomationPanel>
```

## 5. Temas e Estilos

### Paleta de Cores Expandida

```css
:root {
  /* Cores atuais - manter */
  --bg-primary: #101317;
  --bg-secondary: #171b21;
  --bg-tertiary: #15191f;
  --text-primary: #e7ebf2;
  --text-secondary: #aeb7c5;
  --accent: #75d3b5;
  --danger: #e06c75;
  --warning: #f7c86a;
  
  /* Novas cores - adicionar */
  --info: #61afef;
  --voice-active: #c678dd;
  --automation-running: #98c379;
  --permission-low: #75d3b5;
  --permission-medium: #f7c86a;
  --permission-high: #e06c75;
  --permission-critical: #be5046;
}
```

### Tipografia
- **Interface**: Inter (ja usado) — manter
- **Codigo**: Cascadia Code / JetBrains Mono (ja usado) — manter
- **Tamanhos**: 12px (status bar), 13px (ui geral), 14px (editor)

## 6. Micro-interacoes e Animacoes

| Elemento | Animacao | Duracao |
|----------|----------|---------|
| Transicao de views | Fade + slide | 180ms |
| Streaming de texto | Cursor piscante + fade-in | — |
| Microfone ativo | Pulse circular | 1.5s loop |
| Notificacao | Slide-in da direita | 300ms |
| Permissao solicitada | Banner shake + glow | 400ms |
| Agente executando | Spinner + pulsar suave | 1s loop |
| Lista filtrando | Stagger fade | 200ms/item |

## 7. Estados da Interface

Cada componente deve ter estados:

1. **Carregando** — Skeleton loader ou spinner
2. **Vazio** — Mensagem clara + acao sugerida
3. **Erro** — Mensagem + botao de retry
4. **Sucesso** — Confirmacao visual
5. **Em andamento** — Progresso (spinner, barra)
6. **Bloqueado** — Explicacao do bloqueio + acao para desbloquear

## 8. Responsividade e Layout

- **Minimo**: 1200px (manter)
- **Recomendado**: 1440px+ (full layout)
- **Breakpoints**: 1200px, 1600px, 1920px
- **Painel de IA**: minimo 360px, maximo 600px
- **Sidebar**: minimo 260px, maximo 500px
- **Bottom panel**: altura minima 150px, pode maximizar para tela cheia
