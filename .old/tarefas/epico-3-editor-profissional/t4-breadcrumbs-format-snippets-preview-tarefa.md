# Tarefa: Breadcrumbs + Format on Save + Snippets + Markdown Preview

**Epico:** 3 — Editor Profissional  
**Prioridade:** 🟡 Media  
**Estimativa:** 2-3 semanas  
**Dependencias:** Nenhuma

## 1. Breadcrumbs

### Objetivo
Adicionar trilha de navegacao no topo do Monaco mostrando hierarquia de simbolos do arquivo ativo.

### Como Fazer

Monaco Editor ja suporta breadcrumbs nativamente. Basta habilitar:

```typescript
{
  breadcrumbs: true,
  'breadcrumbs.symbolPath': 'on',
  'breadcrumbs.filePath': 'on',
}
```

Extrair simbolos via parser simples de regex para linguagens comuns (functions, classes, interfaces).

## 2. Format on Save

### Objetivo
Formatar arquivo automaticamente ao salvar usando Prettier (ja no projeto).

### Como Fazer

```typescript
// Integrar formatacao via Monaco
editor.getAction('editor.action.formatDocument')?.run();

// Ou via chamada externa ao Prettier
import { format } from 'prettier';
const formatted = await format(content, { parser: 'typescript', ...prettierConfig });
```

Adicionar setting `editor.formatOnSave: boolean`.

## 3. Snippets

### Objetivo
Adicionar templates de codigo expansiveis via Tab (ex.: `for` → for loop, `fn` → function).

### Como Fazer

```typescript
// Registrar snippets no Monaco
monaco.languages.registerCompletionItemProvider('typescript', {
  provideCompletionItems: (model, position) => {
    return {
      suggestions: [
        {
          label: 'console.log',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'console.log($1);',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        },
        // ... mais snippets
      ],
    };
  },
});
```

Formato JSON similar ao VS Code (`snippets/*.json`).

## 4. Markdown Preview

### Objetivo
Adicionar preview renderizado de arquivos `.md` lado a lado com o editor.

### Como Fazer

```bash
npm install react-markdown remark-gfm
```

```tsx
function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
```

Adicionar botao "Preview" na barra de abas quando o arquivo for `.md`.

## Criterios de Pronto

- [ ] Breadcrumbs visiveis no topo do editor
- [ ] Format on Save funciona com Prettier
- [ ] Snippets basicos para TS, JS, Rust, HTML, CSS
- [ ] Markdown Preview renderiza com suporte a GFM (tabelas, code blocks, lists)
- [ ] Preview atualiza em tempo real com edicao
- [ ] Todas as features sao toggleaveis nas settings

## Referencias

- `docs/context/18-vscode-features.md#11` — Editor features
- `docs/context/18-vscode-features.md#110` — Markdown Preview
