# 017 — Editor Fase 3 (Search, Command Palette, Preview, Format)

## Metadados
- Status: a fazer
- Prioridade: 🔴 Alta
- Fase: 3 — Produtividade Imediata
- Dependências: 016
- Paralelizável com: 018, 022

## Descrição
Completar o editor com Search/Replace, Command Palette, Markdown Preview e Format on Save.
**Git Gutter foi movido para a task 020 (Git).**

## Especificação Técnica

### 1. Search/Replace no Monaco

O Monaco já tem find widget nativo. Ativar via opções de criação:

**MonacoWrapper.tsx:**
```tsx
const editor = monaco.editor.create(container, {
  find: { addExtraSpaceOnTop: true, autoFindInSelection: 'never', seedSearchStringFromSelection: 'always' },
  search: { addExtraSpaceOnTop: true },
});
```

Atalhos já funcionam nativamente no Monaco:
- `Ctrl+F` / `Cmd+F` → find
- `Ctrl+H` / `Cmd+H` → find + replace
- `F3` / `Shift+F3` → next/previous match
- `Ctrl+Shift+L` → select all occurrences

**C++:** Nenhuma mudança necessária.

### 2. Command Palette (Ctrl+Shift+P)

Overlay modal similar ao QuickOpen, mas lista **comandos** em vez de arquivos.

**CommandPalette.tsx:**
```tsx
interface Command {
  id: string;
  label: string;
  shortcut?: string;
  category: 'editor' | 'file' | 'view' | 'git' | 'terminal';
  action: () => void;
}
```

Comandos iniciais:
| Categoria | Comando | Atalho |
|-----------|---------|--------|
| file | Salvar | Ctrl+S |
| file | Fechar | Ctrl+W |
| file | Abrir Arquivo... | Ctrl+P |
| editor | Buscar | Ctrl+F |
| editor | Buscar e Substituir | Ctrl+H |
| editor | Split View | `||` |
| editor | Fechar Split | — |
| editor | Abrir Configurações | — |
| view | Toggle Sidebar | — |
| view | Toggle Terminal | Ctrl+` |
| view | Assistente IA | — |
| view | Conhecimento | — |

- Input filtra por nome do comando (case-insensitive)
- Navegação por setas ↑↓ + Enter
- Atalho Ctrl+Shift+P registrado globalmente
- Comandos fornecidos via contexto React (useCommands hook)

**Registro de atalho no EditorPanel:**
```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
      e.preventDefault();
      setCommandPaletteOpen(v => !v);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### 3. Markdown Preview

Botão "Preview" na toolbar do editor para arquivos .md. Abre painel lado a lado.

**Dependência npm:**
```bash
npm install marked
```

**MarkdownPreview.tsx:**
- Recebe `content: string` e `visible: boolean`
- Renderiza HTML via `marked.parse(content)`
- Estilo GitHub-like via Tailwind typography (`prose`)
- Atualiza em tempo real conforme o usuário digita
- Botão "Preview" na toolbar só aparece se o arquivo atual é .md

**EditorPanel.tsx — layout:**
```tsx
<div className="flex-1 flex overflow-hidden">
  {activeState && showPreview ? (
    <>
      <div className="flex-1"><MonacoWrapper ... /></div>
      <div className="w-[45%] border-l border-border"><MarkdownPreview content={...} /></div>
    </>
  ) : (
    <MonacoWrapper ... />
  )}
</div>
```

**C++:** Nenhuma mudança necessária (renderização 100% client-side).

### 4. Format on Save

Quando salvamos um arquivo, detectar se `formatOnSave` está habilitado nas settings
e executar o formatador apropriado antes de enviar o conteúdo para o C++.

**Opção nas settings:**
```
editor_settings key='formatOnSave' value='true'
editor_settings key='formatOnSaveMode' value='prettier'  // prettier | esbuild | none
```

**Formatação client-side (Monaco):**
```tsx
editor.getAction('editor.action.formatDocument')?.run();
```

Isso usa o formatador nativo do Monaco (TypeScript/JavaScript/JSON/CSS/HTML).

**Bridge handler expandido `editorSaveFile`:**
O React envia o conteúdo já formatado pelo Monaco para o C++.

**C++:** Nenhuma mudança estrutural — o conteúdo chega já formatado.

### 5. Find em Múltiplos Arquivos (Ctrl+Shift+F)
**Removido da task — será feito no futuro como feature separada.**

## Critérios de Aceitação
- [ ] Ctrl+F abre find widget no Monaco
- [ ] Ctrl+H abre find+replace
- [ ] Ctrl+Shift+P abre Command Palette com lista de comandos
- [ ] Enter na Command Palette executa o comando selecionado
- [ ] Botão "Preview" na toolbar para arquivos .md
- [ ] Markdown Preview renderiza HTML lado a lado e atualiza em tempo real
- [ ] Format on Save formata documento ao salvar (quando habilitado)

## Test Cases

### TC-001: Find abre com Ctrl+F
- **Pré:** Arquivo aberto no editor
- **Passos:** Pressionar Ctrl+F
- **Resultado:** Find widget aparece no canto superior direito do Monaco
- **Cobertura:** normal

### TC-002: Replace com Ctrl+H
- **Pré:** Arquivo aberto no editor
- **Passos:** Pressionar Ctrl+H
- **Resultado:** Find widget expandido com campo de replace
- **Cobertura:** normal

### TC-003: Command Palette abre comandos
- **Passos:** Pressionar Ctrl+Shift+P
- **Resultado:** Overlay modal com lista de comandos, digitar "salvar" filtra para "Salvar"
- **Cobertura:** normal

### TC-004: Command Palette executa comando
- **Pré:** Command Palette aberta
- **Passos:** 1. Digitar "fechar" 2. Enter
- **Resultado:** Arquivo atual é fechado
- **Cobertura:** normal

### TC-005: Markdown Preview abre
- **Pré:** Arquivo .md aberto no editor
- **Passos:** Clicar botão "Preview" na toolbar
- **Resultado:** Painel direito aparece com HTML renderizado do markdown
- **Cobertura:** normal

### TC-006: Markdown Preview atualiza em tempo real
- **Pré:** Preview aberto lado a lado
- **Passos:** Digitar "# Novo Título" no editor
- **Resultado:** Preview mostra "Novo Título" como H1 instantaneamente
- **Cobertura:** normal

### TC-007: Format on Save formata
- **Pré:** Settings formatOnSave=true
- **Passos:** 1. Digitar código mal formatado 2. Ctrl+S
- **Resultado:** Código é formatado automaticamente antes de salvar
- **Cobertura:** normal

### TC-008: Format on Save desabilitado
- **Pré:** Settings formatOnSave=false
- **Passos:** 1. Digitar código mal formatado 2. Ctrl+S
- **Resultado:** Código NÃO é formatado, salva como está
- **Cobertura:** borda
