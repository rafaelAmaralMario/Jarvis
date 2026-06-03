# Mapeamento de Funcionalidades do VS Code para o JARVIS

> **Objetivo:** Catalogar funcionalidades do VS Code relevantes para o JARVIS, analisar lacunas, extrair lições arquiteturais e priorizar implementação.
>
> **Data:** Junho 2026  |  **Versão JARVIS:** 0.1.0  |  **Versão VS Code referência:** 1.96+

---

## 1. Mapa de Funcionalidades do VS Code

### 1.1. Editor de Código

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Multi-cursor** | `Alt+Click`, `Ctrl+D` para selecionar próxima ocorrência, `Ctrl+Shift+L` para selecionar todas | Edição simultânea de múltiplos pontos no código | ❌ Ausente (Monaco suporta, mas não exposto) |
| **Bracket Pair Colorization** | Pares de colchetes coloridos com linhas-guia | Navegação visual em código aninhado | ❌ Ausente (desabilitado no Monaco) |
| **Minimap** | Visão miniatura do código à direita | Navegação rápida por arquivos longos | ⚠️ Desabilitado por padrão (config `minimap.enabled: false`) |
| **Word Wrap** | Quebra automática de linhas longas | Legibilidade sem scroll horizontal | ❌ Ausente (não configurado) |
| **Folding (Code Folding)** | Expandir/recolher blocos de código (funções, imports, etc.) | Foco em seção específica do código | ❌ Ausente (Monaco suporta, mas atalhos não expostos) |
| **Breadcrumbs** | Trilha de navegação no topo do editor mostrando hierarquia de símbolos | Navegação contextual dentro do arquivo | ❌ Ausente |
| **Format on Save** | Formatação automática ao salvar (`editor.formatOnSave`) | Código consistente sem ação manual | ❌ Ausente (não integrado com Prettier/formatadores) |
| **Snippets** | Templates de código expansíveis via `Tab` | Produtividade em código repetitivo | ❌ Ausente |
| **Emmet** | Expansão CSS/HTML via atalhos (`!` → doctype, `.class` → div) | Agilidade em desenvolvimento web | ❌ Ausente (Monaco suporta, não configurado) |
| **IntelliSense** | Autocomplete contextual com tipos, documentação, signature help | Descoberta de API, redução de erros | ❌ Ausente (Monaco tem suporte básico, sem LSP) |
| **Code Actions (Lightbulb)** | Sugestões automáticas com lâmpada (`Ctrl+.`) | Correção rápida de erros e warnings | ❌ Ausente |
| **Refactoring** | Extract method/variable, rename symbol (F2), inline, change signature | Melhoria de código sem risco | ❌ Ausente |
| **Hover Information** | Tooltip com tipo, documentação, exemplos ao passar mouse | Informação contextual sem navegação | ❌ Ausente |
| **Go to Definition / References** | Navegação para definição de símbolo (`F12`) ou referências (`Shift+F12`) | Compreensão de código | ❌ Ausente |
| **Peek Definition** | Preview inline da definição sem sair do arquivo atual | Contexto sem perder posição | ❌ Ausente |
| **Inline Suggestions** | Sugestões de código inline (Tab Aceitar, Esc Rejeitar) similar ao Copilot | Edição assistida por IA | ❌ Ausente (potencial com modelo de IA) |
| **Sticky Scroll** | Cabeçalhos de escopo fixos no topo do editor durante scroll | Contexto de escopo em arquivos longos | ❌ Ausente |

### 1.2. Gerenciamento de Arquivos

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Explorer (Árvore de Arquivos)** | Navegação hierárquica com CRUD, drag-and-drop, filtros | Gerenciamento visual do projeto | ✅ Existente (com CRUD, sem drag-and-drop) |
| **Open Editors** | Seção no explorer mostrando abas abertas | Visão geral do que está sendo editado | ❌ Ausente |
| **Outline (Estrutura)** | Visão hierárquica de símbolos do arquivo ativo | Navegação estrutural | ❌ Ausente |
| **Timeline** | Histórico local de edições (Git + file events) | Rastreamento de alterações no tempo | ❌ Ausente |
| **Search / Find in Files** | Busca textual com regex, substituição, preview, escopo (include/exclude) | Navegação e refatoração global | ⚠️ Busca textual básica, sem regex, sem preview de substituição |
| **Multi-root Workspaces** | Múltiplas pastas no mesmo workspace (`.code-workspace`) | Projetos multi-módulo/monorepo | ❌ Ausente |
| **Drag-and-Drop de Arquivos** | Mover arquivos por arrasto no explorer | Organização visual rápida | ❌ Ausente |
| **File Nesting** | Agrupamento visual de arquivos relacionados (`.ts`, `.tsx`, `.css`) | Explorador mais limpo | ❌ Ausente |

### 1.3. Controle de Versão (Git)

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **SCM View** | Painel centralizado de todos os repositórios | Visão unificada de mudanças | ✅ Existente (painel Git básico) |
| **Stage/Unstage** | Adicionar/remover arquivos do staging area | Controle granular de commit | ✅ Existente |
| **Diff Editor** | Diff side-by-side com syntax highlight, staging parcial, navegação entre mudanças | Revisão visual de alterações | ⚠️ Diff texto puro (`<pre>`), sem side-by-side |
| **Commit** | Commit com validação, amend, editor de mensagem | Versionamento | ✅ Existente |
| **Branch Management** | Listar, criar, checkout, deletar, merge, rebase branches | Fluxo Git completo | ⚠️ Apenas listar, criar, checkout (sem merge, rebase, delete) |
| **GitLens (Inspector)** | Inline blame, code lens com autores, histórico de linha, busca por commit | Rastreabilidade de código | ❌ Ausente |
| **Inline Blame** | Anotação na linha: autor, data, commit message | Contexto imediato de autoria | ❌ Ausente |
| **Merge Editor** | Editor visual de resolução de conflitos com accept both/incoming/current | Resolução de conflitos assistida | ❌ Ausente |
| **Stash** | `git stash` save/pop/list/apply via UI | Salvar trabalho temporário | ❌ Ausente |
| **Interactive Rebase** | Rebase interativo visual com pick/squash/reword/reorder/drop | Histórico limpo | ❌ Ausente |
| **Push / Pull / Fetch** | Sincronização com remoto | Colaboração remota | ❌ Ausente |
| **Pull Request** | Criação e review de PRs via GitHub/GitLab/Azure DevOps extensões | Revisão sem sair da IDE | ⚠️ Apenas gera URL de comparação |
| **Git Graph** | Visualização gráfica de branches e commits | Compreensão visual do histórico | ❌ Ausente |
| **Source Control Providers** | Múltiplos SCMs (Git, SVN, etc.) via API de contribuição | Flexibilidade de VCS | ❌ Ausente (apenas Git) |

### 1.4. Terminal

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Terminal Integrado** | Terminal shell completo (PowerShell, Bash, Zsh, Cmd) | Execução de comandos sem sair da IDE | ⚠️ Placeholder estático (não funcional) |
| **Split Terminal** | Múltiplos terminais lado a lado ou em abas | Múltiplos contextos simultâneos | ❌ Ausente |
| **Task Runner** | Automação baseada em `tasks.json` (build, test, lint, etc.) | Comandos repetitivos com um atalho | ❌ Ausente |
| **Problems Panel** | Erros e warnings agregados de linters/compiladores | Visão consolidada de problemas | ❌ Ausente |
| **Output Panel** | Logs de extensões, servidores, ferramentas | Diagnóstico | ❌ Ausente |
| **Debug Console** | Saída do debugger, expressões avaliadas em tempo real | Interação com debug | ❌ Ausente |
| **Terminal Tabs** | Múltiplos terminais em abas independentes | Organização de sessões | ❌ Ausente |
| **Shell Integration** | Comandos detectáveis, navegação por comandos no terminal | Navegação no histórico | ❌ Ausente |
| **Terminal Links** | URLs e caminhos clicáveis no terminal | Acesso rápido a recursos | ❌ Ausente |

### 1.5. Debugging

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Breakpoints** | Linha, condicional, logpoint, função, exceção | Pausar execução em pontos específicos | ❌ Ausente |
| **Watch** | Expressões monitoradas em tempo real | Acompanhamento de valores | ❌ Ausente |
| **Call Stack** | Pilha de chamadas com navegação entre frames | Rastreamento de fluxo de execução | ❌ Ausente |
| **Variables** | Visualização de variáveis locais, globais, closures | Inspeção de estado | ❌ Ausente |
| **Launch Configurations** | `launch.json` com perfis customizáveis por projeto | Configuração flexível de debug | ❌ Ausente |
| **Conditional Breakpoints** | Breakpoints que disparam apenas quando condição é verdadeira | Debug seletivo | ❌ Ausente |
| **Debug Console REPL** | Console interativo durante pausa | Expressões e avaliações | ❌ Ausente |
| **Logpoints** | Log sem pausar execução, via console | Debug não intrusivo | ❌ Ausente |
| **Multi-session Debug** | Múltiplos debugs simultâneos (ex.: frontend + backend) | Arquiteturas distribuídas | ❌ Ausente |
| **Debug Adapter Protocol** | Protocolo padrão para adapters de debug | Debug de qualquer linguagem | ❌ Ausente |

### 1.6. Extensões

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Marketplace** | Catálogo de extensões com busca, instalação, reviews | Descoberta de funcionalidades | ❌ Ausente |
| **Install/Uninstall** | Gerenciamento de extensões via UI | Ciclo de vida de extensões | ⚠️ Apenas ativar/desativar plugins locais |
| **Extension Recommendations** | Sugestões baseadas no tipo de projeto (workspace, arquivo) | Descoberta contextual | ❌ Ausente |
| **Extension Contributions** | Pontos de contribuição (views, comandos, menús, keybindings, settings, languages) | Extensibilidade rica | ⚠️ Sistema de plugins básico (manifests, capabilities) |
| **Extension Host Isolation** | Extensões rodam em processo separado (child process ou web worker) | Estabilidade e segurança | ⚠️ Plugins rodam no mesmo processo (sem isolamento) |
| **Extension API** | `vscode.d.ts` — API completa para extensões | Poder de extensão | ❌ Ausente |
| **Webview API** | HTML/CSS/JS sandboxado dentro da IDE | UI customizada em extensões | ❌ Ausente |
| **Built-in Extensions** | Muitos recursos são extensões built-in (Git, Markdown, JSON, TypeScript) | Modularidade e manutenibilidade | ⚠️ 3 plugins built-in (mock, git, obsidian) |

### 1.7. Configurações

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Settings UI** | Interface gráfica de configurações com busca | Configuração sem editar JSON | ✅ Existente (SettingsPanel) |
| **settings.json** | Configuração em JSON com IntelliSense | Configuração avançada | ⚠️ Configuração via UI, sem JSON editável |
| **Workspace Settings** | `.vscode/settings.json` — configuração por projeto | Configuração compartilhada em equipe | ⚠️ Configuração por localStorage, sem arquivo de workspace |
| **Per-language Settings** | Configurações específicas por linguagem (`[typescript]: { ... }`) | Comportamento customizado por linguagem | ❌ Ausente |
| **Keybindings Editor** | Interface para customizar atalhos de teclado | Personalização de shortcuts | ❌ Ausente |
| **Profiles** | Perfis de configuração (extensões, settings, keybindings) intercambiáveis | Múltiplos contextos de trabalho | ❌ Ausente |
| **Settings Sync** | Sincronização via conta Microsoft/GitHub | Mesma configuração em múltiplas máquinas | ❌ Ausente |

### 1.8. Comandos e Atalhos

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Command Palette** | `Ctrl+Shift+P` com todos os comandos disponíveis | Acesso a qualquer ação | ✅ Existente (8 comandos) |
| **Keyboard Shortcuts** | Sistema completo de keybindings com contextos (`when` clauses) | Produtividade via teclado | ❌ Ausente |
| **Quick Open** | `Ctrl+P` para abrir arquivos rapidamente | Navegação rápida | ❌ Ausente (apenas Command Palette) |
| **Multi-step Commands** | Sequências de comandos com input do usuário | Workflows complexos | ❌ Ausente |
| **Tasks** | `tasks.json` com task runner, problem matchers, composição | Automação integrada | ❌ Ausente |
| **Workspace Commands** | Comandos específicos do projeto | Customização por projeto | ❌ Ausente |

### 1.9. Layout e Interface

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Activity Bar** | Ícones verticais para navegação entre views | Acesso rápido a funcionalidades | ✅ Existente (8 ícones) |
| **Status Bar** | Barra inferior com branch, erros, warnings, encoding, indentation | Informações contextuais do projeto | ❌ Ausente |
| **Panel Position** | Painel inferior reposicionável (direita, esquerda, inferior) | Layout adaptável | ❌ Ausente (fixo inferior) |
| **Editor Groups / Split** | Múltiplos grupos de editores lado a lado (split horizontal/vertical) | Comparação e edição simultânea | ❌ Ausente |
| **Zen Mode** | Tela cheia sem distrações | Foco total no código | ❌ Ausente |
| **Centered Layout** | Editor centralizado com margens automáticas | Leitura confortável em telas largas | ❌ Ausente |
| **Custom Title Bar** | Título da janela customizável | Identificação de projeto | ⚠️ Top Bar básico (nome + modelo) |
| **Minimap Customization** | Posição, tamanho, renderização de caracteres vs blocos | Navegação visual | ⚠️ Minimap desabilitado |
| **Editor Tabs** | Tabs com dirty indicator, multi-select, pin, color, grouping | Gerenciamento de arquivos abertos | ✅ Existente (com dirty indicator) |
| **Breadcrumbs** | Trilha no topo do editor | Navegação hierárquica | ❌ Ausente |

### 1.10. Visualização e Display

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Markdown Preview** | Preview renderizado lado a lado do Markdown | Visualização de documentação | ❌ Ausente (Monaco exibe como texto) |
| **PDF Viewer** | Visualização de PDF integrada | Documentação em PDF | ❌ Ausente |
| **Image Viewer** | Visualização de imagens no editor | Assets sem abrir app externo | ❌ Ausente |
| **Hex Editor** | Edição hexadecimal de arquivos binários | Debug de binários | ❌ Ausente |
| **Large File Handling** | Modo especial para arquivos >50MB sem syntax highlight | Arquivos enormes sem travar | ❌ Ausente |
| **Custom Editors** | API para criar visualizadores customizados | Formatos específicos de projeto | ❌ Ausente |

### 1.11. Colaboração

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Live Share** | Edição, debug e terminal compartilhados em tempo real | Pair programming remoto | ❌ Ausente |
| **Workspace Trust** | Modo restrito para workspaces não confiáveis | Segurança ao abrir código externo | ⚠️ Permissões por workspace existem (5 permissões), mas diferente |
| **Remote - SSH** | Desenvolvimento em máquina remota via SSH | Ambientes remotos | ❌ Ausente |
| **Remote - Containers** | Desenvolvimento dentro de Docker containers | Ambientes padronizados | ❌ Ausente |
| **Remote - WSL** | Desenvolvimento no Windows Subsystem for Linux | Integração Windows/Linux | ❌ Ausente |
| **GitHub Codespaces** | IDE baseada em nuvem | Desenvolvimento de qualquer lugar | ❌ Ausente |
| **Audio Call** | Chamada de áudio integrada (Live Share Audio) | Comunicação durante pair programming | ❌ Ausente |

### 1.12. Suporte a Linguagens

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Language Server Protocol** | Protocolo padrão para features de linguagem (completion, hover, definition, diagnostics) | Inteligência de linguagem consistente | ❌ Ausente |
| **Debug Adapter Protocol** | Protocolo padrão para adapters de debug | Debug universal | ❌ Ausente |
| **Grammar Definitions** | `TextMate` grammars para syntax highlighting | Syntax highlight para qualquer linguagem | ✅ Monaco detecta linguagem por extensão |
| **Semantic Tokens** | Tokenização semântica além da sintática (baseada em AST) | Highlight mais preciso que syntax-only | ❌ Ausente |
| **Snippet Providers** | Snippets por linguagem | Aceleração de escrita | ❌ Ausente |
| **Formatter Providers** | Formatação por linguagem (Prettier, rustfmt, black, etc.) | Código consistente | ❌ Ausente |

### 1.13. Recursos Adicionais do VS Code

| Funcionalidade VS Code | Descrição | Problema que Resolve | Status no JARVIS |
|---|---|---|---|
| **Settings Sync** | Sincronização cloud de settings, keybindings, extensões | Consistência entre máquinas | ❌ Ausente |
| **Screencast Mode** | Exibe teclas pressionadas na tela | Demonstrações e ensino | ❌ Ausente |
| **Accessibility** | Suporte a screen readers, navegação por teclado | Inclusão | ❌ Ausente |
| **Log (Telemetry) Output** | Logs de telemetria e diagnóstico | Resolução de problemas | ⚠️ Audit trail, sem telemetria |
| **Profiles** | Perfis de configuração | Diferentes contextos de trabalho | ❌ Ausente |
| **Workspace Trust** | Modo restrito para segurança | Proteção contra código malicioso | ⚠️ Permissões de workspace, mas diferente |

---

## 2. Análise de Lacunas (Gap Analysis)

### 2.1. Prioridade Alta — Funcionalidades Essenciais

| Funcionalidade | Prioridade | Esforço Estimado | Notas de Implementação |
|---|---|---|---|
| **Terminal Integrado Real** | 🔴 Alta | 3-4 semanas | Usar `xterm.js` + pty (node-pty ou equivalente Rust via `portable-pty`). JARVIS já tem a aba Terminal no Bottom Panel. Conectar a um shell real (PowerShell, bash). Comunicação via Tauri command para spawn de processo. |
| **Status Bar** | 🔴 Alta | 1-2 semanas | Barra inferior de 22-24px. Git branch atual, erros/warnings (quando LSP existir), encoding, linguagem, modelo ativo, permissões atuais. Dados já disponíveis nos hooks `useGit`, `useSettings`. |
| **Quick Open (Ctrl+P)** | 🔴 Alta | 1-2 semanas | Fugitivo do Command Palette. `Ctrl+P` deve listar arquivos do workspace com fuzzy search. Reutilizar lógica de busca existente (`searchWorkspace`). `Ctrl+Shift+P` mantido para comandos. |
| **Breadcrumbs** | 🔴 Alta | 2-3 semanas | Trilha no topo do Monaco. Monaco suporta nativamente. Extrair símbolos via serviço de análise (ou futuramente via LSP). |
| **Diff Side-by-Side** | 🔴 Alta | 2-3 semanas | Substituir `<pre>` raw no Bottom Panel por Monaco diff editor (`@monaco-editor/react` tem suporte a diff). Reaproveitar instância Monaco já existente. |

### 2.2. Prioridade Média — Diferenciação Significativa

| Funcionalidade | Prioridade | Esforço Estimado | Notas de Implementação |
|---|---|---|---|
| **Teclas de Atalho Customizáveis** | 🟡 Média | 1-2 semanas | Implementar `keybindings.json` similar ao VS Code. Sistema de `when` clauses para contextos (editor focus, terminal focus, palette open). Interface de edição visual (Settings > Keyboard Shortcuts). |
| **Command Palette Expandido** | 🟡 Média | 1-2 semanas | Adicionar mais comandos (abrir arquivo, alternar terminal, git: push/pull, modelo: selecionar). Melhorar fuzzy search. Atalhos `Ctrl+P` (arquivos) vs `Ctrl+Shift+P` (comandos). |
| **Git Push/Pull/Fetch** | 🟡 Média | 1 semana | Adicionar comandos no Rust (`git push`, `git pull --rebase`, `git fetch`). UI no GitPanel com botões e feedback de progresso. |
| **Multi-cursor no Monaco** | 🟡 Média | ~3 dias | Configurar Monaco para suportar multi-cursor. Atalhos padrão (Alt+Click, Ctrl+D, Ctrl+Shift+L). Provavelmente já funciona, só precisa expor atalhos e configurar. |
| **Code Folding** | 🟡 Média | ~2 dias | Configurar Monaco para folding. Atalhos padrão (Ctrl+Shift+[, Ctrl+Shift+]). Já suportado pelo Monaco, só habilitar. |
| **Snippets** | 🟡 Média | 1-2 semanas | Integrar `monaco-editor` com completion provider para snippets. Formato JSON similar ao VS Code. Snippets por linguagem. |
| **Configuração workspace em JSON** | 🟡 Média | ~1 semana | Salvar configuração em `.jarvis/settings.json` no workspace (similar `.vscode/settings.json`). SettingsPanel atualmente salva em `localStorage`. Mover para arquivo permite versionamento e compartilhamento. |
| **Editor Groups / Split** | 🟡 Média | 2-4 semanas | Suporte a múltiplos grupos de editores. Drag de tab para criar split. Grid de editores. Complexidade moderada (layout + gerenciamento de estado). |

### 2.3. Prioridade Média-Baixa

| Funcionalidade | Prioridade | Esforço Estimado | Notas de Implementação |
|---|---|---|---|
| **Format on Save** | 🟡 Média | ~1 semana | Configurar Monaco para formatar ao salvar. Integrar Prettier (já no projeto) como formatador padrão. `editor.formatOnSave` em settings. |
| **Emmet** | 🟡 Média | ~1 semana | Configurar Monaco Emmet extension. Já suportado pelo Monaco. Ativar para HTML, CSS, JSX. |
| **Language Server Protocol** | 🟡 Média | 4-8 semanas | Feature complexa. Cliente LSP em TypeScript (usar `vscode-languageserver-protocol` ou implementar). Spawn de processo para language server. Comunicação JSON-RPC via stdin/stdout. Suporte a diagnóstico, completion, hover, go-to-definition. |
| **Sticky Scroll** | 🟡 Média | ~1 semana | Configurar opção `editor.experimental.stickyScroll` no Monaco. |
| **Zen Mode** | 🟡 Média | ~1 semana | Esconder sidebar, AI Panel, bottom panel. Foco total no editor. Atalho (ex.: `Ctrl+K Z`). |

### 2.4. Prioridade Baixa — Features de Nicho

| Funcionalidade | Prioridade | Esforço Estimado | Notas de Implementação |
|---|---|---|---|
| **GitLens / Inline Blame** | 🟢 Baixa | 2-3 semanas | `git blame` para linha ativa. Anotação no gutter do Monaco. Cache de blame para performance. |
| **Merge Editor** | 🟢 Baixa | 3-4 semanas | Detectar conflitos (`<<<<<<<`, `=======`, `>>>>>>>`). Editor com 3 painéis (incoming, current, result). GitHub-style merge handling. |
| **IntelliSense via LSP** | 🟢 Baixa | 4-8 semanas | Depende de implementação LSP completa. Primeiro LSP básico para TypeScript (via TypeScript compiler API), depois expandir. |
| **Refactoring** | 🟢 Baixa | 4-6 semanas | Depende de LSP ou TypeScript compiler. Rename symbol (F2) é o mais crítico. Extract method/variable pode vir depois. |
| **Markdown Preview** | 🟢 Baixa | 1-2 semanas | Split view com Monaco de um lado, renderização Markdown do outro. Biblioteca `marked` ou `react-markdown`. |
| **Bracket Pair Colorization** | 🟢 Baixa | ~1 dia | Habilitar `editor.bracketPairColorization.enabled: true` no Monaco. |
| **Git Push/Pull/Fetch** | 🟢 Baixa | 1 semana | Essencial para workflow real, mas sem push não há PR. Prioridade sobe se PR for necessário. |
| **Timeline** | 🟢 Baixa | 2-3 semanas | Histórico local de edições + eventos Git. Similar ao Timeline do VS Code. |
| **Remote Development (SSH)** | 🟢 Baixa | 6-8 semanas | Feature complexa. Servidor Tauri/headless remoto. Cliente se conecta via SSH. VS Code Server como referência. |
| **Live Share** | 🟢 Baixa | 8-12 semanas | Colaboração em tempo real. WebRTC + WebSocket. Sincronização de edições, cursores, terminais. Extremamente complexo. |
| **Hex Editor / PDF Viewer** | 🟢 Baixa | 2-4 semanas | Custom editor para binários e PDFs. Biblioteca `react-pdf` para PDF, componente hex para binário. |
| **Drag-and-Drop Arquivos** | 🟢 Baixa | 1-2 semanas | React DnD ou HTML5 drag API no FilesPanel. Atualizar `moveEntry` via Tauri. |
| **Audio Call** | 🟢 Baixa | 4-6 semanas | Depende de Live Share. WebRTC audio. |
| **Large File Handling** | 🟢 Baixa | 1-2 semanas | Detectar arquivos >50MB, desabilitar syntax highlight, chunks de leitura. |

---

## 3. Lições de Arquitetura do VS Code

### 3.1. Isolamento do Extension Host (Processo Separado)

**O que o VS Code faz:** Extensões rodam em um processo filho Node.js separado (ou Web Worker, ou remoto). A comunicação é via RPC/JSON-RPC por `MessagePort` ou `WebSocket`.

**Por que é importante:**
- Uma extensão que crasha não derruba a IDE
- Extensões não têm acesso direto ao DOM (segurança)
- Performance isolada — extensões lentas não bloqueiam a UI
- Três tipos de host: `LocalProcess` (Node.js full), `LocalWebWorker` (browser APIs), `Remote` (SSH/container)

**Como aplicar no JARVIS:**
- Plugins JS atuais rodam no mesmo processo (renderer). Migrar para `Web Worker` (temos Tauri, então worker é via `postMessage`)
- Plugin host isolado com `eval`/`new Function` sandboxado e API limitada
- Comunicação via RPC tipado (UI ↔ Plugin Host)
- Inspiração: VS Code tem `extHostExtensionService.ts` + `rpcProtocol.ts`

### 3.2. Language Server Protocol (LSP)

**O que o VS Code faz:** Todo o suporte a linguagens é delegado a servidores externos via protocolo padrão. O editor é "burro" — ele apenas consome os resultados do LSP.

**Por que é importante:**
- Suporte a qualquer linguagem com servidor LSP existente (TS, Python, Rust, Go, Java, etc.)
- Servidor roda em processo separado (isolamento de performance)
- Protocolo padronizado permite reuso entre IDEs (VS Code, Neovim, Emacs, Eclipse)

**Como aplicar no JARVIS:**
- Cliente LSP em TypeScript usando `vscode-languageserver-protocol` (já disponível no npm)
- Comunicação via stdin/stdout do processo filho (spawn via Tauri)
- Features: completion, hover, diagnostics, go-to-definition, references, signature help, formatting
- Implementação progressiva: começar com TypeScript (`typescript-language-server`), depois `rust-analyzer`, `pyright`

### 3.3. Web Workers para Computação Pesada

**O que o VS Code faz:** Web Workers são usados para parsing, tokenização, busca textual, formatação.

**Por que é importante:**
- UI nunca bloqueia durante processamento intenso
- Múltiplos cores utilizados
- Busca textual, highlight, diff computation em background

**Como aplicar no JARVIS:**
- Busca textual já existe, mas roda no main thread. Mover para Worker.
- Tokenização e syntax highlight (o Monaco já faz em worker)
- Futuro: análise de código, indexação para agentes de IA

### 3.4. Sistema de Pontos de Contribuição (Contribution Points)

**O que o VS Code faz:** Extensões contribuem com views, comandos, menus, keybindings, settings, languages, debuggers via `package.json` → `contributes`.

**Por que é importante:**
- Declarativo e extensível
- VS Code não precisa conhecer cada extensão — o manifest define tudo
- Sistema de `when` clauses para visibilidade contextual

**Como aplicar no JARVIS:**
- Sistema de plugins atual usa `capabilities` (git.status, models.code, etc.). Evoluir para pontos de contribuição tipo VS Code
- `jarvis.plugins.json` → `contributes.commands`, `contributes.views`, `contributes.keybindings`
- Plugin registry com merge de contributions
- `when` clauses para contexto (ex.: `workspaceHasGit`, `modelActive`, `agentRunning`)

### 3.5. Sistema de Comandos

**O que o VS Code faz:** Toda ação é um comando registrado com ID único. Command Palette, keybindings, menus, programatic API — tudo consome o mesmo sistema de comandos.

**Por que é importante:**
- Consistência: mesma ação acessível de múltiplas formas
- Extensível: extensões registram comandos, que aparecem na palette
- Serializável: comandos podem ser encadeados em tasks

**Como aplicar no JARVIS:**
- Command Palette atual é limitado (8 comandos hardcoded em `constants.tsx`). Migrar para `CommandRegistry`
- Registrar comandos com ID, título, categoria, keybinding
- Integrar com sistema de permissões (comandos sensíveis requerem permissão)
- Comandos de IA: `jarvis.chat.send`, `jarvis.agent.run.developer`, `jarvis.agent.run.reviewer`

### 3.6. Sistema de Keybinding com Contexto (When Clauses)

**O que o VS Code faz:** `keybindings.json` com regras complexas de `when`: `editorTextFocus`, `terminalFocus`, `!editorHasSelection`, `resourceLang == 'typescript'`.

**Por que é importante:**
- Múltiplos atalhos para mesma tecla em contextos diferentes
- Evita conflitos
- Customizável pelo usuário

**Como aplicar no JARVIS:**
- Implementar `KeybindingService` com matched contexts
- Contextos iniciais: `editorFocus`, `terminalFocus`, `sidebarFocus`, `chatFocus`, `paletteOpen`
- Editor visual de keybindings (Settings > Keyboard Shortcuts)

### 3.7. Arquitetura de Temas e CSS Customizável

**O que o VS Code faz:** Sistema de temas com variáveis CSS semânticas, tokens de cores para editor, UI, terminal.

**Por que é importante:**
- Temas completos e consistentes
- Customização sem conflito
- Token colors para syntax highlight

**Como aplicar no JARVIS:**
- CSS atual tem variáveis em `theme.css`. Expandir para cobrir mais componentes.
- Adicionar theme tokens: `--vscode-editor-background`, `--vscode-sidebar-background`, etc.
- Suporte a temas da comunidade (importar temas VS Code existentes)

---

## 4. O Que o JARVIS Já Faz Melhor que o VS Code

### 4.1. Design AI-First

| Aspecto | VS Code | JARVIS | Vantagem JARVIS |
|---|---|---|---|
| **Chat integrado** | Precisa de extensão (Copilot, Cody, Continue) | Nativo com painel AI lateral direito | Experiência coesa sem instalação |
| **Seletor de modelo** | Nenhum (cada extensão gerencia) | Nativo com multi-providers (Ollama, OpenAI, Mock) | Flexibilidade total — modelos locais e cloud |
| **Streaming de tokens** | Via extensão | Nativo com `AbortController` | UI consistente independente do provider |
| **Agentes de IA** | Nenhum built-in (extensões: Copilot Agent Mode, Continue) | 4 agentes built-in + agentes customizáveis | Orquestração de IA arquitetada desde o início |
| **Contexto para IA** | Limitado (extensões) | Painel Context dedicado + integração Obsidian | Memória de longo prazo e conhecimento do projeto |
| **Permissões de IA** | Apenas Workspace Trust (binário: confia/não confia) | 5 permissões granulares (read-workspace, write-workspace, git, network, secrets) | Controle fino sobre o que a IA pode fazer |

### 4.2. Sistema de Agentes

| Aspecto | VS Code | JARVIS |
|---|---|---|
| **Agentes built-in** | Nenhum (Copilot Agent está em preview como extensão) | Cérebro do Projeto, Desenvolvedor, Revisor, Documentador |
| **Agentes customizados** | Não suportado nativamente | Agent Designer com nome, objetivo, permissões |
| **Saída estruturada** | Apenas chat inline / suggestion | `diff`, `review`, `docs`, `context` — cada agente tem saída específica |
| **Verificação de permissões** | Binária (trusted/untrusted) | Granular por permissão + audit trail |

### 4.3. Modelo de Permissões e Segurança

| Aspecto | VS Code | JARVIS |
|---|---|---|
| **Workspace Trust** | Binário (trusted / restricted mode) | 5 permissões configuráveis por workspace |
| **Audit Trail** | Não existe built-in | Todas as ações sensíveis registradas com actor, permissão, alvo, resultado |
| **API Keys** | Extensões gerenciam individualmente | Backend Rust seguro (`%APPDATA%/JARVIS/secure-settings.json`) |
| **Plugin Verification** | Assinatura opcional (publisher identity) | `createPluginVerifier` com strategy pattern, validação de capabilities |
| **Path Traversal Prevention** | Depende do sistema de arquivos | `ensure_inside_workspace()` + `validate_entry_name()` no Rust |

### 4.4. Integração com Obsidian

| Aspecto | VS Code | JARVIS |
|---|---|---|
| **Vault integration** | Extensão (obsidian-md) | Nativo com 2 vaults configuráveis (geral + projeto) |
| **Memory entries** | Não existe | Memória de longo prazo com busca de contexto |
| **Knowledge management** | Nenhum | Notas Markdown + contexto para agentes de IA |

### 4.5. Sistema de Plugins com Verificação

| Aspecto | VS Code | JARVIS |
|---|---|---|
| **Plugin locales** | Não suportado (apenas Marketplace) | `jarvis.plugins.json` + `.jarvis/plugins/*.json` |
| **Verificação preguiçosa** | Não | `createPluginVerifier` com chain of responsibility |
| **Capabilities declarativas** | Implícitas (extensão faz o que quer) | Explícitas no manifesto (git.status, models.text, network.request) |
| **Bloqueio de comandos** | Não | `commands.execute` bloqueado no MVP por segurança |

### 4.6. Stack Tecnológica Moderna

| Aspecto | VS Code | JARVIS |
|---|---|---|
| **Framework Desktop** | Electron (legado) | Tauri 2 (Rust + WebView) — ~10x menor, mais rápido |
| **Linguagem Backend** | Node.js | Rust — performance, segurança de memória |
| **Frontend** | Monolithic (JS puro / self-host) | React 19 + TypeScript strict |
| **Build** | Gulp + tsc | Vite 7 — HMD instantâneo |
| **Tamanho do instalador** | ~100-200MB | ~5-10MB (estimado Tauri) |

---

## 5. Recomendações Acionáveis

As 10 funcionalidades que o JARVIS deve implementar **primeiro**, baseadas no valor comprovado do VS Code:

### 🔴 Top 5 — Essenciais para MVP + 1

| # | Feature | Justificativa | Esforço |
|---|---|---|---|
| 1 | **Terminal Integrado Real** | Sem terminal funcional, o JARVIS não é uma IDE utilizável para fluxos reais. Placeholder atual não serve. Usar `xterm.js` + `node-pty` via Tauri. | 3-4 sem |
| 2 | **Status Bar** | Informações essenciais (branch, encoding, modelo, permissões) estão espalhadas ou ausentes. Barra de status é padrão de qualquer IDE. | 1-2 sem |
| 3 | **Quick Open (Ctrl+P)** | Navegação por nome de arquivo é a feature mais usada do VS Code depois do editor. JARVIS já tem busca textual — conectar ao `Ctrl+P`. | 1-2 sem |
| 4 | **Diff Side-by-Side** | Diff raw (`<pre>`) é inviável para revisão séria. Monaco já suporta diff editor nativamente. | 2-3 sem |
| 5 | **Git Push/Pull/Fetch** | Sem sincronia remota, o Git é apenas local. Fluxo de trabalho real requer push e pull. | 1 sem |

### 🟡 Próximos 5 — Alta Alavancagem

| # | Feature | Justificativa | Esforço |
|---|---|---|---|
| 6 | **Keybindings Customizáveis** | Produtividade via teclado é o diferencial do VS Code. Sistema de `when` clauses + editor visual. | 2-3 sem |
| 7 | **Multi-cursor + Code Folding** | Features do Monaco já disponíveis, só precisam ser expostas com atalhos e configuração. Ganho rápido. | ~1 sem |
| 8 | **Breadcrumbs** | Navegação hierárquica via Monaco. Pequeno esforço, grande impacto em produtividade. | 1-2 sem |
| 9 | **LSP Client (TypeScript primeiro)** | IntelliSense real, diagnóstico, go-to-definition — transforma o editor de "texto colorido" para IDE. TypeScript language server é o mais maduro. | 4-8 sem |
| 10 | **Format on Save + Snippets** | Código consistente automaticamente + templates. Prettier já está no projeto. Snippets no Monaco são triviais. | 1-2 sem |

### Benefícios Esperados

| Feature | Impacto em Produtividade | Dependências |
|---|---|---|
| Terminal + Git Push/Pull | Fluxo de desenvolvimento completo | Nenhuma (Rust + terminal) |
| Status Bar + Quick Open | Navegação e informação | Nenhuma |
| Multi-cursor + Folding + Breadcrumbs | Edição eficiente | Nenhuma (Monaco nativo) |
| LSP + IntelliSense | Qualidade de código | LSP client implementation |
| Format on Save | Consistência de estilo | Prettier já presente |
| Keybindings | Velocidade de operação | Sistema de comandos |

---

## Apêndice: Referências

- [VS Code Architecture Guide](https://thedeveloperspace.com/vs-code-architecture-guide/) — Process model, extensibility, LSP, DAP
- [Extension Host Architecture](https://readoss.com/en/microsoft/vscode/extension-host-vscode-isolates-communicates-extensions) — 3 flavors of extension host
- [VS Code Contribution Points](https://code.visualstudio.com/api/references/contribution-points) — `package.json` contributions
- [LSP Specification](https://microsoft.github.io/language-server-protocol/) — Language Server Protocol
- [DAP Specification](https://microsoft.github.io/debug-adapter-protocol/) — Debug Adapter Protocol
- [VS Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview) — SSH, Containers, WSL
- [VS Code Settings Sync](https://code.visualstudio.com/docs/configure/settings-sync) — Settings, keybindings, extensions sync
- [Workspace Trust](https://code.visualstudio.com/docs/editing/workspaces/workspace-trust) — Security model for untrusted code

---

*Documento gerado em Junho/2026. Baseado no código fonte do JARVIS v0.1.0 e documentação oficial do VS Code.*
