# Kernel — Core do Sistema

## O que faz
Gerencia o lifecycle da aplicação: inicialização, carregamento de módulos, service locator, permissões e bridge de comunicação com o frontend.

## Arquivos
```
kernel/src/main.cpp              — Entry point (1553 linhas)
kernel/src/module_loader.cpp     — Descoberta e carga de módulos .dll
kernel/src/lifecycle.cpp         — Ciclo de vida da aplicação
kernel/src/service_locator.cpp   — Registro e obtenção de serviços
kernel/src/permission_manager.cpp— Gerenciamento de permissões
```

## Funcionalidades

### Inicialização
- Cria QApplication, inicializa Qt WebEngine
- Abre/ cria banco SQLite com WAL mode
- Executa 8 migrations na inicialização
- Instancia todos os managers (Models, Agents, Orchestration, Knowledge, Workspace, Editor, Terminal, Network, Git)
- Configura bridge com 89 handlers
- Carrega UI React no WebEngine

### Module Loader
- Descoberta de módulos em `modules/`
- Carregamento dinâmico de `.dll`/`.so`
- Inicialização e shutdown em ordem de dependência
- Verificação de versão da API (`module_api.h`)

### Service Locator
- Singleton thread-safe
- `registerService<T>()` com shared_ptr
- `getService<T>()` com retorno tipado
- Suporte a lazy initialization

### Permission Manager
- Verificação de permissões por operação
- Roles e níveis de acesso
- Integração com UI de configuração

## 89 Bridge Handlers
Todos os métodos expostos ao frontend via WebChannel. Ver `03-interface/02-bridge-api.md` para lista completa.
