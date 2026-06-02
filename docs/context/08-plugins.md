# Sistema de Plugins

## Arquitetura

- **Declarativo no MVP** (sem execução de código arbitrário)
- Manifestos JSON que declaram capacidades
- Verificação de permissões antes de ativar

## Definição (`src/plugins/index.ts`)

```typescript
interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  capabilities: string[]
  permissions?: Permission[]
  icon?: string
}
```

## 3 Plugins Built-in

| ID | Nome | Capabilities |
|----|------|-------------|
| `jarvis.mock-provider` | Mock AI Provider | models.text, models.code |
| `jarvis.git` | Git Local | git.status, git.diff |
| `jarvis.obsidian` | Obsidian Context | context.markdown, obsidian.vault.read |

## Plugin System: Como Funciona

1. **Built-in plugins** são carregados do código (`src/plugins/manifests.ts`)
2. **Local plugins** são carregados do workspace:
   - `jarvis.plugins.json` (raiz do workspace)
   - `.jarvis/plugins/*.json`
3. **Ativação:** usuário ativa/desativa no painel Plugins
4. **Verificação de permissões:** ao ativar, o sistema valida se o workspace permite

## Verificação de Permissões (Bloqueia se)

- Plugin é inválido (malformado)
- Plugin requer `commands.execute` (não suportado no MVP)
- Plugin requer `secrets.read` mas permissão de secrets está desligada
- Plugin requer `network.request` mas permissão de rede está desligada
- Plugin requer `git.write` mas permissão de git está desligada

## Estados de um Plugin

| Estado | Descrição |
|--------|-----------|
| Built-in | Plugin nativo, sempre disponível |
| Local (loaded) | Encontrado no workspace, visível na lista |
| Active | Permissões verificadas e aprovadas, funcionalidades habilitadas |
| Inactive | Não ativado pelo usuário |
| Blocked | Permissões necessárias não concedidas |

## Persistência

- Plugins ativados: `localStorage` (`jarvis.plugins.enabled`)
- Manifestos locais: lidos do workspace via comando Tauri `list_local_plugin_manifests`

## Próximos Passos (pós-MVP)

- Suporte a `commands.execute` com sandbox
- Plugin signing/verification
- Per-plugin permissions granulares
- Marketplace de plugins
