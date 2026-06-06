# Modulo Workspace

## O que faz
Gerenciamento de projetos, arvore de arquivos, watcher de diretorios e operacoes de arquivo.

## Arquivos
```
backend/jarvis/workspace_manager.py     — File I/O, watcher, projeto, cancelamento

ui/src/components/Workspace/WorkspacePanel.tsx
ui/src/components/Workspace/FileTree.tsx
ui/src/components/Workspace/FileTabs.tsx
```

## Funcionalidades

### Projetos
- Criar, abrir, editar, fechar projetos
- Cada projeto tem diretorio raiz + metadados
- Lista de projetos recentes

### Arvore de Arquivos
- Navegacao hierarquica de diretorios
- Icones por tipo de arquivo
- Context menu: criar arquivo, criar pasta, renomear, deletar
- Expandir/colapsar diretorios
- Atalhos de teclado (navegacao com setas)

### File Watcher
- Monitora mudancas em diretorios do projeto
- Dispara evento `file-changed` via bridge quando arquivo e alterado no disco
- Suporte a watch de multiplos diretorios

### Operacoes de Arquivo
- Criar arquivo com conteudo inicial
- Ler arquivo
- Renomear/mover
- Deletar (com confirmacao)
- Abrir pasta como projeto

## Bridge API
- 15 metodos: `openWorkspace`, `addRoot`, `removeRoot`, `getRoots`, `listFiles`, `createFile`, `createFileWithPath`, `createDirectory`, `deletePath`, `renamePath`, `movePath`, `getRecentFiles`, `getProjectInfo`, `cancelGeneration`

## Eventos
- `file-changed`: disparado quando file_watcher detecta alteracao no disco
