# 017 — Editor Fase 3 (Search, Command Palette, Preview, Git Gutter)

## Metadados
- Status: a fazer
- Prioridade: 🔴 Alta
- Dependências: 016

## Descrição
Completar o editor com Search/Replace (Ctrl+F), Command Palette (Ctrl+Shift+P), Markdown Preview, Format on Save e Git Gutter.

## Especificação Técnica

### 1. Search/Replace (Ctrl+F)
O Monaco já possui find widget nativo. Habilitar e configurar:
- Ctrl+F abre find widget
- Ctrl+H abre find+replace
- Suporte a regex, case-sensitive, whole word
- Destaque de todas as ocorrências

**C++:** Nenhuma mudança necessária (é client-side no Monaco)

### 2. Command Palette (Ctrl+Shift+P)
- Overlay modal similar ao QuickOpen, mas lista comandos
- Comandos: "Salvar", "Fechar", "Split", "Fechar Split", "Abrir Arquivo...", "Abrir Configurações"
- CSS similar ao QuickOpen para consistência

### 3. Markdown Preview
- Botão na toolbar "Preview" (📄) para arquivos .md
- Abre painel lado a lado com HTML renderizado
- Usa marked ou markdown-it para renderizar
- Atualiza em tempo real conforme digita

**React:** `MarkdownPreview.tsx` — componente que renderiza markdown

### 4. Format on Save
- Bridge handler `editorFormatFile(path)` que chama ESLint/Prettier
- Para arquivos .ts/.tsx/.js/.jsx/.json/.css/.md
- Opção nas settings "editor.formatOnSave"
- Chamado automaticamente antes de salvar se habilitado

### 5. Git Gutter
- Indicadores visuais na gutter do Monaco:
  - 🟢 Linha adicionada (verde)
  - 🟡 Linha modificada (amarelo)
  - 🔴 Linha removida (marcador vermelho na gutter)
- Requer diff com o git index
- **C++:** `editorGetGitDiff(filePath)` — retorna diff lines

## Critérios de Aceitação
- [ ] Ctrl+F abre find widget no Monaco
- [ ] Ctrl+H abre find+replace
- [ ] Ctrl+Shift+P abre command palette com comandos
- [ ] Markdown preview renderiza HTML lado a lado
- [ ] Format on Save formata ao salvar
- [ ] Git gutter mostra indicadores visuais de diff

## Test Cases

### TC-001: Find abre com Ctrl+F
- **Passos:** 1. Abrir arquivo 2. Pressionar Ctrl+F
- **Resultado:** Find widget aparece no canto superior direito
- **Cobertura:** normal

### TC-002: Command Palette abre comandos
- **Passos:** 1. Pressionar Ctrl+Shift+P
- **Resultado:** Overlay com lista de comandos, digitar filtra
- **Cobertura:** normal

### TC-003: Markdown preview
- **Passos:** 1. Abrir arquivo .md 2. Clicar "Preview"
- **Resultado:** Painel direito com HTML renderizado
- **Cobertura:** normal

### TC-004: Git Gutter visível
- **Passos:** 1. Abrir arquivo em repo git com mudanças
- **Resultado:** Gutter mostra 🟢🟡🔴 indicadores
- **Cobertura:** normal
