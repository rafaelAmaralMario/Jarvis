# Proposta: Plugin Marketplace

## Visão Geral
Criar um ecossistema de plugins onde desenvolvedores terceiros podem criar, publicar e distribuir extensões para o JARVIS, similar ao VS Code Marketplace.

## Componentes

### Plugin Registry (Backend)
- Repositório centralizado de plugins
- API REST para busca, download e publicação
- Versionamento semântico (semver)
- Metadados: nome, descrição, autor, versão, ícone, capturas de tela
- Categorização (temas, extensões de linguagem, ferramentas, integrações)

### Plugin Manager (Backend C++)
- Descoberta de plugins instalados em `plugins/`
- Verificação de compatibilidade (API version)
- Sandbox de permissões (isolação)
- Gerenciamento de dependências entre plugins
- Hooks de lifecycle: onActivate, onDeactivate, onConfigChange

### Plugin API (C ABI Estável)
Baseada no `module_api.h` existente, expandida para:
```c
// Plugin lifecycle
int32_t plugin_init(const PluginHost* host);
int32_t plugin_activate(void);
int32_t plugin_deactivate(void);
int32_t plugin_shutdown(void);

// Host API
const char* host_get_version(void);
void* host_get_service(const char* service_name);
int32_t host_register_command(const char* name, CommandCallback cb);
int32_t host_register_sidebar_view(const char* id, const char* label, const char* icon);
int32_t host_register_event_listener(const char* event, EventCallback cb);

// UI contribution points
int32_t host_add_menu_item(const char* menu_id, const MenuItem* item);
int32_t host_add_setting(const char* plugin_id, const SettingDef* setting);
```

### UI de Marketplace
- Aba "Marketplace" no painel de Configuração
- Busca de plugins com preview
- Botão "Instalar" com confirmação de permissões
- Gerenciamento de plugins instalados (ativar/desativar/remover)
- Atualizações disponíveis com one-click update

### Sistema de Permissões para Plugins
- Declaração de permissões no manifesto (ex: `"permissions": ["filesystem:read", "network:http"]`)
- UI de revisão de permissões antes da instalação
- Revogação de permissões a qualquer momento
- Sandbox: processo separado ou restrições de capacidade

## Formato do Manifesto (`plugin.json`)
```json
{
    "id": "meu-plugin",
    "version": "1.0.0",
    "minApiVersion": "1.0.0",
    "name": "Meu Plugin",
    "description": "Faz coisas incríveis",
    "author": "Dev X",
    "icon": "icon.png",
    "permissions": ["filesystem:read", "clipboard:write"],
    "contributes": {
        "commands": [{ "id": "meu-plugin.sayHello", "label": "Dizer Olá" }],
        "views": [{ "id": "meu-painel", "label": "Meu Painel", "icon": "star" }],
        "settings": [{ "id": "meu-plugin.greeting", "label": "Saudação", "type": "string" }]
    }
}
```

## Tabelas SQLite
```sql
CREATE TABLE plugins_installed (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    path TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    permissions_granted JSON,
    installed_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE plugins_registry_cache (
    id TEXT PRIMARY KEY,
    latest_version TEXT NOT NULL,
    metadata JSON,
    cached_at TEXT NOT NULL
);
```

## Dependências
- Task 024 (Plugins) — fase inicial obrigatória
- Task 023 (Segurança) — sandbox e permissões
- Sync Server ou serviço cloud para o registry

## Prioridade: Média
## Esforço Estimado: 6-8 semanas (complexo)
## Impacto: Muito Alto — ecossistema extensível atrai comunidade
