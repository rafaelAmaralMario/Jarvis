# Módulo Editor

## O que faz
Editor de código profissional baseado em Monaco Editor com abas, syntax highlighting, split view, quick open, command palette, auto-save e preview Markdown.

## Arquivos
```
kernel/src/editor/editor_manager.cpp        — Estado do editor no backend

ui/src/components/Editor/EditorPanel.tsx    — Container principal
ui/src/components/Editor/EditorTabs.tsx     — Abas do editor
ui/src/components/Editor/MonacoWrapper.tsx  — Wrapper Monaco Editor
ui/src/components/Editor/CommandPalette.tsx — Ctrl+Shift+P
ui/src/components/Editor/QuickOpen.tsx      — Ctrl+P
ui/src/components/Editor/Breadcrumb.tsx     — Breadcrumb de path
ui/src/components/Editor/EditorSettingsPanel.tsx
ui/src/components/Editor/MarkdownPreview.tsx— Preview de .md
```

## Funcionalidades

### Abas
- Múltiplas abas com scroll
- Fechar aba (Ctrl+W)
- Reordenar abas por drag
- Indicador de arquivo não salvo (•)
- Ícone por tipo de arquivo

### Monaco Editor
- Syntax highlighting para 50+ linguagens
- Minimap
- Search/Replace (Ctrl+F, Ctrl+H)
- Multi-cursor
- Code folding
- Autocomplete básico

### Quick Open (Ctrl+P)
- Busca fuzzy por nome de arquivo no projeto
- Preview rápido
- Navegação por setas

### Command Palette (Ctrl+Shift+P)
- Busca fuzzy por comandos disponíveis
- Atalhos de teclado visíveis ao lado
- Comandos: salvar, fechar, formatar, etc

### Breadcrumb
- Caminho completo do arquivo atual
- Navegação clicável por segmento
- Sincronizado com FileTree

### Auto-save
- Salvamento automático após período de inatividade
- Configurável (intervalo em ms)
- Indicador visual de salvamento

### Markdown Preview
- Preview lado a lado para arquivos .md
- Renderização com `marked`
- Atualização em tempo real

### Editor Settings
- Tamanho da fonte
- Tema do editor (vs-dark, light, etc)
- Tab size
- Word wrap
- Auto-save habilitado/desabilitado
- Salvo no banco SQLite (tabela editor_settings)
