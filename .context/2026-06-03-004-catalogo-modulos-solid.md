# Contexto: Catalogo de Modulos com SOLID

**Timestamp:** 2026-06-03T11:15:00-03:00
**Status:** active
**Supersedes:** —
**Superseded by:** —

## Decisao

Criado catalogo completo de modulos em `docs/04-modulos/00-catalogo-completo-solid.md` com:

### 14 modulos organizados em 5 camadas

| Camada | Modulos |
|--------|---------|
| **L0 — Plataforma** | Kernel |
| **L1 — Infraestrutura** | Workspace, Seguranca, Rede, Persistencia |
| **L2 — Dominio** | Conhecimento, AI Engine, Automacao |
| **L3 — Apresentacao** | Editor, Git, Terminal, Voz, Perifericos |
| **L4 — Extensao** | Plugins |

### Violacoes SOLID identificadas e corrigidas no design

| Modulo | Violacao | Correcao |
|--------|----------|----------|
| ModuleAPI | ISP — interface grande | Separar em IInitializable, IActivatable, IServiceProvider, IConfigurable |
| ServiceLocator | DIP — void* sem tipo | IServiceRegistry com getService<T>() |
| IDE (antigo) | SRP — editor+git+terminal | 3 modulos: Editor, Git, Terminal |
| AI Engine | SRP — modelos+chat+agentes | IModelRegistry, IChatService, IAgentService |
| Automacao | SRP — browser+desktop | IBrowserAutomation, IDesktopAutomation |
| Perifericos | SRP — mic+webcam+notificacoes | IMicrophoneService, ICameraService, INotificationService |

### Nova interface de Service Registry (DIP)

```cpp
struct IServiceRegistry {
    template<typename T> void registerService(T* service);
    template<typename T> T* getService();
};
```

Isso substitui o `map<string, void*>` por um mapa tipado, eliminando casts inseguros.
