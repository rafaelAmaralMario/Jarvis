# 024 — Sistema de Plugins

## Metadados
- Status: a fazer
- Prioridade: 🟢 Baixa
- Dependências: 023

## Descrição
Sistema de extensões third-party: Plugin API, manifest system, plugin manager com sandbox.

## Especificação Técnica

### C++ — Plugin API
- Interface estável em C para plugins (.dll/.so):
  - `create_module(ModuleHost*)` → retorna `ModuleAPI*`
  - `destroy_module(ModuleAPI*)`
  - ModuleHost fornece acesso a: service locator, bridge, logger
  - ModuleAPI com funções: `init()`, `shutdown()`, `getName()`, `getVersion()`
- Manifest: `plugin.json` com name, version, author, permissions, entry point

### Plugin Manager
- `PluginManager` — scan de diretório `plugins/`
- Carregamento sob demanda
- Isolamento: cada plugin em seu próprio contexto
- Permissões verificadas antes de operações sensíveis

### Bridge handlers
- `pluginsList()` → plugins instalados
- `pluginsInstall(path)` → instala .dll/.so
- `pluginsUninstall(id)`
- `pluginsToggle(id, enabled)`
- `pluginsGetPermissions(id)` / `pluginsSetPermission(id, perm, granted)`

### React — Componentes
- `PluginManagerPanel.tsx` — lista de plugins com toggle enable/disable
- `PluginCard.tsx` — card com nome, versão, autor, status

## Critérios de Aceitação
- [ ] Plugin .dll/.so é carregado via ModuleLoader
- [ ] Plugin tem acesso ao ServiceLocator
- [ ] Manifest plugin.json define metadados
- [ ] Plugin pode ser desativado sem desinstalar
- [ ] Permissões de plugin são isoladas

## Test Cases

### TC-001: Carregar plugin
- **Passos:** 1. Colocar .dll em plugins/ 2. Executar scan
- **Resultado:** Plugin aparece na lista com nome e versão
- **Cobertura:** normal

### TC-002: Desativar plugin
- **Passos:** 1. Toggle plugin para disabled
- **Resultado:** Plugin é descarregado, não responde mais
- **Cobertura:** normal
