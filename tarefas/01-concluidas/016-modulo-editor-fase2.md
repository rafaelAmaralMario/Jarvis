# 016 — Módulo Editor — Fase 2 (Split, Quick Open, Settings)

## Metadados
- Status: em andamento
- Prioridade: 🔴 Alta
- Dependências: 015

## Descrição
Adicionar Quick Open (Ctrl+P), Split View, Breadcrumb, Auto-save e Settings persistentes ao Editor.

## Especificação Técnica

### 1. Quick Open (Ctrl+P)
Overlay modal com input de busca + lista de arquivos filtrada por fuzzy match.

**C++** — novo bridge handler `editorSearchFiles(query)`:
```cpp
bridge.registerHandler("editorSearchFiles", [workspaceManager](const QVariantList& args) -> QVariant {
    if (args.size() < 1) return QJsonArray();
    auto roots = workspaceManager->getRoots();
    // Walk all files recursively, filter by query (simple substring match)
    QJsonArray results;
    for (const auto& root : roots) {
        walkFiles(root, args[0].toString().toStdString(), results);
    }
    return results;
});
```

**React** — `QuickOpen.tsx`:
- Overlay full-height, fixed, 500px width, centralizado
- Input com auto-foco
- Filtragem por substring (case-insensitive) enquanto digita
- Lista de resultados com ícone + path relativo + preview da pasta
- Navegação por setas ↑↓ + Enter para abrir
- Esc fecha o overlay
- Ctrl+P toggle
- Atalho Ctrl+P registrado no EditorPanel

### 2. Split View
Dois monaco editors lado a lado, cada um com sua própria aba ativa.

**Estado no EditorPanel:**
```ts
type SplitMode = 'single' | 'left' | 'right' | 'both';
interface SplitState {
  mode: SplitMode;
  leftTab: string | null;
  rightTab: string | null;
}
```

- Botão na toolbar "Split" (ícone `||`)
- Ao ativar split: aba atual vai pra esquerda, direita fica vazia
- Arrastar aba para o lado direito
- Botão "Close Split" para voltar a single
- Cada side tem sua própria instância de MonacoWrapper
- Rastro de cursor independente em cada side
- Ctrl+1, Ctrl+2 para focar left/right

### 3. Breadcrumb
Barra horizontal acima do editor mostrando o path do arquivo atual.

```
src/  ▸  components/  ▸  Editor/  ▸  EditorPanel.tsx
```

- Cada segmento clicável → lista arquivos/pastas naquele diretório
- Usa dados do workspace (listDirectory)
- Dropdown ao clicar em segmento → navegação rápida
- Implementado como `Breadcrumb.tsx`

### 4. Auto-save
Salva o arquivo atual após 2 segundos de inatividade.

- Hook `useAutoSave.ts` que observa `isDirty` e `content` da aba ativa
- Timer de 2000ms após última alteração
- Se `isDirty` e timer expirar → chama `saveFile()`
- Desabilitável nas settings
- Indicador visual na status bar: "auto-save on/off"

### 5. Editor Settings
Persistência de configurações do editor.

**DB Migration #8** — `editor_settings`:
```sql
CREATE TABLE IF NOT EXISTS editor_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

**Bridge handlers:**
- `editorGetSettings()` → retorna JSON com todas as settings
- `editorUpdateSettings(key, value)` → salva setting

**Settings:**
| Key | Default | Descrição |
|-----|---------|-----------|
| `fontSize` | 14 | Tamanho da fonte |
| `tabSize` | 4 | Largura da tabulação |
| `wordWrap` | "off" | "off", "on", "wordWrapColumn", "bounded" |
| `theme` | "vs-dark" | Tema do Monaco |
| `minimap` | true | Mostrar minimapa |
| `lineNumbers` | "on" | "on", "off", "relative", "interval" |
| `autoSave` | true | Auto-save habilitado |
| `autoSaveDelay` | 2000 | Delay em ms |

**React UI:** `EditorSettingsPanel.tsx` — painel de configurações no formato de modal

## Critérios de Aceitação
- [ ] Ctrl+P abre Quick Open com busca fuzzy por nome de arquivo
- [ ] Enter/seta no Quick Open abre arquivo selecionado
- [ ] Split view exibe dois editors lado a lado
- [ ] Breadcrumb mostra path clicável do arquivo atual
- [ ] Auto-save salva após 2s de inatividade
- [ ] Settings (fontSize, tabSize, etc) são persistidas no banco
- [ ] Atalhos: Ctrl+P, Ctrl+1, Ctrl+2

## Test Cases

### TC-001: Quick Open abre overlay
- **Passos:** 1. Pressionar Ctrl+P
- **Resultado:** Overlay com input focado e lista de arquivos do workspace
- **Cobertura:** normal

### TC-002: Quick Open filtra por nome
- **Passos:** 1. Ctrl+P 2. Digitar "panel"
- **Resultado:** Lista filtrada mostrando apenas arquivos contendo "panel"
- **Cobertura:** normal

### TC-003: Quick Open abre arquivo
- **Passos:** 1. Ctrl+P 2. Digitar 3. Seta ↓ 4. Enter
- **Resultado:** Arquivo abre no editor ativo
- **Cobertura:** normal

### TC-004: Split view ativa
- **Passos:** 1. Clicar botão Split na toolbar
- **Resultado:** Editor dividido em dois painéis, aba atual na esquerda
- **Cobertura:** normal

### TC-005: Split view arquivos independentes
- **Passos:** 1. Split 2. Abrir arquivo A na esquerda 3. Abrir arquivo B na direita
- **Resultado:** Cada lado exibe seu próprio arquivo, scrolling independente
- **Cobertura:** normal

### TC-006: Breadcrumb navega
- **Passos:** 1. Abrir src/components/Editor/EditorPanel.tsx
- **Resultado:** Breadcrumb mostra src ▸ components ▸ Editor ▸ EditorPanel.tsx, cliques navegam
- **Cobertura:** normal

### TC-007: Auto-save salva automaticamente
- **Passos:** 1. Editar arquivo 2. Aguardar 2s sem digitar
- **Resultado:** Arquivo salvo automaticamente, indicador ● desaparece
- **Cobertura:** normal

### TC-008: Settings persistem entre sessões
- **Passos:** 1. Alterar fontSize para 16 2. Fechar e reabrir app
- **Resultado:** fontSize continua 16
- **Cobertura:** normal
