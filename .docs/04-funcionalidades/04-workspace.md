# Módulo Workspace

## O que faz
Gerenciamento de projetos, árvore de arquivos, watcher de diretórios e operações de arquivo.

## Arquivos
```
kernel/src/workspace/workspace_manager.cpp — CRUD de projetos e arquivos
kernel/src/workspace/file_watcher.cpp      — Monitoramento de diretórios
kernel/src/workspace/file_utils.cpp        — Utilitários de arquivo

ui/src/components/Workspace/WorkspacePanel.tsx
ui/src/components/Workspace/FileTree.tsx
ui/src/components/Workspace/FileTabs.tsx
```

## Funcionalidades

### Projetos
- Criar, abrir, editar, fechar projetos
- Cada projeto tem diretório raiz + metadados
- Lista de projetos recentes

### Árvore de Arquivos
- Navegação hierárquica de diretórios
- Ícones por tipo de arquivo
- Context menu: criar arquivo, criar pasta, renomear, deletar
- Expandir/colapsar diretórios
- Atalhos de teclado (navegação com setas)

### File Watcher
- Monitora mudanças em diretórios do projeto
- Dispara evento `file-changed` via bridge quando arquivo é alterado no disco
- Suporte a watch de múltiplos diretórios

### Operações de Arquivo
- Criar arquivo com conteúdo inicial
- Ler arquivo
- Renomear/mover
- Deletar (com confirmação)
- Abrir pasta como projeto

## Bridge Handlers
14 handlers: list_projects, get_project, create_project, update_project, delete_project, get_files, get_file, create_file, delete_file, rename_file, watch_directory, unwatch_directory, get_file_tree, open_folder

## Eventos
- `file-changed`: disparado quando file_watcher detecta alteração no disco
