# Bugs — JARVIS

> **Atualizado:** 2026-06-15 — Todos os bugs abaixo foram corrigidos.

---

## 1 — ✅ Erro ao abrir o Jarvis ("cannot read properties of undefined")

**Causa:** A tela de erro ocorria porque o componente `AiPanel` usava o tipo `ModelInfo` (que espera campo `provider`) para dados que vinham do backend sem esse campo — os modelos são retornados com `specialty` e não `provider`. Ao filtrar por `m.provider === selectedProvider`, o filtro sempre retornava vazio, e em certos cenários de inicialização o `.length` era chamado em algo indefinido.

**Correções aplicadas:**
- `ui/src/components/AiPanel.tsx`: Alterado tipo de `ModelInfo[]` para `ModelDetail[]` e removido filtro por `provider` — agora mostra modelos por specialty com ícones.
- `ui/src/components/ErrorBoundary.tsx`: Corrigido botão "Abrir Logs" com fallback para `pywebview?.api` e alerta se bridge não disponível.
- `backend/jarvis/bridge.py`: Substituído `CREATE_NEW_CONSOLE` por `CREATE_NO_WINDOW` + `STARTF_USESHOWWINDOW` no `startModelServer()` — eliminou a janela de terminal piscando.

---

## 2 — ✅ Modelos não aparecem na página de Chat

**Causa:** Mesmo problema do Bug 1 — modelos não tinham campo `provider`, então o dropdown de modelos ficava vazio.

**Correção:** O dropdown agora mostra **todos os modelos disponíveis** com seus ícones de especialidade (💬 Chat, 💻 Code, 🧠 Reasoning, etc.).

---

## 3 — ✅ Busca de modelos no HuggingFace

**Implementado:**
- `backend/jarvis/bridge.py`: Novo método `hfSearchModels(query)` que consulta a API do HuggingFace (`api/models?search=...`) e retorna results com `modelId`, `downloads`, `likes`, `pipelineTag`, `description`.
- `ui/src/hooks/use-jarvis.ts`: Adicionado `hfSearchModels` ao bridge.
- `ui/src/types/index.ts`: Adicionado `hfSearchModels` à interface `JarvisBridge`.
- `ui/src/components/Settings/GGUFSettings.tsx`: Adicionada seção "Buscar modelos no HuggingFace" com campo de busca, resultados clicáveis que preenchem o formulário de download.

---

## 4 — ✅ Fallback para modelo General quando não existe Chat

**Correção:** `AiPanel.tsx` — ao carregar modelos, primeiro tenta filtrar por `specialty === 'chat'`. Se não houver modelos Chat, usa **todos os modelos** como fallback (incluindo General).

---

## 5 — ✅ Unificação Workspace/Editor + atalhos de mouse + simplificação de menu

**Correções:**
- `ui/src/components/ActivityBar.tsx`: Unificado `ide` (Workspace) e `editor` em um único item "Workspace + Editor". Menu mais enxuto.
- `ui/src/components/MainArea.tsx`: Roteamento `'ide'` (removido roteamento separado para `'editor'`).
- `ui/src/App.tsx`: Adicionado suporte a botões `X1` (button 3) e `X2` (button 4) do mouse para navegação entre abas.
- `ui/src/App.tsx`: Removido comando `view-editor` do SearchPalette, substituído por `view-ide`.
- `ui/src/App.tsx` / `ui/src/components/StatusBar.tsx`: StatusBar agora obtém dados dinamicamente (versão, módulos, modelo ativo) em vez de valores fixos.

---

## 6 — ✅ Auto-start de modelos locais ao iniciar

**Correção:** `backend/jarvis/main.py` — após a validação dos agentes, o código agora itera sobre todos os modelos GGUF encontrados localmente e tenta iniciá-los automaticamente com `models.start_model()`.

---

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `ui/src/components/AiPanel.tsx` | Tipo `ModelDetail[]`, fallback Chat→General, dropdown por specialty |
| `ui/src/components/ErrorBoundary.tsx` | Bridge com fallback, alerta se não disponível |
| `ui/src/components/ActivityBar.tsx` | Unificado Workspace+Editor, removido item duplicado |
| `ui/src/components/MainArea.tsx` | Roteamento só `'ide'`, não mais `'editor'` |
| `ui/src/App.tsx` | Mouse buttons X1/X2, comando `view-ide`, StatusBar dinâmica |
| `ui/src/components/StatusBar.tsx` | Props removidas, dados via bridge |
| `ui/src/components/Settings/GGUFSettings.tsx` | Busca HuggingFace integrada |
| `ui/src/hooks/use-jarvis.ts` | Método `hfSearchModels` |
| `ui/src/types/index.ts` | Interface `hfSearchModels` |
| `backend/jarvis/bridge.py` | `hfSearchModels()`, `CREATE_NO_WINDOW` no startModelServer |
| `backend/jarvis/main.py` | Auto-start de modelos GGUF locais |
