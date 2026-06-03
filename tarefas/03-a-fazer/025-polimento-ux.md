# 025 — Polimento & UX

## Metadados
- Status: a fazer
- Prioridade: 🟢 Baixa
- Dependências: (nenhuma)

## Descrição
Refinamentos finais: temas customizáveis, keybindings customizáveis, onboarding, estados vazios, micro-animações, responsividade, performance e telemetria opt-in.

## Especificação Técnica

### 1. Custom Themes
- Editor de temas no Settings: cores primary, sidebar, background, etc
- Temas pré-definidos: Dark (padrão), Light, High Contrast, Nord, Dracula
- Armazenamento na tabela `editor_settings`
- Preview em tempo real ao selecionar

### 2. Custom Keybindings
- UI de remapeamento de atalhos
- Tabela: Comando | Atalho atual | Botão "Alterar"
- Input de tecla: detecta combinação pressionada
- Armazenamento: `keybindings` tabela ou JSON em `editor_settings`
- Defaults: Ctrl+S, Ctrl+W, Ctrl+P, Ctrl+Shift+P, Ctrl+F, Ctrl+H, Ctrl+`, Ctrl+Tab, etc

### 3. Onboarding
- Primeira execução detectada (flag no banco)
- Tour guiado com 4-5 steps:
  1. "Bem-vindo ao JARVIS" — visão geral
  2. "Seu Conhecimento" — como criar notas
  3. "Assistente IA" — como conversar
  4. "Workspace" — como abrir projetos
  5. "Atalhos" — comandos essenciais
- Dismissível, revisitável em Help > Tour

### 4. Empty States
- Todas as views com estado vazio ilustrado:
  - Editor: "Selecione um arquivo na árvore ou pressione Ctrl+P"
  - Conhecimento: "Nenhuma nota ainda. Crie sua primeira nota."
  - Chat: "Faça uma pergunta ao assistente."
  - Git: "Nenhum repositório git encontrado."
  - Terminal: "Pressione Ctrl+` para abrir o terminal."
  - Automação: "Nenhum workflow configurado."

### 5. Micro-animações
- Loading skeletons para listas
- Transições suaves entre views (Framer Motion já importado)
- Progress bar para operações longas
- Toast notifications para feedback de ações

### 6. Responsividade
- Layout adaptável (min 800px width)
- Sidebar recolhível (já implementado)
- Painéis redimensionáveis com drag handle
- Suporte a touchscreen básico

### 7. Performance
- Virtualização de listas grandes (react-window)
- Lazy loading de componentes pesados (React.lazy)
- Debounce em busca e auto-save
- Memoização de componentes frequentes

### 8. Telemetria (opt-in)
- Coleta anônima: comandos executados, erros, performance
- Sem dados pessoais ou de código
- Desabilitável via Settings > Privacidade
- Botão "Enviar relatório de erro"

## Critérios de Aceitação
- [ ] Tema pode ser alterado via Settings
- [ ] Keybindings podem ser remapeados
- [ ] Tour de onboarding aparece na primeira execução
- [ ] Todas as views têm empty states
- [ ] Transições são suaves com Framer Motion
- [ ] Layout é responsivo
- [ ] Performance aceitável ( < 100ms response )

## Test Cases

### TC-001: Trocar tema
- **Passos:** 1. Settings > Tema 2. Selecionar "Light"
- **Resultado:** UI muda para tema claro instantaneamente
- **Cobertura:** normal

### TC-002: Remapear atalho
- **Passos:** 1. Settings > Atalhos 2. Alterar "Salvar" para Ctrl+Shift+S
- **Resultado:** Ctrl+Shift+S salva, Ctrl+S não funciona mais
- **Cobertura:** normal

### TC-003: Onboarding
- **Passos:** 1. Resetar flag primeira execução 2. Reiniciar app
- **Resultado:** Tour guiado aparece
- **Cobertura:** normal

### TC-004: Empty states
- **Passos:** 1. Abrir cada view sem dados
- **Resultado:** Cada view mostra mensagem ilustrativa
- **Cobertura:** normal
