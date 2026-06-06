# Kernel — Core do Sistema

## O que faz
Gerencia o lifecycle da aplicacao: inicializacao, injecao de dependencias, bridge de comunicacao com o frontend e carregamento de modulos Python.

## Arquivos
```
backend/jarvis/main.py              — Entry point pywebview (70 linhas)
backend/jarvis/bridge.py            — 65+ metodos window.jarvis.* (490 linhas)
backend/jarvis/database.py          — SQLite WAL thread-safe (64 linhas)
backend/jarvis/migration_runner.py  — 8 migrations na inicializacao
backend/jarvis/module_loader.py     — Descoberta e carga de modulos Python
```

## Funcionalidades

### Inicializacao
- Cria/conecta SQLite com WAL mode
- Executa 8 migrations na inicializacao
- Instancia todos os managers (Module, Workspace, Network, Knowledge, Graph, Models, Agents, Orchestration, Editor, Git, Terminal)
- Injeta todos os managers no JARVISBridge
- Inicia pywebview com js_api registrado

### Module Loader
- Descoberta de modulos Python em `modules/`
- Carregamento dinamico via `importlib.import_module()`
- Verificacao de interface via type hints / Protocols
- Inicializacao e shutdown controlados

### Bridge (pywebview)
- 65+ metodos expostos como `window.pywebview.api.jarvis*()`
- Cada metodo delega para o manager correspondente
- Serializacao automatica via pywebview (dict/list → JSON)
- Eventos para o frontend via `window.evaluate_js()`

### Permission Manager
- Verificacao de permissoes por operacao
- Roles e niveis de acesso
- Integracao com UI de configuracao

## 65+ Bridge Methods
Todos os metodos expostos ao frontend via pywebview js_api. Ver `03-bridge-protocolo.md` para lista completa.
