# Tarefa: Diff Side-by-Side

**Epico:** 2 — Git Completo  
**Prioridade:** 🟡 Media  
**Estimativa:** 2-3 semanas  
**Dependencias:** T1 (diffs de agentes)

## Objetivo

Substituir a visualizacao atual de diff como `<pre>` raw por um Monaco Diff Editor com visualizacao lado a lado (side-by-side).

## Estado Atual

O diff e exibido como texto puro em `<pre>` no Bottom Panel, sem syntax highlight e sem navegacao entre mudancas.

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| @monaco-editor/react (DiffEditor) | Componente diff do Monaco |
| Monaco Editor diff API | Original vs Modified comparacao |

## Como Fazer

### 1. Usar Monaco DiffEditor

```tsx
import { DiffEditor } from '@monaco-editor/react';

function DiffView({ original, modified, language }: DiffViewProps) {
  return (
    <DiffEditor
      original={original}
      modified={modified}
      language={language}
      theme="vs-dark"
      options={{
        renderSideBySide: true,
        originalEditable: false,
        readOnly: true,
        minimap: { enabled: false },
      }}
    />
  );
}
```

### 2. Substituir DiffView atual

Em `src/ui/components/DiffView.tsx`, substituir o `<pre>` pelo Monaco DiffEditor.

### 3. Deteccao de linguagem

Extrair linguagem do path do arquivo usando `languageRegistry` existente.

### 4. Navegacao entre mudancas

Adicionar botoes "Previous Change" / "Next Change" para navegar entre as diferencas.

## Criterios de Pronto

- [ ] Diff exibido lado a lado com Monaco
- [ ] Syntax highlight ativo em ambos os lados
- [ ] Navegacao entre mudancas (previous/next)
- [ ] Tema acompanha o tema da aplicacao
- [ ] Linhas adicionadas/removidas destacadas em verde/vermelho
- [ ] Scroll sincronizado entre original e modified (padrao Monaco)

## Referencias

- `docs/context/18-vscode-features.md#13` — Feature de diff no VS Code
- `docs/roadmap-pos-mvp.md` — v0.2 IDE com IA Aplicavel
