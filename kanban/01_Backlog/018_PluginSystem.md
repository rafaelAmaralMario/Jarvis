# Plugin System

## Descrição
Criar sistema de plugins para o usuário adicionar serviços próprios. ~/.jarvis/plugins/*.py carregados automaticamente. Interface: class JarvisPlugin: name, tools[], on_load(), on_unload(). Cada plugin adiciona ferramentas ao ToolManager.

## Critérios de Aceitação
- [ ] Diretório de plugins monitorado (~/.jarvis/plugins/)
- [ ] Classe base JarvisPlugin com interface definida
- [ ] Carregamento automático ao iniciar
- [ ] Hot-reload ao adicionar/remover plugin
- [ ] Cada plugin pode adicionar N tools ao ToolManager
- [ ] Documentação para criar plugins
- [ ] Sandbox de segurança (restrito ao workspace)

## Dependências
- [ ] — (independente estrutural)

## Fase
Fase 5 — Integrações

## Prioridade
Baixa

## Esforço Estimado
Grande
