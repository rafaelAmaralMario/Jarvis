# Plano de Migração: Qt C++ → Python + pywebview

## Arquitetura Alvo

```
┌─────────────────────────────────────┐
│  React UI (Vite + Tailwind + TS)    │ ← MESMO frontend, sem mudanças
│  window.jarvis.method()              │ ← já suportado pelo use-jarvis.ts
├─────────────────────────────────────┤
│  pywebview (WebView2 do Windows)    │ ← substitui QWebEngineView
├─────────────────────────────────────┤
│  Python Backend (JARVIS_API)         │
│  ├── models_manager.py               │
│  ├── agents_manager.py               │
│  ├── orchestration_manager.py        │
│  ├── knowledge_manager.py            │
│  ├── workspace_manager.py            │
│  ├── git_manager.py                  │
│  ├── editor_manager.py               │
│  ├── terminal_manager.py             │
│  ├── network_manager.py              │
│  ├── database.py                     │
│  └── module_loader.py                │
└─────────────────────────────────────┘
```

---

## Fase -1: Arquivar C++ Legado (1 dia)

**Antes de começar a escrever Python, isolar todo o código C++ original.**

### O que fazer:

1. **Mover diretórios para `.oldC++/`** — preserva todo o histórico, não perde nada:

```
jarvis/
├── backend/                     ← NOVO (Python)
├── ui/                          ← INALTERADO
├── .oldC++/                     ← CÓDIGO ORIGINAL ARQUIVADO
│   ├── kernel/                  ← Todo o kernel C++ (src/, include/, CMakeLists.txt)
│   │   ├── src/
│   │   ├── include/
│   │   ├── resources/
│   │   ├── tests/
│   │   └── CMakeLists.txt
│   ├── tests/                   ← Testes C++ (tests/cpp/, tests/e2e/e2e-proto.cpp)
│   ├── build/                   ← Build artifacts (pode deletar, mas move por segurança)
│   ├── build_test.bat
│   ├── build.bat
│   └── CMakeLists.txt           ← Root CMakeLists.txt
├── MIGRACAO_PYTHON.md
└── README.md
```

2. **Manter apenas o essencial do C++ que ainda é necessário:**
   - `kernel/resources/webui/` — o build do React (VITE). Mas ele será movido para `ui/dist/`
   - `kernel/resources/jarvis.qrc` — não será mais usado (Qt resource file)

3. **Remover do `index.html`** a linha do Qt WebChannel:
   ```html
   <script src="qrc:///qtwebchannel/qwebchannel.js"></script>
   ```

4. **Atualizar `.gitignore`** para incluir `backend/__pycache__/`, `*.pyc`, etc.

### Critério de sucesso:
- `git status` mostra `kernel/` como renomeado para `.oldC++/kernel/`
- React `npm run build` ainda funciona e gera `ui/dist/`
- `python backend/jarvis/main.py` ainda não funciona (faltam os módulos)

---

## Fase 0: Setup do Projeto (1 dia)

### Estrutura de Diretórios

```
jarvis/
├── ui/                          ← INALTERADO (React existente)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/                     ← NOVO (Python)
│   ├── pyproject.toml
│   ├── jarvis/
│   │   ├── __init__.py
│   │   ├── main.py              ← Entry point (pywebview window)
│   │   ├── bridge.py            ← window.jarvis exposure
│   │   ├── database.py          ← SQLite wrapper
│   │   ├── migration_runner.py  ← Schema migrations
│   │   ├── models_manager.py
│   │   ├── agents_manager.py
│   │   ├── orchestration_manager.py
│   │   ├── knowledge_manager.py
│   │   ├── workspace_manager.py
│   │   ├── editor_manager.py
│   │   ├── git_manager.py
│   │   ├── terminal_manager.py
│   │   ├── network_manager.py
│   │   └── module_loader.py
│   └── tests/
│       └── ...
├── build_rls.bat
├── MIGRACAO_PYTHON.md
└── README.md
```

### Dependências Python

```toml
[tool.poetry.dependencies]
python = "^3.11"
pywebview = "^5.0"              # WebView2 window
httpx = "^0.28"                 # HTTP para Ollama + APIs externas
websockets = "^14"              # WebSocket client
gitpython = "^3.1"              # Git operations (ou subprocess puro)
watchdog = "^6.0"               # File system watcher
cryptography = "^44"            # API key encryption
pyte = "^0.8"                   # Terminal emulation (PTY)
ruamel.yaml = "^0.18"           # YAML front matter parsing
```

---

## Fase 1: Database + Migrations (2 dias)

**O que muda:** 8 migrations SQLite em C++ → Python com sqlite3 nativo.

```python
# backend/jarvis/database.py
import sqlite3
import threading

class Database:
    def __init__(self, db_path: str):
        self._lock = threading.RLock()
        self._db = sqlite3.connect(db_path)
        self._db.execute("PRAGMA journal_mode=WAL")
        self._db.execute("PRAGMA synchronous=NORMAL")
        self._db.execute("PRAGMA foreign_keys=ON")
        self._db.row_factory = sqlite3.Row
```

**Portar as 8 migrations** exatamente como estão em `main.cpp` (linhas 322-403), incluindo:
- FTS5 virtual table para `notes_fts`
- Default inserts para `editor_settings`
- Unique constraint `CHECK(id=1)` em `orchestration_config`

**Testes:** Portar `test_database.cpp` e `test_migration_runner.cpp`.

---

## Fase 2: Bridge Layer (1 dia)

**O que muda:** Qt WebChannel + 89 handlers C++ → Python exposto como `window.jarvis`.

pywebview injeta automaticamente o objeto JS API como `window.pywebview.api`.
O React já tem fallback para `window.jarvis` em `use-jarvis.ts:38-42`.

Precisamos de um adaptador mínimo:

```python
# backend/jarvis/bridge.py
class JARVIS_Bridge:
    """Expõe todos os métodos como window.jarvis para o React."""
    
    def __init__(self, db: Database):
        self.models = ModelsManager(db)
        self.agents = AgentsManager(db)
        self.orchestration = OrchestrationManager(db)
        self.knowledge = KnowledgeManager(db)
        self.workspace = WorkspaceManager(db)
        self.editor = EditorService()
        self.git = GitManager()
        self.terminal = TerminalManager()
        self.network = NetworkManager(db)
        self.modules = ModuleLoader()

    # Cada handler vira um método. Exemplo:
    def listModels(self) -> list:
        return self.models.list_all()
    
    def readFile(self, path: str) -> str:
        return self.workspace.read_file(path)

    def gitStatus(self, repo_path: str) -> list:
        return self.git.status(repo_path)
    
    # ... ~90 métodos no total
```

O `index.html` precisa remover a linha:
```html
<script src="qrc:///qtwebchannel/qwebchannel.js"></script>
```

---

## Fase 3: Módulos Core (5 dias)

### 3a. Workspace Manager (1 dia)
**C++:** `workspace_manager.cpp` (300+ linhas), `file_utils.cpp`, `file_watcher.cpp`
**Python:** `pathlib` + `shutil` + `watchdog`

Substituições:
- `QDir::cleanPath` → `pathlib.Path.resolve()`
- `QFileSystemWatcher` → `watchdog.Observer`
- `std::ifstream` → `pathlib.Path.read_text()`

### 3b. Git Manager (1 dia)
**C++:** `git_manager.cpp` (~400 linhas) — spawna `git` CLI via `QProcess`
**Python:** `subprocess` (mesma abordagem) ou `gitpython`

Recomendo `subprocess` puro para manter compatibilidade exata com o C++.

### 3c. Editor Service (0.5 dia)
**C++:** `editor_manager.cpp` — ~150 linhas, só file I/O + extensão → linguagem
**Python:** ~~10 linhas. Mais trivial de todos.

### 3d. Terminal Manager (1 dia)
**C++:** `terminal_manager.cpp` — `QProcess` com PTY
**Python:** 
- `subprocess.Popen` com `creationflags=CREATE_NEW_CONSOLE` no Windows
- `os.read`/`selectors` para I/O assíncrono

### 3e. Network Manager (1 dia)
**C++:** `network_manager.cpp` — `QNetworkAccessManager`, `QWebSocket`, OAuth
**Python:** `httpx.Client` + `websockets` + `requests` (OAuth)

### 3f. Module Loader (0.5 dia)
**C++:** `module_loader.cpp` — `LoadLibrary`/`dlopen` + JSON manifest parsing
**Python:** `importlib` + entry points. Bem mais simples.

---

## Fase 4: AI Modules (4 dias)

### 4a. Ollama Client (1 dia)
**C++:** `ollama_client.cpp` — HTTP para `localhost:11434` via `QNetworkAccessManager`
**Python:** `httpx`:

```python
class OllamaClient:
    def __init__(self, base_url="http://localhost:11434"):
        self.client = httpx.Client(base_url=base_url)
    
    def list_models(self) -> list:
        r = self.client.get("/api/tags")
        return r.json()["models"]
    
    def generate(self, model: str, prompt: str, stream=False):
        return self.client.post("/api/generate", json={
            "model": model, "prompt": prompt, "stream": stream
        })
```

### 4b. Models Manager (0.5 dia)
**C++:** Wrapper sobre OllamaClient + SQLite para `model_metadata`
**Python:** Mesma lógica, sqlite3 nativo.

### 4c. Agents Manager (1 dia)
**C++:** CRUD agents + SQLite + seed defaults
**Python:** sqlite3 CRUD direto.

### 4d. Orchestration Manager (1.5 dia)
**C++:** ~500 linhas — multi-agent routing, critic, streaming
**Python:** É o módulo mais complexo. Precisa de:
- Chamadas sequenciais/paralelas para Ollama
- Template de prompt do orchestrator
- Critic agent review
- Callbacks de streaming para o frontend (via pywebview emit)

---

## Fase 5: Knowledge Module (2 dias)

### 5a. Knowledge Manager (1.5 dia)
**C++:** `knowledge_manager.cpp` — CRUD notes, wikilink parsing, FTS5 search, import/export
**Python:** 
- sqlite3 com FTS5 (`CREATE VIRTUAL TABLE ... USING fts5`)
- `re` para parsing de `[[wikilinks]]`
- `yaml`/`ruamel.yaml` para front matter

### 5b. Graph Builder (0.5 dia)
**C++:** Lê notas e links, retorna GraphData (nodes + edges)
**Python:** Query SQLite, monta dict, retorna JSON.

---

## Fase 6: Integração pywebview (1 dia)

```python
# backend/jarvis/main.py
import webview
from jarvis.bridge import JARVIS_Bridge
from jarvis.database import Database
from jarvis.migration_runner import run_migrations

def main():
    db_path = os.path.join(os.environ["APPDATA"], "JARVIS", "jarvis-ai.db")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    db = Database(db_path)
    run_migrations(db)
    
    bridge = JARVIS_Bridge(db)
    
    window = webview.create_window(
        title="JARVIS",
        url="ui/dist/index.html",  # build do Vite
        js_api=bridge,              # ← vira window.pywebview.api
        width=1280,
        height=800,
        min_size=(900, 600),
    )
    
    # Adaptador: expõe como window.jarvis (já suportado pelo React)
    class JarvisAdapter:
        def __getattr__(self, name):
            return getattr(bridge, name)
    
    window.expose(JarvisAdapter())  # alternativa: ou só usa js_api
    
    webview.start(debug=True)

if __name__ == "__main__":
    main()
```

**Nota:** pywebview expõe o `js_api` como `window.pywebview.api`. O React usa `window.jarvis`. Precisamos de um inject script:

```python
window = webview.create_window(
    ..., 
    js_api=bridge,
)
# Injeta window.jarvis = window.pywebview.api no DocumentCreation
window.load_url("ui/dist/index.html")
```

---

## Fase 7: Build System + Deploy (1 dia)

### Build script final (`build_rls.bat`):

```bat
@echo off
call vcvars64.bat >nul

echo === Building React Frontend ===
cd ui
call npm install && npm run build
cd ..

echo === Building Python Backend ===
cd backend
pip install -e .  # ou poetry install
cd ..

echo === Done ===
echo Run: python backend/jarvis/main.py
```

### pyproject.toml (backend):

```toml
[build-system]
requires = ["setuptools", "wheel"]
build-backend = "setuptools.backends._legacy:_Backend"

[project]
name = "jarvis-backend"
version = "0.1.0"
dependencies = [
    "pywebview>=5",
    "httpx>=0.28",
    "websockets>=14",
    "gitpython>=3.1",
    "watchdog>=6",
    "cryptography>=44",
    "pyte>=0.8",
    "ruamel.yaml>=0.18",
]
```

---

## O que NÃO muda

- **React UI**: 100% reaproveitado. Zero alterações nos componentes.
- **Bridge protocol**: JSON-RPC idêntico. O `use-jarvis.ts` já tem fallback `window.jarvis`.
- **SQLite schema**: Migrações idênticas, mesmas tabelas, mesmas colunas.
- **Testes**: 34 testes Vitest + 6 E2E continuam funcionando.
- **Ollama**: Mesma API HTTP `localhost:11434`.
- **Git**: Mesmo CLI via subprocess.

---

## Fase 8: Documentação (2 dias)

**Reescrever toda a documentação do projeto para refletir a nova arquitetura.**

### Documentos a criar/atualizar:

#### 8a. `README.md` — Documento principal do projeto
Reescrever completamente:
- **Visão geral**: O que é o JARVIS, para que serve
- **Arquitetura**: Diagrama React + Python + pywebview
- **Stack**: Python 3.11+, React 19, TypeScript, Tailwind v4, SQLite, WebView2
- **Pré-requisitos**: Python, Node.js, Ollama (para funcionalidades de AI), Git
- **Instalação**:
  ```bash
  # Backend
  cd backend
  pip install -e .
  
  # Frontend
  cd ui
  npm install && npm run build
  
  # Executar
  cd ..
  python backend/jarvis/main.py
  ```
- **Estrutura de diretórios** (já sem referências a C++/Qt)
- **Comandos úteis**: dev, test, build
- **Variáveis de ambiente**: `APPDATA`, `OLLAMA_HOST`, etc.

#### 8b. `CONTRIBUTING.md` — Guia para contribuidores
- Como rodar o projeto em modo dev
- Como rodar testes (Vitest para frontend, pytest para backend)
- Padrões de código (PEP 8 para Python, Prettier para TypeScript)
- Estrutura de branches e PRs

#### 8c. Documentação técnica da Bridge (parte do README ou separada)
- Lista completa dos ~90 métodos JSON-RPC (pode ser gerada do código Python)
- Exemplo de chamada: `window.jarvis.listModels()`
- Exemplo de evento: `window.jarvis.onEvent('terminal-output', callback)`
- Formato de erros

#### 8d. Documentação do Banco de Dados
- Schema atualizado (8 migrations)
- Diagrama entidade-relacionamento (ERD)
- Notas sobre FTS5, WAL mode, triggers

#### 8e. Remover documentação obsoleta
- Qualquer referência a Qt, QWebEngine, QWebChannel, CMake, Catch2
- `kernel/` docs (todo o diretório foi para `.oldC++/`)

### Critério de sucesso:
- `README.md` explica como baixar, instalar e rodar em < 5 minutos
- Zero menções a Qt, C++, CMake, Catch2 na documentação ativa
- `CONTRIBUTING.md` existe e é útil
- Um novo desenvolvedor consegue rodar o projeto sem ler o código C++ antigo

---

## Fase 9: Limpeza Final (0.5 dia)

**Remover definitivamente o código C++ legado após confirmação de que o Python cobre tudo.**

### O que fazer:

1. **Testar exaustivamente** o backend Python contra a suíte de testes do frontend:
   ```bash
   cd ui && npm test   # 34 testes Vitest + 6 E2E
   ```
   **Cada handler precisa responder com o formato exato que o React espera.**

2. **Testar manualmente** o app completo com pywebview:
   ```bash
   python backend/jarvis/main.py
   ```
   - Navegar entre todas as views (AI, Knowledge, Editor, Git, Settings)
   - Criar/editar/deletar notas
   - Abrir/salvar arquivos
   - Ver status git e fazer commit
   - Abrir terminal e rodar comandos
   - Conectividade com Ollama (listar modelos, chat)

3. **Deletar o diretório `.oldC++/`**:
   ```bash
   rm -rf .oldC++
   ```

4. **Commit final** com mensagem:
   ```
   feat: migrate from Qt/C++ to Python/pywebview
    
   - Removido todo o kernel C++ legado
   - Novo backend Python em backend/jarvis/
   - React frontend inalterado
   - Bridge JSON-RPC via pywebview → window.jarvis
   - Documentação reescrita para nova arquitetura
   Closes #MIGRATION
   ```

5. **Opcional**: Arquivar o projeto C++ original em um branch git separado:
   ```bash
   git checkout -b archive/cpp-legacy
   git add .oldC++
   git commit -m "chore: archive original C++ implementation"
   git checkout main
   git rm -rf .oldC++
   git commit -m "chore: remove archived C++ implementation"
   ```

### Critério de sucesso:
- Não existe mais `kernel/`, `CMakeLists.txt`, `*.cpp`, `*.h` no diretório ativo
- O repositório git tem um branch `archive/cpp-legacy` com o original preservado
- `pip install -e . && python backend/jarvis/main.py` funciona sem erros
- `npm test` passa 100%

---

## Cronograma Total Atualizado

| Fase | Descrição | Dias |
|------|-----------|------|
| -1 | Arquivar C++ legado (.oldC++) | 1 |
| 0 | Setup do projeto + dependências | 1 |
| 1 | Database + Migrations | 2 |
| 2 | Bridge Layer | 1 |
| 3a | Workspace Manager | 1 |
| 3b | Git Manager | 1 |
| 3c | Editor Service | 0.5 |
| 3d | Terminal Manager | 1 |
| 3e | Network Manager | 1 |
| 3f | Module Loader | 0.5 |
| 4a | Ollama Client | 1 |
| 4b | Models Manager | 0.5 |
| 4c | Agents Manager | 1 |
| 4d | Orchestration Manager | 1.5 |
| 5a | Knowledge Manager | 1.5 |
| 5b | Graph Builder | 0.5 |
| 6 | Integração pywebview | 1 |
| 7 | Build System + Deploy | 1 |
| 8 | Documentação | 2 |
| 9 | Limpeza Final | 0.5 |
| **Total** | | **~19.5 dias** |

---

## Riscos

1. **Terminal PTY no Windows**: `subprocess` + `winpty` pode ser necessário. Testar.
2. **Streaming de respostas**: O C++ faz streaming via `QNetworkReply::readyRead`. Em Python, `httpx` com `Stream` + pywebview events.
3. **Segurança de API keys**: C++ usava `QByteArray::toBase64()` simples. Python usará `cryptography.fernet`.
