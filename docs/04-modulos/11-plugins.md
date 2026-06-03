# Modulo Plugins

**ID:** `jarvis.plugins`
**Prioridade:** 🟢 Baixa
**Depende de:** Kernel, Seguranca
**Status:** Nao iniciado

## Visao Geral

API publica para que terceiros possam estender o JARVIS com plugins externos.

## Diferenca entre Modulo Nativo e Plugin

| Aspecto | Modulo Nativo | Plugin |
|---------|--------------|--------|
| Distribuicao | Parte do JARVIS | Instalado pelo usuario |
| API | Total (ABI interna) | Restrita (API publica) |
| Seguranca | Confiavel | Sandboxado |
| Certificacao | Review interno | Assinatura digital |
| Permissoes | Elevadas | Limitadas pelo usuario |

## Plugin API (futuro)

```cpp
class JarvisPlugin {
public:
    virtual ~JarvisPlugin() = default;
    virtual const char* id() = 0;
    virtual const char* name() = 0;
    virtual const char* version() = 0;
    
    virtual bool onLoad(PluginContext* ctx) = 0;
    virtual void onUnload() = 0;
};
```

O `PluginContext` oferece acesso limitado a:
- `knowledge->search(query)` — buscar notas
- `workspace->readFile(path)` — ler arquivos
- `ui->addCommand(id, handler)` — adicionar comandos
- `ui->addPanel(id, component)` — adicionar paineis
- `notifications->show(msg)` — mostrar notificacao
