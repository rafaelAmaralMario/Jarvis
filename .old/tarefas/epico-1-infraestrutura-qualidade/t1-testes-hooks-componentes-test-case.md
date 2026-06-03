# Casos de Teste: Testes de Hooks e Componentes React

## Setup

```typescript
// src/infrastructure/__mocks__/tauri.ts
import { vi } from 'vitest';
export const invoke = vi.fn();
export const convertFileSrc = vi.fn();
```

## Test Cases

### useWorkspace

| # | Nome | Descricao | Input | Expected Result |
|---|------|-----------|-------|-----------------|
| W1 | init vazio | Estado inicial sem workspace | N/A | files=null, workspacePath=null |
| W2 | refresh carrega arquivos | Refresh retorna arvore de arquivos | mock invoke | files preenchidos |
| W3 | refresh sem workspace | Refresh sem workspacePath | workspacePath=null | nao chama invoke |
| W4 | refresh erro | Tauri invoke falha | reject | error log, files mantem anterior |
| W5 | createEntry | Cria arquivo/pasta | path, name, isDir | invoke chamado com args corretos |
| W6 | renameEntry | Renomeia entrada | oldPath, newName | invoke chamado, refresh chamado |
| W7 | deleteEntry | Deleta entrada | path | invoke chamado, refresh chamado |
| W8 | deleteEntry raiz | Protecao contra delecao da raiz | path = workspacePath | nao chama invoke, mostra erro |
| W9 | moveEntry | Move entrada entre pastas | source, target | invoke chamado |
| W10 | searchWorkspace | Busca textual | query | invoke chamado, resultados retornados |

### useEditor

| # | Nome | Descricao | Input | Expected Result |
|---|------|-----------|-------|-----------------|
| E1 | init vazio | Estado inicial sem abas | N/A | tabs=[], activeTab=null |
| E2 | openTab abre arquivo | Abre arquivo no editor | filePath | tab adicionada, activeTab=filePath |
| E3 | openTab ja aberto | Arquivo ja esta em tab | filePath existente | tab nao duplicada, activeTab=filePath |
| E4 | closeTab fecha aba | Fecha aba especifica | filePath | tab removida |
| E5 | closeTab dirty | Fecha com alteracoes nao salvas | filePath com dirty=true | mostra confirmacao modal |
| E6 | setDirty | Marca aba como suja | filePath, true | dirty indicator aparece |
| E7 | saveFile | Salva arquivo | filePath | invoke write chamado, dirty=false |
| E8 | saveFile especial | Bloqueia salvamento especial | welcome.md | nao chama invoke |

### useChat

| # | Nome | Descricao | Input | Expected Result |
|---|------|-----------|-------|-----------------|
| C1 | init vazio | Estado inicial | N/A | messages=[] |
| C2 | sendMessage | Envia mensagem | text="hello" | mensagem adicionada, isGenerating=true |
| C3 | streaming | Recebe tokens | stream de tokens | streamingContent atualizado |
| C4 | cancelGeneration | Cancela geracao | abort | isGenerating=false |
| C5 | sendMessage erro | Provider falha | reject | mensagem de erro adicionada |
| C6 | loadHistory | Carrega historico | workspacePath | messages carregadas do localStorage |

### usePlugins

| # | Nome | Descricao | Input | Expected Result |
|---|------|-----------|-------|-----------------|
| P1 | init com built-in | Estado inicial | N/A | enabledPlugins contem built-in |
| P2 | togglePlugin ativa | Ativa plugin desativado | pluginId | enabledPlugins inclui id |
| P3 | togglePlugin desativa | Desativa plugin ativo | pluginId | enabledPlugins exclui id |
| P4 | togglePlugin bloqueado | Plugin com commands.execute | pluginId blocked | nao ativa, mostra alerta |
| P5 | loadLocalPlugins | Carrega plugins do workspace | mock manifests | localPlugins atualizado |
| P6 | verifyPlugin | Verifica plugin | plugin | retorna { valid, reason } |

### Componentes (Amostragem)

| # | Nome | Descricao | Input | Expected Result |
|---|------|-----------|-------|-----------------|
| CP1 | FilesPanel vazio | Renderiza sem files | files=null | Empty state visivel |
| CP2 | FilesPanel com dados | Renderiza arvore | files=mock[] | Arquivos renderizados |
| CP3 | GitPanel vazio | Sem repositorio | gitFiles=null | Mensagem "sem repo" |
| CP4 | GitPanel com dados | Arquivos modificados | gitFiles=mock[] | Lista de arquivos renderizada |
| CP5 | ChatPanel vazio | Sem mensagens | messages=[] | Input visivel, sem mensagens |
| CP6 | ChatPanel com mensagens | Mensagens do historico | messages=mock[] | Mensagens renderizadas |
| CP7 | ChatPanel loading | Streaming ativo | isGenerating=true | Indicador de digitacao visivel |
| CP8 | BottomPanel abas | Navega entre abas | activeTab="diff" | Conteudo do diff visivel |
| CP9 | ModalDialog aberto | Renderiza modal | isOpen=true | Modal visivel com overlay |
| CP10 | ModalDialog fechado | Modal escondido | isOpen=false | Modal nao renderizado |
| CP11 | ActivityBar ativo | View selecionada | activeView="files" | Icone destacado |
| CP12 | SettingsPanel renderiza | Painel de config | settings=mock | Campos renderizados |
| CP13 | CommandPalette abre | Ctrl+Shift+P | isOpen=true | Input de busca visivel |
