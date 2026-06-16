# Plugin System

## Descrição
Criar sistema de plugins para o usuário adicionar serviços próprios. ~/.jarvis/plugins/*.py carregados automaticamente. Interface: class JarvisPlugin: name, tools[], on_load(), on_unload(). Cada plugin adiciona ferramentas ao ToolManager.

## Critérios de Aceitação
- [x] Diretório de plugins monitorado (~/.jarvis/plugins/)
- [x] Classe base JarvisPlugin com interface definida (name, version, on_load, on_unload, get_tools)
- [x] Carregamento automático ao iniciar (ToolManager.__init__ → PluginLoader.load_all)
- [x] Hot-reload ao adicionar/remover plugin (check_hot_reload por mtime)
- [x] Cada plugin pode adicionar N tools ao ToolManager (plugin_ prefix + dispatch)
- [ ] Documentação para criar plugins — *postergado*
- [ ] Sandbox de segurança — *postergado*

## Dependências
- [x] — (stdlib: importlib, inspect, pathlib)

## Fase
Fase 5 — Integrações

## Prioridade
Baixa

## Esforço Estimado
Grande
